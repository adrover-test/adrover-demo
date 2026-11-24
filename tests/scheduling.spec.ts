import { expect, test } from "@playwright/test";
import { seedDemoSession } from "./demo-session";

const validation =
  "The scheduled start date has already passed and the advertisement setup is not yet complete. The advertisement can no longer be scheduled for the selected start date and must be rescheduled to begin from the next available day.";
const base = {
  id: "ad-1",
  name: "Campaign",
  brand: "Brand",
  description: "Details",
  targetArea: "City",
  startDate: "2027-01-01T00:00:00Z",
  endDate: "2027-01-07T00:00:00Z",
  submittedAt: "2026-12-01T00:00:00Z",
  targetPlays: 7000,
  actualPlays: 0,
  assignedCabs: 10,
  approvalAmount: 2100,
  paidAmount: 0,
  status: "PendingApproval",
  rejectionReason: null,
  videoUrl: null,
  imageUrl: null,
};

async function mockDetails(page: import("@playwright/test").Page, ad: object) {
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({ json: { success: true, data: { items: [ad], total: 1 } } }),
  );
  await page.route("**/api/ClientDashboard/campaigns/*/creative", (route) =>
    route.fulfill({
      json: { success: true, data: { videoUrl: null, imageUrl: null } },
    }),
  );
  await page.route("**/api/ClientDashboard/campaigns/*/playback?*", (route) =>
    route.fulfill({ json: { success: true, data: { items: [], total: 0 } } }),
  );
  await seedDemoSession(page, "client@example.com", "view-ad.html?id=ad-1");
}

test("optional scheduling fields show processing and exact setup validation", async ({
  page,
}) => {
  await mockDetails(page, {
    ...base,
    contentId: "content-1",
    contentState: "Processing",
    readyForScheduling: false,
    setupValidationMessage: validation,
    isEditable: true,
  });
  const details = page.getByLabel("Scheduling details");
  await expect(details).toContainText("Content status: Processing");
  await expect(details).toContainText("Not ready for scheduling");
  await expect(details.getByRole("alert")).toHaveText(validation);
  await expect(page.getByLabel("Upload campaign video")).toBeVisible();
});

test("Started locks creative edits and ready state is authoritative", async ({
  page,
}) => {
  await mockDetails(page, {
    ...base,
    status: "Started",
    firstPlayedAt: "2027-01-01T10:00:00Z",
    contentState: "Ready",
    readyForScheduling: true,
    isEditable: false,
  });
  await expect(page.getByText("Your campaign has started.")).toBeVisible();
  await expect(page.getByLabel("Scheduling details")).toContainText(
    "Ready for scheduling",
  );
  await expect(page.getByLabel("Scheduling details")).toContainText(
    "Campaign edits are locked.",
  );
  await expect(page.getByLabel("Upload campaign video")).toHaveCount(0);
});

test("Started without a first-play timestamp shows status and lock only", async ({
  page,
}) => {
  await mockDetails(page, { ...base, status: "Started", firstPlayedAt: null });
  const details = page.getByLabel("Scheduling details");
  await expect(details.getByText("Started", { exact: true })).toBeVisible();
  await expect(details).toContainText("Campaign edits are locked.");
  await expect(details).not.toContainText("First playback recorded");
  await expect(details).toHaveText("StartedCampaign edits are locked.");
  await expect(page.getByLabel("Upload campaign video")).toHaveCount(0);
});

test("older DTOs keep creative retry and show no invented scheduling state", async ({
  page,
}) => {
  await mockDetails(page, base);
  await expect(page.getByLabel("Upload campaign video")).toBeVisible();
  await expect(page.getByLabel("Scheduling details")).toHaveCount(0);
});

test("checkout displays the backend validation unchanged", async ({ page }) => {
  await page.route("**/api/Payments/create-order", (route) =>
    route.fulfill({
      status: 400,
      json: { success: false, message: validation },
    }),
  );
  await mockDetails(page, { ...base, status: "Approved" });
  await page.getByRole("button", { name: "Check payment / continue" }).click();
  await expect(page.getByRole("alert")).toHaveText(validation);
});

