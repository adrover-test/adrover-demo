import type { Page } from "@playwright/test";

export const clientProfile = {
  id: "client-1",
  name: "Avery Client",
  email: "advertiser@example.com",
  phone: "+91 98765 43210",
  role: "Client",
  profilePictureUrl: null,
  vehicleNumber: null,
  isActive: true,
  createdAt: "2025-03-10T00:00:00Z",
};

export const clientCampaigns = [
  {
    id: "apollo-checkup",
    name: "Apollo Super Speciality Checkup",
    brand: "Apollo Hospitals",
    description: "Promote the annual health checkup offer.",
    targetArea: "Hyderabad",
    videoDurationSeconds: 30,
    startDate: "2026-10-01T00:00:00Z",
    endDate: "2026-10-31T00:00:00Z",
    submittedAt: "2026-11-18T00:00:00Z",
    targetPlays: 50000,
    actualPlays: 18400,
    assignedCabs: 20,
    approvalAmount: 45000,
    paidAmount: 45000,
    status: "Active",
    rejectionReason: null,
    videoUrl: null,
    imageUrl: "https://cdn.example.com/apollo.jpg",
  },
  {
    id: "cyberfintech-launch",
    name: "Cyberfintech Launch",
    brand: "Cyberfintech",
    description: "Introduce our new financial service.",
    targetArea: "HITEC City",
    videoDurationSeconds: 20,
    startDate: "0001-01-01T00:00:00Z",
    endDate: "0001-01-01T00:00:00Z",
    submittedAt: "2026-11-01T00:00:00Z",
    targetPlays: 50000,
    actualPlays: 0,
    assignedCabs: 25,
    approvalAmount: 60000,
    paidAmount: 0,
    status: "PendingApproval",
    rejectionReason: null,
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: "deccan-living-expo",
    name: "Deccan Living Expo",
    brand: "Deccan Living",
    description: "Visit the Deccan Living Expo.",
    targetArea: "Secunderabad",
    videoDurationSeconds: 15,
    startDate: "2026-08-01T00:00:00Z",
    endDate: "2026-08-18T00:00:00Z",
    submittedAt: "2026-07-12T00:00:00Z",
    targetPlays: 25000,
    actualPlays: 25000,
    assignedCabs: 12,
    approvalAmount: 30000,
    paidAmount: 30000,
    status: "Completed",
    rejectionReason: null,
    videoUrl: null,
    imageUrl: "https://cdn.example.com/deccan.jpg",
  },
  {
    id: "northstar-foods",
    name: "Northstar Foods Summer",
    brand: "Northstar Foods",
    description: "A seasonal menu promotion.",
    targetArea: "Banjara Hills",
    videoDurationSeconds: 15,
    startDate: "0001-01-01T00:00:00Z",
    endDate: "0001-01-01T00:00:00Z",
    submittedAt: "2026-11-02T00:00:00Z",
    targetPlays: 10000,
    actualPlays: 0,
    assignedCabs: 8,
    approvalAmount: 12000,
    paidAmount: 0,
    status: "Draft",
    rejectionReason: null,
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: "metro-homes",
    name: "Metro Homes",
    brand: "Metro Homes",
    description: "New home community now open.",
    targetArea: "Kondapur",
    videoDurationSeconds: 20,
    startDate: "0001-01-01T00:00:00Z",
    endDate: "0001-01-01T00:00:00Z",
    submittedAt: "2026-11-03T00:00:00Z",
    targetPlays: 15000,
    actualPlays: 0,
    assignedCabs: 10,
    approvalAmount: 18000,
    paidAmount: 0,
    status: "Approved",
    rejectionReason: null,
    videoUrl: null,
    imageUrl: null,
  },
  {
    id: "greenfield-market",
    name: "Greenfield Market",
    brand: "Greenfield Market",
    description: "Grand opening offers.",
    targetArea: "Gachibowli",
    videoDurationSeconds: 15,
    startDate: "0001-01-01T00:00:00Z",
    endDate: "0001-01-01T00:00:00Z",
    submittedAt: "2026-11-04T00:00:00Z",
    targetPlays: 8000,
    actualPlays: 0,
    assignedCabs: 6,
    approvalAmount: 9000,
    paidAmount: 0,
    status: "Rejected",
    rejectionReason: "Please update the campaign artwork.",
    videoUrl: null,
    imageUrl: null,
  },
];

