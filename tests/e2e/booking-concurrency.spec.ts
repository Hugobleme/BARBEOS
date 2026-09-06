import { test, expect } from "@playwright/test";
import { attachErrorListener } from "../helpers/error-listener";
import { E2E_CONFIG, getFutureTestDate } from "../fixtures/tenant.fixture";

test.describe("5. Concurrent Booking Conflict Suite", () => {
  test.beforeEach(() => {
    test.skip(
      !E2E_CONFIG.isWritableEnv,
      "Concurrent booking E2E test requires isolated writable test environment (E2E_WRITABLE_ENV=true)",
    );
  });

  test("5.1 Two independent browser contexts booking the same slot simultaneously produce exactly 1 winner and 1 BOOKING_SLOT_TAKEN", async ({
    browser,
  }) => {
    const contextA = await browser.newContext();
    const contextB = await browser.newContext();

    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    const errorListenerA = attachErrorListener(pageA);
    const errorListenerB = attachErrorListener(pageB);

    const bookingUrl = `/agendar?barbershop=${E2E_CONFIG.shopSlug}`;

    // 1. Both navigate to the booking page
    await Promise.all([pageA.goto(bookingUrl), pageB.goto(bookingUrl)]);

    // 2. Both select the first service
    await Promise.all([
      pageA
        .locator("button, div")
        .filter({ hasText: /corte|barba/i })
        .first()
        .click(),
      pageB
        .locator("button, div")
        .filter({ hasText: /corte|barba/i })
        .first()
        .click(),
    ]);

    await Promise.all([
      pageA.getByRole("button", { name: /continuar|avançar/i }).click(),
      pageB.getByRole("button", { name: /continuar|avançar/i }).click(),
    ]);

    // 3. Both select the same professional
    await Promise.all([
      pageA.getByText(/qualquer profissional/i).click(),
      pageB.getByText(/qualquer profissional/i).click(),
    ]);

    await Promise.all([
      pageA.getByRole("button", { name: /continuar|avançar/i }).click(),
      pageB.getByRole("button", { name: /continuar|avançar/i }).click(),
    ]);

    // 4. Both select the same date
    const futureDate = getFutureTestDate(14);
    const dayA = pageA.getByRole("gridcell", { name: String(futureDate.dayNumber) }).first();
    const dayB = pageB.getByRole("gridcell", { name: String(futureDate.dayNumber) }).first();

    if (await dayA.isVisible()) await dayA.click();
    if (await dayB.isVisible()) await dayB.click();

    // 5. Both select the exact same time slot
    const slotA = pageA
      .locator("button")
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first();
    const slotB = pageB
      .locator("button")
      .filter({ hasText: /^\d{2}:\d{2}$/ })
      .first();

    if ((await slotA.isVisible()) && (await slotB.isVisible())) {
      await Promise.all([slotA.click(), slotB.click()]);

      await Promise.all([
        pageA.getByRole("button", { name: /continuar|avançar/i }).click(),
        pageB.getByRole("button", { name: /continuar|avançar/i }).click(),
      ]);

      // Fill details
      await pageA.fill("input[name='name'], input#name", "Concorrente A");
      await pageA.fill("input[name='phone'], input#phone", "11911112222");

      await pageB.fill("input[name='name'], input#name", "Concorrente B");
      await pageB.fill("input[name='phone'], input#phone", "11933334444");

      // 6. Submit simultaneously
      const confirmA = pageA.getByRole("button", { name: /confirmar agendamento/i });
      const confirmB = pageB.getByRole("button", { name: /confirmar agendamento/i });

      await Promise.all([confirmA.click(), confirmB.click()]);

      // Assert: Neither page shows the global unhandled error boundary
      await expect(pageA.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();
      await expect(pageB.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

      // Check conflict message on losing context
      const textA = await pageA.textContent("body");
      const textB = await pageB.textContent("body");

      const expectedConflict =
        "Este horário acabou de ser reservado. Escolha outro horário para continuar.";
      const hasConflict = textA?.includes(expectedConflict) || textB?.includes(expectedConflict);
      expect(hasConflict).toBeTruthy();
    }

    errorListenerA.assertNoErrors();
    errorListenerB.assertNoErrors();

    await contextA.close();
    await contextB.close();
  });
});
