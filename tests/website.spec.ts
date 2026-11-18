import { expect, test, type Download, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { seedDemoSession } from "./demo-session";
import {
  clientCampaigns,
  clientPayments,
  clientProfile,
  mockClientPortal,
} from "./client-fixtures";

const pages = [
  "index",
  "faq",
  "pricing",
  "register",
  "contact",
  "login",
  "dashboard",
  "profile",
  "create-ad",
  "advertisements",
  "view-ad",
  "payments",
];
const portalPages = new Set([
  "dashboard",
  "profile",
  "create-ad",
  "advertisements",
  "view-ad",
  "payments",
]);

async function downloadedText(download: Download) {
  const path = await download.path();
  if (!path) throw new Error("Download did not produce a local file.");
  return readFile(path, "utf8");
}

async function signInDemo(page: Page, next: string) {
  await mockClientPortal(page);
  await seedDemoSession(page, "advertiser@example.com", next);
}

for (const slug of pages) {
  test(`${slug}: direct load, refresh, assets, branding and responsive layout`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400)
        errors.push(`${response.status()} ${response.url()}`);
    });
    const destination =
      slug === "view-ad" ? "view-ad.html?id=apollo-checkup" : `${slug}.html`;
    if (portalPages.has(slug)) {
      await signInDemo(page, destination);
    } else {
      await page.goto(destination);
    }
    await expect(page.locator("main h1")).toHaveCount(1);
    await expect(page).toHaveTitle(/Adrover/);
    await expect(page.locator("header .logo")).toHaveText("AdRover");
    await expect(page.locator("header .logo > span")).toHaveCSS(
      "text-transform",
      "capitalize",
    );
    if (portalPages.has(slug)) {
      await expect(page.locator(".portal-topbar-badge")).toContainText(
        "Advertiser portal",
      );
      await expect(page.locator(".portal-exit")).toHaveAttribute(
        "href",
        "login.html?signedOut=1",
      );
    } else {
      await expect(page.locator("header > .button")).toHaveAttribute(
        "href",
        "pricing.html#planner",
      );
    }
    await expect(
      page.locator("footer .footer-links a[href='contact.html']"),
    ).toHaveText("Contact us");
    if (slug !== "index" && slug !== "faq") {
      const headingSize = await page
        .locator("main h1")
        .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
      expect(headingSize).toBeLessThanOrEqual(32);
    }
    await expect(page.locator("body")).not.toContainText(/\badrove\b/i);
    await page.reload();
    await expect(page.locator("main h1")).toBeVisible();
    await expect
      .poll(() =>
        page
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                image instanceof HTMLImageElement &&
                image.complete &&
                image.naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const internalLinks = await page
      .locator("a[href]")
      .evaluateAll((links) =>
        links
          .map((link) => (link as HTMLAnchorElement).href)
          .filter((href) => href.startsWith(location.origin)),
      );
    expect(
      internalLinks.every((href) =>
        new URL(href).pathname.startsWith("/adrover-test/"),
      ),
    ).toBe(true);
    if (!portalPages.has(slug)) {
      await expect(page.locator("header .links a")).toHaveText([
        "Home",
        "Pricing",
        "Register",
        "Contact us",
        "Log in",
      ]);
      await expect(
        page.locator("header .links a[href='login.html']"),
      ).toHaveClass(/nav-login-button/);
    }
    if (["index", "pricing", "contact"].includes(slug)) {
      await expect(
        page.locator(`header .links a[href="${slug}.html"]`),
      ).toHaveAttribute("aria-current", "page");
    }
    expect(errors).toEqual([]);
  });
}

