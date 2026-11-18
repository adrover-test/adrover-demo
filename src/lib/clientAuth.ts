const baseUrl = (import.meta.env?.VITE_API_BASE_URL ?? "")
  .trim()
  .replace(/\/$/, "");
const authRoot = "/api/v1/auth";
const tokenKey = "adrover-client-token";
const refreshTokenKey = "adrover-client-refresh-token";

function errorMessage(data: unknown, fallback: string): string {
  if (typeof data !== "object" || data === null) return fallback;
  const body = data as Record<string, unknown>;
  if (typeof body.error === "string") return body.error;
  if (typeof body.error === "object" && body.error !== null) {
    const nested = (body.error as Record<string, unknown>).message;
    if (typeof nested === "string") return nested;
  }
  if (typeof body.message === "string") return body.message;
  if (typeof body.detail === "string") return body.detail;
  return fallback;
}

async function post(path: string, payload: object): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${authRoot}${path}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error(
      "Could not reach the server. Check your connection and try again.",
    );
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    // The body is not JSON; the status code is enough.
  }
  if (!response.ok) {
    throw new Error(
      errorMessage(
        data,
        `Request failed (HTTP ${response.status}). Try again.`,
      ),
    );
  }
  return data;
}

export async function registerClient(details: {
  email: string;
  phone: string;
  fullName: string;
  password: string;
  advertisement?: import("./advertisementApi").RegistrationProgress;
}) {
  const data = await post("/register", { ...details, role: "Client" });
  if (
    typeof data !== "object" ||
    data === null ||
    !("success" in data) ||
    data.success !== true
  ) {
    throw new Error(
      "The server did not confirm account creation. Try signing in before registering again.",
    );
  }
}

export async function loginClient(email: string, password: string) {
  const data = (await post("/client-login", { email, password })) as {
    data?: { accessToken?: unknown; refreshToken?: unknown };
  };
  const tokens = data?.data;
  if (
    typeof tokens?.accessToken !== "string" ||
    !tokens.accessToken ||
    typeof tokens.refreshToken !== "string" ||
    !tokens.refreshToken
  ) {
    throw new Error("The server returned an unexpected sign-in response.");
  }
  sessionStorage.setItem(tokenKey, tokens.accessToken);
  sessionStorage.setItem(refreshTokenKey, tokens.refreshToken);
}

export function clearClientTokens() {
  sessionStorage.removeItem(tokenKey);
  sessionStorage.removeItem(refreshTokenKey);
}

export const getClientToken = () => sessionStorage.getItem(tokenKey);
