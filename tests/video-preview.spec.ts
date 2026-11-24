import { expect, test } from "@playwright/test";
import type {
  RegistrationDraft,
  RegistrationProgress,
} from "../src/lib/advertisementApi";

test("Register saves its campaign with the account and uploads immediately with resumable retries", async ({
  page,
  isMobile,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(HTMLMediaElement.prototype, "duration", {
      get: () => 1,
    });
    window.Razorpay = class {
      constructor(
        private options: {
          handler: (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => void;
        },
      ) {}
      on() {}
      open() {
        this.options.handler({
          razorpay_payment_id: "pay_test",
          razorpay_order_id: "order_test",
          razorpay_signature: "test-signature",
        });
      }
    };
  });
  const uploads: string[] = [];
  let draft: RegistrationDraft | undefined;
  let videoAttempts = 0;
  let imageAttempts = 0;
  let checkoutCount = 0;
  await page.route(/\/api\/Payments\/.*$/i, async (route) => {
    if (!draft) throw new Error("Campaign must exist before checkout");
    if (route.request().url().endsWith("create-order")) {
      checkoutCount++;
      expect(route.request().postDataJSON()).toMatchObject({
        advertisementId: draft.id,
        amount: 15750,
      });
      draft.paymentStarted = true;
      await route.fulfill({
        json: {
          success: true,
          data: {
            orderId: "order_test",
            keyId: "rzp_test_fixture",
            amount: 15750,
            currency: "INR",
            status: "Pending",
          },
        },
      });
    } else {
      expect(route.request().postDataJSON()).toEqual({
        orderId: "order_test",
        paymentId: "pay_test",
        signature: "test-signature",
      });
      draft.paidAmount = 15750;
      draft.status = "PendingApproval";
      await route.fulfill({
        json: { success: true, data: { status: "Completed" } },
      });
    }
  });
  await page.route(/\/api\/Advertisements(?:\/.*)?$/i, async (route) => {
    if (!draft)
      throw new Error(
        "Draft must be saved with account registration before upload",
      );
    const path = new URL(route.request().url()).pathname;
    expect(route.request().headers().authorization).toBe("Bearer client-token");
    if (path.endsWith("/upload-video")) {
      uploads.push(path);
      if (++videoAttempts === 1) {
        await route.fulfill({
          status: 503,
          json: { success: false, message: "Storage unavailable" },
        });
        return;
      }
      expect(route.request().postData()).toContain(
        'name="file"; filename="campaign.mp4"',
      );
      draft.hasVideo = true;
    } else if (path.endsWith("/upload-image")) {
      uploads.push(path);
      expect(route.request().postData()).toContain(
        'name="file"; filename="banner.png"',
      );
      if (++imageAttempts === 1) {
        await route.fulfill({
          status: 503,
          json: {
            success: false,
            error: { message: "Banner storage unavailable" },
          },
        });
        return;
      }
      draft.hasBanner = true;
    } else if (path.includes("/drafts/")) {
      if (route.request().method() === "PUT")
        draft.progress = route.request().postDataJSON() as RegistrationProgress;
    } else if (path.endsWith("/drafts") && route.request().method() === "GET") {
      await route.fulfill({ json: { success: true, data: [draft] } });
      return;
    } else if (path.endsWith("/my-ads") && route.request().method() === "GET") {
      await route.fulfill({
        json: { success: true, data: { items: [], total: 0 } },
      });
      return;
    } else {
      throw new Error(
        "Registration must not create another campaign at the end",
      );
    }
    await route.fulfill({ json: { success: true, data: draft } });
  });
  const requests: { endpoint: string; body: unknown }[] = [];
  let loginAttempts = 0;
  let registerAttempts = 0;
  await page.route("**/api/v1/auth/*", async (route) => {
    const endpoint = new URL(route.request().url()).pathname;
    requests.push({ endpoint, body: route.request().postDataJSON() });
    if (endpoint.endsWith("/register") && ++registerAttempts === 1) {
      await route.fulfill({
        status: 422,
        json: { error: { message: "Registration unavailable" } },
      });
    } else if (endpoint.endsWith("/register")) {
      const progress = route.request().postDataJSON()
        .advertisement as RegistrationProgress;
      expect(progress).toMatchObject({
        name: "Campaign preview",
        brand: "Test Brand",
        days: "14",
        cabs: "20",
      });
      draft = {
        id: progress.id,
        progress,
        hasVideo: false,
        hasBanner: false,
        paymentStarted: false,
        status: "Draft",
        amount: 0,
        paidAmount: 0,
      };
      await route.fulfill({ json: { success: true } });
    } else if (++loginAttempts === 1) {
      await route.fulfill({
        status: 503,
        json: { error: { message: "Sign-in temporarily unavailable" } },
      });
    } else {
      await route.fulfill({
        json: {
          success: true,
          data: { accessToken: "client-token", refreshToken: "refresh-token" },
        },
      });
    }
  });
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
  await page.locator("#summary-cabs").selectOption("20");
  await expect(page.locator("#summary-price")).toHaveText("₹4,200");
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
    const recorder = new MediaRecorder(stream, { mimeType: "video/mp4" });
    const chunks: Blob[] = [];
    const done = new Promise<Blob>((resolve) => {
      recorder.ondataavailable = (event) => chunks.push(event.data);
      recorder.onstop = () => resolve(new Blob(chunks, { type: "video/mp4" }));
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
    name: "campaign.mp4",
    mimeType: "video/mp4",
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
    page.getByRole("heading", { name: "Advertiser details and account" }),
  ).toBeVisible();
  await expect(page.getByText("Step 2 of 5")).toBeVisible();
  await expect(
    page.locator("#email-preview-code, #phone-preview-code"),
  ).toHaveCount(0);
  await page.getByLabel("Full name *").fill("Test Advertiser");
  await page.getByLabel("Business / brand *").fill("Test Brand");
  await page.getByLabel("Email (username) *").fill("advertiser@example.com");
  await page.getByLabel("Mobile number *").fill("919876543210");
  await page.getByLabel("Password *", { exact: true }).fill("weakpass");
  await page.getByLabel("Confirm password *").fill("weakpass");
  await page.getByRole("button", { name: /Continue/ }).click();
  expect(
    await page
      .locator("#client-password")
      .evaluate((input: HTMLInputElement) => input.validity.patternMismatch),
  ).toBe(true);
  expect(requests).toHaveLength(0);
  await page.getByLabel("Password *", { exact: true }).fill("StrongPass1!");
  await page.getByLabel("Confirm password *").fill("OtherPass1!");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator(".registration-error")).toContainText(
    "Passwords do not match",
  );
  expect(requests).toHaveLength(0);
  await page.getByLabel("Confirm password *").fill("StrongPass1!");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator(".registration-error")).toContainText(
    "Registration unavailable",
  );
  expect(requests).toHaveLength(1);
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator(".registration-error")).toContainText(
    "Sign-in temporarily unavailable",
  );
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator(".registration-error")).toContainText(
    "We could not complete your request",
  );
  expect(draft).toBeDefined();
  expect(checkoutCount).toBe(0);
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.locator(".registration-error")).toContainText(
    "We could not complete your request",
  );
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(
    page.getByRole("heading", { name: "Choose your campaign plan" }),
  ).toBeVisible();
  expect(requests.map((request) => request.endpoint)).toEqual([
    "/api/v1/auth/register",
    "/api/v1/auth/register",
    "/api/v1/auth/client-login",
    "/api/v1/auth/client-login",
  ]);
  expect(requests[0].body).toMatchObject({
    email: "advertiser@example.com",
    phone: "919876543210",
    fullName: "Test Advertiser",
    password: "StrongPass1!",
    role: "Client",
  });
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.locator("#registration-video")).toBeDisabled();
  await expect(page.locator("#registration-banner")).toBeDisabled();
  await page
    .getByRole("button", { name: "Upload missing files and continue" })
    .click();
  expect(requests).toHaveLength(4);
  await expect(page.locator("#total-cost")).toHaveText("₹4,200");
  await expect(page.locator("#daily-play-count")).toHaveValue("1000");
  await expect(page.locator("#vehicle-count")).toHaveValue("20");
  await page.locator("#vehicle-count").selectOption("30");
  await page.locator("#daily-play-count").fill("2500");
  await page.locator("#campaign-days").fill("21");
  await expect(page.locator("#total-cost")).toHaveText("₹15,750");
  await expect(page.locator("#summary-days")).toHaveValue("21");
  await expect(page.locator("#summary-daily-plays")).toHaveValue("2500");
  await expect(page.locator(".registration-summary-details")).toContainText(
    "52,500",
  );
  await page.locator("#daily-play-count").fill("0");
  await expect(page.getByRole("button", { name: /^Continue/ })).toBeDisabled();
  await page.locator("#daily-play-count").fill("2500");
  await page.getByRole("button", { name: /^Continue/ }).click();
  await expect(
    page.getByRole("heading", { name: "Review your registration" }),
  ).toBeVisible();
  await expect(page.locator(".registration-form")).toContainText(
    "2,500 plays per day × 21 days = 52,500 estimated",
  );
  await expect(page.locator(".registration-form")).toContainText("₹15,750");
  await page.getByLabel("Requested campaign start date").fill("2027-01-01");
  await page.getByLabel(/I agree to the campaign plan/).check();
  await page.getByRole("button", { name: /Continue to payment/ }).click();
  await expect(
    page.getByRole("heading", { name: "Pay for your campaign" }),
  ).toBeVisible();
  expect(uploads).toEqual([
    `/api/Advertisements/${draft?.id}/upload-video`,
    `/api/Advertisements/${draft?.id}/upload-video`,
    `/api/Advertisements/${draft?.id}/upload-image`,
    `/api/Advertisements/${draft?.id}/upload-image`,
  ]);
  expect(checkoutCount).toBe(0);
  await page.getByRole("button", { name: /Pay ₹15,750/ }).click();
  await expect(page.getByRole("dialog")).toContainText("₹15,750");
  await expect(page.getByRole("dialog")).toContainText(
    "Your payment is confirmed",
  );
  expect(checkoutCount).toBe(1);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("adrover-demo-advertisements"),
    ),
  ).toBeNull();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
  await page.reload();
  await expect(page).toHaveURL(/dashboard\.html\?draft=/);
  await expect(
    page.getByRole("dialog", { name: "Campaign status" }),
  ).toContainText("Payment verified");
  expect(checkoutCount).toBe(1);
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
