import { reportObservabilityEvent } from "@/lib/observability";

export type NotificationChannel = "email" | "whatsapp" | "sms";

export type NotificationEventType =
  | "appointment.created"
  | "appointment.confirmed"
  | "appointment.cancelled"
  | "appointment.rescheduled"
  | "appointment.reminder_due"
  | "appointment.completed"
  | "appointment.no_show";

export type NotificationOutboxStatus =
  | "pending"
  | "processing"
  | "sent"
  | "failed"
  | "cancelled"
  | "dead_letter";

export interface NotificationDeliveryPayload {
  eventId: string;
  barbershopId: string;
  appointmentId?: string | null;
  eventType: NotificationEventType;
  channel: NotificationChannel;
  scheduledFor: string;
  metadata?: Record<string, unknown>;
}

export type NotificationDeliveryResult =
  | { ok: true; providerMessageId?: string }
  | { ok: false; retryable: boolean; failureCode: string };

export interface INotificationProvider {
  readonly name: string;
  isConfigured(): boolean;
  send(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult>;
}

/**
 * Default safe provider: Disabled.
 * Strictly avoids external network calls, preserves privacy, and never blocks business flows.
 */
export class DisabledNotificationProvider implements INotificationProvider {
  readonly name = "disabled";

  isConfigured(): boolean {
    return false;
  }

  async send(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult> {
    // Record safe diagnostic in observability without exposing message content or contact data
    reportObservabilityEvent("notification_provider_disabled", {
      route: "outbox_dispatcher",
      hasShopContext: Boolean(payload.barbershopId),
      statusCode: 200,
    });

    return {
      ok: false,
      retryable: false,
      failureCode: "PROVIDER_DISABLED_NOT_CONFIGURED",
    };
  }
}

export type SimulationMode = "success" | "retryable_failure" | "permanent_failure";

export interface SimulatedProviderOptions {
  defaultMode?: SimulationMode;
  failureCode?: string;
}

/**
 * Isolated simulation provider for rehearsal and automated outbox testing.
 * Makes zero network calls, requires zero credentials, and never exposes PII.
 */
export class SimulatedNotificationProvider implements INotificationProvider {
  readonly name = "simulated";
  private mode: SimulationMode;
  private customFailureCode?: string;

  constructor(options: SimulatedProviderOptions = {}) {
    this.mode = options.defaultMode || "success";
    this.customFailureCode = options.failureCode;
  }

  isConfigured(): boolean {
    return true;
  }

  setMode(mode: SimulationMode, failureCode?: string): void {
    this.mode = mode;
    this.customFailureCode = failureCode;
  }

  async send(payload: NotificationDeliveryPayload): Promise<NotificationDeliveryResult> {
    // Determine behavior either from explicit metadata override (in isolated tests) or instance mode
    const requestedMode = (payload.metadata?.simulation_mode as SimulationMode) || this.mode;

    reportObservabilityEvent("notification_event_simulated", {
      route: "outbox_worker",
      hasShopContext: Boolean(payload.barbershopId),
      statusCode: 200,
    });

    if (requestedMode === "retryable_failure") {
      return {
        ok: false,
        retryable: true,
        failureCode: this.customFailureCode || "SIMULATED_TRANSIENT_RATE_LIMIT",
      };
    }

    if (requestedMode === "permanent_failure") {
      return {
        ok: false,
        retryable: false,
        failureCode: this.customFailureCode || "SIMULATED_INVALID_RECIPIENT",
      };
    }

    // Default: simulated success
    const syntheticId = `sim_msg_${payload.eventId.replace(/-/g, "").slice(0, 12)}_${Date.now().toString(36)}`;
    return {
      ok: true,
      providerMessageId: syntheticId,
    };
  }
}

// Default provider instance (strictly disabled in client/foundation environment)
let activeProvider: INotificationProvider = new DisabledNotificationProvider();

export function getNotificationProvider(): INotificationProvider {
  return activeProvider;
}

export function setNotificationProviderForTesting(provider: INotificationProvider): void {
  activeProvider = provider;
}
