import {
  getAllAdvertisements,
  getDemoClients,
  getDemoEnquiries,
  getSavedProfile,
} from "./portal";
import type { ChartRange } from "./chartPeriods";
import { parseClientCampaignList } from "./campaignModel";

const adminSessionKey = "adrover-demo-admin-session";
const enquiryUpdatesKey = "adrover-enquiry-updates";
const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/$/, "");

export type EnquiryUpdate = {
  id: string;
  status: "Awaiting reply" | "Replied";
  notes: { text: string; author: string; createdAt: string }[];
  updatedBy: string;
  updatedAt: string;
};

export type AdminDashboardSummary = {
  clientsPresent: number;
  enquiries: number;
  cabsInDirectory: number;
  adsAwaitingApproval: number;
  totalAds: number;
  totalAdPlays: number;
  totalRevenueTillDate: number;
};

export type OperationsOverviewPoint = {
  key: string;
  label: string;
  value: number;
};

export type AdminOperationsOverview = {
  adPlays: OperationsOverviewPoint[];
  campaignRevenue: OperationsOverviewPoint[];
  statusCounts: Record<
    "Active" | "Pending approval" | "Approved" | "Completed",
    number
  >;
  totalAds: number;
  periodPlays: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function field(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (key in record) return record[key];
  }
  return undefined;
}

function summaryCount(
  record: Record<string, unknown>,
  keys: string[],
  label: string,
): number {
  const value = field(record, keys);
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  if (!Number.isFinite(number) || number < 0) {
    throw new Error(`Admin ${label} could not be loaded.`);
  }
  return number;
}

function numericField(record: Record<string, unknown>, keys: string[]): number {
  const value = field(record, keys);
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(number) ? number : 0;
}

function parseOverviewPoints(
  value: unknown,
  valueKeys: string[],
): OperationsOverviewPoint[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      if (!isRecord(entry)) return null;
      const key =
        String(
          field(entry, ["key", "id", "periodKey", "date", "month", "period"]),
        ) || `point-${index + 1}`;
      const label =
        String(field(entry, ["label", "name", "periodLabel", "month"]) ?? "") ||
        key;
      const number = numericField(entry, valueKeys);
      return { key, label, value: number };
    })
    .filter((entry): entry is OperationsOverviewPoint => entry !== null);
}

function statusCountFrom(
  source: Record<string, unknown>,
  primaryKey: string,
  fallbackKeys: string[],
): number {
  const nested = field(source, ["statusCounts", "statuses", "statusSummary"]);
  if (isRecord(nested)) {
    return Math.max(
      0,
      Math.floor(numericField(nested, [primaryKey, ...fallbackKeys])),
    );
  }
  const statusList = field(source, [
    "advertisementsByStatus",
    "statusBreakdown",
  ]);
  if (Array.isArray(statusList)) {
    const target = [primaryKey, ...fallbackKeys].map((value) =>
      value.toLowerCase().replaceAll(" ", ""),
    );
    const matched = statusList.find((item) => {
      if (!isRecord(item)) return false;
      const status = String(field(item, ["status", "name"]) ?? "")
        .toLowerCase()
        .replaceAll(" ", "");
      return target.includes(status);
    });
    if (isRecord(matched))
      return Math.max(
        0,
        Math.floor(numericField(matched, ["count", "value", "total"])),
      );
  }
  return Math.max(
    0,
    Math.floor(numericField(source, [primaryKey, ...fallbackKeys])),
  );
}

function adminRequestHeaders(includeAuth = true): Record<string, string> {
  const token = getAdminToken();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (includeAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function adminGet(path: string, includeAuth = true): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: adminRequestHeaders(includeAuth),
  });
}

