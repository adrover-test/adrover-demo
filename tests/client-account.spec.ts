import { expect, test } from "@playwright/test";
import { seedDemoSession } from "./demo-session";

const profile = {
  id: "client-1",
  name: "Avery Client",
  email: "avery@example.com",
  phone: "+91 98765 43210",
  role: "Client",
  profilePictureUrl: null,
  vehicleNumber: null,
  isActive: true,
  createdAt: "2025-03-10T00:00:00Z",
};

function payment(index: number) {
  return {
    id: `payment-${index}`,
    orderId: `order-${index}`,
    paymentId: `pay-${index}`,
    amount: 1250 + index,
    currency: "INR",
    status: "Completed",
    paymentMethod: "UPI",
    createdAt: `2026-10-${String((index % 28) + 1).padStart(2, "0")}T10:00:00Z`,
    processedAt: "2026-10-10T10:01:00Z",
    advertisementId: "ad-1",
    advertisementName: `Campaign ${index}`,
  };
}

test("profile reads current account details and saves only the supported name field", async ({
  page,
}) => {
  let savedProfile = { ...profile };
  let updateBody: unknown;
  let profileReads = 0;
  await page.route("**/api/Users/me", async (route) => {
    if (route.request().method() === "GET") profileReads += 1;
    if (route.request().method() === "PUT") {
      updateBody = route.request().postDataJSON();
      savedProfile = {
        ...savedProfile,
        name: (updateBody as { name: string }).name,
      };
    }
    await route.fulfill({ json: { success: true, data: savedProfile } });
  });
  await seedDemoSession(page, profile.email, "profile.html");

  await expect(
    page.getByRole("heading", { name: "Your profile" }),
  ).toBeVisible();
  await expect(
    page.getByText(profile.name, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText(profile.email, { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(profile.phone, { exact: true })).toBeVisible();
  await expect(page.getByText("Business name", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Primary service area", { exact: true }),
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Edit name" }).click();
  await page.getByLabel("Account name").fill("Avery Updated");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByText("Avery Updated", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("status")).toContainText(
    "account name has been updated",
  );
  expect(updateBody).toEqual({ name: "Avery Updated" });

  await page.reload();
  await expect(
    page.getByText("Avery Updated", { exact: true }).first(),
  ).toBeVisible();
  expect(profileReads).toBe(2);
});

test("profile offers a friendly retry after the account details cannot be loaded", async ({
  page,
}) => {
  let shouldFail = true;
  await page.route("**/api/Users/me", async (route) => {
    if (shouldFail) {
      return route.fulfill({
        status: 503,
        json: { success: false, message: "Internal database failure" },
      });
    }
    return route.fulfill({ json: { success: true, data: profile } });
  });
  await seedDemoSession(page, profile.email, "profile.html");

  await expect(
    page.getByText("We couldn't load your profile. Please try again."),
  ).toBeVisible();
  await expect(page.getByText(/Internal database|API|HTTP/i)).toHaveCount(0);
  shouldFail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(
    page.getByText(profile.name, { exact: true }).first(),
  ).toBeVisible();
});

test("payments loads real paginated records and exports the visible records", async ({
  page,
}) => {
  const requestedPages: string[] = [];
  await page.addInitScript(() => {
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    Object.defineProperty(window, "__downloadedBlobText", {
      value: "",
      writable: true,
    });
    URL.createObjectURL = (object) => {
      if (object instanceof Blob) {
        void object.text().then((text) => {
          (
            window as Window & { __downloadedBlobText?: string }
          ).__downloadedBlobText = text;
        });
      }
      return originalCreateObjectURL(object);
    };
  });
  await page.route("**/api/Payments/history**", async (route) => {
    const url = new URL(route.request().url());
    const pageNumber = url.searchParams.get("pageNumber") ?? "1";
    requestedPages.push(pageNumber);
    const index = Number(pageNumber);
    const items =
      index === 1
        ? Array.from({ length: 10 }, (_, offset) => payment(offset + 1))
        : [payment(11)];
    await route.fulfill({
      json: {
        success: true,
        data: { items, total: 11, skip: (index - 1) * 10, take: 10 },
      },
    });
  });
  await seedDemoSession(page, profile.email, "payments.html");

  await expect(page.getByRole("heading", { name: "Payments" })).toBeVisible();
  await expect(page.getByText("pay-1", { exact: true })).toBeVisible();
  await expect(page.getByText("Showing 1–10 of 11 payments")).toBeVisible();
  await expect(
    page.getByText("Total amount paid", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Available balance", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("SAMPLE HISTORY", { exact: true })).toHaveCount(
    0,
  );

  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.getByText("pay-11", { exact: true })).toBeVisible();
  await expect(page.getByText("Showing 11–11 of 11 payments")).toBeVisible();
  expect(requestedPages).toEqual(["1", "2"]);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download this page" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "adrover-payment-history-page-2.csv",
  );
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __downloadedBlobText?: string })
            .__downloadedBlobText ?? "",
      ),
    )
    .toContain('"pay-11"');
  const exportedText = await page.evaluate(
    () =>
      (window as Window & { __downloadedBlobText?: string })
        .__downloadedBlobText ?? "",
  );
  expect(exportedText).toContain('"order-11"');
  expect(exportedText).toContain('"Campaign 11"');
  expect(exportedText).toContain('"1261"');
  expect(exportedText).not.toMatch(
    /sample|illustrative|available balance|tax invoice/i,
  );
});

test("payments shows an empty state and retries a failed history request", async ({
  page,
}) => {
  let shouldFail = true;
  await page.route("**/api/Payments/history**", async (route) => {
    if (shouldFail) {
      return route.fulfill({
        status: 503,
        json: { success: false, message: "Temporary service issue" },
      });
    }
    return route.fulfill({
      json: { success: true, data: { items: [], total: 0, skip: 0, take: 10 } },
    });
  });
  await seedDemoSession(page, profile.email, "payments.html");

  await expect(
    page.getByText("We couldn't load your payment history. Please try again."),
  ).toBeVisible();
  shouldFail = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("No payments to show yet.")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Download this page" }),
  ).toBeDisabled();
});
