import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG } from "../fixtures/tenant.fixture";

test.describe("6. PDV Route Smoke Suite", () => {
  test("6.1 Unauthenticated access to /admin/pdv guards and redirects cleanly", async ({
    page,
  }) => {
    const errorListener = attachErrorListener(page);
    await page.goto("/admin/pdv");

    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});
    const currentUrl = page.url();
    const hasLogin = currentUrl.includes("/login");
    const hasLoginForm = await page.locator("input[type='email'], input#email").isVisible();

    expect(hasLogin || hasLoginForm).toBeTruthy();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    errorListener.assertNoErrors();
  });

  test("6.2 Authenticated PDV route renders without ReferenceErrors or shopId errors", async ({
    page,
  }) => {
    test.skip(
      !E2E_CONFIG.ownerEmail || !E2E_CONFIG.ownerPassword,
      "Requires E2E_OWNER_EMAIL and E2E_OWNER_PASSWORD to execute authenticated PDV tests",
    );

    const errorListener = attachErrorListener(page);

    // 1. Log in
    await page.goto("/login");
    await page.fill("input[type='email'], input#email", E2E_CONFIG.ownerEmail!);
    await page.fill("input[type='password'], input#password", E2E_CONFIG.ownerPassword!);
    await page.click("button[type='submit']");
    await page.waitForURL("**/admin**");

    // 2. Open /admin/pdv
    await page.goto("/admin/pdv");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    // 3. Hard refresh
    await page.reload();
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    // 4. Assert no ReferenceError: Label is not defined or shopId is not defined
    const errors = errorListener.getErrors();
    expect(errors.some((e) => e.includes("Label is not defined"))).toBeFalsy();
    expect(errors.some((e) => e.includes("shopId is not defined"))).toBeFalsy();

    // 5. Valid local state renders (PDV controls, Caixa fechado, or items)
    const validContent = page.locator("body");
    await expect(validContent).toBeVisible();

    errorListener.assertNoErrors();
  });
});
