import { expect, test } from "@playwright/test";

test("client phone login validates the number and cannot send or verify OTP before configuration", async ({
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
  await expect(page.locator(".login-journey-stats")).toContainText("1,000");
  await expect(page.locator(".login-journey-stats")).toContainText("7 days");
  await expect(page.getByText("CLIENT LOGIN", { exact: true })).toBeVisible();
  const phone = page.getByLabel("Phone number", { exact: true });
  await expect(phone).toHaveAttribute("autocomplete", "tel");
  await expect(page.locator("#login-email, #login-password")).toHaveCount(0);
  await expect(page.getByLabel("One-time password (OTP)")).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /Verify OTP and sign in/ }),
  ).toBeDisabled();
  await phone.fill("9876543210");
  await page.getByRole("button", { name: /Request OTP/ }).click();
  expect(
    await phone.evaluate(
      (node) => (node as HTMLInputElement).validity.patternMismatch,
    ),
  ).toBe(true);
  await phone.fill("+919876543210");
  await page.getByRole("button", { name: /Request OTP/ }).click();
  await expect(page.locator(".login-status")).toContainText(
    "No OTP has been generated or sent",
  );
  await expect(page).toHaveURL(/login\.html\?next=dashboard\.html$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("adrover-demo-session")),
  ).toBeNull();
  expect(submissions).toEqual([]);
  await phone.fill("+919876543211");
  await expect(page.locator(".login-status")).toBeEmpty();
  await page.reload();
  await expect(phone).toHaveValue("");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});