test("video selectors reject WebM and accept MOV selection", async ({
  page,
}) => {
  await page.goto("pricing.html");
  const input = page.locator("#campaign-video");
  await expect(input).toHaveAttribute("accept", /\.mov/);
  await expect(input).not.toHaveAttribute("accept", /webm/);
  await input.setInputFiles({
    name: "ad.webm",
    mimeType: "video/webm",
    buffer: Buffer.from("not video"),
  });
  await expect(page.locator("#video-error")).toHaveText(
    "Choose an MP4 or MOV video.",
  );
  await input.setInputFiles({
    name: "ad.mov",
    mimeType: "video/quicktime",
    buffer: Buffer.from("not video"),
  });
  await expect(page.locator(".video-file-details strong")).toHaveText("ad.mov");
});

test("started draft cannot be edited even through a direct setup link", async ({
  page,
}) => {
  const draft = {
    id: "ad-1",
    status: "PendingApproval",
    hasVideo: true,
    hasBanner: true,
    amount: 0,
    paidAmount: 0,
    paymentStarted: false,
    firstPlayedAt: "2027-01-01T10:00:00Z",
    isEditable: false,
    progress: {
      id: "ad-1",
      name: "Campaign",
      brand: "Brand",
      targetArea: "City",
      videoDurationSeconds: 30,
      days: "7",
      dailyPlays: "1000",
      cabs: "10",
      startDate: "2027-01-01",
      step: "plan",
      consent: true,
    },
  };
  let writes = 0;
  await page.route("**/api/Advertisements/drafts**", (route) => {
    if (route.request().method() === "PUT") writes++;
    return route.fulfill({
      json: {
        success: true,
        data: new URL(route.request().url()).pathname.endsWith("/ad-1")
          ? draft
          : [draft],
      },
    });
  });
  await seedDemoSession(
    page,
    "client@example.com",
    "dashboard.html?draft=ad-1",
  );
  const dialog = page.getByRole("dialog", { name: "Continue campaign setup" });
  await expect(
    dialog.getByRole("heading", { name: "Campaign edits are locked" }),
  ).toBeVisible();
  await expect(dialog.locator("#campaign-days")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close campaign setup" }).click();
  expect(writes).toBe(0);
});

test("reschedule uses tomorrow in IST, sends a date-only value, and refreshes the campaign", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-24T18:31:00Z") });
  await mockDetails(page, { ...base, setupValidationMessage: validation });
  await expect(
    page.getByRole("form", { name: "Reschedule campaign" }),
  ).toBeVisible();
  let requests = 0;
  let reads = 0;
  await page.route("**/api/Advertisements/my-ads?*", (route) => {
    reads++;
    return route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...base,
              startDate: "2026-11-26T00:00:00Z",
              setupValidationMessage: null,
            },
          ],
          total: 1,
        },
      },
    });
  });
  await page.route("**/api/Advertisements/ad-1/reschedule", (route) => {
    requests++;
    expect(route.request().method()).toBe("PUT");
    expect(route.request().postDataJSON()).toEqual({ startDate: "2026-11-26" });
    return route.fulfill({ json: { success: true, data: { id: "ad-1" } } });
  });
  const form = page.getByRole("form", { name: "Reschedule campaign" });
  const start = form.getByLabel("New start date (India time)");
  await expect(start).toHaveAttribute("min", "2026-11-26");
  await start.fill("2026-11-25");
  await form.getByRole("button", { name: "Update start date" }).click();
  expect(requests).toBe(0);
  await start.fill("2026-11-26");
  await form.getByRole("button", { name: "Update start date" }).click();
  await expect(
    page.getByText(
      "Start date updated. Scheduling remains subject to confirmation.",
    ),
  ).toBeVisible();
  await expect(form).toHaveCount(0);
  expect(requests).toBe(1);
  expect(reads).toBeGreaterThan(0);
});

