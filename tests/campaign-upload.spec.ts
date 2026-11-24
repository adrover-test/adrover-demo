import { expect, test, type Page } from "@playwright/test";
import { seedDemoSession } from "./demo-session";

async function makeVideo(page: Page): Promise<number[]> {
  return page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/mp4" });
    const chunks: Blob[] = [];
    const result = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/mp4" }));
    });
    recorder.start();
    for (let frame = 0; frame < 10; frame++) {
      const context = canvas.getContext("2d")!;
      context.fillStyle = frame % 2 ? "#ffd21c" : "#087a45";
      context.fillRect(0, 0, 320, 180);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    recorder.stop();
    const blob = await result;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
}

async function selectVideo(page: Page, bytes: number[]) {
  await page.evaluate((contents) => {
    const input = document.querySelector<HTMLInputElement>("#campaign-video");
    if (!input) throw new Error("Video input not found");
    const file = new File([new Uint8Array(contents)], "campaign.mp4", {
      type: "video/mp4",
      lastModified: 123456,
    });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, bytes);
  await expect(page.locator(".video-playback-bar")).toContainText("13 seconds");
}

async function fillCampaign(page: Page, bytes: number[]) {
  await page.locator("#ad-name").fill("Spring campaign");
  await page.locator("#ad-brand").fill("Example brand");
  await page.locator("#ad-description").fill("Campaign description");
  await page.locator("#target-area").fill("Hyderabad");
  await page.locator("#start-date").fill("2027-01-01");
  await page.locator("#end-date").fill("2027-01-08");
  await page.locator("#target-plays").fill("10000");
  await page.locator("#assigned-cabs").fill("10");
  await page.locator("#approval-amount").fill("1000");
  await selectVideo(page, bytes);
}

test("creates a backend campaign and attaches its selected video", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      get: () => 12.5,
    });
  });
  const requests: { path: string; auth: string | undefined; body: string }[] =
    [];
  await page.route(/\/api\/Advertisements(?:\/.*)?$/i, async (route) => {
    const request = route.request();
    requests.push({
      path: new URL(request.url()).pathname,
      auth: request.headers().authorization,
      body: request.postData() ?? "",
    });
    if (requests.length === 1) {
      await route.fulfill({ json: { success: true, data: { id: "ad-123" } } });
    } else {
      await route.fulfill({
        json: { success: true, data: { url: "https://example.test/video" } },
      });
    }
  });
  await seedDemoSession(page, "client@example.com", "create-ad.html");
  const bytes = await makeVideo(page);
  await fillCampaign(page, bytes);
  await page.locator("#ad-banner").setInputFiles({
    name: "banner.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==",
      "base64",
    ),
  });
  await page
    .getByRole("button", { name: "Create campaign and upload video" })
    .click();
  await expect(page.locator(".create-ad-status")).toContainText(
    "Your campaign and creative are saved",
  );
  await expect(
    page.getByRole("link", { name: /^View campaign\b/ }),
  ).toHaveAttribute("href", "view-ad.html?id=ad-123");
  await expect(page.locator("main")).not.toContainText(
    /backend|Azure|Blob Storage|campaign ID/,
  );
  expect(requests).toHaveLength(3);
  expect(requests[0].path).toBe("/api/Advertisements");
  expect(requests[0].auth).toBe("Bearer test-token");
  expect(JSON.parse(requests[0].body)).toMatchObject({
    name: "Spring campaign",
    brand: "Example brand",
    videoDurationSeconds: 12.5,
    targetPlays: 10000,
    assignedCabs: 10,
    approvalAmount: 1000,
  });
  expect(requests[1].path).toBe("/api/Advertisements/ad-123/upload-video");
  expect(requests[1].auth).toBe("Bearer test-token");
  expect(requests[1].body).toContain('name="file"; filename="campaign.mp4"');
  expect(requests[2].path).toBe("/api/Advertisements/ad-123/upload-image");
  expect(requests[2].body).toContain('name="file"; filename="banner.png"');
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("adrover-pending-video:client@example.com"),
    ),
  ).toBeNull();
});

test("retries a failed video upload after reload without creating another campaign", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      get: () => 12.5,
    });
  });
  let creations = 0;
  let uploads = 0;
  await page.route(/\/api\/Advertisements(?:\/.*)?$/i, async (route) => {
    if (new URL(route.request().url()).pathname.endsWith("/upload-video")) {
      uploads++;
      if (uploads === 1) {
        await route.fulfill({
          status: 500,
          json: { success: false, message: "Storage unavailable" },
        });
      } else {
        await route.fulfill({ json: { success: true, data: {} } });
      }
    } else {
      creations++;
      await route.fulfill({ json: { success: true, data: { id: "ad-456" } } });
    }
  });
  await seedDemoSession(page, "client@example.com", "create-ad.html");
  const bytes = await makeVideo(page);
  await fillCampaign(page, bytes);
  await page
    .getByRole("button", { name: "Create campaign and upload video" })
    .click();
  await expect(page.locator(".create-ad-error")).toContainText(
    "We could not complete your request",
  );
  await expect(page.locator(".create-ad-error")).not.toContainText(
    "Storage unavailable",
  );
  await expect(page.locator(".create-ad-error")).toContainText(
    "Your campaign is already saved",
  );
  await page.reload();
  await expect(page.locator(".create-ad-status")).toContainText("campaign.mp4");
  await selectVideo(page, bytes);
  await page.getByRole("button", { name: "Retry video upload" }).click();
  await expect(page.locator(".create-ad-status")).toContainText(
    "Your campaign and creative are saved",
  );
  expect(creations).toBe(1);
  expect(uploads).toBe(2);
});

test("retries only the missing banner after reload without another campaign or video upload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      get: () => 12.5,
    });
  });
  let creations = 0;
  let videos = 0;
  let images = 0;
  await page.route(/\/api\/Advertisements(?:\/.*)?$/i, async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/upload-video")) videos++;
    else if (path.endsWith("/upload-image")) {
      images++;
      if (images === 1)
        return route.fulfill({
          status: 503,
          json: { success: false, message: "Storage unavailable" },
        });
    } else {
      creations++;
      return route.fulfill({
        json: { success: true, data: { id: "banner-retry" } },
      });
    }
    return route.fulfill({ json: { success: true, data: {} } });
  });
  async function selectBanner() {
    await page.evaluate(() => {
      const input = document.querySelector<HTMLInputElement>("#ad-banner")!;
      const files = new DataTransfer();
      files.items.add(
        new File([new Uint8Array([137, 80, 78, 71])], "banner.png", {
          type: "image/png",
          lastModified: 123456,
        }),
      );
      input.files = files.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }
  await seedDemoSession(page, "client@example.com", "create-ad.html");
  await fillCampaign(page, await makeVideo(page));
  await selectBanner();
  await page
    .getByRole("button", { name: "Create campaign and upload video" })
    .click();
  await expect(
    page.getByRole("button", { name: "Retry banner upload" }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".create-ad-status")).toContainText("banner.png");
  await selectBanner();
  await page.getByRole("button", { name: "Retry banner upload" }).click();
  await expect(page.locator(".create-ad-status")).toContainText(
    "Your campaign and creative are saved",
  );
  expect(creations).toBe(1);
  expect(videos).toBe(1);
  expect(images).toBe(2);
});
