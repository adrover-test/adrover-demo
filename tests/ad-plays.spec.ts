import { expect, test } from "@playwright/test";
import { getMonthlyAdPlays } from "../src/lib/adPlays";
import { advertisementSamples } from "../src/lib/advertisements";

test("monthly ad plays reconcile with sample delivered totals and retain zero months", () => {
  const months = getMonthlyAdPlays(
    advertisementSamples,
    new Date("2026-11-05T12:00:00Z"),
  );
  expect(months.map((month) => month.key)).toEqual([
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
  ]);
  expect(months.map((month) => month.plays)).toEqual([
    0, 0, 4000, 7000, 94000, 43250,
  ]);
  expect(months.reduce((sum, month) => sum + month.plays, 0)).toBe(
    advertisementSamples.reduce((sum, ad) => sum + ad.plays, 0),
  );
  for (const ad of advertisementSamples) {
    expect(
      getMonthlyAdPlays([ad], new Date("2026-11-05T12:00:00Z")).reduce(
        (sum, month) => sum + month.plays,
        0,
      ),
    ).toBe(ad.plays);
  }
});

test("monthly ad plays exclude future records, approval targets and ads without history", () => {
  const beforeNovemberDelivery = getMonthlyAdPlays(
    advertisementSamples,
    new Date("2026-11-04T23:59:59Z"),
  );
  expect(beforeNovemberDelivery[5].plays).toBe(0);
  const noHistory = [
    {
      ...advertisementSamples[0],
      id: "local-new-ad",
      plays: 0,
      target: 999999,
    },
    advertisementSamples[4],
  ];
  expect(getMonthlyAdPlays(noHistory).every((month) => month.plays === 0)).toBe(
    true,
  );
  expect(
    getMonthlyAdPlays([], new Date("2027-01-05T12:00:00Z")).map(
      (month) => month.key,
    ),
  ).toEqual(["2026-08", "2026-09", "2026-10", "2026-11", "2026-12", "2027-01"]);
});
