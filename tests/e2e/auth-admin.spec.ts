import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG } from "../fixtures/tenant.fixture";

test.describe("2. Auth and Admin Entry Suite", () => {
  test.describe("2.1 Unauthenticated Security Guards", () => {
    const protectedAdminRoutes = [
      "/admin",
      "/admin/agenda",
      "/admin/servicos",
      "/admin/profissionais",
      "/admin/horarios",
      "/admin/pdv",
    ];

    for (const route of protectedAdminRoutes) {
      test(`Unauthenticated navigation to ${route} guards or redirects to login`, async ({
        page,
      }) => {
        const errorListener = attachErrorListener(page);
        await page.goto(route);

        // Should redirect to login or stay contained
        await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});
        const currentUrl = page.url();
        const hasLogin = currentUrl.includes("/login");
        const hasLoginForm = await page.locator("input[type='email'], input#email").isVisible();

        expect(
          hasLogin || hasLoginForm,
          `Expected route ${route} to be protected by login guard, got ${currentUrl}`,
        ).toBeTruthy();

        // Must NEVER expose the global error boundary
        await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
        errorListener.assertNoErrors();
      });
    }
  });

  test.describe("2.2 Authenticated Owner Flow", () => {
    test("Owner can log in, access dashboard, hard refresh, and navigate admin modules", async ({
      page,
    }) => {
      // Guard: Requires isolated owner credentials
      test.skip(
        !E2E_CONFIG.ownerEmail || !E2E_CONFIG.ownerPassword,
        "Requires E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to execute authenticated admin tests",
      );

      const errorListener = attachErrorListener(page);

      // 1. Navigate to login
      await page.goto("/login");
      await page.fill("input[type='email'], input#email", E2E_CONFIG.ownerEmail!);
      await page.fill("input[type='password'], input#password", E2E_CONFIG.ownerPassword!);
      await page.click("button[type='submit']");

      // 2. Reaches authenticated area
      await page.waitForURL("**/admin**", { timeout: 15000 });
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

      // 3. Direct navigation to /admin
      await page.goto("/admin");
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

      // 4. Hard refresh on /admin
      await page.reload();
      await expect(page.locator("body")).toBeVisible();
      await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

      // 5. Check no 'shopId is not defined' or hydration errors
      const errors = errorListener.getErrors();
      expect(errors.some((e) => e.includes("shopId is not defined"))).toBeFalsy();
      expect(errors.some((e) => e.includes("Minified React error"))).toBeFalsy();

      // 6. Admin navigation visible
      const adminNav = page.locator("nav, [role='navigation'], aside");
      await expect(adminNav.first()).toBeVisible();

      // 7. Verify sub-routes render without error
      const adminSubRoutes = [
        "/admin/servicos",
        "/admin/profissionais",
        "/admin/horarios",
        "/admin/agenda",
        "/admin/pdv",
      ];

      for (const subRoute of adminSubRoutes) {
        await page.goto(subRoute);
        await expect(page.locator("body")).toBeVisible();
        await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
      }

      errorListener.assertNoErrors();
    });
  });
});