test("home presents the requested scroll sequence and footer anchors", async ({
  page,
}) => {
  await page.goto("index.html");
  await expect(page.locator("#about")).toContainText(
    "Cab advertising in Hyderabad",
  );
  await expect(page.locator("#upload .upload-step")).toHaveCount(3);
  await expect(page.locator(".landing-cab-photo > image")).toHaveAttribute(
    "href",
    "assets/hyderabad-cab-hero.jpg",
  );
  await expect(page.locator(".step-icon svg")).toHaveCount(3);
  await expect(page.locator("#services")).toContainText("Cab screen ads");
  await expect(page.locator("#upload")).toContainText("Upload your digital ad");
  await expect(page.locator("#testimonials .testimonial")).toHaveCount(3);
  await expect(page.locator("#testimonials")).toHaveCSS(
    "background-color",
    "rgb(234, 240, 228)",
  );
  await expect(page.locator("#testimonials .testimonial").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.locator("#testimonials .testimonial figcaption strong").first(),
  ).toHaveCSS("color", "rgb(16, 24, 20)");
  await expect(
    page.getByRole("heading", { name: "Trusted by Businesses" }),
  ).toBeVisible();
  await expect(page.locator(".testimonial-rating")).toHaveCount(3);
  await expect(page.locator(".testimonial figcaption strong")).toHaveText([
    "Vikram Reddy",
    "Sneha Rao",
    "Farhan Ahmed",
  ]);
  await expect(page.locator(".footer-tagline")).toHaveText(
    "Take Your Brand Everywhere.",
  );
  await expect(page.locator(".footer-operations")).toContainText(
    "confirmation pending",
  );
  await expect(
    page.locator(".footer-operations a[href^='mailto:']"),
  ).toHaveAttribute("href", "mailto:admin@adrover.in");
  await expect(page.locator("footer a[href='#upload']")).toHaveText(
    "How it works",
  );
  await expect(page.locator("footer .footer-links a")).toHaveText([
    "Login",
    "FAQ",
    "How it works",
    "Contact us",
  ]);
  await expect(page.locator("footer a[href='faq.html']")).toHaveText("FAQ");
  await expect(page.locator("#faq")).toHaveCount(0);
  await expect(page.locator("main .landing > section")).toHaveCount(3);
  await expect(page.locator("#testimonials")).toContainText(
    "A sample look at feedback",
  );
  await expect(page.locator("#upload")).toContainText(
    "This website preview does not accept payments",
  );
  const steps = await page.locator(".upload-step").evaluateAll((nodes) =>
    nodes.map((node) => {
      const { x, y } = node.getBoundingClientRect();
      return { x, y };
    }),
  );
  if (page.viewportSize()!.width > 800) {
    expect(steps[0].y).toBe(steps[1].y);
    expect(steps[1].y).toBe(steps[2].y);
    expect(steps[0].x).toBeLessThan(steps[1].x);
    expect(steps[1].x).toBeLessThan(steps[2].x);
  } else {
    expect(steps[0].y).toBeLessThan(steps[1].y);
    expect(steps[1].y).toBeLessThan(steps[2].y);
  }
  await page.getByRole("link", { name: "Start Campaign" }).click();
  await expect(page.locator("#upload")).toBeInViewport();
  for (const selector of [
    "#upload .landing-section-heading",
    "#testimonials .landing-section-heading",
  ]) {
    const target = page.locator(selector);
    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveCSS("opacity", "1");
  }
  await page.locator("footer a[href='faq.html']").click();
  await expect(page).toHaveURL(/faq\.html$/);
  const question = page.getByText("Can I upload a video now?", { exact: true });
  await question.click();
  await expect(page.locator("#faq details").last()).toHaveAttribute("open", "");
  await question.click();
  await expect(page.locator("#faq details").last()).not.toHaveAttribute("open");
});

