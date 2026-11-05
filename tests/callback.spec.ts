import { expect, test } from "@playwright/test";

test("home callback links to the existing contact page without an inline form", async ({
  page,
}) => {
  await page.goto("index.html");
  await expect(page.locator(".upload-cta form")).toHaveCount(0);
  const callback = page.getByRole("link", {
    name: /^Request a callback/,
  });
  await expect(callback).toHaveAttribute("href", "contact.html");
  await callback.click();
  await expect(page).toHaveURL(/contact\.html$/);
  await expect(page.locator("#enquiry-form")).toBeVisible();
  await expect(page.getByLabel("Your name")).toBeEditable();
  await expect(page.getByLabel("Work email")).toBeEditable();
  await expect(page.getByLabel("Phone / WhatsApp")).toBeEditable();
  await expect(page.getByLabel("Anything we should know?")).toBeEditable();
});
