import { expect, test } from "@playwright/test";

test("client login uses the backend and creates a session only after successful credentials", async ({ page }) => {
  const submissions: unknown[] = [];
  await page.route("**/api/v1/auth/client-login", async (route) => {
    const body = route.request().postDataJSON();
    submissions.push(body);
    if (body.password !== "correct-password") {
      await route.fulfill({ status: 401, json: { error: { message: "Invalid email or password" } } });
    } else {
      await route.fulfill({ status: 200, json: { success: true, data: { accessToken: "access-token", refreshToken: "refresh-token" } } });
    }
  });
  await page.goto("login.html?next=dashboard.html");
  await expect(page.locator(".login-journey .login-highlights article")).toHaveCount(3);
  await expect(page.locator("#login-otp, #login-phone")).toHaveCount(0);
  await page.getByLabel("Email address").fill("client@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.locator(".login-status")).toContainText("Invalid email or password");
  expect(await page.evaluate(() => sessionStorage.getItem("adrover-client-token"))).toBeNull();
  await page.getByLabel("Password").fill("correct-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/dashboard\.html$/);
  expect(await page.evaluate(() => sessionStorage.getItem("adrover-client-token"))).toBe("access-token");
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("adrover-demo-session") ?? "null"))).toEqual({ email: "client@example.com" });
  expect(submissions).toEqual([
    { email: "client@example.com", password: "wrong-password" },
    { email: "client@example.com", password: "correct-password" },
  ]);
  await page.locator(".portal-exit").click();
  expect(await page.evaluate(() => sessionStorage.getItem("adrover-client-token"))).toBeNull();
  expect(await page.evaluate(() => sessionStorage.getItem("adrover-client-refresh-token"))).toBeNull();
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
