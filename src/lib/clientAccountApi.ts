import { send } from "./advertisementApi";

export type ClientProfile = {
  name: string;
  email: string;
  phone: string;
};

export type ClientPayment = {
  id: string;
  orderId: string;
  paymentId: string | null;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  createdAt: string;
  processedAt: string | null;
  advertisementName: string | null;
};

export type PaymentHistoryPage = {
  items: ClientPayment[];
  total: number;
  skip: number;
  take: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function field(
  record: Record<string, unknown>,
  camel: string,
  pascal: string,
): unknown {
  return record[camel] ?? record[pascal];
}

function requiredString(value: unknown): value is string {
  return typeof value === "string";
}

function parseProfile(value: unknown): ClientProfile {
  if (!isRecord(value)) throw new Error("Invalid profile");
  const name = field(value, "name", "Name");
  const email = field(value, "email", "Email");
  const phone = field(value, "phone", "Phone");
  if (
    !requiredString(name) ||
    !requiredString(email) ||
    !requiredString(phone)
  ) {
    throw new Error("Invalid profile");
  }
  return { name, email, phone };
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parsePayment(value: unknown): ClientPayment {
  if (!isRecord(value)) throw new Error("Invalid payment");
  const id = field(value, "id", "Id");
  const orderId = field(value, "orderId", "OrderId");
  const amount = field(value, "amount", "Amount");
  const currency = field(value, "currency", "Currency");
  const status = field(value, "status", "Status");
  const createdAt = field(value, "createdAt", "CreatedAt");
  if (
    !requiredString(id) ||
    !requiredString(orderId) ||
    typeof amount !== "number" ||
    !requiredString(currency) ||
    !requiredString(status) ||
    !requiredString(createdAt)
  ) {
    throw new Error("Invalid payment");
  }
  return {
    id,
    orderId,
    paymentId: nullableString(field(value, "paymentId", "PaymentId")),
    amount,
    currency,
    status,
    paymentMethod:
      nullableString(field(value, "paymentMethod", "PaymentMethod")) ?? "",
    createdAt,
    processedAt: nullableString(field(value, "processedAt", "ProcessedAt")),
    advertisementName: nullableString(
      field(value, "advertisementName", "AdvertisementName"),
    ),
  };
}

export async function getClientProfile(): Promise<ClientProfile> {
  try {
    return parseProfile(await send("/api/Users/me", { method: "GET" }));
  } catch {
    throw new Error("We couldn't load your profile. Please try again.");
  }
}

export async function updateClientProfile(
  name: string,
): Promise<ClientProfile> {
  try {
    return parseProfile(
      await send("/api/Users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }),
    );
  } catch {
    throw new Error("We couldn't save your changes. Please try again.");
  }
}

export async function getClientPaymentHistory(
  pageNumber: number,
  pageSize = 10,
): Promise<PaymentHistoryPage> {
  try {
    const query = new URLSearchParams({
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });
    const value = await send(`/api/Payments/history?${query.toString()}`, {
      method: "GET",
    });
    if (!isRecord(value)) throw new Error("Invalid payment history");
    const items = field(value, "items", "Items");
    const total = field(value, "total", "Total");
    const skip = field(value, "skip", "Skip");
    const take = field(value, "take", "Take");
    if (
      !Array.isArray(items) ||
      typeof total !== "number" ||
      typeof skip !== "number" ||
      typeof take !== "number"
    ) {
      throw new Error("Invalid payment history");
    }
    return { items: items.map(parsePayment), total, skip, take };
  } catch {
    throw new Error("We couldn't load your payment history. Please try again.");
  }
}
