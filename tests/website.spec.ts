import { expect, test, type Download, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { seedDemoSession } from "./demo-session";

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
    await expect(page.locator("header .logo")).toHaveText("adrover.");
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
  await expect(page.locator("#upload")).toContainText("Upload your video");
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
    "No campaign setup or video is needed",
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
  await page.getByRole("link", { name: "Start your campaign" }).click();
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
    expect(plannerBox!.height).toBeLessThan(450);
  } else {
    expect(plannerBox!.height).toBeLessThan(900);
  }
  await expect(page.locator("#total-cost")).toHaveText("\u20b9300");
  await expect(page.locator("#total-plays")).toHaveText("1,000");
  for (const value of ["", "0", "-1", "1.5"]) {
    await page.locator("#vehicle-count").fill(value);
    await expect(page.locator("#pricing-error")).toBeVisible();
    await expect(page.locator("#total-cost")).toHaveText("—");
    await expect(page.locator("#continue-enquiry")).toBeDisabled();
  }
  await page.locator("#vehicle-count").fill("12");
  for (const value of ["", "999", "1000.5", "9007199254740991"]) {
    await page.locator("#ad-count").fill(value);
    await expect(page.locator("#pricing-error")).toBeVisible();
    await expect(page.locator("#continue-enquiry")).toBeDisabled();
  }
  await page.locator("#ad-count").fill("2500");
  await page.getByRole("button", { name: "2 Weeks (14 days)" }).click();
  await expect(
    page.getByRole("button", { name: "2 Weeks (14 days)" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("#pricing-result")).toContainText("12");
  await expect(page.locator("#pricing-result")).toContainText(
    "2 Weeks (14 days)",
  );
  await expect(page.locator("#total-plays")).toHaveText("2,500");
  await expect(page.locator("#total-cost")).toHaveText("\u20b9750");
  await page.locator("#continue-enquiry").click();
  await expect(page).toHaveURL(
    /\/adrover-test\/contact\.html\?vehicles=12&ads=2500&weeks=2&type=Cabs/,
  );
  await expect(page.locator("#incoming-campaign")).toContainText(
    "12 cabs, 2 weeks (14 days)",
  );
  await expect(page.locator("#preferred-format")).toHaveValue("Cabs");
  await page.reload();
  await expect(page.locator("#incoming-campaign")).toContainText(
    "2,500 total ads",
  );
  await page.locator("#preferred-format").selectOption("Buses");
  await expect(page.locator("#incoming-campaign")).toContainText(
    "Updated format: Buses",
  );
  await expect(page.locator("#incoming-campaign")).toContainText("\u20b9750");
});

test("contact rejects malformed campaign links without blocking a new draft", async ({
  page,
}) => {
  for (const query of [
    "vehicles=1",
    "vehicles=-1&days=10&dailyPlays=50&type=Both",
    "vehicles=1&days=1&dailyPlays=1&type=Train",
  ]) {
    await page.goto(`contact.html?${query}`);
    await expect(page.locator("#incoming-error")).toContainText(
      "The campaign link could not be used",
    );
    await expect(page.locator("#incoming-campaign")).toBeHidden();
    await expect(page.locator("#preferred-format")).toHaveValue("Both");
    await expect(page.locator("#enquiry-form")).toBeVisible();
  }
  await page.goto("contact.html");
  await expect(page.locator("#incoming-error")).toBeHidden();
  await expect(page.locator("#incoming-campaign")).toBeHidden();
});

test("client login shows unavailable OTP delivery without granting access", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await page.goto("login.html");
  await expect(
    page.getByRole("heading", { name: "Welcome back" }),
  ).toBeVisible();
  await expect(page.locator("#login-phone")).toHaveAttribute(
    "autocomplete",
    "tel",
  );
  await expect(page.locator("#login-otp")).toHaveAttribute(
    "autocomplete",
    "one-time-code",
  );
  await page.locator("#login-phone").fill("+919876543210");
  await page.getByRole("button", { name: /Request OTP/ }).click();
  await expect(page).toHaveURL(/login\.html$/);
  await expect(page.locator(".login-status")).toContainText(
    "No OTP has been generated or sent",
  );
  expect(submissions).toEqual([]);
});

