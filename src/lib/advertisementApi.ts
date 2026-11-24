import { getClientToken } from "./clientAuth";

const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? "https://localhost:7100")
  .trim()
  .replace(/\/$/, "");
const advertisementsRoot = "/api/Advertisements";

type CreateAdvertisementRequest = {
  name: string;
  brand: string;
  description: string;
  targetArea: string;
  videoDurationSeconds: number;
  startDate: string;
  endDate: string;
  targetPlays: number;
  assignedCabs: number;
  approvalAmount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function send(path: string, init: RequestInit): Promise<unknown> {
  const token = getClientToken();
  if (!token) throw new Error("Sign in to your client account to continue.");

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });
  } catch {
    throw new Error(
      "Could not connect to Adrover. Check your connection and try again.",
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  const nestedError =
    isRecord(body) && isRecord(body.error) ? body.error : null;
  const fallback =
    response.status === 401
      ? "Your session has expired. Sign in again to continue."
      : response.status === 403
        ? "You do not have permission to change this item."
        : response.status === 404
          ? "This item could not be found. Refresh the page and try again."
          : "We could not complete your request. Please try again.";
  const validation =
    isRecord(body) && Array.isArray(body.errors)
      ? body.errors
          .filter((entry): entry is string => typeof entry === "string")
          .join(" ")
      : "";
  const message =
    validation ||
    (isRecord(body) && typeof body.message === "string"
      ? body.message
      : nestedError && typeof nestedError.message === "string"
        ? nestedError.message
        : fallback);
  const clientMessage =
    /backend|\bAPI\b|\bSQL\b|exception|blob|azure|\bJWT\b|\btoken\b|configured|\bGUID\b|RegistrationProgress|database|storage|server error/i.test(
      message,
    )
      ? fallback
      : message;
  if (!response.ok)
    throw new Error(
      response.status === 401 || response.status === 403
        ? fallback
        : clientMessage,
    );
  if (!isRecord(body) || body.success !== true) {
    throw new Error(
      clientMessage === fallback
        ? "We could not confirm your request. Please try again."
        : clientMessage,
    );
  }

  return body.data;
}

export async function createAdvertisement(
  details: CreateAdvertisementRequest,
): Promise<{ id: string }> {
  const response = await send(advertisementsRoot, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });
  const id = isRecord(response) ? response.id : null;
  if (typeof id !== "string" || !id) {
    throw new Error(
      "We could not confirm that your campaign was saved. Check My advertisements before trying again.",
    );
  }
  return { id };
}

export async function uploadAdvertisementVideo(
  advertisementId: string,
  file: File,
): Promise<void> {
  const form = new FormData();
  form.append("file", file, file.name);
  await send(
    `${advertisementsRoot}/${encodeURIComponent(advertisementId)}/upload-video`,
    { method: "POST", body: form },
  );
}

export async function uploadAdvertisementImage(
  advertisementId: string,
  file: File,
): Promise<void> {
  const form = new FormData();
  form.append("file", file, file.name);
  await send(
    `${advertisementsRoot}/${encodeURIComponent(advertisementId)}/upload-image`,
    { method: "POST", body: form },
  );
}

export type RegistrationProgress = {
  id: string;
  name: string;
  brand: string;
  targetArea: string;
  videoDurationSeconds: number;
  days: string;
  dailyPlays: string;
  cabs: string;
  startDate: string;
  step: "plan" | "review" | "payment";
  consent: boolean;
};

export type RegistrationDraft = {
  id: string;
  progress: RegistrationProgress;
  hasVideo: boolean;
  hasBanner: boolean;
  status: string;
  amount: number;
  paidAmount: number;
  paymentStarted: boolean;
};

function parseDraft(value: unknown): RegistrationDraft {
  if (!isRecord(value) || !isRecord(value.progress))
    throw new Error(
      "Your saved campaign could not be loaded. Please try again.",
    );
  const p = value.progress;
  if (
    typeof value.id !== "string" ||
    typeof value.hasVideo !== "boolean" ||
    typeof value.hasBanner !== "boolean" ||
    typeof value.status !== "string" ||
    typeof value.amount !== "number" ||
    typeof value.paidAmount !== "number" ||
    typeof value.paymentStarted !== "boolean" ||
    typeof p.id !== "string" ||
    typeof p.name !== "string" ||
    typeof p.brand !== "string" ||
    typeof p.targetArea !== "string" ||
    typeof p.videoDurationSeconds !== "number" ||
    typeof p.days !== "string" ||
    typeof p.dailyPlays !== "string" ||
    typeof p.cabs !== "string" ||
    typeof p.startDate !== "string" ||
    (p.step !== "plan" && p.step !== "review" && p.step !== "payment") ||
    typeof p.consent !== "boolean"
  ) {
    throw new Error(
      "Your saved campaign could not be loaded. Please try again.",
    );
  }
  return {
    id: value.id,
    hasVideo: value.hasVideo,
    hasBanner: value.hasBanner,
    status: value.status,
    amount: value.amount,
    paidAmount: value.paidAmount,
    paymentStarted: value.paymentStarted,
    progress: {
      id: p.id,
      name: p.name,
      brand: p.brand,
      targetArea: p.targetArea,
      videoDurationSeconds: p.videoDurationSeconds,
      days: p.days,
      dailyPlays: p.dailyPlays,
      cabs: p.cabs,
      startDate: p.startDate,
      step: p.step,
      consent: p.consent,
    },
  };
}

export async function getRegistrationDraft(
  id: string,
): Promise<RegistrationDraft> {
  return parseDraft(
    await send(`${advertisementsRoot}/drafts/${encodeURIComponent(id)}`, {
      method: "GET",
    }),
  );
}

export async function getRegistrationDrafts(): Promise<RegistrationDraft[]> {
  const result = await send(`${advertisementsRoot}/drafts`, { method: "GET" });
  if (!Array.isArray(result))
    throw new Error(
      "Your saved campaigns could not be loaded. Please try again.",
    );
  return result.map(parseDraft);
}

export async function saveRegistrationDraft(
  progress: RegistrationProgress,
): Promise<RegistrationDraft> {
  return parseDraft(
    await send(
      `${advertisementsRoot}/drafts/${encodeURIComponent(progress.id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(progress),
      },
    ),
  );
}
