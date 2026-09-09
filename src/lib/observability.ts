/**
 * BARBEOS Privacy-Safe Observability & Diagnostics Layer
 *
 * Captures, sanitizes, deduplicates, and logs client and server errors
 * without collecting or leaking any personal customer or security data.
 */

import { sanitizeError, redactSensitiveData, truncateMessage } from "./sanitize-error";

export type ErrorSource = "ui" | "router" | "network" | "booking" | "pwa" | "server";

export interface SafeErrorEvent {
  eventId: string;
  timestamp: string;
  environment: "development" | "production" | "test";
  source: ErrorSource;
  route: string;
  message: string;
  errorName?: string;
  errorCode?: string;
  statusCode?: number;
  operation?: string;
  release?: string;
  userRole?: "anonymous" | "customer" | "professional" | "receptionist" | "owner";
  hasSession: boolean;
  hasShopContext?: boolean;
  retryable?: boolean;
}

export interface ObservabilityConfig {
  maxEventsPerSession?: number;
  dedupWindowMs?: number;
  sinkEndpoint?: string;
  enabled?: boolean;
}

// In-memory state (ephemeral, non-identifying)
const recentFingerprints = new Map<string, number>();
let eventCountInSession = 0;
let globalListenersRegistered = false;

const DEFAULT_CONFIG: ObservabilityConfig = {
  maxEventsPerSession: 50,
  dedupWindowMs: 5000,
  enabled: true,
};

function getEnvironment(): "development" | "production" | "test" {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "test") return "test";
  if (typeof import.meta !== "undefined" && import.meta.env?.DEV) return "development";
  return "production";
}

function getAppRelease(): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_APP_RELEASE) {
    return String(import.meta.env.VITE_APP_RELEASE).trim();
  }
  if (typeof process !== "undefined" && process.env.VITE_APP_RELEASE) {
    return String(process.env.VITE_APP_RELEASE).trim();
  }
  return undefined;
}

function getSinkEndpoint(): string | undefined {
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_OBSERVABILITY_ENDPOINT) {
    return String(import.meta.env.VITE_OBSERVABILITY_ENDPOINT).trim();
  }
  if (typeof process !== "undefined" && process.env.VITE_OBSERVABILITY_ENDPOINT) {
    return String(process.env.VITE_OBSERVABILITY_ENDPOINT).trim();
  }
  return undefined;
}

function getSafeRoute(route?: string): string {
  if (route && typeof route === "string") {
    // Strip query parameters and sensitive tokens
    const clean = route.split("?")[0].split("#")[0];
    return truncateMessage(clean, 100);
  }
  if (typeof window !== "undefined" && window.location) {
    return truncateMessage(window.location.pathname, 100);
  }
  return "/";
}

function generateEphemeralEventId(): string {
  return "evt_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function isDuplicate(fingerprint: string, windowMs = 5000): boolean {
  const now = Date.now();
  const lastSeen = recentFingerprints.get(fingerprint);

  if (lastSeen && now - lastSeen < windowMs) {
    return true;
  }

  recentFingerprints.set(fingerprint, now);

  // Clean old entries periodically
  if (recentFingerprints.size > 200) {
    for (const [fp, time] of recentFingerprints.entries()) {
      if (now - time > windowMs * 2) {
        recentFingerprints.delete(fp);
      }
    }
  }

  return false;
}

/**
 * Dispatches a sanitized event to the optional external sink (if configured).
 * Operates strictly non-blocking and fails completely silently.
 */