test("dashboard presents sample campaign metrics and responsive navigation", async ({
  page,
}) => {
  await signInDemo(page, "dashboard.html");
  await expect(page.locator("#overview h1")).toHaveText(
    "Welcome back, Advertiser",
  );
  await expect(page.locator(".dashboard-stat")).toHaveCount(4);
  await expect(page.locator(".plays-bar")).toHaveCount(14);
  await expect(page.locator(".dashboard-nav a")).toHaveText([
    "▦Dashboard",
    "▣My advertisements",
    "₹Payments & history",
    "○Profile",
  ]);
  await expect(
    page.locator('.dashboard-nav a[href="create-ad.html"]'),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Route distribution" }),
  ).toHaveCount(0);
  await expect(page.locator(".dashboard-table tbody tr")).toHaveCount(4);
  await expect(page.locator(".dashboard-table thead th")).toHaveText([
    "Ad name",
    "Submitted",
    "Status",
    "Total plays",
    "Details",
  ]);
  const rows = page.locator(".dashboard-table tbody tr");
  for (const row of await rows.all()) {
    const name = await row.locator("th strong").innerText();
    const details = row.getByRole("link", {
      name: `View details for ${name}`,
      exact: true,
    });
    await expect(details).toBeVisible();
    const destination = await details.getAttribute("href");
    await details.click();
    await expect(page).toHaveURL(new URL(destination!, page.url()).toString());
    await expect(page.locator("main h1")).toHaveText(name);
    await page.goBack();
  }
  await page.getByRole("link", { name: "Payments & history" }).click();
  await expect(page).toHaveURL(/payments\.html$/);
  await expect(page.locator(".billing-summary")).toBeVisible();
  await page.getByRole("link", { name: "Profile", exact: true }).click();
  await expect(page).toHaveURL(/profile\.html$/);
  await expect(page.locator(".profile-details-grid")).toContainText(
    "advertiser@example.com",
  );
  await expect(
    page.getByRole("link", { name: "Profile", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page.setViewportSize({ width: 320, height: 800 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("profile edits validate, save across refresh and cancel without saving", async ({
  page,
}) => {
  await signInDemo(page, "profile.html");
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Account name").fill("   ");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toContainText("not just spaces");
  await page.getByLabel("Account name").fill("Asha Rao");
  await page.getByLabel("Business name").fill("Sunrise Coffee");
  await page.getByLabel("Business email").fill("contact@sunrise.example");
  await page.getByLabel("Phone number").fill("+91 98765 43210");
  await page.getByLabel("Primary service area").fill("Hyderabad");
  await page.getByLabel("Advertiser type").fill("Local business");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("status")).toContainText("Profile saved");
  await expect(page.locator(".profile-identity h2")).toHaveText("Asha Rao");
  await page.reload();
  await expect(page.locator(".profile-details-grid")).toContainText(
    "Sunrise Coffee",
  );
  await expect(page.locator(".profile-details-grid")).toContainText(
    "contact@sunrise.example",
  );
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Business name").fill("Unsaved business");
  await page.getByRole("button", { name: /^Cancel/ }).click();
  await expect(page.locator(".profile-details-grid")).toContainText(
    "Sunrise Coffee",
  );
  await expect(page.locator(".profile-details-grid")).not.toContainText(
    "Unsaved business",
  );
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole("button", { name: "Edit profile" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("profile reports a browser storage write failure without losing edits", async ({
  page,
}) => {
  await signInDemo(page, "profile.html");
  await page.getByRole("button", { name: "Edit profile" }).click();
  await page.getByLabel("Account name").fill("Keep my changes");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Browser storage is unavailable.");
    };
  });
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Browser storage is unavailable.",
  );
  await expect(page.getByLabel("Account name")).toHaveValue("Keep my changes");
  await expect(page.getByRole("status")).not.toContainText("Profile saved");
});

test("advertisement list filters and searches sample campaigns", async ({
  page,
}) => {
  await signInDemo(page, "advertisements.html");
  await expect(page.locator(".ad-list-card")).toHaveCount(6);
  await page.getByRole("button", { name: /^Active/ }).click();
  await expect(page.locator(".ad-list-card")).toHaveCount(4);
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
  await expect(page.locator(".ad-list-card")).toHaveCount(6);
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

test("campaign status bar shows active, pending and completed schedules", async ({
  page,
}) => {
  await signInDemo(page, "view-ad.html?id=apollo-checkup");
  const statusBar = page.getByRole("region", {
    name: "Campaign status and days remaining",
  });
  const progress = page.getByRole("progressbar", {
    name: "Campaign days completed",
  });
  await expect(statusBar).toContainText("15 days remaining");
  await expect(statusBar).toContainText("Pending plays: 31,600");
  await expect(
    page
      .locator(".view-ad-meta > div")
      .filter({ has: page.getByText("Pending plays", { exact: true }) }),
  ).toContainText("31,600");
  await expect(progress).toHaveAttribute("value", "15");
  await expect(progress).toHaveAttribute("max", "30");
  await page.goto("view-ad.html?id=cyberfintech-launch");
  await expect(statusBar).toContainText("Pending approval");
  await expect(statusBar).toContainText("Pending plays: 50,000");
  await expect(
    page
      .locator(".view-ad-meta > div")
      .filter({ has: page.getByText("Pending plays", { exact: true }) }),
  ).toContainText("50,000");
  await expect(statusBar).toContainText("30 days requested");
  await expect(statusBar).toContainText("Your campaign has not started");
  await expect(progress).toHaveAttribute("value", "0");
  await page.goto("view-ad.html?id=deccan-living-expo");
  await expect(statusBar).toContainText("0 days remaining");
  await expect(statusBar).toContainText("Pending plays: 0");
  await expect(
    page
      .locator(".view-ad-meta > div")
      .filter({ has: page.getByText("Pending plays", { exact: true }) })
      .locator("dd"),
  ).toHaveText("0");
  await expect(statusBar).toContainText("Campaign completed");
  await expect(progress).toHaveAttribute("value", "17");
  await expect(progress).toHaveAttribute("max", "17");
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(statusBar).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("campaign details show overview without analytics and export a sample report", async ({
  page,
}) => {
  await signInDemo(page, "view-ad.html?id=apollo-checkup");
  await expect(page.locator("main h1")).toHaveText(
    "Apollo Super Speciality Checkup",
  );
  await expect(page.locator(".view-ad-top-grid")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Creative preview" }),
  ).toBeVisible();
  await expect(page.locator(".view-ad-stats")).toHaveCount(0);
  await expect(page.locator(".view-ad-summary-bars")).toHaveCount(0);
  for (const name of [
    "Daily ad plays",
    "Route coverage",
    "Cab-wise play telemetry",
  ]) {
    await expect(page.getByRole("heading", { name, exact: true })).toHaveCount(
      0,
    );
  }
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download report" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    "Adrover-apollo-checkup-sample-report.txt",
  );
  expect(await downloadedText(download)).toContain("Illustrative report only.");
  await page.goto("view-ad.html?id=invalid");
  await expect(page.locator("main h1")).toHaveText("Advertisement not found");
});

test("portal routes require a demo sign-in and exit clears the demo session", async ({
  page,
}) => {
  await page.goto("dashboard.html");
  await expect(page).toHaveURL(/login\.html\?next=/);
  await expect(page.locator("#login-phone")).toBeVisible();
  await seedDemoSession(page, "advertiser@example.com");
  await expect(page).toHaveURL(/dashboard\.html$/);
  await page.locator(".portal-exit").click();
  await expect(page).toHaveURL(/login\.html\?signedOut=1$/);
  await page.goto("dashboard.html");
  await expect(page).toHaveURL(/login\.html\?next=/);
});

test("create-ad flow previews a banner, selects the starter plan and saves a local review brief", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await signInDemo(page, "create-ad.html");
  await page.locator("#ad-name").fill("Spring opening campaign");
  await expect(page.getByLabel("Business or brand")).toHaveCount(0);
  await expect(page.getByLabel("Campaign objective")).toHaveCount(0);
  await expect(page.getByLabel("Preferred area")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Estimate your campaign" }),
  ).toHaveCount(0);
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
  await expect(page.getByText("10,000 plays · 7 days")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Submit ad for review/ }),
  ).toBeDisabled();
  await page.getByLabel("Select Starter plan").check();
  await expect(page.locator(".create-ad-mock-screen")).toContainText(
    "Spring opening campaign",
  );
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download brief" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    "Adrover-advertisement-review-brief.txt",
  );
  const text = await downloadedText(download);
  expect(text).toContain("Advertisement: Spring opening campaign");
  expect(text).toContain("Plan: 10,000 plays over 7 days");
  expect(text).toContain("Illustrative amount: ₹1,000");
  expect(text).toContain("Banner image: spring-banner.png");
  expect(text).toContain("LOCAL REVIEW BRIEF");
  await expect(page.locator(".create-ad-status")).toContainText(
    "Review brief downloaded",
  );
  await page.getByRole("button", { name: /Submit ad for review/ }).click();
  await expect(page).toHaveURL(/view-ad\.html\?id=/);
  await expect(page.locator("main h1")).toHaveText("Spring opening campaign");
  await expect(page.locator(".campaign-status")).toHaveText("Pending approval");
  await page.locator('.dashboard-nav a[href="advertisements.html"]').click();
  await expect(page.locator(".ad-list-card")).toHaveCount(7);
  await expect(page.locator(".ad-list-card").first()).toContainText(
    "Spring opening campaign",
  );
  await expect(page.locator(".ad-list-card").first()).toContainText("10,000");
  expect(submissions).toEqual([]);
});

test("billing page filters transactions and downloads only a sample statement", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await signInDemo(page, "payments.html");
  await expect(page.locator(".billing-summary .dashboard-stat")).toHaveCount(3);
  await expect(page.locator(".billing-table tbody tr")).toHaveCount(6);
  await page.getByLabel("Filter by transaction status").selectOption("Pending");
  await expect(page.locator(".billing-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".billing-table tbody")).toContainText(
    "Weekend Dining Special",
  );
  await page
    .getByLabel("Filter by transaction status")
    .selectOption("All transactions");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download statement" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(
    "Adrover-sample-billing-statement.txt",
  );
  expect(await downloadedText(download)).toContain(
    "No payment information or live account data is included.",
  );
  expect(submissions).toEqual([]);
});

test("enquiry validates required fields and saves only a local branded draft", async ({
  page,
}) => {
  const submissions: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") submissions.push(request.url());
  });
  await page.goto("contact.html?vehicles=20&ads=1000&weeks=1&type=Cabs");
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
  await page.locator("#preferred-format").selectOption("Buses");
  await page.locator("#campaign-message").fill("A local launch");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save My Enquiry Draft" }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("Adrover-enquiry-draft.txt");
  const text = await downloadedText(download);
  expect(text).toContain("ADROVER / CAMPAIGN ENQUIRY DRAFT");
  expect(text).toContain("Name: Asha");
  expect(text).toContain("Interior screen format: Buses");
  expect(text).toContain("1,000 total ads");
  expect(text).toContain("₹300 at INR 0.30/ad");
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