test("process journey animates once in view with reduced-motion support", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("index.html#upload");
  await expect(page.locator("#journey-preview-01")).toBeVisible();
  await expect(page.locator(".upload-steps button")).toHaveCount(0);
  for (const number of ["01", "02", "03"]) {
    const panel = page.locator(`#journey-preview-${number}`);
    await expect(panel).toBeVisible();
    await panel.scrollIntoViewIfNeeded();
    await expect(panel.locator(".journey-mini-screen")).toHaveCSS(
      "animation-name",
      "none",
    );
    await expect(page.locator(".journey-preview:visible")).toHaveCount(3);
    await expect(panel.locator(".journey-tags li")).toHaveCount(
      number === "03" ? 1 : 3,
    );
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("index.html");
  await page.locator("#journey-preview-03").scrollIntoViewIfNeeded();
  await expect(page.locator(".upload-step").last()).toHaveAttribute(
    "data-animated",
    "true",
  );
  await expect(
    page.locator("#journey-preview-03 .journey-mini-screen"),
  ).toHaveCSS("animation-duration", "4s");
  await expect(page.locator(".journey-cab")).toHaveCSS(
    "animation-iteration-count",
    "1",
  );
  await expect(page.locator(".journey-cab")).toHaveCSS(
    "animation-play-state",
    "running",
  );
  await expect(
    page.getByRole("button", { name: /Pause motion|Resume motion/ }),
  ).toHaveCount(0);
  await page.locator("#about").scrollIntoViewIfNeeded();
  await expect(page.locator(".journey-cab")).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await page.locator("#journey-preview-03").scrollIntoViewIfNeeded();
  await expect(page.locator(".journey-cab")).toHaveCSS(
    "animation-play-state",
    "running",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("cab ad cycles within the screen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("index.html");
  await expect(page.locator(".cab-ad-slide")).toHaveCount(6);
  await expect(page.locator(".cab-ad-progress")).toHaveCount(0);
  await expect(page.locator(".cab-ad-first")).toHaveCSS(
    "animation-duration",
    "12s",
  );
  await page.locator(".cab-ad-slide").evaluateAll((slides) => {
    for (const slide of slides) {
      for (const animation of slide.getAnimations()) animation.pause();
    }
  });
  await expect(page.getByRole("button", { name: /animation/i })).toHaveCount(0);
  for (const [time, active] of [
    [0, 0],
    [2001, 1],
    [4001, 2],
    [6001, 3],
    [8001, 4],
    [10001, 5],
    [12001, 0],
  ] as const) {
    await page.locator(".cab-ad-slide").evaluateAll((slides, value) => {
      for (const slide of slides) {
        for (const animation of slide.getAnimations())
          animation.currentTime = value;
      }
    }, time);
    await expect(page.locator(".cab-ad-slide").nth(active)).toHaveCSS(
      "opacity",
      "1",
    );
    for (const index of [0, 1, 2, 3, 4, 5].filter(
      (index) => index !== active,
    )) {
      const opacity = await page
        .locator(".cab-ad-slide")
        .nth(index)
        .evaluate((slide) => Number(getComputedStyle(slide).opacity));
      expect(opacity).toBeLessThan(0.001);
    }
  }
});

test("landing respects reduced motion and mobile page navigation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("index.html#testimonials");
  await expect(page.locator("#testimonials")).toBeInViewport();
  await expect(
    page.locator("#testimonials .landing-section-heading"),
  ).toHaveCSS("animation-name", "none");
  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
  await expect(page.locator(".cab-ad-first")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".cab-ad-first")).toHaveCSS("opacity", "1");
  await expect(page.locator(".cab-ad-second")).toHaveCSS("opacity", "0");
  await expect(page.locator(".cab-ad-controls button")).toBeHidden();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("index.html");
  await page.getByLabel("Open navigation").click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Pricing" })
    .click();
  await expect(page).toHaveURL(/pricing\.html$/);
  await expect(page.locator(".mobile-menu")).not.toHaveAttribute("open");
});

