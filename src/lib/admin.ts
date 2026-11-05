import {
  getAllAdvertisements,
  getDemoClients,
  getDemoEnquiries,
  getSavedProfile,
} from "./portal";

const adminSessionKey = "adrover-demo-admin-session";
const enquiryUpdatesKey = "adrover-enquiry-updates";

export type EnquiryUpdate = {
  id: string;
  status: "Awaiting reply" | "Replied";
  notes: { text: string; author: string; createdAt: string }[];
  updatedBy: string;
  updatedAt: string;
};

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

export function saveEnquiryUpdate(
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
  if (!getAdminEnquiries().some((enquiry) => enquiry.id === id))
    throw new Error("This enquiry no longer exists. Reload the list.");
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

export function startAdminSession(email: string) {
  sessionStorage.setItem(
    adminSessionKey,
    JSON.stringify({ email: email.trim().toLowerCase() }),
  );
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

export const demoCabs = [
  {
    id: "DEMO-CAB-01",
    driver: "Sample Driver Arjun",
    car: "DEMO-TS-001",
    model: "Maruti Dzire",
    phone: "+91 00000 00001",
    email: "arjun@example.com",
    area: "Hitec City",
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
      (item: unknown): item is CabDriver =>
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
  return [...demoCabs, ...saved];
}

/** Creates a browser-local directory entry and records the creating admin. */
export function createCabDriver(input: Omit<CabDriver, "id">) {
  if (!isAdminSessionActive()) throw new Error("Sign in to create a driver.");
  const driver = input.driver.trim();
  const car = input.car.trim().toUpperCase().replace(/[\s-]/g, "");
  const model = input.model.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const area = input.area.trim();
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
  if (!["Available", "Assigned", "Maintenance"].includes(input.status))
    throw new Error("Choose a valid driver availability.");
  const existing = getCabDrivers();
  if (
    existing.some(
      (entry) => entry.car.toUpperCase().replace(/[\s-]/g, "") === car,
    )
  )
    throw new Error("This vehicle number is already in the directory.");
  const session: { email: string } = JSON.parse(
    sessionStorage.getItem(adminSessionKey)!,
  );
  const record = {
    id: `CAB-${crypto.randomUUID()}`,
    driver,
    car,
    model,
    phone,
    email,
    area,
    status: input.status,
    createdBy: session.email,
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