async function adminPut(
  path: string,
  body: Record<string, unknown>,
  includeAuth = true,
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "PUT",
    headers: {
      ...adminRequestHeaders(includeAuth),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

async function adminList(
  path: string,
  key: string,
): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  for (let page = 1; ; page++) {
    let response: Response;
    try {
      response = await adminGet(`${path}?pageNumber=${page}&pageSize=100`);
    } catch {
      throw new Error("Could not reach the admin service.");
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON response.
    }

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? "Your admin session has expired. Sign in again."
          : "The admin data could not be loaded.",
      );
    }

    const body =
      isRecord(payload) && "data" in payload ? payload.data : payload;
    const listValue = Array.isArray(body)
      ? body
      : isRecord(body)
        ? (Object.entries(body).find(
            ([name]) => name.toLowerCase() === key.toLowerCase(),
          )?.[1] ??
          Object.entries(body).find(
            ([name]) => name.toLowerCase() === "items",
          )?.[1])
        : undefined;
    if (!Array.isArray(listValue) || !listValue.every(isRecord)) {
      throw new Error(`The admin ${key} response was invalid.`);
    }
    items.push(...listValue);
    const total = isRecord(body)
      ? Object.entries(body).find(
          ([name]) => name.toLowerCase() === "total",
        )?.[1]
      : undefined;
    if (total === undefined) return items;
    if (
      typeof total !== "number" ||
      !Number.isSafeInteger(total) ||
      total < 0
    ) {
      throw new Error(`The admin ${key} total was invalid.`);
    }
    const pageNumber = isRecord(body)
      ? Object.entries(body).find(
          ([name]) => name.toLowerCase() === "pagenumber",
        )?.[1]
      : undefined;
    if (pageNumber !== undefined && pageNumber !== page) {
      throw new Error(`The admin ${key} page was invalid.`);
    }
    if (items.length >= total) return items;
    if (!listValue.length) {
      throw new Error(`Some admin ${key} records could not be loaded.`);
    }
  }
}

