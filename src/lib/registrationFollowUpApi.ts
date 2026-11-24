import { getAdminToken } from "./admin";

const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

export type RegistrationDraftSummary = {
  id: string;
  name: string;
  brand: string;
  targetArea: string;
  step: string;
  submittedAt: string;
  amount: number | null;
  paidAmount: number;
  balance: number | null;
  hasVideo: boolean;
  hasBanner: boolean;
};

export type UnfinishedRegistration = {
  clientId: string;
  name: string;
  email: string;
  phone: string;
  drafts: RegistrationDraftSummary[];
};

export type FollowUpChannel = "note" | "email" | "sms";
export type FollowUpStatus = "Saved" | "Pending" | "Accepted" | "Failed" | "Unknown";
export type ClientFollowUp = {
  id: string;
  channel: FollowUpChannel;
  subject: string;
  message: string;
  recipient: string;
  status: FollowUpStatus;
  error: string | null;
  by: string;
  createdAt: string;
  nextFollowUpAt: string | null;
};

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("The registration follow-up response was invalid.");
  return value;
}

function count(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0)
    throw new Error("The registration totals could not be loaded.");
  return value;
}

function date(value: unknown): string {
  const result = text(value);
  if (!Number.isFinite(Date.parse(result))) throw new Error("The follow-up date was invalid.");
  return result;
}

async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!baseUrl) throw new Error("Configure the backend API to manage unfinished registrations.");
  const token = getAdminToken();
  if (!token) throw new Error("Sign in with a SuperAdmin account to manage client follow-ups.");
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/admin${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new Error("Could not reach the follow-up service. For message attempts, reload history before retrying.");
  }
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // The status code still identifies failed requests.
  }
  if (!response.ok) {
    const nestedError = record(body) && record(body.error) ? body.error : null;
    throw new Error(
      response.status === 401 || response.status === 403
        ? "Your SuperAdmin session is missing or expired. Sign in again."
        : record(body) && typeof body.message === "string"
          ? body.message
          : nestedError && typeof nestedError.message === "string"
            ? nestedError.message
            : `Follow-up request failed (HTTP ${response.status}). Reload history before retrying a message.`,
    );
  }
  return record(body) && "data" in body ? body.data : body;
}

function parseClient(value: unknown): UnfinishedRegistration {
  if (!record(value) || !Array.isArray(value.drafts))
    throw new Error("The unfinished registration response was invalid.");
  return {
    clientId: text(value.clientId),
    name: text(value.name),
    email: text(value.email),
    phone: text(value.phone),
    drafts: value.drafts.map((draft: unknown) => {
      if (!record(draft) || typeof draft.hasVideo !== "boolean" || typeof draft.hasBanner !== "boolean")
        throw new Error("Registration draft details could not be loaded.");
      return {
        id: text(draft.id), name: text(draft.name), brand: text(draft.brand),
        targetArea: text(draft.targetArea), step: text(draft.step),
        submittedAt: date(draft.submittedAt),
        amount: draft.amount === null ? null : count(draft.amount),
        paidAmount: count(draft.paidAmount),
        balance: draft.balance === null ? null : count(draft.balance),
        hasVideo: draft.hasVideo, hasBanner: draft.hasBanner,
      };
    }),
  };
}

export async function getUnfinishedRegistrations(): Promise<UnfinishedRegistration[]> {
  const result: UnfinishedRegistration[] = [];
  for (let page = 1; ; page++) {
    const body = await request(`/unfinished-registrations?pageNumber=${page}&pageSize=100`);
    if (!record(body) || !Array.isArray(body.items)) throw new Error("The unfinished registration list was invalid.");
    const total = count(body.total);
    result.push(...body.items.map(parseClient));
    if (result.length >= total) return result;
    if (!body.items.length) throw new Error("Some unfinished registrations could not be loaded.");
  }
}

function parseFollowUp(value: unknown): ClientFollowUp {
  if (!record(value)
    || (value.channel !== "note" && value.channel !== "email" && value.channel !== "sms")
    || (value.status !== "Saved" && value.status !== "Pending" && value.status !== "Accepted"
      && value.status !== "Failed" && value.status !== "Unknown"))
    throw new Error("The client follow-up history was invalid.");
  return {
    id: text(value.id), channel: value.channel, status: value.status,
    subject: text(value.subject), message: text(value.message), recipient: text(value.recipient),
    error: value.error === null ? null : text(value.error),
    by: text(value.by), createdAt: date(value.createdAt),
    nextFollowUpAt: value.nextFollowUpAt === null ? null : date(value.nextFollowUpAt),
  };
}

export async function getClientFollowUps(clientId: string): Promise<ClientFollowUp[]> {
  const body = await request(`/clients/${encodeURIComponent(clientId)}/follow-ups`);
  if (!Array.isArray(body)) throw new Error("Client follow-up history could not be loaded.");
  return body.map(parseFollowUp);
}

export async function saveClientFollowUp(
  clientId: string,
  payload: {
    requestId: string;
    channel: FollowUpChannel;
    subject: string;
    message: string;
    nextFollowUpAt: string | null;
  },
): Promise<ClientFollowUp> {
  return parseFollowUp(await request(`/clients/${encodeURIComponent(clientId)}/follow-ups`, {
    method: "POST", body: JSON.stringify(payload),
  }));
}
