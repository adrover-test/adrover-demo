import { expect, test, type Page } from "@playwright/test";
import { seedDemoSession } from "./demo-session";

async function signInAdmin(page: Page, destination = "admin.html") {
  await page.goto(`admin-login.html?next=${encodeURIComponent(destination)}`);
  await expect(page.getByLabel("Admin email")).toHaveAttribute(
    "placeholder",
    "admin@example.com",
  );
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
    "placeholder",
    "Enter your password",
  );
  await page.getByLabel("Admin email").fill("operations@example.com");
  await page
    .getByLabel("Password", { exact: true })
    .fill("admin-demo-password");
  await page.getByRole("button", { name: /Sign in to admin portal/ }).click();
  await expect(page).toHaveURL(new URL(destination, page.url()).toString());
}

test("admin access is separate from advertiser access and logout clears only admin", async ({
  page,
}) => {
  await page.goto("admin.html?section=cabs");
  await expect(page).toHaveURL(/admin-login\.html\?next=/);
  await seedDemoSession(page, "client@example.com");
  await expect(page).toHaveURL(/dashboard\.html$/);
  await page.goto("admin.html");
  await expect(page).toHaveURL(/admin-login\.html\?next=/);
  await signInAdmin(page, "admin.html?section=cabs");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Cabs & drivers", exact: true }),
  ).toBeVisible();
  await page.locator(".portal-exit").click();
  await page.goto("admin.html");
  await expect(page).toHaveURL(/admin-login\.html\?next=/);
  await page.goto("dashboard.html");
  await expect(page.locator("main h1")).toHaveText("Welcome back, Advertiser");
});

