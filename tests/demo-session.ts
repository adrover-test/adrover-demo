import type { Page } from "@playwright/test";

export async function seedDemoSession(
  page: Page,
  email: string,
  destination = "dashboard.html",
) {
  await page.goto("login.html");
  await page.evaluate((identity) => {
    sessionStorage.setItem(
      "adrover-demo-session",
      JSON.stringify({ email: identity }),
    );
    const clients = JSON.parse(
      localStorage.getItem("adrover-demo-clients") ?? "[]",
    ) as string[];
    if (!clients.includes(identity)) {
      localStorage.setItem(
        "adrover-demo-clients",
        JSON.stringify([...clients, identity]),
      );
    }
  }, email);
  await page.goto(destination);
}
