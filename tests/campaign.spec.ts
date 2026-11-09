import { expect, test } from "@playwright/test";
import {
  calculate,
  campaignDescription,
  campaignQuery,
  isVehicleType,
  readCampaign,
  supportedTypes,
} from "../src/lib/campaign";

test("campaign estimate multiplies cabs, days and daily plays at 30 paise", () => {
  const result = calculate(20, 10, 50, "Cabs");
  expect(result).toEqual({
    ok: true,
    estimate: {
      vehicles: 20,
      days: 10,
      dailyPlays: 50,
      type: "Cabs",
      plays: 10_000,
      cost: 3_000,
    },
  });
  if (!result.ok) return;
  expect(campaignDescription(result.estimate)).toContain(
    "20 cabs × 10 days × 50 plays per cab per day = 10,000 estimated 30-second plays",
  );
  expect(campaignDescription(result.estimate)).toContain(
    "₹3,000 at ₹0.30 per play",
  );
  expect(readCampaign(`?${campaignQuery(result.estimate)}`)).toEqual(result);
});

test("total estimated plays must be greater than 1,000", () => {
  expect(calculate(1, 1, 1000, "Cabs")).toMatchObject({
    ok: false,
    error: "Total estimated plays must be greater than 1,000.",
  });
  expect(calculate(1, 1, 1001, "Cabs")).toMatchObject({
    ok: true,
    estimate: { plays: 1001, cost: 300.3 },
  });
});

test("cab is the only supported format", () => {
  expect(supportedTypes).toEqual(["Cabs"]);
  expect(isVehicleType("Cabs")).toBe(true);
  expect(isVehicleType("Buses")).toBe(false);
  expect(isVehicleType("Both")).toBe(false);
  expect(calculate(20, 10, 50, "Buses").ok).toBe(false);
  expect(calculate(20, 10, 50, "Both").ok).toBe(false);
  expect(
    readCampaign("?vehicles=20&days=10&dailyPlays=50&type=Buses"),
  ).toMatchObject({ ok: false });
});

test("rejects invalid numbers and unsafe estimates", () => {
  const invalid = [
    "",
    " ",
    "nope",
    "NaN",
    "Infinity",
    "0",
    "-1",
    "1.5",
    null,
    Number.MAX_SAFE_INTEGER + 1,
  ];
  for (const value of invalid) {
    expect(calculate(value, 10, 50, "Cabs").ok).toBe(false);
    expect(calculate(20, value, 50, "Cabs").ok).toBe(false);
    expect(calculate(20, 10, value, "Cabs").ok).toBe(false);
  }
  expect(calculate(Number.MAX_SAFE_INTEGER, 1, 1, "Cabs")).toMatchObject({
    ok: false,
    error: expect.stringContaining("too large"),
  });
  const maximumPlays = Math.floor(Number.MAX_SAFE_INTEGER / 30);
  expect(calculate(1, 1, maximumPlays, "Cabs").ok).toBe(true);
  expect(calculate(1, 1, maximumPlays + 1, "Cabs").ok).toBe(false);
  expect(calculate(20, 10, 50, "Train").ok).toBe(false);
});

test("reads only valid current campaign links", () => {
  expect(readCampaign("?unrelated=true")).toBeNull();
  expect(readCampaign("?vehicles=20")).toMatchObject({ ok: false });
  expect(readCampaign("?ads=1000")).toMatchObject({
    ok: false,
    error: expect.stringContaining("outdated"),
  });
});
