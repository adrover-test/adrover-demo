import { expect, test } from "@playwright/test";

test("home spacing keeps callback, services and footer aligned at desktop and narrow widths", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("index.html");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => {
      const bounds = (selector: string) => {
        const box = document.querySelector(selector)!.getBoundingClientRect();
        return {
          x: box.x,
          right: box.right,
          y: box.y,
          bottom: box.bottom,
          height: box.height,
        };
      };
      return {
        cta: bounds(".upload-cta"),
        button: bounds(".upload-cta > .button"),
        disclaimer: bounds(".upload-disclaimer"),
        services: bounds(".service-strip"),
        testimonialPadding: parseFloat(
          getComputedStyle(document.querySelector(".testimonials-section")!)
            .paddingTop,
        ),
        links: Array.from(
          document.querySelectorAll(".landing-footer .footer-links a"),
        ).map((link) => link.getBoundingClientRect().height),
        overflow: document.documentElement.scrollWidth > innerWidth,
      };
    });
    expect(layout.overflow).toBe(false);
    expect(layout.button.right).toBeLessThanOrEqual(layout.cta.right);
    expect(layout.button.bottom).toBeLessThanOrEqual(layout.cta.bottom);
    expect(layout.disclaimer.y - layout.cta.bottom).toBeCloseTo(14);
    expect(layout.services.y - layout.disclaimer.bottom).toBeCloseTo(28);
    expect(layout.testimonialPadding).toBeLessThanOrEqual(88);
    expect(layout.links.every((height) => height >= 44)).toBe(true);
  }
});