test("calculator validates inputs and hands campaign to contact under repository subpath", async ({
  page,
}) => {
  await page.goto("pricing.html#planner");
  const plannerBox = await page.locator("#planner").boundingBox();
  const videoBox = await page.locator("#video-preview").boundingBox();
  expect(plannerBox!.y + plannerBox!.height).toBeLessThanOrEqual(videoBox!.y);
  if (page.viewportSize()!.width > 800) {
    expect(plannerBox!.height).toBeLessThan(550);
  } else {
    expect(plannerBox!.height).toBeLessThan(1050);
  }
  await expect(page.locator("#total-cost")).toHaveText("\u20b93,000");
  await expect(page.locator("#total-plays")).toHaveText("10,000");
  await expect(page.locator("#daily-play-result")).toHaveText("50");
  await expect(page.locator(".pricing-page")).toBeVisible();
  await expect(page.locator(".pricing-page")).toContainText(
    "Total estimated plays must be greater than 1,000",
  );
  await expect(page.locator("#plays-breakdown")).toHaveText(
    "20 cabs × 10 days × 50 plays/day/cab = 10,000 estimated plays",
  );
  await page.locator("#vehicle-count").fill("1");
  await page.locator("#campaign-days").fill("1");
  await page.locator("#daily-play-count").fill("1000");
  await expect(page.locator("#pricing-error")).toContainText(
    "must be greater than 1,000",
  );
  await expect(page.locator("#continue-enquiry")).toBeDisabled();
  await page.locator("#daily-play-count").fill("1001");
  await expect(page.locator("#total-plays")).toHaveText("1,001");
  await expect(page.locator("#continue-enquiry")).toBeEnabled();
  await page.locator("#vehicle-count").fill("20");
  await page.locator("#campaign-days").fill("10");
  await page.locator("#daily-play-count").fill("50");
  await expect(
    page.locator(".fine").filter({ hasText: "Estimated plays" }),
  ).toContainText("30-second ad at \u20b90.30 per play");
  for (const value of ["", "0", "-1", "1.5"]) {
    await page.locator("#vehicle-count").fill(value);
    await expect(page.locator("#pricing-error")).toBeVisible();
    await expect(page.locator("#total-cost")).toHaveText("—");
    await expect(page.locator("#continue-enquiry")).toBeDisabled();
  }
  await page.locator("#vehicle-count").fill("20");
  for (const value of ["", "0", "-1", "1.5", "9007199254740991"]) {
    await page.locator("#daily-play-count").fill(value);
    await expect(page.locator("#pricing-error")).toBeVisible();
    await expect(page.locator("#continue-enquiry")).toBeDisabled();
  }
  await page.locator("#daily-play-count").fill("50");
  for (const value of ["", "0", "-1", "1.5"]) {
    await page.locator("#campaign-days").fill(value);
    await expect(page.locator("#pricing-error")).toBeVisible();
    await expect(page.locator("#continue-enquiry")).toBeDisabled();
  }
  await page.locator("#vehicle-count").fill("12");
  await page.locator("#daily-play-count").fill("2500");
  await page.locator("#campaign-days").fill("14");
  await expect(page.locator("#pricing-result")).toContainText("12");
  await expect(page.locator("#pricing-result")).toContainText("14 days");
  await expect(page.locator("#total-plays")).toHaveText("4,20,000");
  await expect(page.locator("#total-cost")).toHaveText("\u20b91,26,000");
  await page.locator("#continue-enquiry").click();
  await expect(page).toHaveURL(
    /\/adrover-test\/contact\.html\?vehicles=12&days=14&dailyPlays=2500&type=Cabs/,
  );
  await expect(page.locator("#incoming-campaign")).toContainText(
    "12 cabs × 14 days × 2,500 plays per cab per day = 4,20,000 estimated",
  );
  await expect(page.locator("#preferred-format")).toHaveValue("Cabs");
  await expect(page.locator("#preferred-format option")).toHaveCount(1);
  await expect(page.locator("#incoming-campaign")).toContainText(
    "\u20b91,26,000",
  );
});

test("contact rejects malformed campaign links without blocking a new draft", async ({
  page,
}) => {
  for (const query of [
    "vehicles=1",
    "vehicles=-1&days=10&dailyPlays=50&type=Cabs",
    "vehicles=1&days=1&dailyPlays=1&type=Train",
  ]) {
    await page.goto(`contact.html?${query}`);
    await expect(page.locator("#incoming-error")).toContainText(
      "The campaign link could not be used",
    );
    await expect(page.locator("#incoming-campaign")).toBeHidden();
    await expect(page.locator("#preferred-format")).toHaveValue("Cabs");
    await expect(page.locator("#enquiry-form")).toBeVisible();
  }
  await page.goto("contact.html");
  await expect(page.locator("#incoming-error")).toBeHidden();
  await expect(page.locator("#incoming-campaign")).toBeHidden();
});

test("client login requires email and password without OTP", async ({
  page,
}) => {
  await page.goto("login.html");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(page.locator("#login-email")).toHaveAttribute(
    "autocomplete",
    "username",
  );
  await expect(page.locator("#login-password")).toHaveAttribute(
    "autocomplete",
    "current-password",
  );
  await expect(page.locator("#login-otp, #login-phone")).toHaveCount(0);
  await page.getByRole("button", { name: "Sign in" }).click();
  expect(
    await page.evaluate(() => sessionStorage.getItem("adrover-demo-session")),
  ).toBeNull();
});

