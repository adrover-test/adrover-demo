import { expect, test } from "@playwright/test";
import { calculate, campaignQuery, readCampaign } from "../src/lib/campaign";

test("campaign calculation, supported formats and handoff", () => {
  for (const type of ["Both", "Cabs", "Buses"]) {
    const result = calculate("20", "10", "50", type);
    expect(result).toEqual({
      ok: true,
      estimate: {
        vehicles: 20,
        days: 10,
        dailyPlays: 50,
        type,
        plays: 10_000,
        cost: 2_500,
      },
    });
    if (result.ok)
      expect(readCampaign(`?${campaignQuery(result.estimate)}`)).toEqual(
        result,
      );
  }
  expect(calculate(1, 1, 1, "Cabs")).toMatchObject({
    ok: true,
    estimate: { cost: 0.25, plays: 1 },
  });
});

test("rejects invalid numbers, unsupported formats and unsafe totals", () => {
  for (const value of [
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
  ]) {
    expect(calculate(value, 10, 50, "Both").ok).toBe(false);
    expect(calculate(20, value, 50, "Both").ok).toBe(false);
    expect(calculate(20, 10, value, "Both").ok).toBe(false);
  }
  expect(calculate(20, 10, 50, "Train").ok).toBe(false);
  expect(calculate(Number.MAX_SAFE_INTEGER, 1, 1, "Both")).toMatchObject({
    ok: false,
    error: expect.stringContaining("too large"),
  });
  expect(readCampaign("?unrelated=true")).toBeNull();
  expect(readCampaign("?vehicles=20")).toMatchObject({ ok: false });
  const maximumPlays = Math.floor(Number.MAX_SAFE_INTEGER / 25);
  expect(calculate(maximumPlays, 1, 1, "Both").ok).toBe(true);
  expect(calculate(maximumPlays + 1, 1, 1, "Both").ok).toBe(false);
});
