import { test, expect } from "@playwright/test";

test.describe("BARBEOS Critical Routes Smoke Tests", () => {
  test("1. Valid booking URL does not crash", async ({ page }) => {
    // Assuming 'demo' or another slug is valid, but we just want to ensure the page mounts without crashing
    await page.goto("/b/demo");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();
  });

  test("2. Missing booking slug shows contained state", async ({ page }) => {
    // agendar without barbershop should show a guard or booking form — never the global error boundary
    await page.goto("/agendar");
    await expect(page.locator("body")).toBeVisible();
    // Must NOT show the global error boundary
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    // Should render either the no-slug guard or the booking form
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("3. Invalid booking slug shows contained state", async ({ page }) => {
    await page.goto("/agendar?barbershop=invalido-123456");
    await expect(page.locator("body")).toBeVisible();
    // Must NOT show the global error boundary
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    // Should render either the not-found guard or the booking form (loading state)
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("4. Public directory route renders", async ({ page }) => {
    await page.goto("/barbearias");
    await expect(page.locator("h1").first()).toBeVisible();
  });

  test("5. Login route renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("text=Entrar").first()).toBeVisible();
  });

  test("6. Admin route redirects or guards unauthenticated users", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForURL("**/login**");
    expect(page.url()).toContain("/login");
  });

  test("7. UTF-8 strings render correctly in a representative route", async ({ page }) => {
    await page.goto("/ajuda");
    // We expect properly encoded strings, check for some text that would break if encoding was bad
    // E.g. "Dúvidas frequentes" or something like that. We'll check body text for 'Ã'
    const bodyText = await page.locator("body").textContent();
    expect(bodyText).not.toContain("Ã£");
    expect(bodyText).not.toContain("Ã©");
  });
});
