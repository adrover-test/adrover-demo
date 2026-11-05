import { expect, test } from "@playwright/test";
import { aggregateChartRecords, chartRanges } from "../src/lib/chartPeriods";
import { getAdPlaysByPeriod } from "../src/lib/adPlays";
import { getCampaignRevenueByPeriod } from "../src/lib/billing";
import { advertisementSamples } from "../src/lib/advertisements";

const asOf = new Date("2026-11-05T12:00:00Z");

test("chart ranges have exact counts, calendar boundaries and zero periods", () => {
  for (const range of chartRanges) {
    const periods = aggregateChartRecords([], range.value, asOf);
    expect(periods).toHaveLength(range.count);
    expect(periods.every((period) => period.value === 0)).toBe(true);
  }
  const years = aggregateChartRecords([], "yearly", asOf);
  expect(years[0].key).toBe("2017-01-01");
  expect(years[9].key).toBe("2026-01-01");
  const months = aggregateChartRecords([], "monthly", asOf);
  expect(months[0].key).toBe("2025-12-01");
  expect(months[11].key).toBe("2026-11-01");
  expect(
    aggregateChartRecords([], "weekly", asOf).map((period) => period.key),
  ).toEqual(["2026-10-12", "2026-10-19", "2026-10-26", "2026-11-02"]);
  const days = aggregateChartRecords([], "daily", asOf);
  expect(days[0].key).toBe("2026-10-07");
  expect(days[29].key).toBe("2026-11-05");
});

test("chart periods handle Monday boundaries, year rollover, leap days and future records", () => {
  const records = [
    { date: "2026-11-01", value: 5 },
    { date: "2026-11-02", value: 7 },
    { date: "2026-11-06", value: 100 },
  ];
  expect(
    aggregateChartRecords(records, "weekly", asOf).map(
      (period) => period.value,
    ),
  ).toEqual([0, 0, 5, 7]);
  expect(
    aggregateChartRecords(
      records,
      "weekly",
      new Date("2026-11-01T23:59:00Z"),
    )[3].key,
  ).toBe("2026-10-26");
  expect(
    aggregateChartRecords([], "weekly", new Date("2027-01-01T12:00:00Z"))[3]
      .key,
  ).toBe("2026-12-28");
  const leap = aggregateChartRecords(
    [{ date: "2024-02-29", value: 9 }],
    "daily",
    new Date("2024-03-01T00:00:00Z"),
  );
  expect(leap[28]).toMatchObject({ key: "2024-02-29", value: 9 });
});

test("filtered plays and revenue preserve real record dates and collection rules", () => {
  for (const range of chartRanges) {
    const plays = getAdPlaysByPeriod(advertisementSamples, range.value, asOf);
    const revenue = getCampaignRevenueByPeriod(range.value, asOf);
    expect(plays.reduce((sum, period) => sum + period.value, 0)).toBe(
      range.value === "weekly" || range.value === "daily" ? 137250 : 148250,
    );
    expect(revenue.reduce((sum, period) => sum + period.value, 0)).toBe(
      range.value === "weekly" || range.value === "daily" ? 125000 : 282500,
    );
  }
  expect(
    getAdPlaysByPeriod([], "yearly", asOf).every(
      (period) => period.value === 0,
    ),
  ).toBe(true);
});
