import { demoApi } from "./demo";
import type { Lang } from "./i18n";

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/$/, "");
const tokenKey = "adrover-driver-token";
const apiRoot = "/api/v1/drivers";

export type TabletStatus = "online" | "offline" | "not_assigned";
export type ApprovalStatus = "approved" | "pending" | "rejected";
export type AdStatus = "upcoming" | "playing" | "completed" | "failed";
export type PaymentStatus = "released" | "processing" | "pending" | "failed";
export type IssueStatus =
  "submitted" | "under_review" | "in_progress" | "resolved" | "rejected";
export type Period = "weekly" | "monthly";

export type Vehicle = {
  id: string;
  registrationNumber: string;
  model: string;
  type: string;
  tabletStatus: TabletStatus;
  approvalStatus: ApprovalStatus;
  assignmentStatus: "assigned" | "not_assigned" | "paused";
  lastSyncAt: string | null;
};

export type DriverDocument = {
  id: string;
  name: string;
  status: "verified" | "pending" | "rejected";
  url?: string;
};

export type DriverProfile = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  address: string | null;
  photoUrl: string | null;
  licenceNumber: string | null;
  licenceExpiry: string | null;
  accountStatus: "active" | "pending" | "inactive" | "suspended";
  registeredAt: string;
  preferredLanguage: Lang | null;
  vehicle: Vehicle | null;
  documents: DriverDocument[];
};

export type ProfileUpdate = {
  name: string;
  email: string | null;
  address: string | null;
};

export type Dashboard = {
  month: {
    adsPlayed: number;
    amountEarned: number;
    pendingAmount: number;
    releasedAmount: number;
    workingDays: number;
    activeCampaigns: number;
  };
  today: {
    scheduled: number;
    played: number;
    remaining: number;
    next: { name: string; scheduledAt: string } | null;
  };
  device: { status: TabletStatus; lastSyncAt: string | null };
};

export type TodayAd = {
  id: string;
  name: string;
  advertiserName: string;
  thumbnailUrl: string | null;
  scheduledAt: string;
  durationSeconds: number;
  status: AdStatus;
  playsCompleted: number;
  playsRemaining: number;
};

export type PlaybackEntry = {
  id: string;
  date: string;
  adName: string;
  advertiserName: string;
  plays: number;
  status: AdStatus;
};

export type Earnings = {
  total: number;
  thisMonth: number;
  pending: number;
  processing: number;
  released: number;
  nextPayout: { date: string; amount: number } | null;
  perAd: { adId: string; adName: string; plays: number; amount: number }[];
};

export type Payment = {
  id: string;
  transactionId: string;
  paidAt: string | null;
  amount: number;
  status: PaymentStatus;
  reference: string | null;
  periodStart: string;
  periodEnd: string;
};

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  isRead: boolean;
};

export type NotificationList = {
  items: AppNotification[];
  unreadCount: number;
};

export type IssueCategory =
  | "ad_not_playing"
  | "tablet_not_working"
  | "internet"
  | "wrong_schedule"
  | "payment_not_received"
  | "earnings_mismatch"
  | "vehicle"
  | "login_otp"
  | "other";

export type IssueSummary = {
  id: string;
  ticketId: string;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
  adminResponse: string | null;
};

export type IssueDetail = IssueSummary & {
  language: Lang;
  advertisementName: string | null;
  vehicleRegistration: string | null;
  attachmentUrl: string | null;
  canConfirm: boolean;
  canReopen: boolean;
  history: {
    status: IssueStatus;
    note: string | null;
    by: "driver" | "admin";
    at: string;
  }[];
};

export type NewIssue = {
  category: IssueCategory;
  description: string;
  advertisementId: string;
  vehicleId: string;
  occurredAt: string;
  contactMobile: string;
  language: Lang;
  attachment: File | null;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly endpoint: string,
  ) {
    super(message);
  }
  // Network failures and 404/501 mean the backend does not provide this endpoint yet.
  get unavailable() {
    return this.status === 0 || this.status === 404 || this.status === 501;
  }
}

export const getToken = () => localStorage.getItem(tokenKey);
export const setToken = (token: string) =>
  localStorage.setItem(tokenKey, token);
