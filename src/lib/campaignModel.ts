import type { Advertisement, AdvertisementStatus } from "./advertisements";
import { readSchedulingState } from "./scheduling";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function text(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Campaign details could not be loaded. Please try again.");
  return value;
}

function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new Error("Campaign totals could not be loaded. Please try again.");
  return value;
}

const statuses: Record<string, AdvertisementStatus> = {
  Draft: "Draft",
  PendingApproval: "Pending approval",
  Approved: "Approved",
  Active: "Active",
  Started: "Started",
  Completed: "Completed",
  Rejected: "Rejected",
  Cancelled: "Cancelled",
};

export type ClientCampaign = Advertisement & {
  amount: number;
  paidAmount: number;
  rejectionReason: string | null;
  hasVideo: boolean;
  hasBanner: boolean;
};

export function parseClientCampaign(value: unknown): ClientCampaign {
  if (!record(value))
    throw new Error("Campaign details could not be loaded. Please try again.");
  const status = statuses[text(value.status)];
  if (!status)
    throw new Error(
      "The campaign status could not be loaded. Please try again.",
    );
  const start = new Date(text(value.startDate));
  const end = new Date(text(value.endDate));
  const submitted = new Date(text(value.submittedAt));
  if (![start, end, submitted].every((date) => Number.isFinite(date.getTime())))
    throw new Error("Campaign dates could not be loaded. Please try again.");
  const scheduled = start.getFullYear() >= 2000 && end >= start;
  const totalDays = scheduled
    ? Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
    : 0;
  const days =
    status === "Active" || status === "Started"
      ? Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000))
      : status === "Completed"
        ? totalDays
        : 0;
  const brand = text(value.brand);
  return {
    ...readSchedulingState(value),
    id: text(value.id),
    name: text(value.name),
    brand,
    initials: brand
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0] ?? "")
      .join("")
      .toUpperCase(),
    area: text(value.targetArea),
    submitted: submitted.toISOString().slice(0, 10),
    dates: scheduled
      ? `${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString("en-IN")}`
      : "Schedule not selected",
    status,
    plays: count(value.actualPlays),
    target: count(value.targetPlays),
    cabs: count(value.assignedCabs),
    totalDays,
    elapsedDays: Math.min(days, totalDays),
    fleet: "Requested cab allocation",
    note: text(value.description),
    amount: count(value.approvalAmount),
    paidAmount: count(value.paidAmount),
    rejectionReason:
      value.rejectionReason == null ? null : text(value.rejectionReason),
    hasVideo: typeof value.videoUrl === "string" && Boolean(value.videoUrl),
    hasBanner: typeof value.imageUrl === "string" && Boolean(value.imageUrl),
  };
}

export function parseClientCampaignList(
  value: unknown,
): ClientCampaign[] | null {
  const items = Array.isArray(value)
    ? value
    : record(value) && Array.isArray(value.items)
      ? value.items
      : null;
  return items === null ? null : items.map(parseClientCampaign);
}
