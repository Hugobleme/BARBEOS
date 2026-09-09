// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import {
  NotificationChannel,
  NotificationEventType,
  NotificationOutboxStatus,
} from "./notification-provider";
import { reportObservabilityEvent, reportNetworkDiagnostic } from "@/lib/observability";

export interface NotificationOutboxItem {
  id: string;
  barbershop_id: string;
  appointment_id: string | null;
  event_type: NotificationEventType;
  channel: NotificationChannel;
  status: NotificationOutboxStatus;
  idempotency_key: string;
  scheduled_for: string;
  attempt_count: number;
  last_attempt_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  failure_code: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface EnqueueNotificationInput {
  barbershopId: string;
  appointmentId?: string | null;
  eventType: NotificationEventType;
  channel?: NotificationChannel;
  scheduledFor?: Date | string;
  deliveryBucket?: string;
  metadata?: Record<string, unknown>;
}

export interface EnqueueNotificationResult {
  event_id: string;
  status: NotificationOutboxStatus;
  scheduled_for: string;
  is_new: boolean;
  idempotency_key: string;
}

export const notificationOutboxService = {
  /**
   * Enqueues an outbox event safely and idempotently via database RPC.
   * Never stores customer names, phones, emails or message bodies in metadata.
   */
  async enqueue(input: EnqueueNotificationInput): Promise<EnqueueNotificationResult> {
    const scheduledIso =
      input.scheduledFor instanceof Date
        ? input.scheduledFor.toISOString()
        : typeof input.scheduledFor === "string"
          ? input.scheduledFor
          : new Date().toISOString();

    try {
      const { data, error } = await supabase.rpc("enqueue_notification_event", {
        p_barbershop_id: input.barbershopId,
        p_appointment_id: input.appointmentId || null,
        p_event_type: input.eventType,
        p_channel: input.channel || "whatsapp",
        p_scheduled_for: scheduledIso,
        p_delivery_bucket: input.deliveryBucket || "default",
        p_metadata: input.metadata || {},
      });

      if (error) {
        reportObservabilityEvent("notification_event_enqueue_failed", {
          route: "notification_outbox",
          hasShopContext: Boolean(input.barbershopId),
          errorCode: error.code || "OUTBOX_ENQUEUE_ERROR",
        });
        throw error;
      }

      const result = data as EnqueueNotificationResult;

      if (result.is_new) {
        reportObservabilityEvent("notification_event_enqueued", {
          route: "notification_outbox",
          hasShopContext: Boolean(input.barbershopId),
        });
      } else {
        reportObservabilityEvent("notification_event_duplicate_prevented", {
          route: "notification_outbox",
          hasShopContext: Boolean(input.barbershopId),
        });
      }

      return result;
    } catch (err: any) {
      reportNetworkDiagnostic("enqueue_notification_event", err, {
        route: "notification_outbox",
        hasShopContext: Boolean(input.barbershopId),
      });
      throw err;
    }
  },

  /**
   * Read-only operational delivery history for owner inspection.
   * Strips all potential PII and selects only status and delivery telemetry.
   */
  async getShopOutbox(barbershopId: string, limit = 50): Promise<NotificationOutboxItem[]> {
    const { data, error } = await supabase
      .from("notification_outbox")
      .select(
        "id, barbershop_id, appointment_id, event_type, channel, status, scheduled_for, attempt_count, last_attempt_at, delivered_at, failed_at, failure_code, created_at, updated_at",
      )
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      reportNetworkDiagnostic("get_shop_outbox", error, {
        route: "notification_outbox",
        hasShopContext: Boolean(barbershopId),
      });
      throw error;
    }

    return (data as NotificationOutboxItem[]) || [];
  },

  /**
   * Read-only notification timeline for a specific appointment.
   */
  async getAppointmentNotifications(appointmentId: string): Promise<NotificationOutboxItem[]> {
    const { data, error } = await supabase
      .from("notification_outbox")
      .select(
        "id, barbershop_id, appointment_id, event_type, channel, status, scheduled_for, attempt_count, last_attempt_at, delivered_at, failed_at, failure_code, created_at, updated_at",
      )
      .eq("appointment_id", appointmentId)
      .order("created_at", { ascending: true });

    if (error) {
      reportNetworkDiagnostic("get_appointment_notifications", error, {
        route: "notification_outbox",
      });
      throw error;
    }

    return (data as NotificationOutboxItem[]) || [];
  },
};
