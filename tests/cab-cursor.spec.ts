import { expect, test } from "@playwright/test";

test("cab follows mouse without blocking controls and respects motion preferences", async ({
  page,
  isMobile,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("pricing.html");
  const cab = page.locator(".cab-cursor");
  await expect(cab).toBeHidden();
  await page.mouse.move(100, 100);
  if (isMobile) {
    await expect(cab).toBeHidden();
    return;
  }
  await expect(cab).toBeVisible();
  await expect(cab).toHaveCSS("pointer-events", "none");
  await page.mouse.move(200, 200);
  await expect
    .poll(async () => (await cab.boundingBox())?.x)
    .toBeGreaterThan(210);
  await page.locator("#vehicle-count").hover();
  await expect(cab).toBeHidden();
  await page.mouse.move(100, 100);
  await expect(cab).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(cab).toBeHidden();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.mouse.move(150, 150);
  await expect(cab).toBeHidden();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(async () => {
    await page.mouse.move(100, 100);
    await page.mouse.move(110, 110);
    await expect(cab).toBeVisible();
  }).toPass();
});
