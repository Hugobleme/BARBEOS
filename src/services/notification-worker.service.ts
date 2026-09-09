// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import {
  INotificationProvider,
  getNotificationProvider,
  NotificationDeliveryPayload,
  NotificationDeliveryResult,
} from "./notification-provider";
import { reportObservabilityEvent, reportNetworkDiagnostic } from "@/lib/observability";

export interface WorkerExecutionOptions {
  batchSize?: number;
  barbershopId?: string;
  provider?: INotificationProvider;
  dryRun?: boolean;
}

export interface WorkerRunSummary {
  claimed: number;
  sent: number;
  retried: number;
  failed: number;
  dead_lettered: number;
  duration_ms: number;
}

export interface ClaimedOutboxEvent {
  id: string;
  barbershop_id: string;
  appointment_id: string | null;
  event_type: string;
  channel: string;
  status: string;
  idempotency_key: string;
  scheduled_for: string;
  attempt_count: number;
  metadata: Record<string, unknown>;
}

export const MAX_WORKER_BATCH_SIZE = 25;
export const MAX_ATTEMPT_COUNT = 4;

/**
 * Calculates deterministic bounded retry timestamp based on attempt count.
 *   - Attempt 1: +1 minute
 *   - Attempt 2: +5 minutes
 *   - Attempt 3: +15 minutes
 */
export function calculateBackoffTime(attemptCount: number, baseDate = new Date()): Date {
  const backoffMinutes = attemptCount === 1 ? 1 : attemptCount === 2 ? 5 : 15;
  return new Date(baseDate.getTime() + backoffMinutes * 60 * 1000);
}

/**
 * Verifies that the worker is executing in a server or test context,
 * preventing accidental execution from browser bundles.
 */
function assertServerEnvironment(): void {
  if (
    typeof window !== "undefined" &&
    typeof process !== "undefined" &&
    process.env?.NODE_ENV !== "test"
  ) {
    throw new Error(
      "WORKER_CLIENT_INVOCATION_PROHIBITED: notification delivery worker can only execute in a trusted server environment.",
    );
  }
}

/**
 * Notification Delivery Worker Service.
 * Safely claims due outbox events, processes them via configured provider
 * (disabled by default in production, simulated in isolated testing),
 * and records bounded retries or dead-letter transitions.
 */
