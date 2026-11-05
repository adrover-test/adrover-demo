import { expect, test } from "@playwright/test";
import {
  approveAdvertisement,
  getAllAdvertisements,
  getAdvertiserAdvertisements,
  getDemoClients,
  getDemoEnquiries,
  saveDemoEnquiry,
  saveAdvertisement,
  saveProfile,
  startDemoSession,
} from "../src/lib/portal";
import {
  endAdminSession,
  getAdminClients,
  getAdminEnquiries,
  getAdminRedirect,
  isAdminSessionActive,
  startAdminSession,
  createCabDriver,
  getCabDrivers,
} from "../src/lib/admin";

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

const originalLocal = Object.getOwnPropertyDescriptor(
  globalThis,
  "localStorage",
);
const originalSession = Object.getOwnPropertyDescriptor(
  globalThis,
  "sessionStorage",
);

test.beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
});

test.afterEach(() => {
  if (originalLocal)
    Object.defineProperty(globalThis, "localStorage", originalLocal);
  else Reflect.deleteProperty(globalThis, "localStorage");
  if (originalSession)
    Object.defineProperty(globalThis, "sessionStorage", originalSession);
  else Reflect.deleteProperty(globalThis, "sessionStorage");
});

test("admin sessions and redirects stay separate and local", () => {
  expect(isAdminSessionActive()).toBe(false);
  startAdminSession("ADMIN@example.com");
  expect(isAdminSessionActive()).toBe(true);
  expect(sessionStorage.getItem("adrover-demo-session")).toBeNull();
  endAdminSession();
  expect(isAdminSessionActive()).toBe(false);
  expect(getAdminRedirect("?next=https://example.com")).toBe("admin.html");
  expect(getAdminRedirect("?next=admin.html%3Fsection%3Dcabs")).toBe(
    "admin.html?section=cabs",
  );
  expect(getAdminRedirect("?next=admin.html%3Fsection%3Dunknown")).toBe(
    "admin.html",
  );
});

test("driver creation validates input, rejects duplicate vehicles and persists attributed records", () => {
  const input = {
    driver: "Test Driver",
    car: "ts 09-ab-1234",
    model: "Test car",
    phone: "+91 98765 43210",
    email: "DRIVER@example.com",
    area: "Hitec City",
    status: "Available" as const,
  };
  expect(() => createCabDriver(input)).toThrow("Sign in");
  startAdminSession("ops@example.com");
  const created = createCabDriver(input);
  expect(created).toMatchObject({
    car: "TS09AB1234",
    email: "driver@example.com",
    createdBy: "ops@example.com",
  });
  expect(Number.isFinite(Date.parse(created.createdAt))).toBe(true);
  expect(getCabDrivers()).toHaveLength(5);
  expect(
    getCabDrivers().find((entry) => entry.id === created.id),
  ).toMatchObject(created);
  expect(() => createCabDriver({ ...input, car: "TS09AB1234" })).toThrow(
    "already",
  );
  for (const invalid of [
    { driver: " " },
    { phone: "invalid" },
    { email: "invalid" },
    { car: "!" },
    { area: "" },
    { model: "" },
  ])
    expect(() => createCabDriver({ ...input, ...invalid })).toThrow();
  localStorage.setItem("adrover-drivers", '[{"id":"broken"}]');
  expect(() => getCabDrivers()).toThrow("could not be read");
  expect(() => createCabDriver({ ...input, car: "TS09AB5678" })).toThrow(
    "could not be read",
  );
});

test("approval validates numerical inputs, records reviewer and prevents repeated approval", () => {
  expect(() =>
    approveAdvertisement("cyberfintech-launch", "50000", "100"),
  ).toThrow("Sign in");
  startAdminSession("admin@example.com");
  for (const plays of ["0", "-1", "1.5", "9007199254740992", "Infinity"]) {
    expect(() =>
      approveAdvertisement("cyberfintech-launch", plays, "100"),
    ).toThrow("whole number");
  }
  for (const amount of ["0", "-1", "1.001", "Infinity", "9007199254740992"]) {
    expect(() =>
      approveAdvertisement("cyberfintech-launch", "50000", amount),
    ).toThrow("positive total");
  }
  expect(() => approveAdvertisement("apollo-checkup", "50000", "100")).toThrow(
    "Only pending",
  );
  expect(() => approveAdvertisement("missing", "50000", "100")).toThrow(
    "Only pending",
  );
  approveAdvertisement("cyberfintech-launch", "70000", "17500.25");
  const ad = getAllAdvertisements().find(
    (entry) => entry.id === "cyberfintech-launch",
  )!;
  expect(ad.status).toBe("Approved");
  expect(ad.target).toBe(70000);
  expect(ad.elapsedDays).toBe(0);
  expect(ad.dates).toBe("Awaiting payment/scheduling");
  expect(ad.approval).toMatchObject({
    amount: 17500.25,
    approvedBy: "admin@example.com",
  });
  expect(Date.parse(ad.approval!.approvedAt)).not.toBeNaN();
  expect(() => approveAdvertisement(ad.id, "80000", "20000")).toThrow(
    "Only pending",
  );
});

test("registered clients include saved profile and only their own local ads", () => {
  startDemoSession("owner@example.com");
  startDemoSession("owner@example.com");
  expect(getDemoClients()).toEqual(["owner@example.com"]);
  saveProfile({
    accountName: "Local Owner",
    businessName: "Local Store",
    email: "contact@example.com",
    phone: "",
    area: "Hyderabad",
    advertiserType: "Retail",
  });
  const sample = getAllAdvertisements()[0];
  saveAdvertisement({
    ...sample,
    id: "local-ad",
    ownerEmail: "owner@example.com",
    name: "Local campaign",
    brand: "Local Store",
    status: "Pending approval",
  });
  const client = getAdminClients().find(
    (entry) => entry.id === "owner@example.com",
  )!;
  expect(client.name).toBe("Local Store");
  expect(client.email).toBe("contact@example.com");
  expect(client.contact).toBe("Local Owner");
  expect(client.advertiserType).toBe("Retail");
  expect(client.signInEmail).toBe("owner@example.com");
  expect(client.profileSaved).toBe(true);
  expect(client.ads.map((entry) => entry.id)).toEqual(["local-ad"]);
  expect(
    getAdvertiserAdvertisements().some((entry) => entry.id === "local-ad"),
  ).toBe(true);
  startDemoSession("other@example.com");
  expect(
    getAdvertiserAdvertisements().some((entry) => entry.id === "local-ad"),
  ).toBe(false);
});

test("enquiries persist and malformed storage is rejected", () => {
  expect(getDemoEnquiries()).toEqual([]);
  saveDemoEnquiry({
    id: "enquiry-1",
    name: "Demo",
    business: "Store",
    email: "demo@example.com",
    phone: "",
    goal: "Launch",
    message: "Review",
    createdAt: new Date().toISOString(),
  });
  expect(getDemoEnquiries()).toHaveLength(1);
  expect(getAdminEnquiries()).toHaveLength(3);
  localStorage.setItem("adrover-demo-enquiries", '[{"id":123}]');
  expect(() => getDemoEnquiries()).toThrow("could not be read");
  localStorage.setItem("adrover-demo-clients", "[123]");
  expect(() => getDemoClients()).toThrow("could not be read");
  localStorage.setItem("adrover-demo-approvals", "[{}]");
  expect(() => getAllAdvertisements()).toThrow("could not be read");
});
