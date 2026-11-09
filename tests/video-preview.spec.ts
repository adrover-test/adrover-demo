import { expect, test } from "@playwright/test";

test("Register opens the creative form directly with local video playback", async ({
  page,
  isMobile,
}) => {
  await page.goto("pricing.html");
  if (isMobile) await page.getByLabel("Open navigation").click();
  await page
    .getByRole("navigation", {
      name: isMobile ? "Mobile navigation" : "Main navigation",
    })
    .getByRole("link", { name: "Register", exact: true })
    .click();
  await expect(page).toHaveURL(/register\.html$/);
  await expect(
    page.getByRole("heading", { name: "Name your ad and add a banner" }),
  ).toBeVisible();
  await expect(page.getByText("Step 1 of 5")).toBeVisible();
  await expect(
    page.locator(".registration-summary-details > div").last(),
  ).toHaveClass("registration-summary-total");
  await expect(page.locator("#summary-price")).toHaveCSS("font-size", "24px");
  await page.locator("#summary-days").fill("14");
  await page.locator("#summary-cabs").fill("15");
  await expect(page.locator("#summary-price")).toHaveText("₹3,150");
  const input = page.locator("#registration-video");
  await input.setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("invalid"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "Choose an MP4" }),
  ).toBeVisible();
  await input.setInputFiles({
    name: "broken.mp4",
    mimeType: "video/mp4",
    buffer: Buffer.from("invalid"),
  });
  await expect(
    page.getByRole("alert").filter({ hasText: "could not be played" }),
  ).toBeVisible();
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 180;
    const stream = canvas.captureStream(10);
    const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
    const chunks: Blob[] = [];
    const done = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/webm" }));
    });
    recorder.start();
    for (let i = 0; i < 10; i++) {
      const context = canvas.getContext("2d")!;
      context.fillStyle = i % 2 ? "#ffd21c" : "#087a45";
      context.fillRect(0, 0, 320, 180);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    recorder.stop();
    const blob = await done;
    stream.getTracks().forEach((track) => track.stop());
    return Array.from(new Uint8Array(await blob.arrayBuffer()));
  });
  await input.setInputFiles({
    name: "campaign.webm",
    mimeType: "video/webm",
    buffer: Buffer.from(bytes),
  });
  await expect(page.locator(".registration-source")).toContainText("320 × 180");
  const video = page.getByLabel("Live advertisement video preview", {
    exact: true,
  });
  await expect(video).toHaveAttribute("src", /^blob:/);
  await video.evaluate((node) => (node as HTMLVideoElement).play());
  await expect
    .poll(() =>
      video.evaluate((node) => (node as HTMLVideoElement).currentTime),
    )
    .toBeGreaterThan(0);
  await video.evaluate((node) => (node as HTMLVideoElement).pause());
  await page.getByLabel("Advertisement name *").fill("Campaign preview");
  await page.locator("#registration-banner").setInputFiles({
    name: "banner.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pysAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page
    .getByRole("button", { name: /Continue to advertiser details/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Who should we contact?" }),
  ).toBeVisible();
  await page.getByLabel("Full name *").fill("Test Advertiser");
  await page.getByLabel("Business / brand *").fill("Test Brand");
  await page.getByLabel("Email *").fill("advertiser@example.com");
  await page.getByLabel("Mobile number *").fill("+919876543210");
  await page.getByRole("button", { name: /Continue/ }).click();
  await page.getByLabel("Enter email preview code").fill("123456");
  await page
    .locator(".registration-verify-card")
    .nth(0)
    .getByRole("button", { name: /^Verify/ })
    .click();
  await page.getByLabel("Enter mobile preview code").fill("123456");
  await page
    .locator(".registration-verify-card")
    .nth(1)
    .getByRole("button", { name: /^Verify/ })
    .click();
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator("#total-cost")).toHaveText("₹3,150");
  await expect(page.locator("#daily-play-count")).toHaveValue("50");
  await expect(page.locator("#vehicle-count")).toHaveValue("15");
  await page.locator("#vehicle-count").fill("12");
  await page.locator("#daily-play-count").fill("2500");
  await page.locator("#campaign-days").fill("21");
  await expect(page.locator("#total-cost")).toHaveText("₹1,89,000");
  await expect(page.locator(".registration-summary-details")).toContainText(
    "21 days",
  );
  await expect(page.locator("#summary-daily-plays")).toHaveValue("2500");
  await expect(page.locator(".registration-summary-details")).toContainText(
    "6,30,000",
  );
  await page.locator("#daily-play-count").fill("0");
  await expect(page.getByRole("button", { name: /^Continue/ })).toBeDisabled();
  await page.locator("#daily-play-count").fill("2500");
  await page.getByRole("button", { name: /^Continue/ }).click();
  await expect(
    page.getByRole("heading", { name: "Review your registration" }),
  ).toBeVisible();
  await expect(page.locator(".registration-form")).toContainText(
    "12 cabs × 21 days × 2,500 plays per cab per day = 6,30,000 estimated",
  );
  await expect(page.locator(".registration-form")).toContainText("₹1,89,000");
  await page.getByLabel(/I understand this is a browser-local preview/).check();
  await page.getByRole("button", { name: /Submit for review/ }).click();
  await expect(page.getByRole("dialog")).toContainText("₹1,89,000");
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("adrover-demo-advertisements") ?? "[]"),
  );
  expect(saved[0]).toMatchObject({ target: 630000, totalDays: 21 });
  expect(saved[0].note).toContain("₹1,89,000");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.reload();
  await expect(input).toHaveValue("");
  await expect(
    page.getByRole("heading", { name: "Name your ad and add a banner" }),
  ).toBeVisible();
});

test("old registration URL redirects to the standalone creative form", async ({
  page,
}) => {
  await page.goto("pricing.html#registration");
  await expect(page).toHaveURL(/register\.html$/);
  await expect(page.locator("#registration-video")).toBeVisible();
  await expect(
    page.locator("header .links a[href='register.html']"),
  ).toHaveAttribute("aria-current", "page");
});
