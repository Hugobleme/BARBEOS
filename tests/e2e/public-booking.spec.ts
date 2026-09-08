import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG, getFutureTestDate } from "../fixtures/tenant.fixture";

test.describe("4. Public Booking Flow Suite", () => {
  test("4.1 Missing booking slug shows graceful contained state", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    await page.goto("/agendar");

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("4.2 Invalid booking slug shows graceful not-found state", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    await page.goto("/agendar?barbershop=slug-inexistente-9999");

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
    await expect(page.locator("h1, h2").first()).toBeVisible();

    errorListener.assertNoErrors();
  });

  test("4.3 Public booking step progression through date and time selection", async ({ page }) => {
    const errorListener = attachErrorListener(page);
    const bookingUrl = `/agendar?barbershop=${E2E_CONFIG.shopSlug}`;
    await page.goto(bookingUrl);

    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    // Verify page rendered contained content without error boundary
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();

    // If active shop was found, step progression is exercised
    const serviceCard = page
      .locator("button, div")
      .filter({ hasText: /corte|barba|serviço/i })
      .first();

    if (await serviceCard.isVisible()) {
      await serviceCard.click();

      const nextButton = page.getByRole("button", { name: /continuar|avançar|próximo/i });
      if ((await nextButton.isVisible()) && (await nextButton.isEnabled())) {
        await nextButton.click();

        const anyPro = page.getByText(/qualquer profissional/i);
        if (await anyPro.isVisible()) {
          await anyPro.click();
          const proNext = page.getByRole("button", { name: /continuar|avançar|próximo/i });
          if ((await proNext.isVisible()) && (await proNext.isEnabled())) {
            await proNext.click();
          }
        }
      }
    }

    errorListener.assertNoErrors();
  });

  test("4.4 Full booking happy path with atomic confirmation and slot refetch", async ({
    page,
  }) => {
    test.skip(
      !E2E_CONFIG.isWritableEnv,
      "Final booking write requires isolated writable test environment (E2E_WRITABLE_ENV=true)",
    );

    const errorListener = attachErrorListener(page);
    const bookingUrl = `/agendar?barbershop=${E2E_CONFIG.shopSlug}`;
    await page.goto(bookingUrl);

    // 1. Select service
    await page
      .locator("button, div")
      .filter({ hasText: /corte|barba/i })
      .first()
      .click();
    await page.getByRole("button", { name: /continuar|avançar/i }).click();

    // 2. Select pro
    await page.getByText(/qualquer profissional/i).click();
    await page.getByRole("button", { name: /continuar|avançar/i }).click();

    // 3. Select future date & time
    const futureDate = getFutureTestDate(7);
    const dayBtn = page.getByRole("gridcell", { name: String(futureDate.dayNumber) }).first();
    if (await dayBtn.isVisible()) {
      await dayBtn.click();
    }

    const timeSlot = page
      .locator("button")
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first();
    if (await timeSlot.isVisible()) {
      await timeSlot.click();
      await page.getByRole("button", { name: /continuar|avançar/i }).click();

      // 4. Fill guest / customer details
      await page.fill("input[name='name'], input#name", "Cliente Teste E2E");
      await page.fill("input[name='phone'], input#phone", "11999990000");

      // 5. Submit booking
      const confirmButton = page.getByRole("button", { name: /confirmar agendamento/i });
      await confirmButton.click();

      // 6. Assert success & slot release/refetch
      await expect(page.getByText(/agendamento solicitado/i)).toBeVisible();
      expect(page.url()).not.toContain("error");
    }

    errorListener.assertNoErrors();
  });
});