async function sendToSink(event: SafeErrorEvent, endpoint?: string): Promise<void> {
  const target = endpoint || getSinkEndpoint();
  if (!target) return;

  try {
    const payload = JSON.stringify(event);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(target, blob);
    } else if (typeof fetch === "function") {
      fetch(target, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Never throw or block from sink dispatch
  }
}

/**
 * Formats a single-line JSON log for server runtimes.
 */
export function formatServerLog(event: SafeErrorEvent): string {
  try {
    return JSON.stringify({
      timestamp: event.timestamp,
      source: event.source,
      operation: event.operation || "server_request",
      route: event.route,
      message: event.message,
      status: event.statusCode || 500,
      code: event.errorCode,
    });
  } catch {
    return `{"timestamp":"${event.timestamp}","source":"server","message":"Unexpected application error","status":500}`;
  }
}

/**
 * Core error reporting function.
 */
export function reportError(
  error: unknown,
  context: Partial<SafeErrorEvent> = {},
  config: ObservabilityConfig = DEFAULT_CONFIG,
): SafeErrorEvent | null {
  try {
    if (config.enabled === false) return null;

    // Rate limiting
    const maxEvents = config.maxEventsPerSession ?? DEFAULT_CONFIG.maxEventsPerSession!;
    if (eventCountInSession >= maxEvents) {
      return null;
    }

    const sanitized = sanitizeError(error);
    const source: ErrorSource = context.source || "ui";
    const route = getSafeRoute(context.route);
    const errorCode = context.errorCode || sanitized.errorCode;
    const statusCode = context.statusCode || sanitized.statusCode;

    // Deduplication check
    const dedupWindow = config.dedupWindowMs ?? DEFAULT_CONFIG.dedupWindowMs!;
    const fingerprint = `${source}:${route}:${errorCode || ""}:${sanitized.name}:${sanitized.message}`;
    if (isDuplicate(fingerprint, dedupWindow)) {
      return null;
    }

    eventCountInSession++;

    const event: SafeErrorEvent = {
      eventId: generateEphemeralEventId(),
      timestamp: new Date().toISOString(),
      environment: getEnvironment(),
      source,
      route,
      message: sanitized.message,
      errorName: sanitized.name,
      errorCode,
      statusCode,
      operation: context.operation ? truncateMessage(context.operation, 50) : undefined,
      release: getAppRelease(),
      userRole: context.userRole,
      hasSession: Boolean(context.hasSession),
      hasShopContext: context.hasShopContext,
      retryable: context.retryable,
    };

    // Development diagnostic console logging
    if (event.environment === "development" && typeof console !== "undefined") {
      console.warn(
        `[barbeos-observability] [${event.source.toUpperCase()}] ${event.operation ? `(${event.operation}) ` : ""}${event.message}`,
        {
          code: event.errorCode,
          status: event.statusCode,
          route: event.route,
          retryable: event.retryable,
        },
      );
    }

    // Server-side structured logging
    if (typeof window === "undefined" && event.source === "server") {
      console.error(formatServerLog(event));
    }

    // Dispatch to optional sink asynchronously
    sendToSink(event, config.sinkEndpoint);

    return event;
  } catch {
    // Fail-safe: Reporter must never throw or disrupt application runtime
    return null;
  }
}

/**
 * Reports booking-specific diagnostic events (e.g. concurrent slot conflicts).
 */
export function reportBookingConflict(
  context: Partial<SafeErrorEvent> = {},
): SafeErrorEvent | null {
  return reportError(
    new Error("BOOKING_SLOT_TAKEN: Horário indisponível ou acabou de ser reservado"),
    {
      source: "booking",
      operation: "submit_public_booking",
      errorCode: "BOOKING_SLOT_TAKEN",
      statusCode: 409,
      retryable: true,
      ...context,
    },
  );
}

/**
 * Reports network / database service operation failures.
 */
export function reportNetworkDiagnostic(
  operation: string,
  error: unknown,
  context: Partial<SafeErrorEvent> = {},
): SafeErrorEvent | null {
  return reportError(error, {
    source: "network",
    operation,
    retryable: true,
    ...context,
  });
}

/**
 * Reports PWA and Service Worker operational lifecycle events.
 */
export function reportPwaDiagnostic(
  action: "registration_failure" | "update_detected" | "update_failure" | "reload_triggered",
  details?: string,
): SafeErrorEvent | null {
  const safeDetails = details ? truncateMessage(redactSensitiveData(details), 100) : "";
  return reportError(new Error(`PWA ${action}${safeDetails ? `: ${safeDetails}` : ""}`), {
    source: "pwa",
    operation: action,
    retryable: false,
  });
}

/**
 * Reports safe non-error operational events (e.g. notification outbox lifecycle).
 */
export function reportObservabilityEvent(
  operation:
    | "notification_event_enqueued"
    | "notification_event_duplicate_prevented"
    | "notification_event_enqueue_failed"
    | "notification_provider_disabled",
  context: Partial<SafeErrorEvent> = {},
): SafeErrorEvent | null {
  return reportError(new Error(`Operational event: ${operation}`), {
    source: "network",
    operation,
    retryable: false,
    ...context,
  });
}

/**
 * Initializes global client-side error listeners idempotently.
 */
export function initGlobalErrorListeners(): void {
  if (typeof window === "undefined") return;
  if (globalListenersRegistered) return;

  globalListenersRegistered = true;

  window.addEventListener("error", (event: ErrorEvent) => {
    try {
      // Don't report errors caused by observability itself
      const errorMsg = event.message || "";
      if (errorMsg.includes("barbeos-observability")) return;

      reportError(event.error || event.message, {
        source: "ui",
        route: window.location.pathname,
      });
    } catch {
      // Ignore
    }
  });

  window.addEventListener("unhandledrejection", (event: PromiseRejectionEvent) => {
    try {
      reportError(event.reason, {
        source: "ui",
        route: window.location.pathname,
      });
    } catch {
      // Ignore
    }
  });
}

/**
 * Resets internal observability state (for unit testing purposes).
 */
export function resetObservabilityStateForTests(): void {
  recentFingerprints.clear();
  eventCountInSession = 0;
  globalListenersRegistered = false;
}
