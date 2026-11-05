import { advertisementSamples, type Advertisement } from "./advertisements";

const demoSessionKey = "adrover-demo-session";
const savedAdvertisementsKey = "adrover-demo-advertisements";

export type AdvertiserProfile = {
  accountName: string;
  businessName: string;
  email: string;
  phone: string;
  area: string;
  advertiserType: string;
};

function profileStorageKey() {
  return `adrover-demo-profile:${getDemoEmail()}`;
}

export function getSavedProfile(
  email = getDemoEmail(),
): AdvertiserProfile | null {
  const serialized = localStorage.getItem(`adrover-demo-profile:${email}`);
  if (!serialized) return null;
  const value: unknown = JSON.parse(serialized);
  if (
    typeof value !== "object" ||
    value === null ||
    !("accountName" in value) ||
    typeof value.accountName !== "string" ||
    !("businessName" in value) ||
    typeof value.businessName !== "string" ||
    !("email" in value) ||
    typeof value.email !== "string" ||
    !("phone" in value) ||
    typeof value.phone !== "string" ||
    !("area" in value) ||
    typeof value.area !== "string" ||
    !("advertiserType" in value) ||
    typeof value.advertiserType !== "string"
  ) {
    throw new Error("Saved profile could not be read. Edit and save it again.");
  }
  return {
    accountName: value.accountName,
    businessName: value.businessName,
    email: value.email,
    phone: value.phone,
    area: value.area,
    advertiserType: value.advertiserType,
  };
}

export function saveProfile(profile: AdvertiserProfile) {
  localStorage.setItem(profileStorageKey(), JSON.stringify(profile));
}

const portalPages = new Set([
  "dashboard.html",
  "advertisements.html",
  "view-ad.html",
  "payments.html",
  "profile.html",
  "create-ad.html",
]);

export function startDemoSession(email: string) {
  const normalized = email.trim().toLocaleLowerCase();
  const clients = getDemoClients();
  if (!clients.includes(normalized)) {
    localStorage.setItem(
      "adrover-demo-clients",
      JSON.stringify([...clients, normalized]),
    );
  }
  sessionStorage.setItem(
    demoSessionKey,
    JSON.stringify({ email: email.trim().toLocaleLowerCase() }),
  );
}

export function getDemoClients(): string[] {
  const serialized = localStorage.getItem("adrover-demo-clients");
  if (!serialized) return [];
  const value: unknown = JSON.parse(serialized);
  if (
    !Array.isArray(value) ||
    !value.every((email) => typeof email === "string" && email.includes("@"))
  ) {
    throw new Error("Saved demo clients could not be read.");
  }
  return value;
}

export type DemoEnquiry = {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  goal: string;
  message: string;
  createdAt: string;
};

export function getDemoEnquiries(): DemoEnquiry[] {
  const serialized = localStorage.getItem("adrover-demo-enquiries");
  if (!serialized) return [];
  const value: unknown = JSON.parse(serialized);
  if (
    !Array.isArray(value) ||
    !value.every(
      (entry): entry is DemoEnquiry =>
        typeof entry === "object" &&
        entry !== null &&
        [
          "id",
          "name",
          "business",
          "email",
          "phone",
          "goal",
          "message",
          "createdAt",
        ].every((key) => key in entry && typeof entry[key] === "string"),
    )
  ) {
    throw new Error("Saved demo enquiries could not be read.");
  }
  return value;
}

export function saveDemoEnquiry(enquiry: DemoEnquiry) {
  localStorage.setItem(
    "adrover-demo-enquiries",
    JSON.stringify([enquiry, ...getDemoEnquiries()]),
  );
}

type Approval = NonNullable<Advertisement["approval"]> & { id: string };

function getApprovals(): Approval[] {
  const serialized = localStorage.getItem("adrover-demo-approvals");
  if (!serialized) return [];
  const value: unknown = JSON.parse(serialized);
  if (
    !Array.isArray(value) ||
    !value.every(
      (item): item is Approval =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.approvedAt === "string" &&
        typeof item.approvedBy === "string" &&
        Number.isSafeInteger(item.plays) &&
        item.plays > 0 &&
        typeof item.amount === "number" &&
        Number.isFinite(item.amount) &&
        item.amount > 0,
    )
  ) {
    throw new Error("Saved demo approvals could not be read.");
  }
  return value;
}

export function getAllAdvertisements(): Advertisement[] {
  const approvals = getApprovals();
  return [...getSavedAdvertisements(), ...advertisementSamples].map((ad) => {
    const approval = approvals.find((entry) => entry.id === ad.id);
    return approval
      ? {
          ...ad,
          status: "Approved",
          target: approval.plays,
          dates:
            ad.dates === "Start date pending approval"
              ? "Awaiting payment/scheduling"
              : ad.dates,
          approval,
        }
      : ad;
  });
}

export function getAdvertiserAdvertisements() {
  const email = getDemoEmail();
  return getAllAdvertisements().filter(
    (ad) => !ad.ownerEmail || ad.ownerEmail === email,
  );
}

