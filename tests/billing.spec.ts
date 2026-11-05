import { expect, test } from "@playwright/test";
import {
  getCollectedCampaignRevenue,
  getMonthlyCampaignRevenue,
} from "../src/lib/billing";

test("revenue excludes wallet, pending and future payments and subtracts refunds", () => {
  expect(getCollectedCampaignRevenue(new Date("2026-11-05T12:00:00Z"))).toBe(
    282500,
  );
  expect(getCollectedCampaignRevenue(new Date("2026-10-01T12:00:00Z"))).toBe(
    157500,
  );
  expect(getCollectedCampaignRevenue(new Date("2026-08-01T12:00:00Z"))).toBe(0);
});

test("monthly revenue chart uses the same net payments and includes zero months", () => {
  const months = getMonthlyCampaignRevenue(new Date("2026-11-05T12:00:00Z"));
  expect(months.map((month) => month.key)).toEqual([
    "2026-06",
    "2026-07",
    "2026-08",
    "2026-09",
    "2026-10",
    "2026-11",
  ]);
  expect(months.map((month) => month.amount)).toEqual([
    0, 0, -12500, 75000, 220000, 0,
  ]);
  expect(months.reduce((sum, month) => sum + month.amount, 0)).toBe(282500);
  expect(
    getMonthlyCampaignRevenue(new Date("2027-01-05T12:00:00Z"))[5].key,
  ).toBe("2027-01");
});