test("admin client views, enquiry search and driver directory work on small screens", async ({
  page,
}) => {
  await signInAdmin(page);
  await expect(page.locator(".dashboard-nav-icon")).toHaveCount(0);
  await expect(
    page
      .getByRole("navigation", { name: "Admin navigation" })
      .getByRole("link"),
  ).toHaveText([
    "Overview",
    "Clients",
    "Enquiries",
    "Cabs & drivers",
    "Ad approvals1",
  ]);
  await expect(page.locator(".dashboard-stat")).toHaveCount(7);
  await expect(
    page.locator(".admin-totals .dashboard-stat").nth(1),
  ).toContainText("1,48,250");
  await expect(
    page.getByRole("region", { name: "Dashboard charts" }),
  ).toBeVisible();
  await expect(page.locator(".admin-revenue-column")).toHaveCount(12);
  await expect(
    page.getByRole("heading", { name: "Monthly ad plays", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".admin-plays-column")).toHaveCount(12);
  await expect(page.locator(".admin-plays-panel")).toContainText(
    "Illustrative monthly history",
  );
  await expect(page.locator(".admin-monthly-plays")).toHaveAccessibleName(
    /^Monthly ad plays:/,
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.locator(".admin-monthly-plays .admin-revenue-bar").first(),
  ).toHaveCSS("animation-name", "none");
  await expect(page.locator(".admin-chart-legend")).toContainText(
    "Pending approval",
  );
  await expect(
    page.locator(".admin-totals .dashboard-stat").first(),
  ).toContainText("6");
  await expect(
    page.locator(".admin-totals .dashboard-stat").last(),
  ).toContainText("₹2,82,500");
  await expect(page.locator(".dashboard-stat").first()).toContainText("6");
  await page.getByRole("link", { name: "Clients", exact: true }).click();
  await page.getByLabel("Search clients").fill("Apollo");
  await expect(page.locator(".admin-clients-table tbody tr")).toHaveCount(1);
  await page.getByRole("link", { name: /View client/ }).click();
  await expect(page.locator("main h1")).toHaveText("Apollo Diagnostics");
  await page
    .getByRole("link", { name: "View ad Apollo Super Speciality Checkup" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Campaign overview" }),
  ).toBeVisible();
  await expect(page.locator("main h1")).toHaveCount(1);
  await page.getByRole("link", { name: "Enquiries", exact: true }).click();
  await page.getByLabel("Search enquiries").fill("Morning Coffee");
  await expect(page.locator(".admin-enquiries tbody tr")).toHaveCount(1);
  await expect(page.locator(".admin-enquiries")).toContainText(
    "cafe@example.com",
  );
  await page.getByLabel("Search enquiries").fill("no matching enquiry");
  await expect(page.getByText("No enquiries match your search.")).toBeVisible();
  await page.getByRole("link", { name: "Cabs & drivers", exact: true }).click();
  await expect(page.locator(".admin-table tbody tr")).toHaveCount(4);
  await page.getByLabel("Search cabs & drivers").fill("DEMO-TS-003");
  await expect(page.locator(".admin-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".admin-table tbody")).toContainText(
    "Sample Driver Sameer",
  );
  await expect(page.locator(".admin-table tbody")).toContainText(
    "+91 00000 00003",
  );
  await expect(page.locator(".admin-table tbody")).toContainText(
    "sameer@example.com",
  );
  await page
    .getByRole("link", { name: "View details for Sample Driver Sameer" })
    .click();
  await expect(page.locator("main h1")).toHaveText("Sample Driver Sameer");
  await expect(
    page.getByRole("region", { name: "Cab driver details" }),
  ).toContainText("DEMO-TS-003");
  await expect(page.locator(".view-ad-meta")).toContainText("+91 00000 00003");
  await expect(page.locator(".view-ad-meta")).toContainText(
    "sameer@example.com",
  );
  await page.reload();
  await expect(page.locator("main h1")).toHaveText("Sample Driver Sameer");
  await page.setViewportSize({ width: 320, height: 800 });
  for (const section of [
    "dashboard",
    "clients",
    "client&id=sample%3AApollo%20Diagnostics",
    "enquiries",
    "cabs",
    "cab&id=DEMO-CAB-03",
    "approvals",
    "ad&id=cyberfintech-launch",
  ]) {
    await page.goto(`admin.html?section=${section}`);
    await expect(page.locator("main h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("enquiry summary filters combine with search and update after follow-up", async ({
  page,
}) => {
  await signInAdmin(page, "admin.html?section=enquiries");
  const summary = page.getByRole("group", {
    name: "Filter enquiries by reply status",
  });
  const total = summary.getByRole("button", { name: /Total enquiries/ });
  const awaiting = summary.getByRole("button", { name: /Awaiting reply/ });
  const replied = summary.getByRole("button", { name: /^Replied/ });
  await expect(total).toHaveAttribute("aria-pressed", "true");
  await expect(total).toContainText("2");
  await expect(awaiting).toContainText("2");
  await expect(replied).toContainText("0");
  await replied.click();
  await expect(page.locator(".admin-enquiries tbody tr")).toHaveCount(0);
  await expect(
    page.getByText("No enquiries match the selected reply status and search."),
  ).toBeVisible();
  await awaiting.click();
  await page.getByLabel("Search enquiries").fill("Morning Coffee");
  const row = page.locator(".admin-enquiries tbody tr");
  await expect(row).toHaveCount(1);
  await expect(total).toContainText("2");
  await row.getByText("Notes & follow-up", { exact: true }).click();
  await row.getByLabel("Reply status", { exact: true }).selectOption("Replied");
  await row.getByRole("button", { name: /Save follow-up/ }).click();
  await expect(row).toHaveCount(0);
  await expect(awaiting).toContainText("1");
  await expect(replied).toContainText("1");
  await replied.click();
  await expect(row).toHaveCount(1);
  await page.getByLabel("Search enquiries").fill("no matching record");
  await expect(row).toHaveCount(0);
  await page.getByRole("button", { name: /Clear enquiry filters/ }).click();
  await expect(row).toHaveCount(2);
  await expect(page.getByLabel("Search enquiries")).toHaveValue("");
  await expect(total).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(replied).toContainText("1");
});

test("admin creates a driver with persistent directory details and updated cab count", async ({
  page,
}) => {
  await signInAdmin(page, "admin.html?section=cabs");
  await page.getByText("Create driver", { exact: true }).click();
  const form = page.getByRole("form", { name: "Create driver", exact: true });
  await form.getByLabel("Driver name").fill("Test Driver");
  await form.getByLabel("Vehicle number").fill("ts 09 ab 1234");
  await form.getByLabel("Vehicle model").fill("Maruti Dzire");
  await form.getByLabel("Driver phone").fill("+91 98765 43210");
  await form.getByLabel("Driver email").fill("driver@example.com");
  await form.getByLabel("Service area").fill("Hitec City");
  await form.getByLabel("Availability").selectOption("Maintenance");
  await form.getByRole("button", { name: /Save driver/ }).click();
  await expect(form.getByRole("status")).toHaveText(
    "Driver created and added to the directory.",
  );
  await expect(page.locator(".admin-table tbody tr")).toHaveCount(5);
  await page.getByLabel("Search cabs & drivers").fill("TS09AB1234");
  await expect(page.locator(".admin-table tbody tr")).toHaveCount(1);
  await expect(page.locator(".admin-table tbody")).toContainText("Maintenance");
  await page
    .getByRole("link", { name: "View details for Test Driver" })
    .click();
  await expect(page.locator("main h1")).toHaveText("Test Driver");
  await page.reload();
  await expect(page.locator(".view-ad-meta")).toContainText(
    "driver@example.com",
  );
  await page.goto("admin.html");
  await expect(
    page.locator(".dashboard-stat").filter({ hasText: "Cabs in directory" }),
  ).toContainText("5");
});

test("driver save failures keep entered details and do not add records", async ({
  page,
}) => {
  await signInAdmin(page, "admin.html?section=cabs");
  await page.getByText("Create driver", { exact: true }).click();
  const form = page.getByRole("form", { name: "Create driver", exact: true });
  await form.getByLabel("Driver name").fill("Unsaved Driver");
  await form.getByLabel("Vehicle number").fill("TS09AB9876");
  await form.getByLabel("Vehicle model").fill("Test car");
  await form.getByLabel("Driver phone").fill("+91 98765 43210");
  await form.getByLabel("Driver email").fill("unsaved@example.com");
  await form.getByLabel("Service area").fill("Hitec City");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "adrover-drivers")
        throw new Error("Driver storage unavailable");
      return original.call(this, key, value);
    };
  });
  await form.getByRole("button", { name: /Save driver/ }).click();
  await expect(form.getByRole("alert")).toHaveText(
    "Driver storage unavailable",
  );
  await expect(form.getByLabel("Driver name")).toHaveValue("Unsaved Driver");
  await expect(page.locator(".admin-table tbody tr")).toHaveCount(4);
});

test("admin graph filters update both charts with exact period counts and totals", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-11-05T12:00:00Z"));
  await signInAdmin(page);
  const filter = page.getByLabel("Graph period", { exact: true });
  for (const [range, count, label, total] of [
    ["yearly", 10, "Yearly", "1,48,250"],
    ["monthly", 12, "Monthly", "1,48,250"],
    ["weekly", 4, "Weekly", "1,37,250"],
    ["daily", 30, "Daily", "1,37,250"],
  ] as const) {
    await filter.selectOption(range);
    await expect(page.locator(".admin-plays-column")).toHaveCount(count);
    await expect(page.locator(".admin-revenue-column")).toHaveCount(count);
    await expect(
      page.getByRole("heading", { name: `${label} ad plays`, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: `${label} campaign revenue`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.locator(".admin-plays-panel .dashboard-panel-tag"),
    ).toHaveText(`${total} plays in period`);
    await expect(page.locator(".admin-monthly-plays")).toHaveAccessibleName(
      new RegExp(`^${label} ad plays:`),
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.locator(".admin-plays-column").first()).toContainText(
    "7 Oct",
  );
  await expect(page.locator(".admin-plays-column").last()).toContainText(
    "5 Nov",
  );
  await expect(page.locator(".admin-plays-column").last()).toContainText(
    "43,250",
  );
});

test("client campaign can be approved with plays and INR amount and stays unscheduled", async ({
  page,
}) => {
  const nonGetRequests: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") nonGetRequests.push(request.url());
  });
  await seedDemoSession(page, "new-client@example.com");
  await expect(page).toHaveURL(/dashboard\.html$/);
  await page.goto("create-ad.html");
  await page.getByLabel("Advertisement name").fill("Admin review journey");
  await page.locator("#ad-banner").setInputFiles({
    name: "admin-review.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/pysAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page.getByLabel("Select Starter plan").check();
  await page.getByRole("button", { name: /Submit ad for review/ }).click();
  await expect(page).toHaveURL(/view-ad\.html\?id=/);
  const clientAdUrl = page.url();
  const id = new URL(clientAdUrl).searchParams.get("id")!;

  await signInAdmin(page);
  await expect(page.locator(".dashboard-stat").first()).toContainText("7");
  await page.getByRole("link", { name: "Clients", exact: true }).click();
  await page.getByLabel("Search clients").fill("new-client@example.com");
  await page.getByRole("link", { name: /View client/ }).click();
  await expect(page.locator(".admin-table tbody")).toContainText(
    "Admin review journey",
  );
  await page
    .getByRole("link", { name: "View ad Admin review journey" })
    .click();
  await page.getByLabel("Assigned plays").fill("75000");
  await page.getByLabel("Total campaign amount").fill("18750.50");
  await page.locator(".admin-confirm input").check();
  await page.getByRole("button", { name: /Approve ad/ }).click();
  await expect(page.getByRole("status")).toContainText("Ad approved");
  await expect(page.locator(".view-ad-status-bar")).toContainText("Approved");
  await expect(page.locator(".view-ad-status-bar")).toContainText(
    "awaiting payment/scheduling",
  );
  await expect(page.locator(".view-ad-meta")).toContainText("75,000");
  await expect(page.locator(".view-ad-meta")).toContainText("18,750.5");
  await expect(page.locator(".view-ad-meta")).toContainText(
    "operations@example.com",
  );
  await expect(page.getByRole("button", { name: /Approve ad/ })).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".view-ad-status-bar .campaign-status")).toHaveText(
    "Approved",
  );
  await page.goto(clientAdUrl);
  await expect(page.locator(".view-ad-status-bar")).toContainText(
    "awaiting payment/scheduling",
  );
  await expect(page.getByRole("progressbar")).toHaveAttribute("value", "0");
  await expect(page.locator(".view-ad-meta")).toContainText("18,750.5");
  await page.goto("advertisements.html");
  await page.getByRole("button", { name: /^Approved/ }).click();
  await expect(page.locator(".ad-list-card")).toHaveCount(1);
  await expect(page.locator(".ad-list-card")).toContainText(
    "75,000 target plays",
  );
  await expect(page.locator(".ad-list-run-state")).not.toContainText("Active");
  await page.goto(`admin.html?section=ad&id=${id}`);
  await expect(page.locator(".view-ad-status-bar .campaign-status")).toHaveText(
    "Approved",
  );
  await page.goto("admin.html");
  await expect(
    page.locator(".admin-totals .dashboard-stat").first(),
  ).toContainText("7");
  await expect(
    page.locator(".admin-totals .dashboard-stat").last(),
  ).toContainText("₹2,82,500");
  expect(nonGetRequests).toEqual([]);
});

test("client info displays advertiser profile changes and separate sign-in email", async ({
  page,
}) => {
  await seedDemoSession(page, "profile-owner@example.com");
  await expect(page).toHaveURL(/dashboard\.html$/);
  await page.goto("profile.html");
  await page.getByRole("button", { name: /Edit profile/ }).click();
  await page.getByLabel("Account name").fill("Asha Rao");
  await page.getByLabel("Business name").fill("Sunrise Coffee");
  await page.getByLabel("Business email").fill("contact@sunrise.example");
  await page.getByLabel("Phone number").fill("+91 98765 43210");
  await page.getByLabel("Primary service area").fill("Madhapur");
  await page.getByLabel("Advertiser type").fill("Local business");
  await page.getByRole("button", { name: /Save changes/ }).click();
  await expect(page.getByRole("status")).toContainText("Profile saved");
  await signInAdmin(
    page,
    `admin.html?section=client&id=${encodeURIComponent("profile-owner@example.com")}`,
  );
  const profile = page.getByRole("region", { name: "Advertiser profile" });
  for (const value of [
    "Asha Rao",
    "Sunrise Coffee",
    "contact@sunrise.example",
    "+91 98765 43210",
    "Madhapur",
    "Local business",
    "profile-owner@example.com",
  ]) {
    await expect(profile).toContainText(value);
  }
  await page.reload();
  await expect(profile).toContainText("contact@sunrise.example");
});

test("approval validation and storage failures do not show false success", async ({
  page,
}) => {
  await signInAdmin(page, "admin.html?section=ad&id=cyberfintech-launch");
  await page.getByLabel("Assigned plays").fill("9007199254740992");
  await page.getByLabel("Total campaign amount").fill("12000");
  await page.locator(".admin-confirm input").check();
  await page.getByRole("button", { name: /Approve ad/ }).click();
  await expect(page.getByRole("alert")).toContainText("safe range");
  await page.getByLabel("Assigned plays").fill("50000");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Approval storage unavailable.");
    };
  });
  await page.getByRole("button", { name: /Approve ad/ }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Approval storage unavailable.",
  );
  await expect(page.locator(".view-ad-status-bar .campaign-status")).toHaveText(
    "Pending approval",
  );
  await expect(page.getByRole("status")).toHaveCount(0);
});

