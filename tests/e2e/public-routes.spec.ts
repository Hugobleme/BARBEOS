import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG } from "../fixtures/tenant.fixture";

test.describe("1. Public Routes Smoke Suite", () => {
  test("1.1 Home route (/) loads cleanly without error fallback", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    const response = await page.goto("/");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("1.2 Barbearias directory (/barbearias) renders directory content", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    const response = await page.goto("/barbearias");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("1.3 Servicos route (/servicos) loads successfully", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    const response = await page.goto("/servicos");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("1.4 Profissionais route (/profissionais) loads successfully", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    const response = await page.goto("/profissionais");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("1.5 Login route (/login) renders authentication form", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    const response = await page.goto("/login");

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("input[type='email'], input#email")).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("1.6 Public booking route (/agendar) renders contained state without crashing", async ({
    page,
  }) => {
    const errorListener = attachErrorListener(page);
    const response = await page.goto(`/agendar?barbershop=${E2E_CONFIG.shopSlug}`);

    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator("body")).toBeVisible();
    // Must NEVER show the global unhandled error boundary
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();

    errorListener.assertNoErrors();
  });
});
