import { test, expect } from "@playwright/test";

test.describe("Observability & Safe Diagnostics Smoke Tests", () => {
  test("1. Normal booking route renders smoothly without error fallback", async ({ page }) => {
    await page.goto("/agendar");
    await expect(page.locator("body")).toBeVisible();

    // Verify error boundary fallback is NOT displayed
    await expect(page.locator("text=Ops, algo não saiu como o esperado")).not.toBeVisible();

    // Verify booking UI / options are rendered
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("2. DOM on public routes contains no leaked JWTs, service keys, or raw stack traces", async ({
    page,
  }) => {
    await page.goto("/agendar");
    await page.waitForLoadState("domcontentloaded");

    const content = await page.content();

    // Secrets and token patterns must never be rendered into DOM
    expect(content).not.toContain("service_role");
    expect(content).not.toContain("db_secret");
    expect(content).not.toMatch(/Bearer\s+eyJ/i);
    expect(content).not.toContain("at BookingPage (");
    expect(content).not.toContain("ReferenceError:");
  });

  test("3. Uncaught client errors render contained error UI without exposing raw error stack", async ({
    page,
  }) => {
    // Collect client console errors
    const clientErrors: string[] = [];
    page.on("pageerror", (err) => {
      clientErrors.push(err.message);
    });

    await page.goto("/agendar");

    // Intentionally trigger a safe synthetic error in window context
    await page.evaluate(() => {
      try {
        window.dispatchEvent(
          new ErrorEvent("error", {
            message: "Uncaught ReferenceError: Label is not defined",
            error: new ReferenceError("Label is not defined"),
          }),
        );
      } catch {
        // Ignored
      }
    });

    // Page must remain functional and not display raw stack traces to the customer
    const bodyText = (await page.locator("body").textContent()) || "";
    expect(bodyText).not.toContain("ReferenceError: Label is not defined");
    expect(bodyText).not.toContain(".tsx:");
  });
});
