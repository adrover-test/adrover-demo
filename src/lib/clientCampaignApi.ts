import { send } from "./advertisementApi";
import { readSchedulingState, type SchedulingState } from "./scheduling";
import type { Advertisement, AdvertisementStatus } from "./advertisements";

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
export type ClientCampaign = Advertisement &
  SchedulingState & {
    amount: number;
    paidAmount: number;
    rejectionReason: string | null;
    hasVideo: boolean;
    hasBanner: boolean;
  };
function campaign(value: unknown): ClientCampaign {
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
export async function getClientCampaigns(): Promise<ClientCampaign[]> {
  const result: ClientCampaign[] = [];
  for (let page = 1; ; page++) {
    const response = await send(
      `/api/Advertisements/my-ads?pageNumber=${page}&pageSize=100`,
      { method: "GET" },
    );
    if (!record(response) || !Array.isArray(response.items))
      throw new Error("Your campaigns could not be loaded. Please try again.");
    const total = count(response.total);
    result.push(...response.items.map(campaign));
    if (result.length >= total) return result;
    if (!response.items.length)
      throw new Error("Some campaigns could not be loaded. Please try again.");
  }
}
export async function getClientCampaign(id: string): Promise<ClientCampaign> {
  // The account-scoped list prevents public campaign links from exposing another client's campaign.
  const found = (await getClientCampaigns()).find((ad) => ad.id === id);
  if (!found)
    throw new Error(
      "Campaign not found. Choose a campaign from My advertisements.",
    );
  return found;
}
export type DashboardSummary = {
  totalAdvertisements: number;
  activeAdvertisements: number;
  pendingAdvertisements: number;
  totalPlays: number;
  activeCabs: number;
  dailyPlays: { date: string; plays: number }[];
};
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const value = await send("/api/ClientDashboard/summary", { method: "GET" });
  if (!record(value) || !Array.isArray(value.dailyPlays))
    throw new Error("Your overview could not be loaded. Please try again.");
  return {
    totalAdvertisements: count(value.totalAdvertisements),
    activeAdvertisements: count(value.activeAdvertisements),
    pendingAdvertisements: count(value.pendingAdvertisements),
    totalPlays: count(value.totalPlays),
    activeCabs: count(value.activeCabs),
    dailyPlays: value.dailyPlays.map((entry: unknown) => {
      if (!record(entry))
        throw new Error("Your activity could not be loaded. Please try again.");
      const date = text(entry.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        throw new Error(
          "Your activity dates could not be loaded. Please try again.",
        );
      return { date, plays: count(entry.plays) };
    }),
  };
}
export type Playback = {
  id: string;
  vehicleNumber: string;
  latitude: number;
  longitude: number;
  durationSeconds: number;
  playedAt: string;
};
export async function getCampaignPlayback(
  id: string,
  date: string,
  page: number,
): Promise<{ items: Playback[]; total: number }> {
  const value = await send(
    `/api/ClientDashboard/campaigns/${encodeURIComponent(id)}/playback?date=${encodeURIComponent(date)}&pageNumber=${page}&pageSize=25`,
    { method: "GET" },
  );
  if (!record(value) || !Array.isArray(value.items))
    throw new Error("Playback history could not be loaded. Please try again.");
  return {
    total: count(value.total),
    items: value.items.map((entry: unknown) => {
      if (
        !record(entry) ||
        typeof entry.latitude !== "number" ||
        typeof entry.longitude !== "number" ||
        !Number.isFinite(entry.latitude) ||
        !Number.isFinite(entry.longitude) ||
        Math.abs(entry.latitude) > 90 ||
        Math.abs(entry.longitude) > 180
      )
        throw new Error(
          "Playback locations could not be loaded. Please try again.",
        );
      const playedAt = text(entry.playedAt);
      if (!Number.isFinite(Date.parse(playedAt)))
        throw new Error(
          "Playback times could not be loaded. Please try again.",
        );
      return {
        id: text(entry.id),
        vehicleNumber: text(entry.vehicleNumber),
        latitude: entry.latitude,
        longitude: entry.longitude,
        durationSeconds: count(entry.durationSeconds),
        playedAt,
      };
    }),
  };
}
export async function getCampaignCreative(
  id: string,
): Promise<{ videoUrl: string | null; imageUrl: string | null }> {
  const value = await send(
    `/api/ClientDashboard/campaigns/${encodeURIComponent(id)}/creative`,
    { method: "GET" },
  );
  if (!record(value))
    throw new Error("Your creative could not be loaded. Please try again.");
  function url(input: unknown) {
    if (input === null) return null;
    const link = new URL(text(input));
    if (link.protocol !== "https:")
      throw new Error(
        "Your creative could not be opened safely. Please contact support.",
      );
    return link.href;
  }
  return { videoUrl: url(value.videoUrl), imageUrl: url(value.imageUrl) };
}
