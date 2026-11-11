export const supportedTypes = ["Cabs"] as const;
export type VehicleType = (typeof supportedTypes)[number];
export const cabCountOptions = [10, 20, 30] as const;
export const minimumCampaignDays = 7;
export const minimumDailyPlays = 1000;
export type Estimate = {
  vehicles: number;
  days: number;
  dailyPlays: number;
  type: "Cabs";
  plays: number;
  cost: number;
};
export type Calculation =
  { ok: true; estimate: Estimate } | { ok: false; error: string };

export const numberFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});
export const moneyFormat = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function isVehicleType(value: unknown): value is VehicleType {
  return supportedTypes.some((type) => type === value);
}

export function isPositiveInteger(value: string | number | null): boolean {
  return Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

export function isSupportedCabCount(value: string | number | null): boolean {
  return cabCountOptions.some((count) => count === Number(value));
}

export function isValidCampaignDays(value: string | number | null): boolean {
  return isPositiveInteger(value) && Number(value) >= minimumCampaignDays;
}

export function isValidDailyPlays(value: string | number | null): boolean {
  return isPositiveInteger(value) && Number(value) >= minimumDailyPlays;
}

export function calculate(
  vehicles: string | number | null,
  days: string | number | null,
  dailyPlays: string | number | null,
  type: unknown,
): Calculation {
  if (!isVehicleType(type))
    return {
      ok: false,
      error: "Cab advertising is the only supported format.",
    };
  if (!isSupportedCabCount(vehicles))
    return {
      ok: false,
      error: "Cab count must be 10, 20, or 30.",
    };
  if (!isValidCampaignDays(days))
    return {
      ok: false,
      error: `Campaign duration must be at least ${minimumCampaignDays} days.`,
    };
  if (!isValidDailyPlays(dailyPlays))
    return {
      ok: false,
      error: `Plays per day must be at least ${numberFormat.format(minimumDailyPlays)}.`,
    };
  const vehicleCount = Number(vehicles);
  const duration = Number(days);
  const daily = Number(dailyPlays);
  const plays = duration * daily;
  if (!Number.isSafeInteger(plays)) {
    return {
      ok: false,
      error:
        "The values are too large for a reliable estimate. Use smaller values and discuss larger campaigns with Adrover.",
    };
  }
  const cents = plays * 30;
  if (!Number.isSafeInteger(cents)) {
    return {
      ok: false,
      error:
        "The values are too large for a reliable estimate. Use smaller values and discuss larger campaigns with Adrover.",
    };
  }
  return {
    ok: true,
    estimate: {
      vehicles: vehicleCount,
      days: duration,
      dailyPlays: daily,
      type: "Cabs",
      plays,
      cost: cents / 100,
    },
  };
}

export function readCampaign(search: string): Calculation | null {
  const params = new URLSearchParams(search);
  if (params.has("ads") || params.has("weeks")) {
    return {
      ok: false,
      error: "This campaign link uses an outdated pricing format.",
    };
  }
  const keys = ["vehicles", "days", "dailyPlays", "type"];
  if (!keys.some((key) => params.has(key))) return null;
  return calculate(
    params.get("vehicles"),
    params.get("days"),
    params.get("dailyPlays"),
    params.get("type"),
  );
}

export function campaignQuery(estimate: Estimate): string {
  return new URLSearchParams({
    vehicles: String(estimate.vehicles),
    days: String(estimate.days),
    dailyPlays: String(estimate.dailyPlays),
    type: estimate.type,
  }).toString();
}

export function campaignDescription(estimate: Estimate): string {
  return `${numberFormat.format(estimate.dailyPlays)} plays per day × ${numberFormat.format(estimate.days)} days = ${numberFormat.format(estimate.plays)} estimated 30-second plays; ${moneyFormat.format(estimate.cost)} at ₹0.30 per play. Requested fleet: ${numberFormat.format(estimate.vehicles)} cabs. Taxes and final placement details apply at checkout.`;
}
