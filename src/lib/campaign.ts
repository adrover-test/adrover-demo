export const supportedTypes = ["Both", "Cabs", "Buses"] as const;
export type VehicleType = (typeof supportedTypes)[number];
export type Estimate = {
  vehicles: number;
  days: number;
  dailyPlays: number;
  type: VehicleType;
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