export function approveAdvertisement(
  id: string,
  plays: string,
  amount: string,
) {
  const session = sessionStorage.getItem("adrover-demo-admin-session");
  if (!session)
    throw new Error("Sign in to the demo admin portal before approving.");
  const admin: unknown = JSON.parse(session);
  if (
    typeof admin !== "object" ||
    admin === null ||
    !("email" in admin) ||
    typeof admin.email !== "string"
  ) {
    throw new Error("The admin session is invalid. Sign in again.");
  }
  if (!/^[1-9]\d*$/.test(plays) || !Number.isSafeInteger(Number(plays))) {
    throw new Error(
      "Assigned plays must be a positive whole number within the safe range.",
    );
  }
  if (
    !/^\d+(\.\d{1,2})?$/.test(amount) ||
    !Number.isFinite(Number(amount)) ||
    Number(amount) <= 0 ||
    !Number.isSafeInteger(Math.round(Number(amount) * 100))
  ) {
    throw new Error(
      "Enter a positive total amount in INR with at most two decimal places.",
    );
  }
  const ad = getAllAdvertisements().find((entry) => entry.id === id);
  if (!ad || ad.status !== "Pending approval") {
    throw new Error(
      "Only pending advertisements can be approved. Reload the queue.",
    );
  }
  const approval: Approval = {
    id,
    plays: Number(plays),
    amount: Number(amount),
    approvedAt: new Date().toISOString(),
    approvedBy: admin.email,
  };
  localStorage.setItem(
    "adrover-demo-approvals",
    JSON.stringify([...getApprovals(), approval]),
  );
}

export function endDemoSession() {
  sessionStorage.removeItem(demoSessionKey);
}

export function isDemoSessionActive() {
  const session = sessionStorage.getItem(demoSessionKey);
  if (!session) return false;
  const value: unknown = JSON.parse(session);
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    typeof value.email === "string" &&
    value.email.includes("@")
  );
}

export function getDemoEmail() {
  const session = sessionStorage.getItem(demoSessionKey);
  if (!session) return "";
  const value: unknown = JSON.parse(session);
  if (
    typeof value !== "object" ||
    value === null ||
    !("email" in value) ||
    typeof value.email !== "string"
  ) {
    throw new Error("The demo session is invalid. Sign in again to continue.");
  }
  return value.email;
}

export function requireDemoSession(filename: string, search: string) {
  if (!portalPages.has(filename) || isDemoSessionActive()) return;

  const candidate = new URL(`${filename}${search}`, window.location.href);
  const safeFilename = candidate.pathname.split("/").pop() ?? "";
  const next =
    portalPages.has(safeFilename) && candidate.origin === window.location.origin
      ? safeFilename === "view-ad.html"
        ? `${safeFilename}?id=${encodeURIComponent(candidate.searchParams.get("id") ?? "")}`
        : safeFilename
      : "dashboard.html";
  window.location.replace(`login.html?next=${encodeURIComponent(next)}`);
}

export function getDemoRedirect(search: string) {
  const requested = new URLSearchParams(search).get("next");
  if (!requested) return "dashboard.html";

  const candidate = new URL(requested, window.location.origin);
  const filename = candidate.pathname.split("/").pop() ?? "";
  if (!portalPages.has(filename) || candidate.origin !== window.location.origin)
    return "dashboard.html";

  if (filename === "view-ad.html") {
    const id = candidate.searchParams.get("id") ?? "";
    if (!/^[a-z0-9-]{1,80}$/i.test(id)) return "advertisements.html";
    return `${filename}?id=${encodeURIComponent(id)}`;
  }

  return filename;
}

function isAdvertisement(value: unknown): value is Advertisement {
  if (typeof value !== "object" || value === null) return false;
  const ad = value as Record<string, unknown>;
  return (
    typeof ad.id === "string" &&
    (ad.ownerEmail === undefined || typeof ad.ownerEmail === "string") &&
    typeof ad.name === "string" &&
    typeof ad.brand === "string" &&
    typeof ad.initials === "string" &&
    typeof ad.area === "string" &&
    typeof ad.submitted === "string" &&
    typeof ad.dates === "string" &&
    (ad.status === "Active" ||
      ad.status === "Pending approval" ||
      ad.status === "Completed") &&
    typeof ad.plays === "number" &&
    Number.isFinite(ad.plays) &&
    typeof ad.target === "number" &&
    Number.isFinite(ad.target) &&
    typeof ad.elapsedDays === "number" &&
    typeof ad.totalDays === "number" &&
    typeof ad.cabs === "number" &&
    typeof ad.fleet === "string" &&
    typeof ad.note === "string"
  );
}

export function getSavedAdvertisements() {
  const serialized = localStorage.getItem(savedAdvertisementsKey);
  if (!serialized) return [];

  const saved: unknown = JSON.parse(serialized);
  if (!Array.isArray(saved) || !saved.every(isAdvertisement)) {
    throw new Error(
      "Saved demo campaigns could not be read. Clear this site's saved data and try again.",
    );
  }
  return saved;
}

export function saveAdvertisement(advertisement: Advertisement) {
  const saved = getSavedAdvertisements();
  if (saved.some((item) => item.id === advertisement.id)) {
    throw new Error("This campaign already exists in the demo account.");
  }
  localStorage.setItem(
    savedAdvertisementsKey,
    JSON.stringify([advertisement, ...saved]),
  );
}
