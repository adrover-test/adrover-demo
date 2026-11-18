import { expect, test, type Page } from "@playwright/test";
import { seedDemoSession } from "./demo-session";

const campaign = {
  id: "67b2f3dc-05a0-45b0-a61d-bde44301e310",
  clientId: "client-one",
  name: "Real autumn campaign",
  brand: "Northstar",
  description: "Saved campaign details",
  targetArea: "Hyderabad",
  videoUrl: "https://storage.invalid/video.webm",
  imageUrl: null,
  videoDurationSeconds: 13,
  startDate: "2027-01-01T00:00:00Z",
  endDate: "2027-01-08T00:00:00Z",
  targetPlays: 10000,
  actualPlays: 27,
  assignedCabs: 10,
  status: "PendingApproval",
  approvalAmount: 3000,
  paidAmount: 0,
  rejectionReason: null,
  approvedAt: null,
  submittedAt: "2026-11-18T10:00:00Z",
};
async function mockCampaigns(page: Page) {
  await page.route("**/api/Advertisements/drafts", (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  );
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { items: [campaign], total: 1, skip: 0, take: 100 },
      },
    }),
  );
  await page.route("**/api/ClientDashboard/summary", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          totalAdvertisements: 1,
          activeAdvertisements: 0,
          pendingAdvertisements: 1,
          totalPlays: 27,
          activeCabs: 2,
          dailyPlays: Array.from({ length: 14 }, (_, day) => ({
            date: `2026-11-${String(day + 5).padStart(2, "0")}`,
            plays: day === 13 ? 9 : 0,
          })),
        },
      },
    }),
  );
}