test("a demo enquiry is visible to admin without changing draft downloads", async ({
  page,
}) => {
  await page.goto("contact.html");
  await page.getByLabel("Your name").fill("Demo Enquirer");
  await page.getByLabel("Business name").fill("New enquiry business");
  await page.getByLabel("Work email").fill("enquiry@example.com");
  await page
    .getByLabel("Campaign objective")
    .selectOption("Introduce my business");
  await page
    .getByLabel("Anything we should know")
    .fill("Please discuss a campaign next month.");
  await page.getByRole("button", { name: /Save enquiry for admin/ }).click();
  await expect(page.locator("#enquiry-status")).toContainText("Enquiry saved");
  await signInAdmin(page, "admin.html?section=enquiries");
  await page.getByLabel("Search enquiries").fill("New enquiry business");
  await expect(page.locator(".admin-enquiries tbody tr")).toHaveCount(1);
  await expect(page.locator(".admin-enquiries")).toContainText(
    "Please discuss a campaign next month.",
  );
  await page.reload();
  await page.getByLabel("Search enquiries").fill("enquiry@example.com");
  await expect(page.locator(".admin-enquiries tbody tr")).toHaveCount(1);
});

test("enquiry reply status and attributed notes persist for another admin sign-in", async ({
  page,
}) => {
  await signInAdmin(page, "admin.html?section=enquiries");
  await page.getByLabel("Search enquiries").fill("Morning Coffee");
  const row = page.locator(".admin-enquiries tbody tr");
  await expect(row.locator(".enquiry-reply-status")).toHaveText(
    "Awaiting reply",
  );
  await row.locator("summary").click();
  await row.getByLabel("Reply status").selectOption("Replied");
  await row
    .getByLabel("Internal note")
    .fill("Called client. Send revised pricing tomorrow.");
  await row.getByRole("button", { name: /Save follow-up/ }).click();
  await expect(row.locator(".enquiry-replied")).toHaveText("Replied");
  await expect(row.locator(".enquiry-note-list")).toContainText(
    "operations@example.com",
  );
  await expect(row.locator(".enquiry-note-list")).toContainText(
    "Called client.",
  );
  await page.locator(".portal-exit").click();
  await page.goto("admin-login.html");
  await page.getByLabel("Admin email").fill("second-admin@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-password");
  await page.getByRole("button", { name: /Sign in to admin portal/ }).click();
  await expect(page).toHaveURL(/admin\.html$/);
  await page.goto("admin.html?section=enquiries");
  await page.getByLabel("Search enquiries").fill("Morning Coffee");
  await row.locator("summary").click();
  await expect(row.locator(".enquiry-note-list")).toContainText(
    "Called client.",
  );
  await row
    .getByLabel("Internal note")
    .fill("Sent revised quote. Waiting for confirmation.");
  await row.getByRole("button", { name: /Save follow-up/ }).click();
  await expect(row.locator(".enquiry-note-list li")).toHaveCount(2);
  await expect(row.locator(".enquiry-note-list")).toContainText(
    "second-admin@example.com",
  );
  await page.reload();
  await page.getByLabel("Search enquiries").fill("Morning Coffee");
  await row.locator("summary").click();
  await expect(row.locator(".enquiry-note-list li")).toHaveCount(2);
  await row.getByLabel("Reply status").selectOption("Awaiting reply");
  await row.getByRole("button", { name: /Save follow-up/ }).click();
  await expect(row.locator(".enquiry-awaiting")).toHaveText("Awaiting reply");
  await expect(row.locator(".enquiry-note-list li")).toHaveCount(2);
});

test("enquiry follow-up shows save errors and keeps the unsaved note", async ({
  page,
}) => {
  await signInAdmin(page, "admin.html?section=enquiries");
  await page.getByLabel("Search enquiries").fill("Morning Coffee");
  const row = page.locator(".admin-enquiries tbody tr");
  await row.locator("summary").click();
  await row.getByLabel("Internal note").fill("Do not lose this note.");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Notes storage unavailable.");
    };
  });
  await row.getByRole("button", { name: /Save follow-up/ }).click();
  await expect(row.getByRole("alert")).toHaveText("Notes storage unavailable.");
  await expect(row.getByLabel("Internal note")).toHaveValue(
    "Do not lose this note.",
  );
  await expect(row.locator(".enquiry-note-list li")).toHaveCount(0);
});

test("corrupt admin data is surfaced explicitly", async ({ page }) => {
  await signInAdmin(page);
  await page.evaluate(() =>
    localStorage.setItem("adrover-demo-approvals", '{"broken":true}'),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toHaveText(
    "Saved demo approvals could not be read.",
  );
  await expect(
    page.getByRole("button", { name: /Retry loading/ }),
  ).toBeVisible();
  await expect(page.locator(".dashboard-stat")).toHaveCount(0);
});
