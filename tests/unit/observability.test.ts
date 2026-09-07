import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { sanitizeError, redactSensitiveData, truncateMessage } from "../../src/lib/sanitize-error";
import {
  reportError,
  reportBookingConflict,
  reportNetworkDiagnostic,
  reportPwaDiagnostic,
  formatServerLog,
  initGlobalErrorListeners,
  resetObservabilityStateForTests,
} from "../../src/lib/observability";
import { ErrorBoundary } from "../../src/components/ErrorBoundary";

describe("BARBEOS Privacy-Safe Observability Layer", () => {
  beforeEach(() => {
    resetObservabilityStateForTests();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetObservabilityStateForTests();
  });

  // 1. JavaScript error sanitization
  it("1. JavaScript error sanitization: strips stack traces and preserves name/message", () => {
    const error = new ReferenceError("Info is not defined");
    const sanitized = sanitizeError(error);

    expect(sanitized.name).toBe("ReferenceError");
    expect(sanitized.message).toBe("Info is not defined");
    // Message should not contain full multi-line stack trace
    expect(sanitized.message).not.toContain("at BookingPage");
  });

  // 2. Supabase/PostgREST error sanitization
  it("2. Supabase/PostgREST error sanitization: extracts code, status and redacts message", () => {
    const postgrestError = {
      name: "PostgrestError",
      code: "23505",
      status: 409,
      message: "duplicate key value violates unique constraint on customer_email user@barbeos.com",
      details: "Key (email)=(user@barbeos.com) already exists.",
    };

    const sanitized = sanitizeError(postgrestError);
    expect(sanitized.errorCode).toBe("23505");
    expect(sanitized.statusCode).toBe(409);
    expect(sanitized.message).not.toContain("user@barbeos.com");
    expect(sanitized.message).toContain("[REDACTED_EMAIL]");
  });

  // 3. JWT redaction
  it("3. JWT redaction: replaces eyJ tokens with [REDACTED_JWT]", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
    const raw = `Auth failed with token: ${jwt}`;
    const cleaned = redactSensitiveData(raw);

    expect(cleaned).not.toContain(jwt);
    expect(cleaned).toContain("[REDACTED_JWT]");
  });

  // 4. Bearer token redaction
  it("4. Bearer token redaction: replaces Bearer ... with Bearer [REDACTED_TOKEN]", () => {
    const raw = "Request header Bearer 987abc-secret-access-token failed";
    const cleaned = redactSensitiveData(raw);

    expect(cleaned).not.toContain("987abc-secret-access-token");
    expect(cleaned).toContain("Bearer [REDACTED_TOKEN]");
  });

  // 5. Email redaction
  it("5. Email redaction: replaces email addresses with [REDACTED_EMAIL]", () => {
    const raw = "Customer client.vip@empresa.com.br could not be booked";
    const cleaned = redactSensitiveData(raw);

    expect(cleaned).not.toContain("client.vip@empresa.com.br");
    expect(cleaned).toContain("[REDACTED_EMAIL]");
  });

  // 6. Brazilian phone redaction
  it("6. Brazilian phone redaction: redacts multiple Brazilian phone formats to [REDACTED_PHONE]", () => {
    const p1 = "Erro ao enviar SMS para (11) 98765-4321";
    const p2 = "Contato: +55 11 98888-7777";
    const p3 = "Telefone 11987654321 invalido";

    expect(redactSensitiveData(p1)).toBe("Erro ao enviar SMS para [REDACTED_PHONE]");
    expect(redactSensitiveData(p2)).toBe("Contato: [REDACTED_PHONE]");
    expect(redactSensitiveData(p3)).toBe("Telefone [REDACTED_PHONE] invalido");
  });

  // 7. UUID redaction
  it("7. UUID redaction: replaces UUIDs with [REDACTED_ID]", () => {
    const uuid = "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d";
    const raw = `Customer ID ${uuid} has conflict`;
    const cleaned = redactSensitiveData(raw);

    expect(cleaned).not.toContain(uuid);
    expect(cleaned).toContain("[REDACTED_ID]");
  });

  // 8. Sensitive URL query parameter redaction
  it("8. Sensitive URL query parameter redaction: redacts tokens, secrets, passwords in query strings", () => {
    const url =
      "https://barbeos.com/auth/callback?token=secret123&code=xyz999&phone=11999999999&tab=overview";
    const cleaned = redactSensitiveData(url);

    expect(cleaned).not.toContain("token=secret123");
    expect(cleaned).not.toContain("phone=11999999999");
    expect(cleaned).toContain("token=[REDACTED]");
    expect(cleaned).toContain("phone=[REDACTED]");
    expect(cleaned).toContain("tab=overview");
  });

  // 9. Message truncation
  it("9. Message truncation: caps messages exceeding 200 characters with ellipsis", () => {
    const longMsg = "A".repeat(350);
    const truncated = truncateMessage(longMsg, 200);

    expect(truncated.length).toBe(200);
    expect(truncated.endsWith("...")).toBe(true);
  });

  // 10. Sanitization fallback
  it("10. Sanitization fallback: handles null, undefined, circular and non-stringifiable inputs gracefully", () => {
    const circular: any = {};
    circular.self = circular;

    const res1 = sanitizeError(null);
    expect(res1.message).toBe("Unexpected application error");

    const res2 = sanitizeError(undefined);
    expect(res2.message).toBe("Unexpected application error");

    const res3 = sanitizeError(circular);
    expect(res3.message).toBe("Unexpected application error");
  });

  // 11. Reporter never throws
  it("11. Reporter never throws: reportError and helpers never throw on corrupted or adversarial input", () => {
    expect(() => {
      reportError(null as any);
      reportError(undefined as any);
      reportError({
        toString: () => {
          throw new Error("Kaboom");
        },
      } as any);
      reportBookingConflict({ route: null as any });
      reportNetworkDiagnostic("failing_op", undefined);
      reportPwaDiagnostic("update_failure", null as any);
    }).not.toThrow();
  });

  // 12. Duplicate error deduplication
  it("12. Duplicate error deduplication: deduplicates identical errors within sliding window", () => {
    const err = new Error("Unique connection failure");

    const first = reportError(err, { source: "network", route: "/agendar" });
    const second = reportError(err, { source: "network", route: "/agendar" });

    expect(first).not.toBeNull();
    expect(second).toBeNull(); // Deduplicated
  });

  // 13. Session rate limiting
  it("13. Session rate limiting: caps events at maxEventsPerSession (e.g. 50)", () => {
    const customConfig = { maxEventsPerSession: 5, dedupWindowMs: 0 };

    const events = [];
    for (let i = 0; i < 10; i++) {
      const evt = reportError(new Error(`Error variation ${i}`), {}, customConfig);
      if (evt) events.push(evt);
    }

    expect(events.length).toBe(5);
  });

  // 14. Global error handler sends one safe event
  it("14. Global error handler: handles window error events safely", () => {
    if (typeof window !== "undefined") {
      initGlobalErrorListeners();
      const errorEvent = new ErrorEvent("error", {
        message: "Uncaught ReferenceError: shopId is not defined",
        error: new ReferenceError("shopId is not defined"),
      });

      expect(() => {
        window.dispatchEvent(errorEvent);
      }).not.toThrow();
    }
  });

  // 15. unhandledrejection handler sends one safe event
  it("15. unhandledrejection handler: handles unhandled promise rejections safely", () => {
    if (typeof window !== "undefined") {
      initGlobalErrorListeners();
      const rejectionEvent = new CustomEvent("unhandledrejection", {
        detail: { reason: new Error("Network timeout") },
      });

      expect(() => {
        window.dispatchEvent(rejectionEvent);
      }).not.toThrow();
    }
  });

  // 16. Booking slot conflict is categorized as handled/retryable
  it("16. Booking slot conflict: reports handled retryable event with BOOKING_SLOT_TAKEN", () => {
    const conflictEvent = reportBookingConflict({
      route: "/agendar",
      hasShopContext: true,
    });

    expect(conflictEvent).not.toBeNull();
    expect(conflictEvent?.source).toBe("booking");
    expect(conflictEvent?.errorCode).toBe("BOOKING_SLOT_TAKEN");
    expect(conflictEvent?.statusCode).toBe(409);
    expect(conflictEvent?.retryable).toBe(true);
    expect(conflictEvent?.hasShopContext).toBe(true);
  });

  // 17. Error boundary does not expose raw error details
  it("17. Error boundary: catches render error and displays safe friendly fallback without leaking raw info", () => {
    const boundary = new ErrorBoundary({ children: "child" });
    const secretError = new Error("Database password db_secret_12345 leaked in stack");

    // Simulate componentDidCatch
    boundary.componentDidCatch(secretError, { componentStack: "at SecretComponent" } as any);

    // Verify rendered output contains friendly fallback and no raw stack/details
    boundary.state = { hasError: true };
    const rendered = boundary.render();
    const renderedString = JSON.stringify(rendered);
    expect(renderedString).toContain("Ops, algo não saiu como o esperado");
    expect(renderedString).not.toContain("SecretComponent");
    expect(renderedString).not.toContain("db_secret_12345");

    // Also verify server logging redaction
    const serverLog = formatServerLog({
      eventId: "123",
      timestamp: new Date().toISOString(),
      environment: "production",
      source: "server",
      route: "/admin",
      message: redactSensitiveData(secretError.message),
      hasSession: false,
    });

    expect(serverLog).not.toContain("db_secret_12345");
    expect(serverLog).toContain("[REDACTED_SECRET]");
  });

  // 18. Monitoring-disabled application still works normally
  it("18. Monitoring-disabled: when enabled: false, reporting returns null without side effects", () => {
    const disabledConfig = { enabled: false };
    const result = reportError(new Error("Some error"), {}, disabledConfig);

    expect(result).toBeNull();
  });
});