test("client overview and campaign list show only saved account data", async ({
  page,
}) => {
  await mockCampaigns(page);
  await seedDemoSession(page, "client@example.com");
  await expect(
    page
      .locator(".dashboard-stat")
      .filter({ hasText: "Total advertisements" })
      .locator("strong"),
  ).toHaveText("1");
  await expect(
    page
      .locator(".dashboard-stat")
      .filter({ hasText: "Total ad plays" })
      .locator("strong"),
  ).toHaveText("27");
  await expect(
    page
      .locator(".dashboard-stat")
      .filter({ hasText: "Cabs playing your ads" })
      .locator("strong"),
  ).toHaveText("2");
  await expect(page.locator(".plays-chart-footer")).toContainText("9 today");
  await expect(page.locator("tbody")).toContainText("Real autumn campaign");
  await expect(page.locator("main")).not.toContainText(
    /illustrative|sample|backend|Azure|Blob Storage|18\.4%|342/,
  );
  await page.getByRole("link", { name: /View all advertisements/ }).click();
  await expect(page.locator(".ad-list-card")).toHaveCount(1);
  await expect(page.locator(".ad-list-card")).toContainText(
    "Real autumn campaign",
  );
  await expect(page.locator(".ad-list-play-count")).toContainText("27");
  await page
    .getByRole("searchbox", { name: "Search advertisements" })
    .fill("Not my campaign");
  await expect(
    page.getByRole("heading", { name: "No matching advertisements" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("link", { name: "View details", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`view-ad.html\\?id=${campaign.id}`));
});

test("overview failures remain visible and retry loads real data", async ({
  page,
}) => {
  await mockCampaigns(page);
  let fail = true;
  await page.route("**/api/ClientDashboard/summary", (route) =>
    route.fulfill(
      fail
        ? {
            status: 500,
            json: { success: false, message: "SQL backend exception" },
          }
        : {
            json: {
              success: true,
              data: {
                totalAdvertisements: 1,
                activeAdvertisements: 0,
                pendingAdvertisements: 1,
                totalPlays: 27,
                activeCabs: 0,
                dailyPlays: [],
              },
            },
          },
    ),
  );
  await seedDemoSession(page, "client@example.com");
  await expect(page.getByRole("alert")).toContainText(
    "We could not complete your request",
  );
  await expect(
    page.locator(".dashboard-stat").first().locator("strong"),
  ).toHaveText("—");
  await expect(page.locator("main")).not.toContainText("SQL backend exception");
  fail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.locator(".dashboard-stat").first().locator("strong"),
  ).toHaveText("1");
});

test("campaign detail uses real creative and recorded playback with date filtering", async ({
  page,
}) => {
  await mockCampaigns(page);
  let chosenDate = "";
  await page.route("**/api/ClientDashboard/campaigns/*/creative", (route) =>
    route.fulfill({
      json: { success: true, data: { videoUrl: null, imageUrl: null } },
    }),
  );
  await page.route("**/api/ClientDashboard/campaigns/*/playback?*", (route) => {
    chosenDate = new URL(route.request().url()).searchParams.get("date") ?? "";
    return route.fulfill({
      json: {
        success: true,
        data: {
          total: 1,
          items: [
            {
              id: "play-one",
              vehicleNumber: "TS01AB1234",
              latitude: 17.44,
              longitude: 78.35,
              durationSeconds: 13,
              playedAt: "2026-11-18T12:00:00Z",
            },
          ],
        },
      },
    });
  });
  await seedDemoSession(
    page,
    "client@example.com",
    `view-ad.html?id=${campaign.id}`,
  );
  await expect(
    page.getByRole("heading", { name: campaign.name, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".view-ad-meta")).toContainText("27");
  await expect(page.getByText("TS01AB1234", { exact: true })).toBeVisible();
  await expect(
    page.getByText("17.44000, 78.35000", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No creative has been uploaded yet."),
  ).toBeVisible();
  await page.getByLabel("Playback date (UTC)").fill("2026-11-01");
  await expect.poll(() => chosenDate).toBe("2026-11-01");
  await expect(page.locator("main")).not.toContainText(
    /sample|DEMO-|Simulated|backend|Blob Storage/,
  );
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).click();
  expect((await download).suggestedFilename()).toBe(
    `Adrover-${campaign.id}-report.txt`,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("campaign listing fetches subsequent pages without showing sample records", async ({
  page,
}) => {
  await mockCampaigns(page);
  let pages = new Set<string>();
  await page.route("**/api/Advertisements/my-ads?*", (route) => {
    const number =
      new URL(route.request().url()).searchParams.get("pageNumber") ?? "";
    pages.add(number);
    return route.fulfill({
      json: {
        success: true,
        data: {
          total: 2,
          items:
            number === "1"
              ? [campaign]
              : [
                  {
                    ...campaign,
                    id: "second-campaign",
                    name: "Second saved campaign",
                    status: "Rejected",
                  },
                ],
        },
      },
    });
  });
  await seedDemoSession(page, "client@example.com", "advertisements.html");
  await expect(page.locator(".ad-list-card")).toHaveCount(2);
  expect([...pages].sort()).toEqual(["1", "2"]);
  await page.getByRole("button", { name: /^Rejected/ }).click();
  await expect(page.locator(".ad-list-card")).toHaveCount(1);
  await expect(page.locator(".ad-list-card")).toContainText(
    "Second saved campaign",
  );
  await expect(page.locator(".ad-list-card .campaign-status")).toHaveText(
    "Rejected",
  );
  await expect(page.locator(".ad-list-play-caption")).toHaveText(
    "Changes required",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("missing campaigns retain a heading and a route back to the account list", async ({
  page,
}) => {
  await mockCampaigns(page);
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { items: [], total: 0 },
      },
    }),
  );
  await page.route("**/api/ClientDashboard/campaigns/**", (route) =>
    route.fulfill({
      status: 404,
      json: { success: false, message: "Campaign not found." },
    }),
  );
  await seedDemoSession(
    page,
    "client@example.com",
    `view-ad.html?id=${campaign.id}`,
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Campaign details",
  );
  await expect(page.getByRole("alert")).toContainText("Campaign not found");
  await expect(
    page.getByRole("link", { name: "Back to my advertisements" }),
  ).toHaveAttribute("href", "advertisements.html");
});

test("campaign details retry a remaining banner without recreating the campaign", async ({
  page,
}) => {
  await mockCampaigns(page);
  let savedBanner = false;
  const uploads: { path: string; body: string }[] = [];
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...campaign,
              imageUrl: savedBanner ? "https://media.invalid/banner.png" : null,
            },
          ],
          total: 1,
        },
      },
    }),
  );
  await page.route("**/api/ClientDashboard/campaigns/*/creative", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { videoUrl: null, imageUrl: null },
      },
    }),
  );
  await page.route("**/api/ClientDashboard/campaigns/*/playback?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { items: [], total: 0 },
      },
    }),
  );
  await page.route("**/api/Advertisements/*/upload-image", (route) => {
    uploads.push({
      path: new URL(route.request().url()).pathname,
      body: route.request().postData() ?? "",
    });
    if (uploads.length === 1)
      return route.fulfill({
        status: 503,
        json: {
          success: false,
          message: "Azure Blob storage unavailable",
        },
      });
    savedBanner = true;
    return route.fulfill({ json: { success: true, data: null } });
  });
  await page.route("**/api/Advertisements", () => {
    throw new Error("An existing campaign must not be recreated");
  });
  await page.route("**/api/Advertisements/*/upload-video", () => {
    throw new Error("An existing video must not be uploaded again");
  });
  await seedDemoSession(
    page,
    "client@example.com",
    `view-ad.html?id=${campaign.id}`,
  );
  const banner = page.getByLabel("Upload optional banner");
  const file = {
    name: "banner.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0AAAAABJRU5ErkJggg==",
      "base64",
    ),
  };
  await banner.setInputFiles(file);
  await expect(page.getByRole("alert")).toContainText(
    "We could not complete your request",
  );
  await expect(page.locator("main")).not.toContainText(
    /Azure|Blob|storage unavailable/,
  );
  await banner.setInputFiles(file);
  await expect(
    page.getByRole("status").filter({ hasText: "Your banner is saved." }),
  ).toBeVisible();
  await expect(
    page.getByRole("region", { name: "Finish creative upload" }),
  ).toHaveCount(0);
  expect(uploads).toHaveLength(2);
  for (const upload of uploads) {
    expect(upload.path).toBe(`/api/Advertisements/${campaign.id}/upload-image`);
    expect(upload.body).toContain('filename="banner.png"');
  }
});

