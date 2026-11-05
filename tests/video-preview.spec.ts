import { expect, test } from "@playwright/test";

test("valid video preview opens the styled advertiser registration and clears previews on removal", async ({
  page,
}) => {
  await page.goto("pricing.html");
  await expect(page).toHaveURL(/\/adrover-test\/pricing\.html$/);
  await expect(page.locator("#total-cost")).toHaveText("₹2,500");
  const frame = await page.locator(".video-cab-frame").boundingBox();
  expect(frame!.width).toBeLessThanOrEqual(280);
  if (page.viewportSize()!.width > 800) {
    const panel = await page.locator(".video-preview-panel").boundingBox();
    expect(panel!.height).toBeLessThan(560);
  }
  await expect(
    page.getByRole("button", { name: /^Play preview/ }),
  ).toBeDisabled();
  const next = page.getByRole("button", { name: /^Move forward with ad/ });
  await expect(next).toHaveCount(0);

  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const context = canvas.getContext("2d")!;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    const recorded = new Promise<Blob>((resolve, reject) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onerror = () =>
        reject(new Error("Test video generation failed"));
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    recorder.start();
    for (let frame = 0; frame < 15; frame++) {
      context.fillStyle = frame % 2 ? "#087a45" : "#ffd21c";
      context.fillRect(0, 0, 320, 180);
      context.fillStyle = "#101814";
      context.font = "24px sans-serif";
      context.fillText("Adrover preview", 30, 90);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    recorder.stop();
    const blob = await recorded;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  const uploads: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") uploads.push(request.url());
  });
  await page.locator("#campaign-video").setInputFiles({
    name: "my-campaign.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  });
  const video = page.locator(".video-screen video");
  await expect(video).toHaveAttribute("src", /^blob:/);
  await expect(page.locator(".video-playback-bar")).toContainText("320 × 180");
  await expect(next).toBeVisible();
  await expect(video).toHaveCSS("object-fit", "contain");
  await page.getByRole("button", { name: /^Play preview/ }).click();
  await expect
    .poll(() =>
      video.evaluate((node) => (node as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0);
  await page.getByRole("button", { name: /^Pause preview/ }).click();
  expect(
    await video.evaluate((node) => (node as HTMLVideoElement).paused),
  ).toBe(true);
  const oldUrl = await video.getAttribute("src");
  await page.locator("#campaign-video").setInputFiles({
    name: "replacement.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  });
  await expect(video).not.toHaveAttribute("src", oldUrl!);
  await expect(page.locator(".video-playback-bar")).toContainText("320 × 180");
  expect(
    await page.evaluate(async (url) => {
      try {
        await fetch(url!);
        return false;
      } catch {
        return true;
      }
    }, oldUrl),
  ).toBe(true);
  const replacementUrl = await video.getAttribute("src");
  await page.getByRole("button", { name: "Remove video" }).click();
  await expect(video).toHaveCount(0);
  await expect(next).toHaveCount(0);
  expect(
    await page.evaluate(async (url) => {
      try {
        await fetch(url!);
        return false;
      } catch {
        return true;
      }
    }, replacementUrl),
  ).toBe(true);
  expect(uploads).toEqual([]);
  await page.locator("#campaign-video").setInputFiles({
    name: "next-step.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  });
  await expect(next).toBeVisible();
  await next.click();
  await expect(page).toHaveURL(/pricing\.html#registration$/);
  await expect(
    page.getByRole("heading", { name: "Register your ad" }),
  ).toBeVisible();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Name your ad and add a banner" }),
  ).toBeVisible();
  await expect(page.locator(".registration-layout")).toBeVisible();
  await expect(page.locator(".registration-sidebar")).toContainText(
    "10,000 plays",
  );
  await expect(page.locator(".registration-sidebar")).toContainText("₹1,000");
  await expect(page.locator(".registration-live-preview")).toContainText(
    "LIVE PREVIEW",
  );
  await expect(
    page
      .getByRole("region", { name: "Live creative preview" })
      .locator("video"),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  await page.getByLabel("Advertisement name *").fill("Autumn campaign");
  await page.locator("#registration-banner").setInputFiles({
    name: "autumn-banner.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pysAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(
    page.getByRole("region", { name: "Live creative preview" }).locator("img"),
  ).toHaveAttribute("src", /^blob:/);
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(
    page.getByRole("heading", { name: "Who should we contact?" }),
  ).toBeVisible();
  await page.getByLabel("Full name *").fill("Preview Advertiser");
  await page.getByLabel("Business / brand *").fill("Sample Studio");
  await page.getByLabel("Email *").fill("preview-advertiser@example.com");
  await page.getByLabel("Mobile number *").fill("+91 98765 43210");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(
    page.getByRole("heading", {
      name: "Preview email and mobile verification",
    }),
  ).toBeVisible();
  await page.getByLabel("Enter email preview code").fill("123456");
  await page
    .locator(".registration-verify-card")
    .nth(0)
    .getByRole("button", { name: "Verify" })
    .click();
  await page.getByLabel("Enter mobile preview code").fill("123456");
  await page
    .locator(".registration-verify-card")
    .nth(1)
    .getByRole("button", { name: "Verify" })
    .click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(
    page.getByRole("heading", { name: "Choose your campaign plan" }),
  ).toBeVisible();
  await expect(page.locator(".registration-plan")).toContainText("10,000");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(
    page.getByRole("heading", { name: "Review your registration" }),
  ).toBeVisible();
  await page.getByLabel(/I understand this is a browser-local preview/).check();
  await page.getByRole("button", { name: /Submit for review/ }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Your ad is in the approval queue",
  );
});

test("video selection reports unsupported, empty and undecodable files", async ({
  page,
}) => {
  await page.goto("pricing.html#video-preview");
  const input = page.locator("#campaign-video");
  await input.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not a video"),
  });
  await expect(page.locator("#video-error")).toContainText(
    "Choose an MP4 or WebM",
  );
  await input.setInputFiles({
    name: "empty.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.alloc(0),
  });
  await expect(page.locator("#video-error")).toContainText("non-empty");
  await input.evaluate((node) => {
    const file = new File(["size-validation"], "large.mp4", {
      type: "video/mp4",
    });
    Object.defineProperty(file, "size", { value: 100 * 1024 * 1024 + 1 });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    (node as HTMLInputElement).files = transfer.files;
    node.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await expect(page.locator("#video-error")).toContainText("100 MB or less");
  await input.setInputFiles({
    name: "broken.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("invalid video"),
  });
  await expect(page.locator("#video-error")).toContainText(
    "could not be played",
  );
  await expect(
    page.getByRole("button", { name: /^Play preview/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /^Move forward with ad/ }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Remove video" }).click();
  await expect(page.locator("#video-error")).toBeHidden();
  await expect(page.locator(".video-screen-empty")).toBeVisible();
});

test("direct registration URL explains that a local video must be selected again", async ({
  page,
}) => {
  await page.goto("pricing.html#registration");
  await expect(
    page.getByRole("heading", { name: "Continue your registration" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Select your video again to continue" }),
  ).toBeVisible();
  await expect(page.locator(".registration-reset-card")).toContainText(
    "video and banner files stay in the current browser session",
  );
  await page.getByRole("button", { name: /Return to video preview/ }).click();
  await expect(page).toHaveURL(/pricing\.html$/);
  await expect(page.locator("#video-preview")).toBeInViewport();
});