test("dashboard shows server account totals and navigates to live account pages", async ({
  page,
}) => {
  await signInDemo(page, "dashboard.html");
  await expect(page.locator("#overview h1")).toHaveText(
    "Welcome back, Advertiser",
  );
  await expect(page.locator(".dashboard-stat")).toHaveCount(4);
  await expect(page.locator(".dashboard-stat").nth(0)).toContainText("6");
  await expect(page.locator(".dashboard-stat").nth(1)).toContainText("43,400");
  await expect(page.locator(".dashboard-stat").nth(2)).toContainText("18");
  await expect(page.locator(".plays-bar")).toHaveCount(14);
  await expect(page.locator(".dashboard-nav a")).toHaveText([
    "▦Dashboard",
    "▣My advertisements",
    "₹Payments & history",
    "○Profile",
  ]);
  const rows = page.locator(".dashboard-table tbody tr");
  await expect(rows).toHaveCount(4);
  const apolloRow = rows.filter({ hasText: "Apollo Super Speciality Checkup" });
  await expect(apolloRow).toHaveCount(1);
  const details = apolloRow.getByRole("link", {
    name: "View details for Apollo Super Speciality Checkup",
  });
  await details.click();
  await expect(page.locator("main h1")).toHaveText(
    "Apollo Super Speciality Checkup",
  );
  await page.getByRole("link", { name: "Back to my advertisements" }).click();
  await expect(page).toHaveURL(/advertisements\.html$/);
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page).toHaveURL(/dashboard\.html#overview$/);
  await page.getByRole("link", { name: "Payments & history" }).click();
  await expect(page).toHaveURL(/payments\.html$/);
  await expect(page.locator(".billing-table tbody tr")).toHaveCount(
    clientPayments.length,
  );
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/profile\.html$/);
  await expect(page.locator(".profile-details-grid")).toContainText(
    clientProfile.email,
  );
  await expect(
    page.getByRole("link", { name: "Profile", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("profile updates the supported name remotely and retains read-only contact details", async ({
  page,
}) => {
  await signInDemo(page, "profile.html");
  await expect(page.locator(".profile-details-grid")).toContainText(
    clientProfile.email,
  );
  await expect(page.locator(".profile-details-grid")).toContainText(
    clientProfile.phone,
  );
  await expect(page.getByText("Business name", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Edit name" }).click();
  await page.getByLabel("Account name").fill("Asha Rao");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText(
    "account name has been updated",
  );
  await expect(page.locator(".profile-identity h2")).toHaveText("Asha Rao");
  await page.reload();
  await expect(page.locator(".profile-details-grid")).toContainText("Asha Rao");
  await expect(page.locator(".profile-details-grid")).toContainText(
    clientProfile.email,
  );
  await page.getByRole("button", { name: "Edit name" }).click();
  await page.getByLabel("Account name").fill("Unsaved name");
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.locator(".profile-details-grid")).toContainText("Asha Rao");
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole("button", { name: "Edit name" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("profile keeps edits visible when saving the account name fails", async ({
  page,
}) => {
  await mockClientPortal(page);
  await page.route("**/api/Users/me", async (route) => {
    if (route.request().method() === "PUT") {
      return route.fulfill({
        status: 503,
        json: { success: false, message: "Temporary service issue" },
      });
    }
    return route.fulfill({ json: { success: true, data: clientProfile } });
  });
  await seedDemoSession(page, "advertiser@example.com", "profile.html");
  await page.getByRole("button", { name: "Edit name" }).click();
  await page.getByLabel("Account name").fill("Keep my changes");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "We couldn't save your changes",
  );
  await expect(page.getByLabel("Account name")).toHaveValue("Keep my changes");
  await expect(page.getByRole("status")).not.toContainText("updated");
});

test("advertisement list filters and searches campaigns returned for this client", async ({
  page,
}) => {
  await signInDemo(page, "advertisements.html");
  await expect(page.locator(".ad-list-card")).toHaveCount(
    clientCampaigns.length,
  );
  await expect(
    page.locator(".ad-list-summary .dashboard-stat").first(),
  ).toContainText("6 campaigns");
  await page.getByRole("button", { name: /^Active/ }).click();
  await expect(page.locator(".ad-list-card")).toHaveCount(1);
  await page.getByPlaceholder("Search campaigns or brands").fill("Apollo");
  await expect(page.locator(".ad-list-card")).toHaveCount(1);
  await expect(page.locator(".ad-list-card")).toContainText(
    "Apollo Super Speciality Checkup",
  );
  await page
    .getByPlaceholder("Search campaigns or brands")
    .fill("no matching ad");
  await expect(page.locator(".ad-list-empty")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator(".ad-list-card")).toHaveCount(
    clientCampaigns.length,
  );
  await page
    .locator(".ad-list-card")
    .filter({ hasText: "Apollo Super Speciality Checkup" })
    .getByRole("link", { name: "View details" })
    .click();
  await expect(page).toHaveURL(/view-ad\.html\?id=apollo-checkup$/);
  await expect(
    page.getByRole("heading", { name: "Campaign overview" }),
  ).toBeVisible();
});

test("portal entrances respect reduced motion and leave content visible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await signInDemo(page, "dashboard.html");
  await expect(page.locator(".dashboard-heading")).toHaveCSS(
    "animation-name",
    "portal-enter",
  );
  await expect(page.locator(".dashboard-stat").first()).toHaveCSS(
    "animation-duration",
    "0.36s",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload();
  await expect(page.locator(".dashboard-heading")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".dashboard-stat").first()).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".dashboard-stat").first()).toHaveCSS(
    "opacity",
    "1",
  );
  await page.goto("view-ad.html?id=apollo-checkup");
  await expect(page.locator(".view-ad-status-bar")).toHaveCSS(
    "animation-name",
    "none",
  );
  await expect(page.locator(".view-ad-status-bar")).toBeVisible();
});

test("campaign details show returned status, payment totals and recorded playback", async ({
  page,
}) => {
  await signInDemo(page, "view-ad.html?id=apollo-checkup");
  await expect(page.locator("main h1")).toHaveText(
    "Apollo Super Speciality Checkup",
  );
  await expect(
    page.getByRole("region", { name: "Campaign status" }),
  ).toContainText("Active");
  await expect(page.locator(".view-ad-meta")).toContainText("18,400");
  await expect(page.locator(".view-ad-meta")).toContainText("45,000");
  await expect(page.locator(".dashboard-table tbody")).toContainText(
    "TS09AB1234",
  );
  await expect(page.locator(".dashboard-table tbody")).toContainText(
    "17.44350, 78.37720",
  );
  await page.goto("view-ad.html?id=cyberfintech-launch");
  await expect(
    page.getByRole("region", { name: "Campaign status" }),
  ).toContainText("awaiting review");
  await expect(page.locator(".view-ad-meta")).toContainText("60,000");
  await page.goto("view-ad.html?id=deccan-living-expo");
  await expect(
    page.getByRole("region", { name: "Campaign status" }),
  ).toContainText("finished");
  await expect(page.locator(".view-ad-meta")).toContainText("30,000");
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("campaign details load the owner's creative and export the returned campaign report", async ({
  page,
}) => {
  await signInDemo(page, "view-ad.html?id=apollo-checkup");
  await expect(page.locator("main h1")).toHaveText(
    "Apollo Super Speciality Checkup",
  );
  await expect(page.locator(".view-ad-top-grid")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your creative" }),
  ).toBeVisible();
  await expect(page.locator("img.registration-review-banner")).toHaveAttribute(
    "src",
    "https://cdn.example.com/apollo.jpg",
  );
  await expect(page.locator(".view-ad-stats")).toHaveCount(0);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    "Adrover-apollo-checkup-report.txt",
  );
  const report = await downloadedText(download);
  expect(report).toContain("Advertisement: Apollo Super Speciality Checkup");
  expect(report).toContain("Plays delivered: 18400");
  expect(report).toContain("Campaign amount (INR): 45000");
  expect(report).not.toMatch(/sample|illustrative/i);
  await page.goto("view-ad.html?id=invalid");
  await expect(page.getByRole("alert")).toContainText("Campaign not found");
});

test("portal routes require a demo sign-in and exit clears the demo session", async ({
  page,
}) => {
  await page.goto("dashboard.html");
  await expect(page).toHaveURL(/login\.html\?next=/);
  await expect(page.locator("#login-email")).toBeVisible();
  await mockClientPortal(page);
  await seedDemoSession(page, "advertiser@example.com");
  await expect(page).toHaveURL(/dashboard\.html$/);
  await page.getByRole("link", { name: "Back to homepage" }).click();
  await expect(page).toHaveURL(/index\.html$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("adrover-demo-session")),
  ).toContain("advertiser@example.com");
  await page.goto("dashboard.html");
  await page.locator(".portal-exit").click();
  await expect(page).toHaveURL(/login\.html\?signedOut=1$/);
  await page.goto("dashboard.html");
  await expect(page).toHaveURL(/login\.html\?next=/);
});

test("create-ad previews an optional banner and downloads a local brief without submitting", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await signInDemo(page, "create-ad.html");
  await page.locator("#ad-name").fill("Spring opening campaign");
  await page.locator("#ad-banner").setInputFiles({
    name: "spring-banner.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pysAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await expect(page.locator(".create-ad-banner-preview")).toHaveAttribute(
    "src",
    /^blob:/,
  );
  await expect(page.locator(".create-ad-mock-screen")).toContainText(
    "Spring opening campaign",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download campaign brief/ }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    "Adrover-advertisement-review-brief.txt",
  );
  const text = await downloadedText(download);
  expect(text).toContain("Advertisement: Spring opening campaign");
  expect(text).toContain("Banner image: spring-banner.png");
  expect(text).toContain("downloading it does not submit a campaign");
  await expect(page.locator(".create-ad-status")).toContainText(
    "Review brief downloaded",
  );
  expect(submissions).toEqual([]);
});

test("payments filter server records and download only actual payment history", async ({
  page,
}) => {
  await signInDemo(page, "payments.html");
  await expect(page.locator(".billing-table tbody tr")).toHaveCount(
    clientPayments.length,
  );
  await page
    .getByLabel("Filter this page by payment status")
    .selectOption("Pending");
  await expect(page.locator(".billing-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".billing-table tbody")).toContainText(
    "Cyberfintech Launch",
  );
  await page
    .getByLabel("Filter this page by payment status")
    .selectOption("All statuses");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download this page" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    "adrover-payment-history-page-1.csv",
  );
  const statement = await downloadedText(download);
  expect(statement).toContain('"pay-1"');
  expect(statement).toContain('"order-1"');
  expect(statement).toContain('"Apollo Super Speciality Checkup"');
  expect(statement).toContain('"45000"');
  expect(statement).not.toMatch(
    /sample|illustrative|available balance|tax invoice/i,
  );
});

test("enquiry validates required fields and saves only a local branded draft", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await page.goto("contact.html?vehicles=20&days=10&dailyPlays=50&type=Cabs");
  await page.getByRole("button", { name: "Save My Enquiry Draft" }).click();
  expect(
    await page
      .locator("#contact-name")
      .evaluate((node) => (node as HTMLInputElement).validity.valueMissing),
  ).toBe(true);
  await page.locator("#contact-name").fill("   ");
  await page.locator("#business-name").fill("Cafe");
  await page.locator("#work-email").fill("owner@example.com");
  await page.locator("#campaign-goal").selectOption("Introduce my business");
  await page.getByRole("button", { name: "Save My Enquiry Draft" }).click();
  await expect(page.locator("#enquiry-status")).toContainText(
    "not just spaces",
  );
  await page.locator("#contact-name").fill("Asha");
  await expect(page.locator("#preferred-format option")).toHaveCount(1);
  await page.locator("#campaign-message").fill("A local launch");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save My Enquiry Draft" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("Adrover-enquiry-draft.txt");
  const text = await downloadedText(download);
  expect(text).toContain("ADROVER / CAMPAIGN ENQUIRY DRAFT");
  expect(text).toContain("Name: Asha");
  expect(text).toContain("Interior screen format: Cabs");
  expect(text).toContain("10,000 estimated 30-second plays");
  expect(text).toContain("₹3,000 at ₹0.30 per play");
  expect(text).toContain("Nothing has been submitted or sent.");
  expect(text).not.toMatch(/\badrove\b/i);
  await expect(page.locator("#enquiry-status")).toContainText(
    "Nothing has been sent to Adrover.",
  );
  expect(submissions).toEqual([]);
});

test("repository landing URL and direct section anchors work", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator("#about")).toBeVisible();
  for (const [slug, id] of [
    ["index", "upload"],
    ["index", "testimonials"],
    ["index", "services"],
    ["pricing", "planner"],
    ["contact", "launch-notes"],
  ]) {
    await page.goto(`${slug}.html#${id}`);
    await expect(page.locator(`#${id}`)).toBeInViewport();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .toBeGreaterThan(0);
    await page.reload();
    await expect(page.locator(`#${id}`)).toBeInViewport();
  }
});

test("mobile navigation and 320px layout remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  for (const slug of pages) {
    const destination =
      slug === "view-ad" ? "view-ad.html?id=apollo-checkup" : `${slug}.html`;
    if (portalPages.has(slug)) {
      await signInDemo(page, destination);
    } else {
      await page.goto(destination);
    }
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page.goto("index.html");
  await page.getByLabel("Open navigation").click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Pricing" })
    .click();
  await expect(page.locator("#planner")).toBeVisible();
});
