import { describe, it, expect, vi, beforeEach } from "vitest";
import { AvailabilityService } from "../../src/services/availability.service";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from "@/integrations/supabase/client";
import { addDays, format } from "date-fns";

describe("AvailabilityService", () => {
  let service: AvailabilityService;

  beforeEach(() => {
    service = new AvailabilityService();
    vi.resetAllMocks();
  });

  /**
   * @param shopHours - rows returned for the requested weekday
   * @param proHours - working_hours rows
   * @param timeOffs - time_off rows
   * @param conflicts - get_public_appointments RPC result
   * @param hasAnyHours - whether any barbershop_business_hours exist at all (for hasAnyBusinessHours check)
   */
  const mockSupabase = (
    shopHours: any[],
    proHours: any[],
    timeOffs: any[],
    conflicts: any[],
    hasAnyHours: boolean = shopHours.length > 0,
  ) => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "barbershop_business_hours") {
        return {
          select: (cols?: string) => {
            // hasAnyBusinessHours calls .select("id").eq(...).limit(1)
            if (cols === "id") {
              return {
                eq: () => ({
                  limit: vi.fn().mockResolvedValue({
                    data: hasAnyHours ? [{ id: "some-id" }] : [],
                    error: null,
                  }),
                }),
              };
            }
            // getAvailableSlots calls .select("*").eq(...).eq(...)
            return {
              eq: () => ({ eq: vi.fn().mockResolvedValue({ data: shopHours, error: null }) }),
            };
          },
        };
      }
      if (table === "professionals") {
        return {
          select: () => ({
            eq: () => ({ eq: vi.fn().mockResolvedValue({ data: [{ id: "pro1" }], error: null }) }),
          }),
        };
      }
      if (table === "working_hours") {
        return {
          select: () => ({
            in: () => ({ eq: vi.fn().mockResolvedValue({ data: proHours, error: null }) }),
          }),
        };
      }
      if (table === "time_off") {
        return {
          select: () => ({ in: vi.fn().mockResolvedValue({ data: timeOffs, error: null }) }),
        };
      }
      return { select: vi.fn() };
    });

    (supabase.rpc as any).mockResolvedValue({ data: conflicts, error: null });
  };

  // ── Missing shop configuration ───────────────────────────────────────

  it("1. No business hours at all returns emptyReason=no_shop_hours", async () => {
    mockSupabase([], [], [], [], false);
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("no_shop_hours");
  });

  it("2. Closed on this weekday but has other days returns emptyReason=closed_day", async () => {
    mockSupabase([], [], [], [], true); // hasAnyHours = true, but none for this weekday
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("closed_day");
  });

  // ── Normal slot generation ───────────────────────────────────────────

  it("3. One open interval returns slots only within the interval", async () => {
    mockSupabase([{ opens_at: "09:00:00", closes_at: "10:00:00" }], [], [], []);
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual(["09:00", "09:30"]);
    expect(result.emptyReason).toBeNull();
  });

  it("4. Service duration cannot extend past closing", async () => {
    mockSupabase([{ opens_at: "09:00:00", closes_at: "09:45:00" }], [], [], []);
    const date = addDays(new Date(), 1);
    // 60 minutes duration can't fit in 45 mins
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 60,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("all_booked");
  });

  // ── Appointment conflict ─────────────────────────────────────────────

  it("5. Existing appointment blocks overlapping slots", async () => {
    mockSupabase(
      [{ opens_at: "09:00:00", closes_at: "10:00:00" }],
      [],
      [],
      [
        {
          professional_id: "pro1",
          scheduled_start: `${format(addDays(new Date(), 1), "yyyy-MM-dd")}T09:30:00`,
          scheduled_end: `${format(addDays(new Date(), 1), "yyyy-MM-dd")}T10:00:00`,
        },
      ],
    );
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual(["09:00"]); // 09:30 is blocked
    expect(result.emptyReason).toBeNull();
  });

  // ── Past date ────────────────────────────────────────────────────────

  it("6. Past date returns emptyReason=past_date", async () => {
    mockSupabase([{ opens_at: "09:00:00", closes_at: "10:00:00" }], [], [], []);
    const date = addDays(new Date(), -1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("past_date");
  });

  // ── Professional working hours ───────────────────────────────────────

  it("7. Professional with specific working hours uses those instead of shop hours", async () => {
    mockSupabase(
      [{ opens_at: "09:00:00", closes_at: "18:00:00" }],
      [{ professional_id: "pro1", start_time: "10:00:00", end_time: "12:00:00", break_start: null, break_end: null }],
      [],
      [],
    );
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 30,
    });
    // Should generate slots from 10:00 to 11:30 (4 slots), not from 09:00
    expect(result.times).toContain("10:00");
    expect(result.times).toContain("10:30");
    expect(result.times).toContain("11:00");
    expect(result.times).toContain("11:30");
    expect(result.times).not.toContain("09:00");
    expect(result.times).not.toContain("12:00");
    expect(result.emptyReason).toBeNull();
  });

  it("8. Professional with break excludes break period", async () => {
    mockSupabase(
      [{ opens_at: "09:00:00", closes_at: "18:00:00" }],
      [{ professional_id: "pro1", start_time: "09:00:00", end_time: "11:00:00", break_start: "10:00:00", break_end: "10:30:00" }],
      [],
      [],
    );
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 30,
    });
    // 09:00-10:00 → 09:00, 09:30. 10:30-11:00 → 10:30. Total: 3 slots
    expect(result.times).toEqual(["09:00", "09:30", "10:30"]);
    expect(result.emptyReason).toBeNull();
  });

  // ── Time-off exclusion ───────────────────────────────────────────────

  it("9. Time-off period blocks overlapping slots", async () => {
    const tomorrow = addDays(new Date(), 1);
    const dateStr = format(tomorrow, "yyyy-MM-dd");
    mockSupabase(
      [{ opens_at: "09:00:00", closes_at: "10:00:00" }],
      [],
      [
        {
          professional_id: "pro1",
          start_at: `${dateStr}T09:00:00`,
          end_at: `${dateStr}T09:30:00`,
        },
      ],
      [],
    );
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date: tomorrow,
      durationMinutes: 30,
    });
    // 09:00 blocked by time-off, only 09:30 available
    expect(result.times).toEqual(["09:30"]);
    expect(result.emptyReason).toBeNull();
  });

  // ── Supabase query error ─────────────────────────────────────────────

  it("10. Supabase query error throws and does not silently return empty", async () => {
    (supabase.from as any).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: "connection refused" } }),
        }),
      }),
    }));

    const date = addDays(new Date(), 1);
    await expect(
      service.getAvailableSlots({
        barbershopId: "shop1",
        date,
        durationMinutes: 30,
      }),
    ).rejects.toThrow("Query failure: connection refused");
  });

  // ── 30-min service duration ──────────────────────────────────────────

  it("11. 30-minute service in 1-hour window produces 2 slots", async () => {
    mockSupabase([{ opens_at: "14:00:00", closes_at: "15:00:00" }], [], [], []);
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual(["14:00", "14:30"]);
  });

  // ── Service longer than window ───────────────────────────────────────

  it("12. Service duration longer than window returns empty with emptyReason=all_booked", async () => {
    mockSupabase([{ opens_at: "17:00:00", closes_at: "17:30:00" }], [], [], []);
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 60,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("all_booked");
  });
});
