import { expect, test } from "@playwright/test";
import { seedDemoSession } from "./demo-session";

const draft = {
  id: "campaign-draft-123",
  progress: {
    id: "campaign-draft-123",
    name: "Summer launch",
    brand: "Northstar Foods",
    targetArea: "Hyderabad citywide",
    videoDurationSeconds: 12.5,
    days: "14",
    dailyPlays: "1200",
    cabs: "20",
    startDate: "",
    step: "plan",
    consent: false,
  },
  hasVideo: true,
  hasBanner: true,
  status: "Draft",
  amount: 0,
  paidAmount: 0,
  paymentStarted: false,
};

test("client dashboard highlights the saved campaign's next step", async ({
  page,
}) => {
  let saved = draft;
  let failSave = false;
  await page.route("**/api/Advertisements/drafts**", (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (request.method() === "PUT") {
      if (failSave) return route.fulfill({ status: 503, json: { message: "Save unavailable" } });
      saved = { ...saved, progress: request.postDataJSON() };
    }
    return route.fulfill({
      json: {
        success: true,
        data: path.endsWith(`/${draft.id}`) ? saved : [saved],
      },
    });
  });
  await seedDemoSession(page, "client@example.com");

  const campaign = page.locator(".saved-campaign-card");
  await expect(
    page.getByRole("heading", { name: "Pick up where you left off" }),
  ).toBeVisible();
  await expect(page.getByText("1 saved campaign")).toBeVisible();
  await expect(
    campaign.getByRole("heading", { name: "Summer launch" }),
  ).toBeVisible();
  await expect(
    campaign.getByText("Choose your campaign plan", { exact: true }),
  ).toBeVisible();
  await expect(
    campaign.getByText("Next step: Choose your campaign plan"),
  ).toBeVisible();
  const continueButton = campaign.getByRole("button", { name: "Continue setup" });
  await continueButton.click();
  await expect(page).toHaveURL(/dashboard\.html$/);
  const dialog = page.getByRole("dialog", { name: "Continue campaign setup" });
  await expect(dialog.getByRole("heading", { name: "Choose your campaign plan" })).toBeFocused();
  await expect(dialog.locator("[aria-current=step]")).toHaveText("2Plan");
  await expect(dialog.getByText("Details & account")).toHaveCount(0);
  await expect(dialog.locator(".registration-save-status")).toHaveCSS("position", "absolute");
  await expect(dialog.getByText(/Campaign campaign-draft-123/)).toHaveCount(0);
  expect(await dialog.locator(".campaign-setup-body").evaluate((body) => body.scrollWidth <= body.clientWidth)).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(continueButton).toBeFocused();

  await continueButton.click();
  failSave = true;
  await dialog.locator("#campaign-days").fill("21");
  await dialog.getByRole("button", { name: /^Continue\b/ }).click();
  await expect(dialog.getByRole("heading", { name: "Review your campaign" })).toBeFocused();
  await dialog.getByRole("button", { name: "Close campaign setup" }).click();
  await expect(dialog.getByRole("alert").filter({ hasText: "Save unavailable" })).toBeVisible();
  failSave = false;
  await dialog.getByRole("button", { name: "Close campaign setup" }).click();
  await expect(dialog).toHaveCount(0);
  const review = campaign.getByRole("button", { name: "Continue review" });
  await expect(review).toBeVisible();
  expect(saved.progress.days).toBe("21");
  await review.click();
  await expect(dialog.getByRole("heading", { name: "Review your campaign" })).toBeVisible();
  await expect(dialog.locator("#summary-days")).toHaveValue("21");
  await dialog.getByRole("button", { name: "Close campaign setup" }).click();
  await page.goto("advertisements.html");
  await campaign.getByRole("link", { name: "Continue review" }).click();
  await expect(page).toHaveURL(/dashboard\.html\?draft=campaign-draft-123$/);
  await expect(dialog.getByRole("heading", { name: "Review your campaign" })).toBeVisible();
  await page.goto("index.html");
  await expect(
    page.getByRole("heading", { name: "Pick up where you left off" }),
  ).toHaveCount(0);
});

test("saved campaign connectors stay clear of labels at desktop, tablet and phone widths", async ({ page }, testInfo) => {
  await page.route("**/api/Advertisements/drafts", (route) =>
    route.fulfill({ json: { success: true, data: [draft] } }),
  );
  await seedDemoSession(page, "client@example.com");
  const campaign = page.locator(".saved-campaign-card");
  await expect(campaign).toBeVisible();

  for (const width of [1277, 1024, 768, 640, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    const geometry = await campaign.evaluate((card) => {
      const stages = [...card.querySelectorAll<HTMLElement>(".saved-campaign-steps li")];
      return stages.map((stage, index) => {
        const bounds = stage.getBoundingClientRect();
        const dot = stage.querySelector(".saved-campaign-step-dot")!.getBoundingClientRect();
        const label = stage.lastElementChild!.getBoundingClientRect();
        const connector = getComputedStyle(stage, "::after");
        const railTop = bounds.top + parseFloat(connector.top);
        const railBottom = railTop + parseFloat(connector.height);
        return {
          labelBelowDot: label.top >= dot.bottom + 5,
          labelInsideStage: label.left >= bounds.left && label.right <= bounds.right + 1,
          connectorClear: index === stages.length - 1 || (
            railBottom < label.top &&
            bounds.left + parseFloat(connector.left) > dot.right &&
            bounds.left + parseFloat(connector.left) + parseFloat(connector.width) <
              stages[index + 1].querySelector(".saved-campaign-step-dot")!.getBoundingClientRect().left
          ),
        };
      });
    });
    expect(geometry, `Progress spacing at ${width}px`).toEqual(
      Array.from({ length: 4 }, () => ({ labelBelowDot: true, labelInsideStage: true, connectorClear: true })),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `Page overflow at ${width}px`).toBe(true);
    if (width === 1277 || width === 390) {
      await campaign.screenshot({ path: testInfo.outputPath(`campaign-card-${width}.png`) });
    }
  }
});

test("dashboard homepage link returns to the public site without signing the client out", async ({
  page,
}) => {
  await page.route("**/api/Advertisements/drafts", (route) =>
    route.fulfill({ json: { success: true, data: [] } }),
  );
  await seedDemoSession(page, "client@example.com");
  await page.getByRole("link", { name: "Back to homepage" }).click();
  await expect(page).toHaveURL(/index\.html$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("adrover-demo-session")),
  ).toContain("client@example.com");
  await page.goto("dashboard.html");
  await expect(
    page.getByRole("heading", { name: "Pick up where you left off" }),
  ).toBeVisible();
});
