import { getAdminToken, type CabDriver } from "./admin";
import type {
  Earnings,
  IssueDetail,
  IssueSummary,
  Payment,
} from "../driver/api";

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/$/, "");
const driversRoot = "/api/v1/drivers";

export function generateDriverPassword(details: {
  name: string;
  car: string;
  phone: string;
}): string {
  const name = (details.name.normalize("NFKC").match(/[\p{L}\p{N}]/gu) ?? [])
    .slice(0, 2)
    .join("");
  const car = details.car.toUpperCase().replace(/[\s-]/g, "");
  const phone = details.phone.replace(/\D/g, "");
  if (!name || !/^[A-Z0-9]{6,15}$/.test(car))
    throw new Error(
      "Enter the driver name and a valid vehicle number before generating a password.",
    );
  if (!/^(?:91|0)?[6-9]\d{9}$/.test(phone))
    throw new Error(
      "Enter a valid 10-digit driver mobile number before generating a password.",
    );

  // The personal details are predictable; security comes from ten random base-32 characters.
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = new Uint8Array(10);
  crypto.getRandomValues(random);
  const suffix = Array.from(random, (value) => alphabet[value & 31]).join("");
  return `${name}${car.slice(-3)}${phone.slice(-2)}-${suffix}`;
}

type BackendDriver = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  vehicleNumber: string;
  vehicleModel: string;
  serviceArea: string;
  screenId: string;
  status: string;
};

function toCabDriver(value: BackendDriver): CabDriver {
  return {
    id: value.id,
    driver: value.fullName,
    car: value.vehicleNumber,
    model: value.vehicleModel,
    phone: value.phone,
    email: value.email,
    area: value.serviceArea,
    screenId: value.screenId,
    status: parseStatus(value.status),
  };
}

function parseStatus(status: string): CabDriver["status"] {
  if (
    status === "Available" ||
    status === "Assigned" ||
    status === "Maintenance"
  )
    return status;
  throw new Error("The driver directory returned an invalid availability.");
}

function toBackendPayload(input: Omit<CabDriver, "id">) {
  return {
    fullName: input.driver,
    phone: input.phone,
    email: input.email,
    vehicleNumber: input.car,
    vehicleModel: input.model,
    serviceArea: input.area,
    screenId: input.screenId,
    status: input.status,
  };
}

async function send(path: string, init: RequestInit): Promise<unknown> {
  const token = getAdminToken();
  if (!token) throw new Error("Sign in to the admin portal to continue.");
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${driversRoot}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new Error(
      "Could not connect to Adrover. Check your connection and try again.",
    );
  }
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Non-JSON body; the status code is enough.
  }
  if (!response.ok) {
    const record =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : null;
    const nested =
      record && typeof record.error === "object" && record.error !== null
        ? (record.error as Record<string, unknown>)
        : null;
    const message =
      record && typeof record.message === "string" && record.message
        ? record.message
        : nested && typeof nested.message === "string" && nested.message
          ? nested.message
          : response.status === 401
            ? "Your admin session has expired. Sign in again to continue."
            : "We could not complete your request. Please try again.";
    throw new Error(message);
  }
  return typeof body === "object" && body !== null && "data" in body
    ? body.data
    : body;
}

/** Loads the driver directory from the database. */
export async function listDrivers(): Promise<CabDriver[]> {
  const data = await send("", { method: "GET" });
  if (!Array.isArray(data))
    throw new Error("The driver directory could not be loaded.");
  return (data as BackendDriver[]).map(toCabDriver);
}

/** Creates a driver with a one-time generated password; only its hash is stored. */
export async function saveNewDriver(
  input: Omit<CabDriver, "id">,
  password: string,
): Promise<void> {
  await send("", {
    method: "POST",
    body: JSON.stringify({ ...toBackendPayload(input), password }),
  });
}

/** Updates driver details, including the editable screen ID. */
export async function saveDriverUpdate(
  id: string,
  input: Omit<CabDriver, "id">,
  password?: string,
): Promise<void> {
  await send(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({
      ...toBackendPayload(input),
      ...(password ? { password } : {}),
    }),
  });
}

export type DriverAssignment = {
  id: string;
  advertisementId: string;
  name: string;
  scheduledAt: string;
  targetPlays: number;
  ratePerPlay: number;
  status: "assigned" | "paused" | "completed";
  playsCompleted: number;
};

export type DriverOperations = {
  campaigns: { id: string; name: string; startDate: string; endDate: string }[];
  assignments: DriverAssignment[];
  earnings: Earnings;
  payouts: Payment[];
  issues: { summary: IssueSummary; confirmed: boolean }[];
};

export async function getDriverOperations(
  id: string,
): Promise<DriverOperations> {
  const data = await send(`/${encodeURIComponent(id)}/operations`, {
    method: "GET",
  });
  if (
    typeof data !== "object" ||
    data === null ||
    !("campaigns" in data) ||
    !Array.isArray(data.campaigns) ||
    !("assignments" in data) ||
    !Array.isArray(data.assignments) ||
    !("payouts" in data) ||
    !Array.isArray(data.payouts) ||
    !("issues" in data) ||
    !Array.isArray(data.issues) ||
    !("earnings" in data) ||
    typeof data.earnings !== "object" ||
    data.earnings === null
  )
    throw new Error("The driver operations response was invalid.");
  return data as DriverOperations;
}

export async function updateDriverOperation(
  id: string,
  path: string,
  method: "POST" | "PUT",
  body: Record<string, unknown>,
): Promise<void> {
  await send(`/${encodeURIComponent(id)}${path}`, {
    method,
    body: JSON.stringify(body),
  });
}

export async function getDriverIssue(
  id: string,
  issueId: string,
): Promise<IssueDetail> {
  const data = await send(
    `/${encodeURIComponent(id)}/issues/${encodeURIComponent(issueId)}`,
    { method: "GET" },
  );
  if (
    typeof data !== "object" ||
    data === null ||
    !("id" in data) ||
    data.id !== issueId ||
    !("history" in data) ||
    !Array.isArray(data.history)
  )
    throw new Error("The driver issue response was invalid.");
  return data as IssueDetail;
}
