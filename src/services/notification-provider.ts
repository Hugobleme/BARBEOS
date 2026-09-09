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

// Default provider instance (strictly disabled in client/foundation environment)
let activeProvider: INotificationProvider = new DisabledNotificationProvider();

export function getNotificationProvider(): INotificationProvider {
  return activeProvider;
}

export function setNotificationProviderForTesting(provider: INotificationProvider): void {
  activeProvider = provider;
}
