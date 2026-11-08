export const supportedTypes = ["Both", "Cabs", "Buses"] as const;
export type VehicleType = (typeof supportedTypes)[number];
type LegacyEstimate = {
  vehicles: number;
  days: number;
  dailyPlays: number;
  type: VehicleType;
  plays: number;
  cost: number;
};
export type AdEstimate = {
  vehicles: number;
  days: number;
  weeks: number;
  type: "Cabs";
  plays: number;
  cost: number;
};
export type Estimate = LegacyEstimate | AdEstimate;
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

export function calculate(
  vehicles: string | number | null,
  days: string | number | null,
  dailyPlays: string | number | null,
  type: unknown,
): Calculation {
  if (!isVehicleType(type))
    return { ok: false, error: "Choose a supported vehicle format." };
  const names = ["Vehicle count", "Campaign days", "Plays per vehicle per day"];
  const values = [vehicles, days, dailyPlays].map(Number);
  const badIndex = values.findIndex((value) => !isPositiveInteger(value));
  if (badIndex !== -1)
    return {
      ok: false,
      error: `${names[badIndex]} must be a positive whole number.`,
    };
  const [vehicleCount, duration, daily] = values;
  const plays = vehicleCount * duration * daily;
  const cents = plays * 25;
  if (!Number.isSafeInteger(plays) || !Number.isSafeInteger(cents)) {
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
      type,
      plays,
      cost: cents / 100,
    },
  };
}

export function readCampaign(search: string): Calculation | null {
  const params = new URLSearchParams(search);
  if (params.has("ads") || params.has("weeks")) {
    if (params.get("type") !== "Cabs")
      return { ok: false, error: "This estimate supports cabs only." };
    return calculateAds(
      params.get("vehicles"),
      params.get("ads"),
      params.get("weeks"),
    );
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
  if ("weeks" in estimate)
    return new URLSearchParams({
      vehicles: String(estimate.vehicles),
      ads: String(estimate.plays),
      weeks: String(estimate.weeks),
      type: estimate.type,
    }).toString();
  return new URLSearchParams({
    vehicles: String(estimate.vehicles),
    days: String(estimate.days),
    dailyPlays: String(estimate.dailyPlays),
    type: estimate.type,
  }).toString();
}

export function calculateAds(
  vehicles: string | number | null,
  ads: string | number | null,
  weeks: string | number | null,
): Calculation {
  if (!isPositiveInteger(vehicles))
    return {
      ok: false,
      error: "Number of cabs must be a positive whole number.",
    };
  if (!isPositiveInteger(ads) || Number(ads) < 1000)
    return {
      ok: false,
      error: "Number of ads must be a whole number of at least 1,000.",
    };
  if (!isPositiveInteger(weeks) || Number(weeks) > 3)
    return {
      ok: false,
      error: "Select a campaign duration of 1, 2 or 3 weeks.",
    };
  const cents = Number(ads) * 30;
  if (!Number.isSafeInteger(cents))
    return {
      ok: false,
      error: "The values are too large for a reliable estimate. Use fewer ads.",
    };
  return {
    ok: true,
    estimate: {
      vehicles: Number(vehicles),
      plays: Number(ads),
      weeks: Number(weeks),
      days: Number(weeks) * 7,
      type: "Cabs",
      cost: cents / 100,
    },
  };
}

export function campaignDescription(estimate: Estimate): string {
  if ("weeks" in estimate)
    return `${estimate.vehicles} cabs, ${estimate.weeks} ${estimate.weeks === 1 ? "week" : "weeks"} (${estimate.days} days), ${numberFormat.format(estimate.plays)} total ads across the entire campaign; ${moneyFormat.format(estimate.cost)} at INR 0.30/ad. Cabs and duration do not multiply the ad total.`;
  return `${estimate.vehicles} vehicles, ${estimate.days} days, ${estimate.dailyPlays} plays/vehicle/day. ${numberFormat.format(estimate.plays)} estimated plays; ${moneyFormat.format(estimate.cost)} at assumed INR 0.25/play.`;
}
