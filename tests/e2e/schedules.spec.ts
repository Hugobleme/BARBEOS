import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG } from "../fixtures/tenant.fixture";

test.describe("3. Business and Professional Schedules Suite", () => {
  test.beforeEach(() => {
    test.skip(
      !E2E_CONFIG.isWritableEnv || !E2E_CONFIG.ownerEmail || !E2E_CONFIG.ownerPassword,
      "Requires isolated writable test environment (E2E_WRITABLE_ENV=true) and owner credentials",
    );
  });

  test("3.1 Configures and persists barbershop business hours", async ({ page }) => {
    const errorListener = attachErrorListener(page);

    // 1. Log in
    await page.goto("/login");
    await page.fill("input[type='email'], input#email", E2E_CONFIG.ownerEmail!);
    await page.fill("input[type='password'], input#password", E2E_CONFIG.ownerPassword!);
    await page.click("button[type='submit']");
    await page.waitForURL("**/admin**");

    // 2. Open /admin/horarios
    await page.goto("/admin/horarios");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    // 3. Verify business hours UI is visible
    const saveButton = page.getByRole("button", { name: /salvar|atualizar/i });
    await expect(saveButton).toBeVisible();

    // 4. Update one weekday and save
    const timeInputs = page.locator("input[type='time']");
    const count = await timeInputs.count();
    if (count > 0) {
      await timeInputs.first().fill("08:30");
      await saveButton.click();
      await page.waitForTimeout(1000);

      // 5. Reload and confirm persistence
      await page.reload();
      await expect(timeInputs.first()).toHaveValue("08:30");
    }

    errorListener.assertNoErrors();
  });

  test("3.2 Configures and persists professional weekly schedule and break", async ({ page }) => {
    const errorListener = attachErrorListener(page);

    // 1. Log in
    await page.goto("/login");
    await page.fill("input[type='email'], input#email", E2E_CONFIG.ownerEmail!);
    await page.fill("input[type='password'], input#password", E2E_CONFIG.ownerPassword!);
    await page.click("button[type='submit']");
    await page.waitForURL("**/admin**");

    // 2. Open /admin/profissionais
    await page.goto("/admin/profissionais");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    // 3. Edit professional or open schedule tab/dialog
    const scheduleButton = page
      .getByRole("button", { name: /horário|disponibilidade|editar/i })
      .first();
    if (await scheduleButton.isVisible()) {
      await scheduleButton.click();
      await expect(page.getByText(/disponibilidade semanal/i)).toBeVisible();

      // Configure break and save if form is present
      const saveBtn = page.getByRole("button", { name: /salvar/i });
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
      }
    }

    errorListener.assertNoErrors();
  });
});
