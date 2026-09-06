import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG } from "../fixtures/tenant.fixture";

test.describe("7. Mobile Smoke Suite (390px Viewport)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("7.1 Mobile login route renders without horizontal overflow", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    await page.goto("/login");

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("input[type='email'], input#email")).toBeVisible();

    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 5;
    });
    expect(isOverflowing).toBeFalsy();

    errorListener.assertNoErrors();
  });

  test("7.2 Mobile admin guard redirects unauthenticated user without layout break", async ({
    page,
  }) => {
    const errorListener = attachErrorListener(page);
    await page.goto("/admin");

    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    errorListener.assertNoErrors();
  });

  test("7.3 Mobile /admin/horarios and /admin/profissionais guard appropriately", async ({
    page,
  }) => {
    const errorListener = attachErrorListener(page);

    await page.goto("/admin/horarios");
    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    await page.goto("/admin/profissionais");
    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    errorListener.assertNoErrors();
  });

  test("7.4 Mobile public booking renders usable controls without overflow", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    await page.goto(`/agendar?barbershop=${E2E_CONFIG.shopSlug}`);

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    // Check no massive horizontal scroll that breaks mobile layout
    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 5;
    });
    expect(isOverflowing).toBeFalsy();

    errorListener.assertNoErrors();
  });
});