export const clientPayments = [
  {
    id: "payment-1",
    orderId: "order-1",
    paymentId: "pay-1",
    amount: 45000,
    currency: "INR",
    status: "Completed",
    paymentMethod: "UPI",
    cardLastFour: null,
    cardIssuer: null,
    createdAt: "2026-10-01T10:00:00Z",
    processedAt: "2026-10-01T10:01:00Z",
    advertisementId: "apollo-checkup",
    advertisementName: "Apollo Super Speciality Checkup",
  },
  {
    id: "payment-2",
    orderId: "order-2",
    paymentId: null,
    amount: 60000,
    currency: "INR",
    status: "Pending",
    paymentMethod: "",
    cardLastFour: null,
    cardIssuer: null,
    createdAt: "2026-11-01T10:00:00Z",
    processedAt: null,
    advertisementId: "cyberfintech-launch",
    advertisementName: "Cyberfintech Launch",
  },
];

export async function mockClientPortal(page: Page) {
  let profile = { ...clientProfile };
  await page.route("https://cdn.example.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/png",
      body: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pysAAAAASUVORK5CYII=",
        "base64",
      ),
    });
  });
  await page.route("**/api/Advertisements/drafts**", async (route) => {
    await route.fulfill({ json: { success: true, data: [] } });
  });
  await page.route("**/api/Advertisements/my-ads**", async (route) => {
    await route.fulfill({
      json: {
        success: true,
        data: {
          items: clientCampaigns,
          total: clientCampaigns.length,
          pageNumber: 1,
          pageSize: 100,
        },
      },
    });
  });
  await page.route("**/api/ClientDashboard/summary", async (route) => {
    const today = new Date().toISOString().slice(0, 10);
    const dailyPlays = Array.from({ length: 14 }, (_, index) => {
      const date = new Date(`${today}T00:00:00Z`);
      date.setUTCDate(date.getUTCDate() - (13 - index));
      return {
        date: date.toISOString().slice(0, 10),
        plays: index === 13 ? 42 : index * 3,
      };
    });
    await route.fulfill({
      json: {
        success: true,
        data: {
          totalAdvertisements: clientCampaigns.length,
          activeAdvertisements: 1,
          pendingAdvertisements: 1,
          totalPlays: 43400,
          activeCabs: 18,
          dailyPlays,
        },
      },
    });
  });
  await page.route("**/api/Users/me", async (route) => {
    if (route.request().method() === "PUT") {
      const body = route.request().postDataJSON() as { name?: string };
      if (body.name) profile = { ...profile, name: body.name };
    }
    await route.fulfill({ json: { success: true, data: profile } });
  });
  await page.route("**/api/Payments/history**", async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = Number(url.searchParams.get("pageNumber") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const skip = (pageNumber - 1) * pageSize;
    const items = clientPayments.slice(skip, skip + pageSize);
    await route.fulfill({
      json: {
        success: true,
        data: { items, total: clientPayments.length, skip, take: pageSize },
      },
    });
  });
  await page.route(
    "**/api/ClientDashboard/campaigns/*/creative",
    async (route) => {
      const id = new URL(route.request().url()).pathname.split("/").at(-2);
      const campaign = clientCampaigns.find((item) => item.id === id);
      await route.fulfill({
        json: {
          success: true,
          data: {
            videoUrl: campaign?.videoUrl ?? null,
            imageUrl: campaign?.imageUrl ?? null,
          },
        },
      });
    },
  );
  await page.route(
    "**/api/ClientDashboard/campaigns/*/playback**",
    async (route) => {
      await route.fulfill({
        json: {
          success: true,
          data: {
            items: [
              {
                id: "playback-1",
                vehicleNumber: "TS09AB1234",
                latitude: 17.4435,
                longitude: 78.3772,
                durationSeconds: 30,
                playedAt: "2026-11-17T10:00:00Z",
              },
            ],
            total: 1,
          },
        },
      });
    },
  );
}
