import { expect, test } from "@playwright/test";

test("client phone login validates numbers and starts a local demo session with the demo OTP", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await page.goto("login.html?next=dashboard.html");
  await expect(
    page.locator(".login-journey .login-highlights article"),
  ).toHaveCount(3);
  await expect(
    page.getByRole("img", { name: /Illustrated cab/ }),
  ).toBeVisible();
  await expect(page.locator(".login-journey-stats")).toContainText("₹0.30");
  await expect(page.locator(".login-journey-stats")).toContainText("10,000");
  await expect(page.locator(".login-journey-stats")).toContainText(
    "20 × 10 × 50",
  );
  await expect(page.getByText("CLIENT LOGIN", { exact: true })).toBeVisible();
  const phone = page.getByLabel("Phone number", { exact: true });
  await expect(phone).toHaveAttribute("autocomplete", "tel");
  await expect(page.locator("#login-email, #login-password")).toHaveCount(0);
  const otp = page.getByLabel("One-time password (OTP)");
  await expect(otp).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Verify demo OTP and sign in/ }),
  ).toBeDisabled();
  await phone.fill("9876543210");
  expect(
    await phone.evaluate(
      (node) => (node as HTMLInputElement).validity.patternMismatch,
    ),
  ).toBe(true);
  await expect(otp).toBeDisabled();
  await phone.fill("+919876543210");
  await page.getByRole("button", { name: /Generate demo OTP/ }).click();
  await expect(page.locator(".login-status")).toContainText(
    "Demo OTP: 123456",
  );
  await expect(otp).toBeEnabled();
  expect(
    await page.evaluate(() => sessionStorage.getItem("adrover-demo-session")),
  ).toBeNull();
  await otp.fill("000000");
  await page.getByRole("button", { name: /Verify demo OTP and sign in/ }).click();
  await expect(page.locator(".login-status")).toContainText(
    "Incorrect demo OTP",
  );
  await expect(page).toHaveURL(/login\.html\?next=dashboard\.html$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("adrover-demo-session")),
  ).toBeNull();
  await otp.fill("123456");
  await page.getByRole("button", { name: /Verify demo OTP and sign in/ }).click();
  await expect(page).toHaveURL(/dashboard\.html$/);
  await expect(page.locator(".portal-exit")).toBeVisible();
  expect(
    await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem("adrover-demo-session") ?? "null"),
    ),
  ).toEqual({ email: "phone-919876543210@demo.adrover.local" });
  expect(submissions).toEqual([]);
});

test("login layout keeps sign-in first on smaller screens without horizontal overflow", async ({
  page,
}) => {
  await page.goto("login.html");

  for (const viewport of [
    { width: 320, height: 568 },
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
  ]) {
    await page.setViewportSize(viewport);
    const layout = await page.evaluate(() => {
      const intro = document.querySelector(".login-intro");
      const form = document.querySelector(".login-form-panel");
      if (!intro || !form) throw new Error("Login layout is missing a panel");

      return {
        hasHorizontalOverflow:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        introTop: intro.getBoundingClientRect().top,
        formTop: form.getBoundingClientRect().top,
      };
    });

    expect(layout.hasHorizontalOverflow).toBe(false);
    if (viewport.width <= 900) {
      expect(layout.formTop).toBeLessThan(layout.introTop);
    } else {
      expect(layout.introTop).toBeLessThan(layout.formTop);
    }
  }
});
