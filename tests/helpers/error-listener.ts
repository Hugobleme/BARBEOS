import { Page, expect } from "@playwright/test";

export interface ErrorListenerOptions {
  allowedErrors?: (string | RegExp)[];
}

/**
 * Attaches pageerror and console.error listeners to catch unexpected client-side exceptions.
 * Fails tests if any unhandled error, ReferenceError, TypeError or React ErrorBoundary occurs.
 */
export function attachErrorListener(page: Page, options: ErrorListenerOptions = {}) {
  const errors: string[] = [];
  const allowed = [
    // Ignore benign network response status messages logged by browser console
    /Failed to load resource: the server responded with a status of 40\d/,
    /Failed to load resource: net::ERR_/,
    /favicon\.ico/,
    /Minified React error #(418|423|425)/,
    /hydration/i,
    ...(options.allowedErrors || []),
  ];

  page.on("pageerror", (err) => {
    const message = err.message || String(err);
    const isAllowed = allowed.some((rule) =>
      typeof rule === "string" ? message.includes(rule) : rule.test(message),
    );
    if (!isAllowed) {
      errors.push(`[PAGE_ERROR] ${message}`);
    }
  });

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      const isAllowed = allowed.some((rule) =>
        typeof rule === "string" ? text.includes(rule) : rule.test(text),
      );
      if (!isAllowed) {
        errors.push(`[CONSOLE_ERROR] ${text}`);
      }
    }
  });

  return {
    getErrors: () => [...errors],
    assertNoErrors: () => {
      expect(errors, `Unexpected errors caught during test run:\n${errors.join("\n")}`).toEqual([]);
    },
    clearErrors: () => {
      errors.length = 0;
    },
  };
}
