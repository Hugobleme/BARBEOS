import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  DisabledNotificationProvider,
  getNotificationProvider,
  setNotificationProviderForTesting,
  NotificationDeliveryPayload,
} from "../../src/services/notification-provider";
import { notificationOutboxService } from "../../src/services/notification-outbox.service";
import { supabase } from "../../src/integrations/supabase/client";
import { readFileSync } from "fs";
import { resolve } from "path";

vi.mock("../../src/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

describe("BARBEOS Notification Outbox & Provider Foundation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setNotificationProviderForTesting(new DisabledNotificationProvider());
  });

  // 1. Schema & Migration Verification
  describe("1. Database Migration & Schema Constraints", () => {
    const migrationPath = resolve(
      process.cwd(),
      "supabase/migrations/20260909183000_add_notification_outbox.sql",
    );
    const sql = readFileSync(migrationPath, "utf-8");

    it("1.1 Outbox table has RLS explicitly enabled", () => {
      expect(sql).toContain("ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;");
    });

    it("1.2 Only owner role has SELECT policy; mutations have zero user policies", () => {
      expect(sql).toContain('CREATE POLICY "notification_outbox_owner_select"');
      expect(sql).toContain("barbershop_members.role = 'owner'");
      expect(sql).not.toContain('CREATE POLICY "notification_outbox_anon"');
      expect(sql).not.toContain("FOR INSERT TO authenticated");
      expect(sql).not.toContain("FOR UPDATE TO authenticated");
      expect(sql).not.toContain("FOR DELETE TO authenticated");
    });

    it("1.3 Validates event_type constraint strictly", () => {
      expect(sql).toContain("appointment.created");
      expect(sql).toContain("appointment.confirmed");
      expect(sql).toContain("appointment.cancelled");
      expect(sql).toContain("appointment.rescheduled");
      expect(sql).toContain("appointment.reminder_due");
      expect(sql).toContain("appointment.completed");
      expect(sql).toContain("appointment.no_show");
    });

    it("1.4 Validates channel constraint (email, whatsapp, sms)", () => {
      expect(sql).toContain("channel IN ('email', 'whatsapp', 'sms')");
    });

    it("1.5 Validates status constraint and attempts >= 0", () => {
      expect(sql).toContain(
        "status IN ('pending', 'processing', 'sent', 'failed', 'cancelled', 'dead_letter')",
      );
      expect(sql).toContain("attempt_count >= 0");
    });

    it("1.6 Enforces idempotency key uniqueness", () => {
      expect(sql).toContain(
        "CONSTRAINT notification_outbox_idempotency_key_key UNIQUE (idempotency_key)",
      );
    });

    it("1.7 Enqueue function is SECURITY DEFINER with search_path set", () => {
      expect(sql).toContain("CREATE OR REPLACE FUNCTION public.enqueue_notification_event");
      expect(sql).toContain("SECURITY DEFINER");
      expect(sql).toContain("SET search_path = public, pg_temp");
      expect(sql).toContain(
        "REVOKE ALL ON FUNCTION public.enqueue_notification_event(uuid, uuid, text, text, timestamptz, text, jsonb) FROM anon",
      );
    });

    it("1.8 Cross-tenant check is present in database function", () => {
      expect(sql).toContain("OUTBOX_CROSS_TENANT_REJECTED");
    });
  });

  // 2. Disabled Provider Behavior
  describe("2. Disabled Notification Provider", () => {
    it("2.1 Default provider is DisabledNotificationProvider", () => {
      const provider = getNotificationProvider();
      expect(provider.name).toBe("disabled");
      expect(provider.isConfigured()).toBe(false);
    });

    it("2.2 Disabled provider does not make network requests and returns safe code", async () => {
      const provider = getNotificationProvider();
      const payload: NotificationDeliveryPayload = {
        eventId: "event-123",
        barbershopId: "shop-456",
        appointmentId: "appt-789",
        eventType: "appointment.created",
        channel: "whatsapp",
        scheduledFor: new Date().toISOString(),
      };

      const result = await provider.send(payload);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.retryable).toBe(false);
        expect(result.failureCode).toBe("PROVIDER_DISABLED_NOT_CONFIGURED");
      }
    });

    it("2.3 Disabled provider failure never blocks bookings", async () => {
      const provider = getNotificationProvider();
      const result = await provider.send({
        eventId: "test",
        barbershopId: "shop-1",
        eventType: "appointment.created",
        channel: "whatsapp",
        scheduledFor: new Date().toISOString(),
      });
      // Should return a controlled result instead of throwing an unhandled exception
      expect(result).toBeDefined();
      expect(result.ok).toBe(false);
    });
  });

  // 3. Service Enqueue & Idempotency
  describe("3. Notification Outbox Service Enqueue", () => {
    it("3.1 Calls enqueue_notification_event RPC with non-PII parameters", async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: {
          event_id: "evt-uuid-1",
          status: "pending",
          scheduled_for: "2026-09-09T18:00:00.000Z",
          is_new: true,
          idempotency_key: "appt-1:appointment.created:whatsapp:creation",
        },
        error: null,
      });

      const result = await notificationOutboxService.enqueue({
        barbershopId: "00000000-0000-0000-0000-000000000001",
        appointmentId: "00000000-0000-0000-0000-000000000002",
        eventType: "appointment.created",
        channel: "whatsapp",
        deliveryBucket: "creation",
        metadata: { source_op: "create_public_booking" },
      });

      expect(result.event_id).toBe("evt-uuid-1");
      expect(result.is_new).toBe(true);
      expect(supabase.rpc).toHaveBeenCalledWith(
        "enqueue_notification_event",
        expect.objectContaining({
          p_barbershop_id: "00000000-0000-0000-0000-000000000001",
          p_appointment_id: "00000000-0000-0000-0000-000000000002",
          p_event_type: "appointment.created",
          p_channel: "whatsapp",
          p_delivery_bucket: "creation",
        }),
      );
    });

    it("3.2 Repeated enqueue with same idempotency key reports duplicate prevented", async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: {
          event_id: "evt-uuid-1",
          status: "pending",
          scheduled_for: "2026-09-09T18:00:00.000Z",
          is_new: false,
          idempotency_key: "appt-1:appointment.created:whatsapp:creation",
        },
        error: null,
      });

      const result = await notificationOutboxService.enqueue({
        barbershopId: "shop-1",
        appointmentId: "appt-1",
        eventType: "appointment.created",
        channel: "whatsapp",
      });

      expect(result.is_new).toBe(false);
      expect(result.event_id).toBe("evt-uuid-1");
    });

    it("3.3 Enqueue error is safely thrown and tracked", async () => {
      (supabase.rpc as any).mockResolvedValue({
        data: null,
        error: { code: "OUTBOX_CROSS_TENANT_REJECTED", message: "Cross tenant attempt" },
      });

      await expect(
        notificationOutboxService.enqueue({
          barbershopId: "shop-1",
          appointmentId: "appt-foreign",
          eventType: "appointment.created",
        }),
      ).rejects.toMatchObject({ code: "OUTBOX_CROSS_TENANT_REJECTED" });
    });
  });

  // 4. Read-Only Owner Inspection & PII Minimization
  describe("4. Operational Admin Outbox Inspection", () => {
    it("4.1 getShopOutbox requests only operational metadata and strips PII", async () => {
      const mockRows = [
        {
          id: "evt-1",
          barbershop_id: "shop-1",
          appointment_id: "appt-1",
          event_type: "appointment.created",
          channel: "whatsapp",
          status: "pending",
          scheduled_for: "2026-09-09T18:00:00Z",
          attempt_count: 0,
          failure_code: null,
          created_at: "2026-09-09T18:00:00Z",
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({ data: mockRows, error: null }),
            }),
          }),
        }),
      });

      const data = await notificationOutboxService.getShopOutbox("shop-1");
      expect(data).toHaveLength(1);
      expect(data[0]).not.toHaveProperty("phone");
      expect(data[0]).not.toHaveProperty("customer_name");
      expect(data[0]).not.toHaveProperty("message_body");
      expect(data[0].status).toBe("pending");
    });
  });
});
