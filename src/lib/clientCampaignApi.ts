import { send } from "./advertisementApi";
import {
  parseClientCampaign,
  type ClientCampaign,
} from "./campaignModel";
export type { ClientCampaign } from "./campaignModel";

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
    result.push(...response.items.map(parseClientCampaign));
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
