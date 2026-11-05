import { expect, test } from "@playwright/test";

test("advertiser and admin navigation share the home brand palette", async ({
  page,
}) => {
  await page.goto("login.html");
  await page.getByLabel("Business email").fill("theme@example.com");
  await page.locator("#login-password").fill("preview-password");
  await page.getByRole("button", { name: /Enter advertiser portal/ }).click();
  await page.goto("advertisements.html");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(248, 247, 241)",
  );
  await expect(page.locator(".ad-filter-active")).toHaveCSS(
    "background-color",
    "rgb(255, 210, 28)",
  );
  await expect(page.locator(".dashboard-nav-active")).toHaveCSS(
    "background-color",
    "rgb(255, 210, 28)",
  );
  await expect(page.locator(".ad-list-controls")).toHaveCSS(
    "border-radius",
    "20px",
  );
  await page.getByRole("button", { name: /^Active/ }).click();
  await expect(page.locator(".ad-filter-active")).toHaveCSS(
    "color",
    "rgb(16, 24, 20)",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("admin-login.html");
  await page.getByLabel("Admin email").fill("theme-admin@example.com");
  await page.getByLabel("Password", { exact: true }).fill("preview-password");
  await page.getByRole("button", { name: /Sign in to admin portal/ }).click();
  await expect(page.locator(".dashboard-nav-active")).toHaveCSS(
    "background-color",
    "rgb(255, 210, 28)",
  );
  await expect(page.locator(".dashboard-panel").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
});

test("driver form uses available panel width and polished controls remain accessible", async ({
  page,
}) => {
  await page.goto("admin-login.html?next=admin.html%3Fsection%3Dcabs");
  await page.getByLabel("Admin email").fill("ui-review@example.com");
  await page.getByLabel("Password", { exact: true }).fill("preview-password");
  await page.getByRole("button", { name: /Sign in to admin portal/ }).click();
  await page.getByText("Create driver", { exact: true }).click();
  const form = page.getByRole("form", { name: "Create driver", exact: true });
  const details = page.locator(".admin-create-driver");
  const panel = await details.evaluate(
    (element) => element.parentElement!.getBoundingClientRect().width,
  );
  const width = await details.evaluate(
    (element) => element.getBoundingClientRect().width,
  );
  expect(width).toBeGreaterThan(panel * 0.75);
  await form.getByLabel("Driver name").focus();
  await expect(form.getByLabel("Driver name")).toBeFocused();
  await expect(form.getByLabel("Driver name")).toHaveCSS(
    "border-top-color",
    "rgb(8, 122, 69)",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(form).toHaveCSS("animation-name", "none");
  await expect(form.getByLabel("Driver name")).toHaveCSS(
    "transition-duration",
    "0s",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("admin.html?section=enquiries");
  await expect(page.locator(".enquiry-summary-button").first()).toHaveCSS(
    "animation-name",
    "none",
  );
});
