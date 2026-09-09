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
   * Helper to configure the Supabase query mock
   */
  const mockSupabase = ({
    shopHours = [] as any[],
    proHours = [] as any[],
    timeOffs = [] as any[],
    conflicts = [] as any[],
    hasAnyShopHours = shopHours.length > 0,
    hasAnyProHours = proHours.length > 0,
    pros = [{ id: "pro1" }],
  } = {}) => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "barbershop_business_hours") {
        return {
          select: (cols?: string) => {
            if (cols === "id") {
              return {
                eq: () => ({
                  limit: vi.fn().mockResolvedValue({
                    data: hasAnyShopHours ? [{ id: "some-sh-id" }] : [],
                    error: null,
                  }),
                }),
              };
            }
            return {
              eq: () => ({ eq: vi.fn().mockResolvedValue({ data: shopHours, error: null }) }),
            };
          },
        };
      }
      if (table === "professionals") {
        return {
          select: () => ({
            eq: () => ({ eq: vi.fn().mockResolvedValue({ data: pros, error: null }) }),
          }),
        };
      }
      if (table === "working_hours") {
        return {
          select: (cols?: string) => {
            if (cols === "id") {
              return {
                in: () => ({
                  limit: vi.fn().mockResolvedValue({
                    data: hasAnyProHours ? [{ id: "some-wh-id" }] : [],
                    error: null,
                  }),
                }),
              };
            }
            return {
              in: () => ({ eq: vi.fn().mockResolvedValue({ data: proHours, error: null }) }),
            };
          },
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

  // ── 1. Business open + professional working = slots generated ────────
  it("1. Business open + professional working = slots generated", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "11:00:00" }],
      proHours: [{ professional_id: "pro1", start_time: "09:00:00", end_time: "11:00:00" }],
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual(["09:00", "09:30", "10:00", "10:30"]);
    expect(result.emptyReason).toBeNull();
  });

  // ── 2. Business closed = no slots ────────────────────────────────────
  it("2. Business closed on requested weekday = no slots (closed_day)", async () => {
    mockSupabase({
      shopHours: [],
      hasAnyShopHours: true, // configured on other days, but closed today
      proHours: [{ professional_id: "pro1", start_time: "09:00:00", end_time: "17:00:00" }],
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("closed_day");
  });

  // ── 3. Professional off = no slots ───────────────────────────────────
  it("3. Professional off on requested weekday = no slots", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "18:00:00" }],
      proHours: [], // professional has working_hours on other days, but not today
      hasAnyProHours: true,
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("all_booked");
  });

  // ── 4. Break interval excluded ───────────────────────────────────────
  it("4. Break interval is excluded from generated slots", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "12:00:00" }],
      proHours: [
        {
          professional_id: "pro1",
          start_time: "09:00:00",
          end_time: "12:00:00",
          break_start: "10:00:00",
          break_end: "11:00:00",
        },
      ],
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 30,
    });
    // Slots in 09:00-10:00 (09:00, 09:30) and 11:00-12:00 (11:00, 11:30)
    expect(result.times).toEqual(["09:00", "09:30", "11:00", "11:30"]);
    expect(result.times).not.toContain("10:00");
    expect(result.times).not.toContain("10:30");
  });

  // ── 5. Existing appointment conflict excluded ────────────────────────
  it("5. Existing appointment conflict is excluded from available slots", async () => {
    const tomorrow = addDays(new Date(), 1);
    const dateStr = format(tomorrow, "yyyy-MM-dd");
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "11:00:00" }],
      proHours: [{ professional_id: "pro1", start_time: "09:00:00", end_time: "11:00:00" }],
      conflicts: [
        {
          professional_id: "pro1",
          scheduled_start: `${dateStr}T09:30:00`,
          scheduled_end: `${dateStr}T10:00:00`,
        },
      ],
    });
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date: tomorrow,
      durationMinutes: 30,
    });
    expect(result.times).toContain("09:00");
    expect(result.times).not.toContain("09:30"); // conflict
    expect(result.times).toContain("10:00");
    expect(result.times).toContain("10:30");
  });

  // ── 6. Service duration that exceeds closing = excluded ──────────────
  it("6. Service duration that exceeds closing time is excluded", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "09:45:00" }],
      proHours: [{ professional_id: "pro1", start_time: "09:00:00", end_time: "09:45:00" }],
    });
    const date = addDays(new Date(), 1);
    // 60-min service cannot fit into 45-min window
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 60,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("all_booked");
  });

  // ── 7. 'Any professional' aggregates slots from active pros ─────────
  it("7. 'Any professional' returns slots when at least one eligible pro is working", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "12:00:00" }],
      pros: [{ id: "pro1" }, { id: "pro2" }],
      proHours: [
        // pro1 works morning
        { professional_id: "pro1", start_time: "09:00:00", end_time: "10:30:00" },
        // pro2 works late morning
        { professional_id: "pro2", start_time: "10:30:00", end_time: "12:00:00" },
      ],
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "any",
      date,
      durationMinutes: 30,
    });
    // Aggregated slots from pro1 (09:00, 09:30, 10:00) and pro2 (10:30, 11:00, 11:30)
    expect(result.times).toEqual(["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]);
    expect(result.timeToPros["09:00"]).toContain("pro1");
    expect(result.timeToPros["10:30"]).toContain("pro2");
  });

  // ── 8. No shop hours returns setup-state reason (no_shop_hours) ──────
  it("8. No shop hours returns setup-state reason (no_shop_hours)", async () => {
    mockSupabase({
      shopHours: [],
      hasAnyShopHours: false,
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("no_shop_hours");
  });

  // ── 9. No professional hours returns professional-setup reason ──────
  it("9. No professional hours returns professional-setup reason (no_pro_hours)", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "18:00:00" }],
      proHours: [],
      hasAnyProHours: false, // Pro has never configured working_hours
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("no_pro_hours");
  });

  // ── 10. Weekday mapping uses 0 Sunday through 6 Saturday ─────────────
  it("10. Weekday mapping accurately preserves 0 Sunday through 6 Saturday", () => {
    const sunday = new Date(2026, 8, 6); // 2026-09-06 is Sunday
    const monday = new Date(2026, 8, 7); // 2026-09-07 is Monday
    const saturday = new Date(2026, 8, 12); // 2026-09-12 is Saturday

    expect(sunday.getDay()).toBe(0);
    expect(monday.getDay()).toBe(1);
    expect(saturday.getDay()).toBe(6);
  });

  // ── 11. Local date does not shift to adjacent day ────────────────────
  it("11. Local date does not shift to adjacent day during availability calculation", async () => {
    let capturedWeekday: number | null = null;
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === "barbershop_business_hours") {
        return {
          select: () => ({
            eq: (_col1: string, _val1: any) => ({
              eq: (_col2: string, weekdayVal: any) => {
                capturedWeekday = weekdayVal;
                return Promise.resolve({
                  data: [{ opens_at: "09:00:00", closes_at: "12:00:00" }],
                  error: null,
                });
              },
            }),
          }),
        };
      }
      if (table === "working_hours") {
        return {
          select: (cols?: string) => {
            if (cols === "id") {
              return {
                in: () => ({
                  limit: vi.fn().mockResolvedValue({ data: [{ id: "1" }], error: null }),
                }),
              };
            }
            return {
              in: () => ({
                eq: vi.fn().mockResolvedValue({
                  data: [{ professional_id: "pro1", start_time: "09:00:00", end_time: "12:00:00" }],
                  error: null,
                }),
              }),
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
      if (table === "time_off") {
        return { select: () => ({ in: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
      }
      return { select: vi.fn() };
    });
    (supabase.rpc as any).mockResolvedValue({ data: [], error: null });

    // Test a specific calendar date in local time
    const testDate = addDays(new Date(), 7);
    testDate.setHours(23, 30, 0, 0);
    const localWeekday = testDate.getDay();

    await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date: testDate,
      durationMinutes: 30,
    });

    expect(capturedWeekday).toBe(localWeekday);
  });

  // ── 12. Past date returns emptyReason=past_date ──────────────────────
  it("12. Past date returns emptyReason=past_date", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "18:00:00" }],
      proHours: [{ professional_id: "pro1", start_time: "09:00:00", end_time: "18:00:00" }],
    });
    const pastDate = addDays(new Date(), -2);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date: pastDate,
      durationMinutes: 30,
    });
    expect(result.times).toEqual([]);
    expect(result.emptyReason).toBe("past_date");
  });

  // ── 13. Supabase query error throws ──────────────────────────────────
  it("13. Supabase query error throws without being swallowed", async () => {
    (supabase.from as any).mockImplementation(() => ({
      select: () => ({
        eq: () => ({
          eq: vi.fn().mockResolvedValue({ data: null, error: { message: "connection timeout" } }),
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
    ).rejects.toThrow("Query failure: connection timeout");
  });

  // ── 14. Format mismatch (HH:mm vs HH:mm:ss) normalizes properly ─────
  it("14. Format mismatch (HH:mm vs HH:mm:ss) normalizes properly", async () => {
    mockSupabase({
      shopHours: [{ opens_at: "09:00:00", closes_at: "18:00:00" }],
      proHours: [
        {
          professional_id: "pro1",
          start_time: "09:00",
          end_time: "18:00",
          break_start: "12:00:00",
          break_end: "13:00",
        },
      ],
    });
    const date = addDays(new Date(), 1);
    const result = await service.getAvailableSlots({
      barbershopId: "shop1",
      professionalId: "pro1",
      date,
      durationMinutes: 60,
      intervalMinutes: 60,
    });
    expect(result.times).toContain("09:00");
    expect(result.times).toContain("10:00");
    expect(result.times).toContain("11:00");
    expect(result.times).not.toContain("12:00");
    expect(result.times).toContain("13:00");
    expect(result.times).toContain("17:00");
  });
});
