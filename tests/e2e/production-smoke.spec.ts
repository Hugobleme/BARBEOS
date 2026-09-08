import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG } from "../fixtures/tenant.fixture";

/**
 * PRODUCTION READINESS SMOKE TEST SUITE (STRICTLY READ-ONLY)
 *
 * Requirements:
 * 1. Must require explicit E2E_BASE_URL.
 * 2. Must refuse to run if E2E_WRITABLE_ENV is enabled.
 * 3. Read-only and public route checks only.
 * 4. Never enters credentials or logs in with production owner accounts.
 * 5. Never creates appointments, customers, or mutations.
 * 6. Never submits the final booking confirmation.
 * 7. Ignores expected browser/analytics noise.
 * 8. Screenshots captured only on failure (configured in playwright.config.ts).
 * 9. Never stores PII in artifacts or reports.
 * 10. Optional & manually triggered in CI; skipped if E2E_BASE_URL is not set.
 */

const SMOKE_ERROR_OPTIONS = {
  allowedErrors: [
    /Minified React error #(418|423|425)/,
    /hydration/i,
    /favicon\.ico/,
    /analytics|gtm|segment/i,
  ],
};

test.describe("Production Readiness Smoke Suite (Non-Destructive)", () => {
  test.beforeAll(() => {
    // Safety check 1: Enforce zero-mutation guarantee
    if (process.env.E2E_WRITABLE_ENV === "true") {
      throw new Error(
        "CRITICAL SAFETY VIOLATION: Production smoke tests must NEVER run with E2E_WRITABLE_ENV=true. " +
          "Smoke testing is strictly read-only and non-destructive.",
      );
    }

    // Safety check 2: If explicitly executing via test:smoke:production, require explicit E2E_BASE_URL
    const targetUrl = process.env.E2E_BASE_URL?.trim();
    if (process.env.npm_lifecycle_event === "test:smoke:production" && !targetUrl) {
      throw new Error(
        "Missing required environment variable E2E_BASE_URL.\n" +
          "Usage: E2E_BASE_URL=https://barbeos.vercel.app npm run test:smoke:production",
      );
    }
  });

  test.beforeEach(async ({ page }) => {
    // If not invoked with E2E_BASE_URL during generic test runs, skip gracefully
    const targetUrl = process.env.E2E_BASE_URL?.trim();
    test.skip(
      !targetUrl,
      "Skipped: Production smoke test requires explicit E2E_BASE_URL (e.g. E2E_BASE_URL=https://your-domain.com)",
    );

    // Active network firewall: abort immediately if any test attempt triggers a write mutation
    page.on("request", (req) => {
      const method = req.method();
      if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
        const url = req.url();
        if (
          url.includes("/rpc/create_public_booking") ||
          url.includes("/rest/v1/appointments") ||
          url.includes("/rest/v1/customers")
        ) {
          throw new Error(
            `CRITICAL SAFETY VIOLATION: Write request detected during production smoke test: ${method} ${url}`,
          );
        }
      }
    });
  });

  test("1. Public Home (/) renders cleanly without error fallback", async ({ page }) => {
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);
    const response = await page.goto("/");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("2. Public Directory (/barbearias) renders directory content", async ({ page }) => {
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);
    const response = await page.goto("/barbearias");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("3. Public Services (/servicos) renders catalog without errors", async ({ page }) => {
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);
    const response = await page.goto("/servicos");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("4. Public Professionals (/profissionais) renders team list without errors", async ({
    page,
  }) => {
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);
    const response = await page.goto("/profissionais");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("5. Public Login (/login) renders auth form safely without logging in", async ({ page }) => {
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);
    const response = await page.goto("/login");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("input[type='email'], input#email")).toBeVisible();

    // Read-only guarantee: Do NOT input credentials or click submit
    errorListener.assertNoErrors();
  });

  test("6. Public Booking (/agendar) mounts contained shell without crashing", async ({ page }) => {
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);
    const targetUrl = `/agendar?barbershop=${E2E_CONFIG.shopSlug}`;
    const response = await page.goto(targetUrl);

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();

    // Read-only guarantee: Do NOT submit appointment reservation
    errorListener.assertNoErrors();
  });

  test("7. Unauthenticated Admin Guard (/admin) redirects safely to login", async ({ page }) => {
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);
    await page.goto("/admin");

    await page.waitForURL("**/login**", { timeout: 10000 }).catch(() => {});
    const currentUrl = page.url();
    const hasLogin = currentUrl.includes("/login");
    const hasLoginForm = await page.locator("input[type='email'], input#email").isVisible();

    expect(
      hasLogin || hasLoginForm,
      `Expected unauthenticated /admin to guard or redirect to /login, got ${currentUrl}`,
    ).toBeTruthy();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    errorListener.assertNoErrors();
  });

  test("8. Security & Zero-PII Audit: DOM contains no leaked credentials or stack traces", async ({
    page,
  }) => {
    await page.goto("/agendar");
    await page.waitForLoadState("domcontentloaded");

    const content = await page.content();
    expect(content).not.toContain("service_role");
    expect(content).not.toContain("db_secret");
    expect(content).not.toMatch(/Bearer\s+eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+/i);
    expect(content).not.toContain("ReferenceError: Label is not defined");
    expect(content).not.toContain(".tsx:");
  });

  test("9. Mobile Usability (390px viewport): Public route has no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errorListener = attachErrorListener(page, SMOKE_ERROR_OPTIONS);

    await page.goto("/login");
    await expect(page.locator("body")).toBeVisible();

    const isOverflowing = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 5;
    });
    expect(isOverflowing).toBeFalsy();

    errorListener.assertNoErrors();
  });
});
