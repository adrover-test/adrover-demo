import type { Advertisement } from "./advertisements";
import { aggregateChartRecords, type ChartRange } from "./chartPeriods";

const sampleDeliveryHistory = [
  { adId: "deccan-living-expo", date: "2026-08-31", plays: 4000 },
  { adId: "deccan-living-expo", date: "2026-09-05", plays: 7000 },
  { adId: "apollo-checkup", date: "2026-10-31", plays: 50000 },
  { adId: "monsoon-offer", date: "2026-10-31", plays: 22000 },
  { adId: "hitec-techfest", date: "2026-10-31", plays: 12000 },
  { adId: "weekend-dining", date: "2026-10-31", plays: 10000 },
  { adId: "apollo-checkup", date: "2026-11-05", plays: 18400 },
  { adId: "monsoon-offer", date: "2026-11-05", plays: 9250 },
  { adId: "hitec-techfest", date: "2026-11-05", plays: 9000 },
  { adId: "weekend-dining", date: "2026-11-05", plays: 6600 },
] as const;

/** Buckets only recorded sample delivery, never assigned targets. */
export function getAdPlaysByPeriod(
  ads: Advertisement[],
  range: ChartRange,
  asOf = new Date(),
) {
  const ids = new Set(ads.map((ad) => ad.id));
  return aggregateChartRecords(
    sampleDeliveryHistory
      .filter((record) => ids.has(record.adId))
      .map((record) => ({ date: record.date, value: record.plays })),
    range,
    asOf,
  );
}

/** Sample delivery history only; cumulative totals cannot establish delivery dates. */
export function getMonthlyAdPlays(ads: Advertisement[], asOf = new Date()) {
  const ids = new Set(ads.map((ad) => ad.id));
  const cutoff = asOf.toISOString().slice(0, 10);
  const format = new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(
      Date.UTC(asOf.getUTCFullYear(), asOf.getUTCMonth() - 5 + index, 1),
    );
    const key = date.toISOString().slice(0, 7);
    const plays = sampleDeliveryHistory.reduce(
      (total, record) =>
        ids.has(record.adId) &&
        record.date <= cutoff &&
        record.date.startsWith(key)
          ? total + record.plays
          : total,
      0,
    );
    return { key, label: format.format(date), plays };
  });
}