test("reschedule rejection shows backend error and refreshes campaign", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-11-24T18:31:00Z") });
  await mockDetails(page, { ...base, setupValidationMessage: validation });
  await expect(
    page.getByRole("form", { name: "Reschedule campaign" }),
  ).toBeVisible();
  let reads = 0;
  await page.route("**/api/Advertisements/my-ads?*", (route) => {
    reads++;
    return route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...base,
              status: "Started",
              firstPlayedAt: null,
              setupValidationMessage: validation,
            },
          ],
          total: 1,
        },
      },
    });
  });
  await page.route("**/api/Advertisements/ad-1/reschedule", (route) =>
    route.fulfill({
      status: 422,
      json: {
        success: false,
        message: "A provider schedule has already been submitted.",
      },
    }),
  );
  const form = page.getByRole("form", { name: "Reschedule campaign" });
  await form.getByLabel("New start date (India time)").fill("2026-11-26");
  await form.getByRole("button", { name: "Update start date" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "A provider schedule has already been submitted." }),
  ).toBeVisible();
  await expect(form).toHaveCount(0);
  await expect(page.getByText("Start date updated.")).toHaveCount(0);
  expect(reads).toBeGreaterThan(0);
});

test("reschedule control requires validation and no playback or Started status", async ({
  page,
}) => {
  await mockDetails(page, { ...base });
  const form = page.getByRole("form", { name: "Reschedule campaign" });
  await expect(form).toHaveCount(0);
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...base,
              firstPlayedAt: "2026-11-24T01:00:00Z",
              setupValidationMessage: validation,
            },
          ],
          total: 1,
        },
      },
    }),
  );
  await page.reload();
  await expect(page.getByLabel("Scheduling details")).toBeVisible();
  await expect(form).toHaveCount(0);
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...base,
              status: "Started",
              firstPlayedAt: null,
              setupValidationMessage: validation,
            },
          ],
          total: 1,
        },
      },
    }),
  );
  await page.reload();
  await expect(page.getByText("Your campaign has started.")).toBeVisible();
  await expect(form).toHaveCount(0);
});

test("paid non-editable campaign can upload its missing video and refresh processing state", async ({
  page,
}) => {
  const paid = {
    ...base,
    status: "Approved",
    paidAmount: 2100,
    isEditable: false,
    firstPlayedAt: null,
    contentState: "NotSubmitted",
    readyForScheduling: false,
  };
  await mockDetails(page, paid);
  const video = page.getByLabel("Upload campaign video");
  await expect(video).toBeVisible();
  let uploads = 0;
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...paid,
              videoUrl: "https://cdn.example.com/ad.mp4",
              contentState: "Processing",
            },
          ],
          total: 1,
        },
      },
    }),
  );
  await page.route("**/api/Advertisements/ad-1/upload-video", (route) => {
    uploads++;
    expect(route.request().method()).toBe("POST");
    expect(route.request().postData()).toContain('filename="ad.mp4"');
    return route.fulfill({
      json: { success: true, data: { url: "https://cdn.example.com/ad.mp4" } },
    });
  });
  await video.setInputFiles({
    name: "ad.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("video"),
  });
  await expect(page.getByText("Your video is saved.")).toBeVisible();
  await expect(page.getByLabel("Scheduling details")).toContainText(
    "Content status: Processing",
  );
  await expect(page.getByLabel("Upload campaign video")).toHaveCount(0);
  expect(uploads).toBe(1);
});

test("missing video is locked for started and completed campaigns", async ({
  page,
}) => {
  await mockDetails(page, {
    ...base,
    status: "Started",
    firstPlayedAt: null,
    isEditable: false,
  });
  await expect(page.getByText("Your campaign has started.")).toBeVisible();
  await expect(page.getByLabel("Upload campaign video")).toHaveCount(0);
  await page.route("**/api/Advertisements/my-ads?*", (route) =>
    route.fulfill({
      json: {
        success: true,
        data: {
          items: [
            {
              ...base,
              status: "Completed",
              actualPlays: 25,
              firstPlayedAt: null,
              isEditable: false,
            },
          ],
          total: 1,
        },
      },
    }),
  );
  await page.reload();
  await expect(page.getByText("Your campaign has finished.")).toBeVisible();
  await expect(page.getByLabel("Upload campaign video")).toHaveCount(0);
});