export const clearToken = () => localStorage.removeItem(tokenKey);

let currentLanguage: Lang = "en";
export const setRequestLanguage = (lang: Lang) => {
  currentLanguage = lang;
};

async function request<T>(
  method: string,
  path: string,
  options: {
    body?: unknown;
    form?: FormData;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    auth?: boolean;
  } = {},
): Promise<T> {
  const { auth = true } = options;
  const endpoint = `${method} ${apiRoot}${path}`;
  const search = options.query
    ? `?${new URLSearchParams(options.query).toString()}`
    : "";
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Language": currentLanguage,
    ...options.headers,
  };
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.form) body = options.form;
  else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${apiRoot}${path}${search}`, {
      method,
      headers,
      body,
    });
  } catch {
    throw new ApiError("network", 0, endpoint);
  }

  if (response.status === 401 && auth) {
    clearToken();
    window.location.replace("driver-login.html?expired=1");
  }
  if (!response.ok) {
    let message = "";
    try {
      const data: unknown = await response.json();
      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      )
        message = data.message;
    } catch {
      // The body is not JSON; the status code is enough.
    }
    throw new ApiError(message, response.status, endpoint);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const isDemo = baseUrl === "";

const liveApi = {
  requestOtp: (mobile: string) =>
    request<void>("POST", "/auth/otp/request", {
      body: { mobile },
      auth: false,
    }),
  verifyOtp: (mobile: string, otp: string) =>
    request<{ accessToken: string }>("POST", "/auth/otp/verify", {
      body: { mobile, otp },
      auth: false,
    }),
  getProfile: () => request<DriverProfile>("GET", "/profile"),
  updateProfile: (update: ProfileUpdate) =>
    request<DriverProfile>("PUT", "/profile", { body: update }),
  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append("photo", file);
    return request<{ photoUrl: string }>("POST", "/profile/photo", { form });
  },
  saveLanguage: (preferredLanguage: Lang) =>
    request<void>("PUT", "/language", { body: { preferredLanguage } }),
  getDashboard: () => request<Dashboard>("GET", "/dashboard"),
  getTodayAds: () =>
    request<{ items: TodayAd[] }>("GET", "/advertisements/today"),
  getPlaybackHistory: (from: string, to: string) =>
    request<{ items: PlaybackEntry[] }>("GET", "/advertisements/history", {
      query: { from, to },
    }),
  getEarnings: (period: Period) =>
    request<Earnings>("GET", "/earnings", { query: { period } }),
  getPayments: (period: Period) =>
    request<{ items: Payment[] }>("GET", "/payments", { query: { period } }),
  getPayment: (id: string) =>
    request<Payment>("GET", `/payments/${encodeURIComponent(id)}`),
  getVehicle: () => request<Vehicle>("GET", "/vehicle"),
  getNotifications: () => request<NotificationList>("GET", "/notifications"),
  markNotificationRead: (id: string) =>
    request<void>("PUT", `/notifications/${encodeURIComponent(id)}/read`),
  getIssues: () => request<{ items: IssueSummary[] }>("GET", "/issues"),
  getIssue: (id: string) =>
    request<IssueDetail>("GET", `/issues/${encodeURIComponent(id)}`),
  submitIssue: (issue: NewIssue, requestId: string) => {
    const form = new FormData();
    form.append("category", issue.category);
    form.append("description", issue.description);
    form.append("advertisementId", issue.advertisementId);
    form.append("vehicleId", issue.vehicleId);
    form.append("occurredAt", issue.occurredAt);
    form.append("contactMobile", issue.contactMobile);
    form.append("language", issue.language);
    if (issue.attachment) form.append("attachment", issue.attachment);
    return request<{ id: string; ticketId: string }>("POST", "/issues", {
      form,
      headers: { "Idempotency-Key": requestId },
    });
  },
  confirmIssue: (id: string) =>
    request<void>("POST", `/issues/${encodeURIComponent(id)}/confirm`),
  reopenIssue: (id: string, reason: string) =>
    request<void>("POST", `/issues/${encodeURIComponent(id)}/reopen`, {
      body: { reason },
    }),
};

export const api: typeof liveApi = isDemo ? demoApi : liveApi;
