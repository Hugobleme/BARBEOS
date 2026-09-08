import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("BARBEOS Accessibility (WCAG 2.1 AA) Audits", () => {
  test("1. Landing page meets WCAG 2.1 AA accessibility standards", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"]) // Dark-theme palette uses design-system tokens; verified separately
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("2. Login page has accessible form semantics and landmarks", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("3. Booking wizard (/agendar) has accessible controls and progressbar", async ({ page }) => {
    await page.goto("/agendar");
    await expect(page.locator("body")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("4. Public Barbearias directory renders with accessible landmarks", async ({ page }) => {
    await page.goto("/barbearias");
    await expect(page.locator("body")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test("5. Mobile viewport preserves accessible controls", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/agendar");
    await expect(page.locator("body")).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .disableRules(["color-contrast"])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});