test("recorded plays prevent a missing-video upload without a timestamp", async ({
  page,
}) => {
  await mockDetails(page, {
    ...base,
    status: "Active",
    actualPlays: 25,
    firstPlayedAt: null,
    isEditable: false,
  });
  await expect(page.getByText("Your campaign is active.")).toBeVisible();
  await expect(page.getByLabel("Upload campaign video")).toHaveCount(0);
});

test("date-only playback blocks edits, upload and reschedule even with stale status and zero plays", async ({
  page,
}) => {
  await mockDetails(page, {
    ...base,
    status: "PendingApproval",
    actualPlays: 0,
    firstPlayedAt: null,
    firstPlaybackDate: "2026-11-24",
    isEditable: true,
    setupValidationMessage: validation,
  });
  const details = page.getByLabel("Scheduling details");
  await expect(details.getByText("Started", { exact: true })).toBeVisible();
  await expect(
    details.getByText("First playback date: 2026-11-24", { exact: true }),
  ).toBeVisible();
  await expect(details).toContainText("Campaign edits are locked.");
  await expect(details).not.toContainText("First playback recorded:");
  await expect(
    page.getByRole("form", { name: "Reschedule campaign" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Upload campaign video")).toHaveCount(0);
  await expect(page.getByLabel("Upload optional banner")).toHaveCount(0);
});

test("paid settings lock alone does not prevent rescheduling or a missing video upload", async ({
  page,
}) => {
  await mockDetails(page, {
    ...base,
    status: "Approved",
    paidAmount: 2100,
    isEditable: false,
    firstPlayedAt: null,
    firstPlaybackDate: null,
    setupValidationMessage: validation,
  });
  await expect(
    page.getByRole("form", { name: "Reschedule campaign" }),
  ).toBeVisible();
  await expect(page.getByLabel("Upload campaign video")).toBeVisible();
  await expect(page.getByLabel("Scheduling details")).not.toContainText(
    "Started",
  );
});

test("date-only playback locks a stale draft when opened directly", async ({
  page,
}) => {
  const draft = {
    id: "ad-1",
    status: "Draft",
    hasVideo: true,
    hasBanner: true,
    amount: 0,
    paidAmount: 0,
    paymentStarted: false,
    isEditable: true,
    firstPlayedAt: null,
    firstPlaybackDate: "2026-11-24",
    progress: {
      id: "ad-1",
      name: "Campaign",
      brand: "Brand",
      targetArea: "City",
      videoDurationSeconds: 30,
      days: "7",
      dailyPlays: "1000",
      cabs: "10",
      startDate: "2027-01-01",
      step: "plan",
      consent: true,
    },
  };
  let writes = 0;
  await page.route("**/api/Advertisements/drafts**", (route) => {
    if (route.request().method() === "PUT") writes++;
    return route.fulfill({
      json: {
        success: true,
        data: new URL(route.request().url()).pathname.endsWith("/ad-1")
          ? draft
          : [draft],
      },
    });
  });
  await seedDemoSession(
    page,
    "client@example.com",
    "dashboard.html?draft=ad-1",
  );
  const dialog = page.getByRole("dialog", { name: "Continue campaign setup" });
  await expect(
    dialog.getByRole("heading", { name: "Campaign edits are locked" }),
  ).toBeVisible();
  await expect(
    dialog.getByText("First playback date: 2026-11-24"),
  ).toBeVisible();
  await expect(dialog.locator("#campaign-days")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Close campaign setup" }).click();
  expect(writes).toBe(0);
});
