import { expect, test } from "@playwright/test";

test("ad-themed page entrance is decorative, non-blocking and finishes promptly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    document.addEventListener("animationstart", (event) => {
      if (event.animationName === "ad-page-greeting") {
        document.documentElement.dataset.adEntranceStarted = "true";
      }
    });
  });
  await page.goto("index.html");
  await expect(page.locator("html")).toHaveAttribute(
    "data-ad-entrance-started",
    "true",
  );
  const entrance = page.locator(".ad-page-entrance");
  if (await entrance.count()) {
    await expect(entrance).toHaveAttribute("aria-hidden", "true");
    await expect(entrance).toHaveCSS("pointer-events", "none");
  }
  await expect(page.locator("main h1")).toBeVisible();
  await expect(entrance).toHaveCount(0, { timeout: 3000 });
  await page.goto("admin-login.html");
  await expect(page.locator("html")).toHaveAttribute(
    "data-ad-entrance-started",
    "true",
  );
  await expect(page.getByLabel("Admin email")).toBeEditable();
  await expect(entrance).toHaveCount(0, { timeout: 3000 });
});

test("reduced motion omits the page entrance without hiding content or anchors", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("index.html#testimonials");
  await expect(page.locator(".ad-page-entrance")).toBeHidden();
  await expect(page.locator("#testimonials")).toBeInViewport();
  await page.goto("login.html");
  await expect(page.getByLabel("Phone number", { exact: true })).toBeEditable();
  await expect(page.locator(".ad-page-entrance")).toBeHidden();
});
