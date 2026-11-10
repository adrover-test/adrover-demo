import { expect, test } from "@playwright/test";

test("home assistant answers estimate questions and links to the planner", async ({
  page,
}) => {
  await page.goto("index.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Chat with Adrover" }).click();

  const chat = page.getByRole("log", { name: "Chat messages" });
  await expect(
    page.getByRole("heading", { name: "Adrover assistant" }),
  ).toBeVisible();
  const estimatePrompt = page.getByRole("button", {
    name: "How much does a campaign cost?",
  });
  await estimatePrompt.focus();
  await estimatePrompt.press("Enter");
  await expect(chat).toContainText("10,000 plays");
  await expect(chat).toContainText("₹3,000");
  await expect(
    chat.getByRole("link", { name: /Open campaign planner/ }),
  ).toHaveAttribute("href", "pricing.html#planner");
});

test("home assistant handles contact questions without promising to send enquiries", async ({
  page,
}) => {
  await page.goto("index.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Chat with Adrover" }).click();
  const contactPrompt = page.getByRole("button", {
    name: "How can I get in touch?",
  });
  await contactPrompt.focus();
  await contactPrompt.press("Enter");

  const chat = page.getByRole("log", { name: "Chat messages" });
  await expect(chat).toContainText("pending verification");
  await expect(chat).toContainText("does not send a message");

  const question = page.getByRole("textbox", { name: "Ask a question" });
  await question.fill("Can I contact you for a callback?");
  await question.press("Enter");

  await expect(
    chat.getByRole("link", { name: /View contact options/ }).last(),
  ).toHaveAttribute("href", "contact.html");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Chat with Adrover" }),
  ).toBeFocused();
});

test("home assistant fits mobile screens and appears on public pages", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("index.html", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Chat with Adrover" }).click();
  await expect(
    page.getByRole("textbox", { name: "Ask a question" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);

  for (const route of [
    "faq.html",
    "pricing.html",
    "register.html",
    "contact.html",
    "login.html",
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "Chat with Adrover" }),
    ).toBeVisible();
  }

  await page.goto("admin-login.html", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", { name: "Chat with Adrover" }),
  ).toHaveCount(0);
});