export const notificationWorkerService = {
  /**
   * Main worker batch execution pipeline.
   */
  async processOutboxBatch(options: WorkerExecutionOptions = {}): Promise<WorkerRunSummary> {
    assertServerEnvironment();
    const startTime = Date.now();

    // 1. Validate and bound batch size
    const requestedBatch = options.batchSize ?? 10;
    if (requestedBatch > MAX_WORKER_BATCH_SIZE) {
      throw new Error(
        `WORKER_BATCH_LIMIT_EXCEEDED: Requested batch ${requestedBatch} exceeds maximum allowed limit of ${MAX_WORKER_BATCH_SIZE}.`,
      );
    }
    const boundedBatch = Math.max(1, Math.min(requestedBatch, MAX_WORKER_BATCH_SIZE));

    const provider = options.provider || getNotificationProvider();

    reportObservabilityEvent("notification_worker_started", {
      route: "outbox_worker",
      hasShopContext: Boolean(options.barbershopId),
      statusCode: 200,
    });

    const summary: WorkerRunSummary = {
      claimed: 0,
      sent: 0,
      retried: 0,
      failed: 0,
      dead_lettered: 0,
      duration_ms: 0,
    };

    // 2. Claim eligible rows atomically via FOR UPDATE SKIP LOCKED
    let claimedEvents: ClaimedOutboxEvent[] = [];

    try {
      const { data, error } = await supabase.rpc("claim_notification_outbox_batch", {
        p_batch_size: boundedBatch,
        p_barbershop_id: options.barbershopId || null,
      });

      if (error) {
        reportNetworkDiagnostic("claim_notification_outbox_batch", error, {
          route: "outbox_worker",
          hasShopContext: Boolean(options.barbershopId),
        });
        throw error;
      }

      claimedEvents = (data as ClaimedOutboxEvent[]) || [];
      summary.claimed = claimedEvents.length;
    } catch (err: any) {
      summary.duration_ms = Date.now() - startTime;
      reportObservabilityEvent("notification_worker_completed", {
        route: "outbox_worker",
        hasShopContext: Boolean(options.barbershopId),
        errorCode: "WORKER_CLAIM_FAILED",
      });
      throw err;
    }

    if (claimedEvents.length === 0) {
      summary.duration_ms = Date.now() - startTime;
      reportObservabilityEvent("notification_worker_completed", {
        route: "outbox_worker",
        hasShopContext: Boolean(options.barbershopId),
        statusCode: 200,
      });
      return summary;
    }

    // 3. Process each claimed event independently
    for (const event of claimedEvents) {
      reportObservabilityEvent("notification_event_claimed", {
        route: "outbox_worker",
        hasShopContext: Boolean(event.barbershop_id),
      });

      if (options.dryRun) {
        continue;
      }

      const deliveryPayload: NotificationDeliveryPayload = {
        eventId: event.id,
        barbershopId: event.barbershop_id,
        appointmentId: event.appointment_id,
        eventType: event.event_type as any,
        channel: event.channel as any,
        scheduledFor: event.scheduled_for,
        metadata: event.metadata || {},
      };

      let deliveryResult: NotificationDeliveryResult;
      try {
        deliveryResult = await provider.send(deliveryPayload);
      } catch (sendErr: any) {
        deliveryResult = {
          ok: false,
          retryable: true,
          failureCode: "UNHANDLED_PROVIDER_EXCEPTION",
        };
      }

      // 4. Handle Result & Status Transition
      if (deliveryResult.ok) {
        // Success (simulated in test/rehearsal environment)
        summary.sent++;
        await this.completeEvent({
          eventId: event.id,
          status: "sent",
          providerMessageId: deliveryResult.providerMessageId,
        });
      } else if (deliveryResult.retryable) {
        // Retryable failure: check attempt count
        if (event.attempt_count >= MAX_ATTEMPT_COUNT) {
          // Exceeded max retry attempts -> dead letter
          summary.dead_lettered++;
          reportObservabilityEvent("notification_event_dead_lettered", {
            route: "outbox_worker",
            hasShopContext: Boolean(event.barbershop_id),
            errorCode: deliveryResult.failureCode,
          });

          await this.completeEvent({
            eventId: event.id,
            status: "dead_letter",
            failureCode: deliveryResult.failureCode || "EXCEEDED_MAX_ATTEMPTS",
          });
        } else {
          // Reschedule with bounded backoff
          summary.retried++;
          const nextRetryDate = calculateBackoffTime(event.attempt_count);

          reportObservabilityEvent("notification_event_retry_scheduled", {
            route: "outbox_worker",
            hasShopContext: Boolean(event.barbershop_id),
            errorCode: deliveryResult.failureCode,
          });

          await this.completeEvent({
            eventId: event.id,
            status: "pending",
            failureCode: deliveryResult.failureCode,
            retryScheduledFor: nextRetryDate.toISOString(),
          });
        }
      } else {
        // Permanent / non-retryable failure
        summary.failed++;
        await this.completeEvent({
          eventId: event.id,
          status: "failed",
          failureCode: deliveryResult.failureCode || "PERMANENT_DELIVERY_FAILURE",
        });
      }
    }

    summary.duration_ms = Date.now() - startTime;
    reportObservabilityEvent("notification_worker_completed", {
      route: "outbox_worker",
      hasShopContext: Boolean(options.barbershopId),
      statusCode: 200,
    });

    return summary;
  },

  /**
   * Helper to invoke complete_notification_outbox_event RPC safely.
   */
  async completeEvent(params: {
    eventId: string;
    status: "pending" | "sent" | "failed" | "cancelled" | "dead_letter";
    failureCode?: string | null;
    providerMessageId?: string | null;
    retryScheduledFor?: string | null;
  }): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc("complete_notification_outbox_event", {
        p_event_id: params.eventId,
        p_status: params.status,
        p_failure_code: params.failureCode || null,
        p_provider_message_id: params.providerMessageId || null,
        p_retry_scheduled_for: params.retryScheduledFor || null,
      });

      if (error) {
        reportNetworkDiagnostic("complete_notification_outbox_event", error, {
          route: "outbox_worker",
        });
        return false;
      }

      return Boolean(data);
    } catch {
      return false;
    }
  },
};