export async function loginAdmin(
  email: string,
  password: string,
): Promise<string | undefined> {
  if (!email.trim() || !email.includes("@")) {
    throw new Error("Enter a valid admin email.");
  }
  if (!password) {
    throw new Error("Enter your admin password.");
  }
  if (!baseUrl) return undefined;

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/auth/admin-login`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch {
    throw new Error("Could not reach the admin sign-in service.");
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response.
  }
  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : "Admin sign-in failed. Check your credentials.",
    );
  }
  const body =
    isRecord(payload) && payload.success === true && "data" in payload
      ? payload.data
      : payload;
  if (
    !isRecord(body) ||
    typeof body.accessToken !== "string" ||
    !body.accessToken
  ) {
    throw new Error("The server returned an unexpected sign-in response.");
  }
  return body.accessToken;
}

let dashboardSummaryInFlight: Promise<AdminDashboardSummary> | null = null;
const operationsOverviewInFlight: Partial<
  Record<ChartRange, Promise<AdminOperationsOverview>>
> = {};

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummary> {
  if (dashboardSummaryInFlight) return dashboardSummaryInFlight;

  dashboardSummaryInFlight = (async () => {
    let response: Response;
    try {
      response = await adminGet("/api/admin/dashboard/summary");
    } catch {
      throw new Error("Could not reach the admin dashboard service.");
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON response.
    }

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? "You do not have permission to view the admin dashboard summary."
          : "The admin dashboard summary could not be loaded.",
      );
    }

    const body =
      isRecord(payload) && payload.success === true && "data" in payload
        ? payload.data
        : payload;
    if (!isRecord(body)) {
      throw new Error("The admin dashboard summary response was invalid.");
    }

    return {
      clientsPresent: summaryCount(
        body,
        ["clientsPresent", "totalClients", "clients", "clientCount"],
        "client count",
      ),
      enquiries: summaryCount(
        body,
        ["enquiries", "totalEnquiries", "enquiryCount"],
        "enquiry count",
      ),
      cabsInDirectory: summaryCount(
        body,
        ["cabsInDirectory", "totalCabs", "cabs", "cabCount", "driversCount"],
        "cab count",
      ),
      adsAwaitingApproval: summaryCount(
        body,
        [
          "adsAwaitingApproval",
          "pendingApprovals",
          "pendingAdvertisements",
          "adsPendingApproval",
        ],
        "pending approval count",
      ),
      totalAds: summaryCount(
        body,
        ["totalAds", "advertisements", "advertisementCount"],
        "advertisement count",
      ),
      totalAdPlays: summaryCount(
        body,
        ["totalAdPlays", "adPlays", "totalPlays", "plays"],
        "ad play count",
      ),
      totalRevenueTillDate: summaryCount(
        body,
        ["totalRevenueTillDate", "totalRevenue", "collectedRevenue", "revenue"],
        "revenue",
      ),
    };
  })();

  try {
    return await dashboardSummaryInFlight;
  } finally {
    dashboardSummaryInFlight = null;
  }
}

export async function getAdminOperationsOverview(
  range: ChartRange,
): Promise<AdminOperationsOverview> {
  const cached = operationsOverviewInFlight[range];
  if (cached) return cached;

  operationsOverviewInFlight[range] = (async () => {
    let response: Response;
    try {
      response = await adminGet(
        `/api/admin/dashboard/operations-overview?range=${encodeURIComponent(range)}`,
      );
    } catch {
      throw new Error("Could not reach the admin operations overview service.");
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON response.
    }

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? "You do not have permission to view operations overview data."
          : "The operations overview could not be loaded.",
      );
    }

    const body =
      isRecord(payload) && payload.success === true && "data" in payload
        ? payload.data
        : payload;
    if (!isRecord(body)) {
      throw new Error("The operations overview response was invalid.");
    }

    const adPlays = parseOverviewPoints(
      field(body, ["monthlyAdPlays", "adPlays", "plays", "playsByPeriod"]),
      ["totalPlays", "value", "plays", "count", "total"],
    );
    const campaignRevenue = parseOverviewPoints(
      field(body, [
        "monthlyCampaignRevenue",
        "campaignRevenue",
        "revenue",
        "revenueByPeriod",
      ]),
      ["netRevenue", "value", "amount", "revenue", "total"],
    );
    const statusCounts = {
      Active: statusCountFrom(body, "Active", ["active"]),
      "Pending approval": statusCountFrom(body, "Pending approval", [
        "pendingApproval",
        "pendingApprovals",
        "PendingApproval",
      ]),
      Approved: statusCountFrom(body, "Approved", ["approved"]),
      Completed: statusCountFrom(body, "Completed", ["completed"]),
    } as const;
    return {
      adPlays,
      campaignRevenue,
      statusCounts,
      totalAds: Math.max(
        0,
        Math.floor(
          numericField(body, [
            "totalAds",
            "advertisements",
            "advertisementCount",
          ]),
        ),
      ),
      periodPlays: Math.max(
        0,
        Math.floor(
          numericField(body, [
            "totalAdPlaysInPeriod",
            "periodPlays",
            "totalAdPlays",
            "totalPlays",
          ]),
        ),
      ),
    };
  })();

  try {
    return await operationsOverviewInFlight[range]!;
  } finally {
    delete operationsOverviewInFlight[range];
  }
}

function getEnquiryUpdates(): EnquiryUpdate[] {
  const serialized = localStorage.getItem(enquiryUpdatesKey);
  if (!serialized) return [];
  const value: unknown = JSON.parse(serialized);
  if (
    !Array.isArray(value) ||
    !value.every(
      (item): item is EnquiryUpdate =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        (item.status === "Awaiting reply" || item.status === "Replied") &&
        typeof item.updatedBy === "string" &&
        typeof item.updatedAt === "string" &&
        Number.isFinite(Date.parse(item.updatedAt)) &&
        Array.isArray(item.notes) &&
        item.notes.every(
          (note: unknown) =>
            typeof note === "object" &&
            note !== null &&
            "text" in note &&
            typeof note.text === "string" &&
            "author" in note &&
            typeof note.author === "string" &&
            "createdAt" in note &&
            typeof note.createdAt === "string" &&
            Number.isFinite(Date.parse(note.createdAt)),
        ),
    )
  ) {
    throw new Error("Saved enquiry statuses and notes could not be read.");
  }
  return value;
}

export async function saveEnquiryUpdate(
  id: string,
  status: EnquiryUpdate["status"],
  note: string,
) {
  if (!isAdminSessionActive()) throw new Error("Sign in to update an enquiry.");
  if (status !== "Awaiting reply" && status !== "Replied")
    throw new Error("Choose a valid enquiry status.");
  if (note.length > 2000)
    throw new Error("Internal notes must be 2,000 characters or fewer.");
  if (note.length > 0 && !note.trim())
    throw new Error("Enter a note containing text, not just spaces.");
  if (!id.trim()) throw new Error("Choose a valid enquiry before saving.");

  if (baseUrl) {
    let response: Response;
    try {
      response = await adminPut(
        `/api/admin/enquiries/${encodeURIComponent(id)}/follow-up`,
        {
          replyStatus: status,
          internalNote: note.trim(),
        },
      );
    } catch {
      throw new Error("Could not reach the admin follow-up service.");
    }

    let payload: unknown = null;
    try {
      payload = await response.json();
    } catch {
      // Non-JSON response.
    }

    if (!response.ok) {
      throw new Error(
        response.status === 401 || response.status === 403
          ? "You do not have permission to update enquiries."
          : isRecord(payload) && typeof payload.message === "string"
            ? payload.message
            : "The enquiry follow-up could not be saved.",
      );
    }
  }

  const session: unknown = JSON.parse(sessionStorage.getItem(adminSessionKey)!);
  if (
    typeof session !== "object" ||
    session === null ||
    !("email" in session) ||
    typeof session.email !== "string"
  ) {
    throw new Error("The admin session is invalid. Sign in again.");
  }
  const updates = getEnquiryUpdates();
  const current = updates.find((update) => update.id === id);
  const now = new Date().toISOString();
  const update: EnquiryUpdate = {
    id,
    status,
    updatedBy: session.email,
    updatedAt: now,
    notes: [
      ...(current?.notes ?? []),
      ...(note.trim()
        ? [{ text: note.trim(), author: session.email, createdAt: now }]
        : []),
    ],
  };
  localStorage.setItem(
    enquiryUpdatesKey,
    JSON.stringify([...updates.filter((item) => item.id !== id), update]),
  );
}

export function startAdminSession(email: string, accessToken?: string) {
  sessionStorage.setItem(
    adminSessionKey,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      ...(accessToken ? { accessToken } : {}),
    }),
  );
}

/** Returns the backend access token for the admin session, if one was issued. */
export function getAdminToken(): string | null {
  const serialized = sessionStorage.getItem(adminSessionKey);
  if (!serialized) return null;
  const value: unknown = JSON.parse(serialized);
  return typeof value === "object" &&
    value !== null &&
    "accessToken" in value &&
    typeof value.accessToken === "string"
    ? value.accessToken
    : null;
}

export function endAdminSession() {
  sessionStorage.removeItem(adminSessionKey);
}

export function isAdminSessionActive() {
  const serialized = sessionStorage.getItem(adminSessionKey);
  if (!serialized) return false;
  const value: unknown = JSON.parse(serialized);
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string" &&
    value.email.includes("@")
  );
}

export function requireAdminSession(filename: string, search: string) {
  if (filename !== "admin.html" || isAdminSessionActive()) return false;
  window.location.replace(
    `admin-login.html?next=${encodeURIComponent(`admin.html${search}`)}`,
  );
  return true;
}

export function getAdminRedirect(search: string) {
  const next = new URLSearchParams(search).get("next");
  if (!next?.startsWith("admin.html?")) return "admin.html";
  const requested = new URLSearchParams(next.slice("admin.html?".length));
  const section = requested.get("section");
  if (
    !section ||
    ![
      "dashboard",
      "clients",
      "unfinished-registrations",
      "client",
      "enquiries",
      "cabs",
      "approvals",
      "ad",
      "cab",
    ].includes(section)
  )
    return "admin.html";
  const params = new URLSearchParams({ section });
  const id = requested.get("id");
  if (id) params.set("id", id);
  return `admin.html?${params}`;
}

export function getAdminClients() {
  const ads = getAllAdvertisements();
  const sampleBrands = [
    ...new Set(ads.filter((ad) => !ad.ownerEmail).map((ad) => ad.brand)),
  ];
  const emails = [
    ...new Set([
      ...getDemoClients(),
      ...ads.flatMap((ad) => (ad.ownerEmail ? [ad.ownerEmail] : [])),
    ]),
  ];
  return [
    ...sampleBrands.map((brand) => ({
      id: `sample:${brand}`,
      name: brand,
      contact: "Sample client",
      email: `${brand.toLowerCase().replace(/[^a-z0-9]/g, "")}@example.com`,
      phone: "Not provided",
      area: ads.find((ad) => ad.brand === brand)?.area ?? "Hyderabad",
      advertiserType: "Not provided",
      signInEmail: "Not available",
      profileSaved: false,
      ads: ads.filter((ad) => !ad.ownerEmail && ad.brand === brand),
    })),
    ...emails.map((email) => {
      const profile = getSavedProfile(email);
      return {
        id: email,
        name: profile?.businessName ?? email,
        contact: profile?.accountName ?? "Not provided",
        email: profile?.email ?? email,
        phone: profile?.phone || "Not provided",
        area: profile?.area ?? "Not provided",
        advertiserType: profile?.advertiserType ?? "Not provided",
        signInEmail: email,
        profileSaved: profile !== null,
        ads: ads.filter((ad) => ad.ownerEmail === email),
      };
    }),
  ];
}

export type AdminClient = ReturnType<typeof getAdminClients>[number] & {
  reportedAdsCount?: number;
};

let adminClientsInFlight: Promise<AdminClient[]> | null = null;

function clientText(record: Record<string, unknown>, keys: string[]): string {
  const value = field(record, keys);
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function clientCount(record: Record<string, unknown>, keys: string[]): number {
  const value = field(record, keys);
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : NaN;
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
}

function clientFlag(record: Record<string, unknown>, keys: string[]): boolean {
  const value = field(record, keys);
  return value === true || value === 1 || value === "true" || value === "1";
}

export async function getAdminClientsFromApi(): Promise<AdminClient[]> {
  if (!baseUrl) return getAdminClients();
  if (adminClientsInFlight) return adminClientsInFlight;

  adminClientsInFlight = (async () => {
    const items = await adminList("/api/admin/clients", "clients");

    const ads = getAllAdvertisements();
    return items.map((entry, index) => {
      if (!isRecord(entry)) throw new Error("A client record was invalid.");
      const email =
        clientText(entry, ["email", "businessEmail", "clientEmail"]) ||
        `client-${index + 1}@example.com`;
      const signInEmail =
        clientText(entry, ["signInEmail", "ownerEmail", "loginEmail"]) || email;
      const embeddedAds = parseClientCampaignList(
        field(entry, ["campaigns", "ads", "advertisements"]),
      );
      const clientAds = embeddedAds
        ? embeddedAds.map((ad) => ({
            ...ad,
            ownerEmail: signInEmail,
          }))
        : ads.filter(
            (ad) => ad.ownerEmail === signInEmail || ad.ownerEmail === email,
          );
      const name =
        clientText(entry, [
          "clientOrBusiness",
          "name",
          "businessName",
          "companyName",
        ]) || email;
      const contact =
        clientText(entry, [
          "contact",
          "contactName",
          "accountName",
          "fullName",
        ]) || "Not provided";
      const phone =
        clientText(entry, ["phone", "phoneNumber", "mobile"]) || "Not provided";
      const area =
        clientText(entry, ["area", "serviceArea", "city"]) || "Not provided";
      return {
        id:
          clientText(entry, ["id", "clientId", "userId"]) ||
          signInEmail ||
          email,
        name,
        contact,
        email,
        phone,
        area,
        advertiserType:
          clientText(entry, ["advertiserType", "type"]) || "Not provided",
        signInEmail,
        profileSaved: clientFlag(entry, ["profileSaved", "hasProfile"]),
        ads: clientAds,
        reportedAdsCount:
          embeddedAds?.length ??
          clientCount(entry, [
            "advertisementCount",
            "adsCount",
            "totalAds",
            "advertisements",
          ]),
      };
    });
  })();

  try {
    return await adminClientsInFlight;
  } finally {
    adminClientsInFlight = null;
  }
}

export function getAdminEnquiries() {
  const updates = getEnquiryUpdates();
  return [
    ...getDemoEnquiries(),
    {
      id: "sample-enquiry-1",
      name: "Sample Retail Team",
      business: "Deccan Retail",
      email: "retail@example.com",
      phone: "Not provided",
      goal: "Launch a product or service",
      message:
        "Interested in a two-week retail launch campaign around Madhapur. Please discuss creative requirements and availability.",
      createdAt: "2026-11-04T10:00:00.000Z",
    },
    {
      id: "sample-enquiry-2",
      name: "Sample Cafe Team",
      business: "Morning Coffee",
      email: "cafe@example.com",
      phone: "Not provided",
      goal: "Promote an offer or event",
      message:
        "Planning a weekend cafe launch. Looking for a campaign estimate and available routes.",
      createdAt: "2026-11-03T09:30:00.000Z",
    },
  ].map((enquiry) => ({
    ...enquiry,
    update: updates.find((update) => update.id === enquiry.id),
  }));
}

export type AdminEnquiry = ReturnType<typeof getAdminEnquiries>[number] & {
  replyStatus?: EnquiryUpdate["status"];
};

let adminEnquiriesInFlight: Promise<AdminEnquiry[]> | null = null;

export async function getAdminEnquiriesFromApi(): Promise<AdminEnquiry[]> {
  if (!baseUrl) return getAdminEnquiries();
  if (adminEnquiriesInFlight) return adminEnquiriesInFlight;

  adminEnquiriesInFlight = (async () => {
    const items = await adminList("/api/admin/enquiries", "enquiries");

    const updates = getEnquiryUpdates();
    return items.map((entry, index) => {
      if (!isRecord(entry)) throw new Error("An enquiry record was invalid.");
      const id =
        clientText(entry, ["id", "enquiryId", "inquiryId"]) ||
        `enquiry-${index + 1}`;
      const createdAt =
        clientText(entry, ["createdAt", "createdOn", "receivedAt", "date"]) ||
        new Date().toISOString();
      const validCreatedAt = Number.isFinite(Date.parse(createdAt))
        ? createdAt
        : new Date().toISOString();
      return {
        id,
        name: clientText(entry, ["name", "contactName"]) || "Not provided",
        business:
          clientText(entry, [
            "business",
            "businessOrName",
            "businessName",
            "companyName",
          ]) || "Not provided",
        email: clientText(entry, ["email", "businessEmail"]) || "Not provided",
        phone: clientText(entry, ["phone", "phoneNumber", "mobile"]),
        goal:
          clientText(entry, ["goal", "objective", "purpose"]) || "Not provided",
        message: clientText(entry, ["message", "requirements", "notes"]),
        createdAt: validCreatedAt,
        update: updates.find((update) => update.id === id),
        replyStatus:
          entry.replyStatus === "Replied"
            ? ("Replied" as const)
            : ("Awaiting reply" as const),
      };
    });
  })();

  try {
    return await adminEnquiriesInFlight;
  } finally {
    adminEnquiriesInFlight = null;
  }
}

export const demoCabs = [
  {
    id: "DEMO-CAB-01",
    driver: "Sample Driver Arjun",
    car: "DEMO-TS-001",
    model: "Maruti Dzire",
    phone: "+91 00000 00001",
    email: "arjun@example.com",
    area: "Hitec City",
    screenId: "DEMO-SCR-01",
    status: "Available",
  },
  {
    id: "DEMO-CAB-02",
    driver: "Sample Driver Ravi",
    car: "DEMO-TS-002",
    model: "Toyota Etios",
    phone: "+91 00000 00002",
    email: "ravi@example.com",
    area: "Airport Express",
    screenId: "DEMO-SCR-02",
    status: "Assigned",
  },
  {
    id: "DEMO-CAB-03",
    driver: "Sample Driver Sameer",
    car: "DEMO-TS-003",
    model: "Hyundai Aura",
    phone: "+91 00000 00003",
    email: "sameer@example.com",
    area: "Banjara Hills",
    screenId: "DEMO-SCR-03",
    status: "Available",
  },
  {
    id: "DEMO-CAB-04",
    driver: "Sample Driver Kiran",
    car: "DEMO-TS-004",
    model: "Maruti Tour S",
    phone: "+91 00000 00004",
    email: "kiran@example.com",
    area: "Secunderabad",
    screenId: "DEMO-SCR-04",
    status: "Maintenance",
  },
] as const;

export type CabDriver = {
  id: string;
  driver: string;
  car: string;
  model: string;
  phone: string;
  email: string;
  area: string;
  screenId: string;
  status: "Available" | "Assigned" | "Maintenance";
};

const driversKey = "adrover-drivers";

/** Returns the directory and locally created drivers, rejecting unreadable records. */
export function getCabDrivers(): CabDriver[] {
  const serialized = localStorage.getItem(driversKey);
  const saved: unknown = serialized ? JSON.parse(serialized) : [];
  if (
    !Array.isArray(saved) ||
    !saved.every(
      (item: unknown): item is Omit<CabDriver, "screenId"> =>
        typeof item === "object" &&
        item !== null &&
        ["id", "driver", "car", "model", "phone", "email", "area"].every(
          (key) =>
            key in item &&
            typeof Reflect.get(item, key) === "string" &&
            Reflect.get(item, key).trim().length > 0,
        ) &&
        "status" in item &&
        ["Available", "Assigned", "Maintenance"].includes(String(item.status)),
    )
  )
    throw new Error("Saved driver records could not be read.");
  return [
    ...demoCabs,
    // Records saved before screen IDs existed default to an empty screen ID.
    ...saved.map((item) => ({
      ...item,
      screenId:
        "screenId" in item && typeof Reflect.get(item, "screenId") === "string"
          ? String(Reflect.get(item, "screenId"))
          : "",
    })),
  ];
}

function validateDriverInput(
  input: Omit<CabDriver, "id">,
  existing: CabDriver[],
  excludeId?: string,
) {
  const driver = input.driver.trim();
  const car = input.car.trim().toUpperCase().replace(/[\s-]/g, "");
  const model = input.model.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const area = input.area.trim();
  const screenId = input.screenId.trim().toUpperCase();
  if (
    !driver ||
    !model ||
    !area ||
    [driver, model, area].some((value) => value.length > 120)
  )
    throw new Error(
      "Enter a driver name, vehicle model and service area of 120 characters or fewer.",
    );
  if (!/^[A-Z0-9]{6,15}$/.test(car))
    throw new Error(
      "Enter a vehicle number containing 6–15 letters and digits.",
    );
  if (
    !/^\+?[\d ()-]{7,25}$/.test(phone) ||
    phone.replace(/\D/g, "").length < 7 ||
    phone.replace(/\D/g, "").length > 15
  )
    throw new Error("Enter a valid contact number with 7–15 digits.");
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid driver email address.");
  if (!/^[A-Z0-9-]{3,50}$/.test(screenId))
    throw new Error("Enter a screen ID of 3–50 letters, digits or hyphens.");
  if (!["Available", "Assigned", "Maintenance"].includes(input.status))
    throw new Error("Choose a valid driver availability.");
  const others = existing.filter((entry) => entry.id !== excludeId);
  if (
    others.some(
      (entry) => entry.car.toUpperCase().replace(/[\s-]/g, "") === car,
    )
  )
    throw new Error("This vehicle number is already in the directory.");
  if (others.some((entry) => entry.screenId.toUpperCase() === screenId))
    throw new Error("This screen ID is already assigned to another driver.");
  return { driver, car, model, phone, email, area, screenId };
}

function getAdminEmail(): string {
  const session: unknown = JSON.parse(
    sessionStorage.getItem(adminSessionKey) ?? "null",
  );
  if (
    typeof session !== "object" ||
    session === null ||
    !("email" in session) ||
    typeof session.email !== "string"
  )
    throw new Error("The admin session is invalid. Sign in again.");
  return session.email;
}

/** Creates a browser-local directory entry and records the creating admin. */
export function createCabDriver(input: Omit<CabDriver, "id">) {
  if (!isAdminSessionActive()) throw new Error("Sign in to create a driver.");
  const existing = getCabDrivers();
  const fields = validateDriverInput(input, existing);
  const record = {
    id: `CAB-${crypto.randomUUID()}`,
    ...fields,
    status: input.status,
    createdBy: getAdminEmail(),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(
    driversKey,
    JSON.stringify([
      ...existing.filter(
        (entry) => !demoCabs.some((sample) => sample.id === entry.id),
      ),
      record,
    ]),
  );
  return record;
}

/** Updates a browser-local directory entry, including the editable screen ID. */
export function updateCabDriver(id: string, input: Omit<CabDriver, "id">) {
  if (!isAdminSessionActive()) throw new Error("Sign in to edit a driver.");
  if (demoCabs.some((sample) => sample.id === id))
    throw new Error("Sample drivers cannot be edited.");
  const existing = getCabDrivers();
  if (!existing.some((entry) => entry.id === id))
    throw new Error("This driver no longer exists. Reload the list.");
  const fields = validateDriverInput(input, existing, id);
  localStorage.setItem(
    driversKey,
    JSON.stringify(
      existing
        .filter((entry) => !demoCabs.some((sample) => sample.id === entry.id))
        .map((entry) =>
          entry.id === id
            ? {
                ...entry,
                ...fields,
                status: input.status,
                updatedBy: getAdminEmail(),
                updatedAt: new Date().toISOString(),
              }
            : entry,
        ),
    ),
  );
}
