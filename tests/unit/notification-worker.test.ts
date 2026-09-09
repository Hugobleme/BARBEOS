import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  notificationWorkerService,
  calculateBackoffTime,
  MAX_WORKER_BATCH_SIZE,
  MAX_ATTEMPT_COUNT,
  WorkerExecutionOptions,
} from "../../src/services/notification-worker.service";
import {
  DisabledNotificationProvider,
  SimulatedNotificationProvider,
  getNotificationProvider,
  setNotificationProviderForTesting,
} from "../../src/services/notification-provider";
import { supabase } from "../../src/integrations/supabase/client";
import { readFileSync } from "fs";
import { resolve } from "path";

vi.mock("../../src/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe("BARBEOS Simulated Notification Delivery Worker (Etapa 15C)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNotificationProviderForTesting(new DisabledNotificationProvider());
  });

  // ── 1. Database DDL & Claiming Specification ──────────────────────────────
  describe("1. Database DDL & Claim Constraints", () => {
    const migrationPath = resolve(
      process.cwd(),
      "supabase/migrations/20260909190000_add_notification_worker_claim.sql",
    );
    const sql = readFileSync(migrationPath, "utf-8");

    it("1.1 claim_notification_outbox_batch uses FOR UPDATE SKIP LOCKED", () => {
      expect(sql).toContain("FOR UPDATE SKIP LOCKED");
    });

    it("1.2 Only due pending events are eligible for claiming", () => {
      expect(sql).toContain("outbox.status = 'pending'");
      expect(sql).toContain("outbox.scheduled_for <= now()");
    });

    it("1.3 Batch size is strictly clamped between 1 and 25", () => {
      expect(sql).toContain("LEAST(GREATEST(COALESCE(p_batch_size, 10), 1), 25)");
    });

    it("1.4 Atomically transitions to 'processing' and increments attempt_count exactly once", () => {
      expect(sql).toContain("status = 'processing'");
      expect(sql).toContain("attempt_count = outbox.attempt_count + 1");
      expect(sql).toContain("last_attempt_at = now()");
    });

    it("1.5 claim function restricts direct execution from anon, authenticated and public", () => {
      expect(sql).toContain(
        "REVOKE ALL ON FUNCTION public.claim_notification_outbox_batch(integer, uuid) FROM PUBLIC;",
      );
      expect(sql).toContain(
        "REVOKE ALL ON FUNCTION public.claim_notification_outbox_batch(integer, uuid) FROM anon;",
      );
      expect(sql).toContain(
        "REVOKE ALL ON FUNCTION public.claim_notification_outbox_batch(integer, uuid) FROM authenticated;",
      );
    });

    it("1.6 complete_notification_outbox_event enforces transitions from 'processing'", () => {
      expect(sql).toContain("CREATE OR REPLACE FUNCTION public.complete_notification_outbox_event");
      expect(sql).toContain("WHERE id = p_event_id");
      expect(sql).toContain("AND status = 'processing'");
    });

    it("1.7 Sent, cancelled, and dead-letter events are not eligible for claim", () => {
      // Confirmed by the WHERE status = 'pending' filter in the claim CTE
      expect(sql).not.toContain("outbox.status = 'sent'");
      expect(sql).not.toContain("outbox.status = 'cancelled'");
      expect(sql).not.toContain("outbox.status = 'dead_letter'");
    });
  });

  // ── 2. Server Boundary & Batch Limits ─────────────────────────────────────
  describe("2. Server Boundary & Batch Enforcement", () => {
    it("2.1 Rejects requested batch size exceeding maximum limit of 25", async () => {
      await expect(notificationWorkerService.processOutboxBatch({ batchSize: 50 })).rejects.toThrow(
        "WORKER_BATCH_LIMIT_EXCEEDED",
      );
    });

    it("2.2 Allows valid batch size within range [1, 25]", async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const summary = await notificationWorkerService.processOutboxBatch({ batchSize: 20 });
      expect(summary.claimed).toBe(0);
      expect(supabase.rpc).toHaveBeenCalledWith(
        "claim_notification_outbox_batch",
        expect.objectContaining({ p_batch_size: 20 }),
      );
    });
  });

  // ── 3. Simulated Provider Behaviors ───────────────────────────────────────
  describe("3. Simulated Provider & Isolated Testing", () => {
    it("3.1 Default provider remains DisabledNotificationProvider", () => {
      const provider = getNotificationProvider();
      expect(provider.name).toBe("disabled");
      expect(provider.isConfigured()).toBe(false);
    });

    it("3.2 SimulatedNotificationProvider produces synthetic ID on success without network call", async () => {
      const simProvider = new SimulatedNotificationProvider({ defaultMode: "success" });
      const result = await simProvider.send({
        eventId: "00000000-0000-0000-0000-000000000001",
        barbershopId: "shop-1",
        eventType: "appointment.created",
        channel: "whatsapp",
        scheduledFor: new Date().toISOString(),
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.providerMessageId).toMatch(/^sim_msg_/);
      }
    });

    it("3.3 SimulatedNotificationProvider returns retryable failure when configured", async () => {
      const simProvider = new SimulatedNotificationProvider({
        defaultMode: "retryable_failure",
        failureCode: "SIM_TEMP_BUSY",
      });

      const result = await simProvider.send({
        eventId: "00000000-0000-0000-0000-000000000002",
        barbershopId: "shop-1",
        eventType: "appointment.created",
        channel: "whatsapp",
        scheduledFor: new Date().toISOString(),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.retryable).toBe(true);
        expect(result.failureCode).toBe("SIM_TEMP_BUSY");
      }
    });

    it("3.4 SimulatedNotificationProvider returns permanent failure when configured", async () => {
      const simProvider = new SimulatedNotificationProvider({
        defaultMode: "permanent_failure",
        failureCode: "SIM_INVALID_CONTACT",
      });

      const result = await simProvider.send({
        eventId: "00000000-0000-0000-0000-000000000003",
        barbershopId: "shop-1",
        eventType: "appointment.created",
        channel: "whatsapp",
        scheduledFor: new Date().toISOString(),
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.retryable).toBe(false);
        expect(result.failureCode).toBe("SIM_INVALID_CONTACT");
      }
    });
  });

  // ── 4. Bounded Retry & Backoff Strategy ───────────────────────────────────
  describe("4. Bounded Retry & Backoff Strategy", () => {
    it("4.1 Attempt 1 schedules retry +1 minute later", () => {
      const base = new Date("2026-09-09T18:00:00.000Z");
      const retry = calculateBackoffTime(1, base);
      expect(retry.toISOString()).toBe("2026-09-09T18:01:00.000Z");
    });

    it("4.2 Attempt 2 schedules retry +5 minutes later", () => {
      const base = new Date("2026-09-09T18:00:00.000Z");
      const retry = calculateBackoffTime(2, base);
      expect(retry.toISOString()).toBe("2026-09-09T18:05:00.000Z");
    });

    it("4.3 Attempt 3 schedules retry +15 minutes later", () => {
      const base = new Date("2026-09-09T18:00:00.000Z");
      const retry = calculateBackoffTime(3, base);
      expect(retry.toISOString()).toBe("2026-09-09T18:15:00.000Z");
    });
  });

  // ── 5. End-to-End Worker Batch Processing ─────────────────────────────────
  describe("5. End-to-End Batch Simulation Pipeline", () => {
    it("5.1 Successfully marks simulated events as 'sent'", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          barbershop_id: "shop-1",
          appointment_id: "appt-1",
          event_type: "appointment.created",
          channel: "whatsapp",
          status: "processing",
          idempotency_key: "key-1",
          scheduled_for: "2026-09-09T18:00:00Z",
          attempt_count: 1,
          metadata: {},
        },
      ];

      (supabase.rpc as any).mockImplementation((fn: string) => {
        if (fn === "claim_notification_outbox_batch") {
          return Promise.resolve({ data: mockEvents, error: null });
        }
        if (fn === "complete_notification_outbox_event") {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const simProvider = new SimulatedNotificationProvider({ defaultMode: "success" });
      const summary = await notificationWorkerService.processOutboxBatch({
        provider: simProvider,
      });

      expect(summary.claimed).toBe(1);
      expect(summary.sent).toBe(1);
      expect(summary.retried).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.dead_lettered).toBe(0);

      expect(supabase.rpc).toHaveBeenCalledWith(
        "complete_notification_outbox_event",
        expect.objectContaining({
          p_event_id: "evt-1",
          p_status: "sent",
        }),
      );
    });

    it("5.2 Reschedules transient failures when attempt_count < MAX_ATTEMPT_COUNT", async () => {
      const mockEvents = [
        {
          id: "evt-retry",
          barbershop_id: "shop-1",
          appointment_id: "appt-1",
          event_type: "appointment.created",
          channel: "whatsapp",
          status: "processing",
          idempotency_key: "key-2",
          scheduled_for: "2026-09-09T18:00:00Z",
          attempt_count: 2,
          metadata: {},
        },
      ];

      (supabase.rpc as any).mockImplementation((fn: string) => {
        if (fn === "claim_notification_outbox_batch") {
          return Promise.resolve({ data: mockEvents, error: null });
        }
        if (fn === "complete_notification_outbox_event") {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const simProvider = new SimulatedNotificationProvider({
        defaultMode: "retryable_failure",
        failureCode: "SIM_RATE_LIMITED",
      });

      const summary = await notificationWorkerService.processOutboxBatch({
        provider: simProvider,
      });

      expect(summary.claimed).toBe(1);
      expect(summary.sent).toBe(0);
      expect(summary.retried).toBe(1);
      expect(summary.dead_lettered).toBe(0);

      expect(supabase.rpc).toHaveBeenCalledWith(
        "complete_notification_outbox_event",
        expect.objectContaining({
          p_event_id: "evt-retry",
          p_status: "pending",
          p_failure_code: "SIM_RATE_LIMITED",
        }),
      );
    });

    it("5.3 Transitions to 'dead_letter' when attempt_count reaches MAX_ATTEMPT_COUNT (4)", async () => {
      const mockEvents = [
        {
          id: "evt-dead",
          barbershop_id: "shop-1",
          appointment_id: "appt-1",
          event_type: "appointment.created",
          channel: "whatsapp",
          status: "processing",
          idempotency_key: "key-3",
          scheduled_for: "2026-09-09T18:00:00Z",
          attempt_count: 4,
          metadata: {},
        },
      ];

      (supabase.rpc as any).mockImplementation((fn: string) => {
        if (fn === "claim_notification_outbox_batch") {
          return Promise.resolve({ data: mockEvents, error: null });
        }
        if (fn === "complete_notification_outbox_event") {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const simProvider = new SimulatedNotificationProvider({
        defaultMode: "retryable_failure",
      });

      const summary = await notificationWorkerService.processOutboxBatch({
        provider: simProvider,
      });

      expect(summary.claimed).toBe(1);
      expect(summary.sent).toBe(0);
      expect(summary.retried).toBe(0);
      expect(summary.dead_lettered).toBe(1);

      expect(supabase.rpc).toHaveBeenCalledWith(
        "complete_notification_outbox_event",
        expect.objectContaining({
          p_event_id: "evt-dead",
          p_status: "dead_letter",
        }),
      );
    });

    it("5.4 Transitions non-retryable failure directly to 'failed'", async () => {
      const mockEvents = [
        {
          id: "evt-perm-fail",
          barbershop_id: "shop-1",
          appointment_id: "appt-1",
          event_type: "appointment.created",
          channel: "whatsapp",
          status: "processing",
          idempotency_key: "key-4",
          scheduled_for: "2026-09-09T18:00:00Z",
          attempt_count: 1,
          metadata: {},
        },
      ];

      (supabase.rpc as any).mockImplementation((fn: string) => {
        if (fn === "claim_notification_outbox_batch") {
          return Promise.resolve({ data: mockEvents, error: null });
        }
        if (fn === "complete_notification_outbox_event") {
          return Promise.resolve({ data: true, error: null });
        }
        return Promise.resolve({ data: null, error: null });
      });

      const simProvider = new SimulatedNotificationProvider({
        defaultMode: "permanent_failure",
        failureCode: "INVALID_NUMBER_SIMULATED",
      });

      const summary = await notificationWorkerService.processOutboxBatch({
        provider: simProvider,
      });

      expect(summary.claimed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.sent).toBe(0);
      expect(summary.retried).toBe(0);

      expect(supabase.rpc).toHaveBeenCalledWith(
        "complete_notification_outbox_event",
        expect.objectContaining({
          p_event_id: "evt-perm-fail",
          p_status: "failed",
          p_failure_code: "INVALID_NUMBER_SIMULATED",
        }),
      );
    });

    it("5.5 Scopes claim to specific barbershopId when requested", async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: [],
        error: null,
      });

      await notificationWorkerService.processOutboxBatch({
        barbershopId: "00000000-0000-0000-0000-000000000099",
      });

      expect(supabase.rpc).toHaveBeenCalledWith(
        "claim_notification_outbox_batch",
        expect.objectContaining({
          p_barbershop_id: "00000000-0000-0000-0000-000000000099",
        }),
      );
    });

    it("5.6 Worker summary contains only non-PII aggregate counts", async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: [],
        error: null,
      });

      const summary = await notificationWorkerService.processOutboxBatch();
      expect(summary).toHaveProperty("claimed");
      expect(summary).toHaveProperty("sent");
      expect(summary).toHaveProperty("retried");
      expect(summary).toHaveProperty("failed");
      expect(summary).toHaveProperty("dead_lettered");
      expect(summary).toHaveProperty("duration_ms");

      expect(summary).not.toHaveProperty("phone");
      expect(summary).not.toHaveProperty("email");
      expect(summary).not.toHaveProperty("customer_name");
      expect(summary).not.toHaveProperty("message");
    });
  });
});