test("approved campaigns check the real payment endpoint and update payment labels", async ({
  page,
}) => {
  await mockCampaigns(page);
  let paid = false;
  const requests: unknown[] = [];
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            { ...campaign, status: "Approved", paidAmount: paid ? 3000 : 0 },
          ],
          total: 1,
        },
      },
    }),
  );
  await page.route("**/api/ClientDashboard/campaigns/*/creative", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { videoUrl: null, imageUrl: null },
      },
    }),
  );
  await page.route("**/api/ClientDashboard/campaigns/*/playback?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: { items: [], total: 0 },
      },
    }),
  );
  await page.route("**/api/Payments/create-order", (route) => {
    requests.push(route.request().postDataJSON());
    paid = true;
    return route.fulfill({
      json: {
        success: true,
        data: {
          orderId: "previous-order",
          keyId: "test-key",
          amount: 3000,
          currency: "INR",
          status: "Completed",
        },
      },
    });
  });
  await seedDemoSession(page, "client@example.com", "advertisements.html");
  await expect(page.locator(".ad-list-play-caption")).toHaveText(
    "Awaiting payment",
  );
  await page.getByRole("link", { name: "View details", exact: true }).click();
  await page.getByRole("button", { name: /Check payment \/ continue/ }).click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Payment confirmed. Thank you." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Check payment \/ continue/ }),
  ).toHaveCount(0);
  expect(requests).toEqual([
    {
      advertisementId: campaign.id,
      amount: 3000,
      description: "Advertisement registration",
    },
  ]);
  await page.getByRole("link", { name: "Back to my advertisements" }).click();
  await expect(page.locator(".ad-list-play-caption")).toHaveText(
    "Awaiting scheduling",
  );
});
