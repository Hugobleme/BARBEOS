import { supabase } from "@/integrations/supabase/client";
import { format, addMinutes, isBefore, isAfter } from "date-fns";

export type AvailableSlot = {
  time: string; // HH:mm
  professionalId: string | null; // null if any
};

export type AvailabilityParams = {
  barbershopId: string;
  professionalId?: string | null;
  date: Date;
  durationMinutes: number;
  intervalMinutes?: number;
};

export type EmptyReason =
  | "past_date"
  | "no_shop_hours"
  | "closed_day"
  | "no_professionals"
  | "no_pro_hours"
  | "all_booked"
  | null;

export type AvailabilityResult = {
  times: string[];
  timeToPros: Record<string, string[]>;
  emptyReason: EmptyReason;
};

export class AvailabilityService {
  /**
   * Check if a barbershop has any business hours configured at all (any weekday).
   */
  async hasAnyBusinessHours(barbershopId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("barbershop_business_hours")
      .select("id")
      .eq("barbershop_id", barbershopId)
      .limit(1);
    if (error) return false;
    return (data?.length ?? 0) > 0;
  }

  /**
   * Check if given professional(s) have any working hours configured at all (any weekday).
   */
  async hasAnyWorkingHours(proIds: string[]): Promise<boolean> {
    if (!proIds || proIds.length === 0) return false;
    const { data, error } = await supabase
      .from("working_hours")
      .select("id")
      .in("professional_id", proIds)
      .limit(1);
    if (error) return false;
    return (data?.length ?? 0) > 0;
  }

  async getAvailableSlots(params: AvailabilityParams): Promise<AvailabilityResult> {
    const { barbershopId, professionalId, date, durationMinutes, intervalMinutes = 30 } = params;

    const now = new Date();
    // 1. Validate date
    if (isBefore(date, new Date(now.getFullYear(), now.getMonth(), now.getDate()))) {
      return { times: [], timeToPros: {}, emptyReason: "past_date" };
    }

    const weekday = date.getDay();
    const dateStr = format(date, "yyyy-MM-dd");

    // 2. Load barbershop operating intervals for this weekday
    const { data: shopHours, error: shopErr } = await supabase
      .from("barbershop_business_hours")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("weekday", weekday);

    if (shopErr) throw new Error("Query failure: " + shopErr.message);

    if (!shopHours || shopHours.length === 0) {
      // Distinguish: no hours configured AT ALL vs. closed on this specific day
      const hasAny = await this.hasAnyBusinessHours(barbershopId);
      const reason: EmptyReason = hasAny ? "closed_day" : "no_shop_hours";

      if (import.meta.env.DEV) {
        console.debug("[booking/availability]", {
          barbershopId,
          weekday,
          dateStr,
          reason,
          shopHoursCount: 0,
        });
      }

      return { times: [], timeToPros: {}, emptyReason: reason };
    }

    // 3. Resolve professional intervals
    let proIdsToFetch: string[] = [];
    if (professionalId && professionalId !== "any") {
      proIdsToFetch = [professionalId];
    } else {
      const { data: pros, error: prosErr } = await supabase
        .from("professionals")
        .select("id")
        .eq("barbershop_id", barbershopId)
        .eq("active", true);
      if (prosErr) throw new Error("Query failure: " + prosErr.message);
      if (!pros || pros.length === 0) {
        return { times: [], timeToPros: {}, emptyReason: "no_professionals" };
      }
      proIdsToFetch = pros.map((p) => p.id);
    }

    // Check if relevant professional(s) have ANY working hours configured at all
    const hasAnyProHours = await this.hasAnyWorkingHours(proIdsToFetch);
    if (!hasAnyProHours) {
      if (import.meta.env.DEV) {
        console.debug(
          "[booking/availability] No working hours configured for professional(s):",
          proIdsToFetch,
        );
      }
      return { times: [], timeToPros: {}, emptyReason: "no_pro_hours" };
    }

    const { data: proHours, error: proHoursErr } = await supabase
      .from("working_hours")
      .select("*")
      .in("professional_id", proIdsToFetch)
      .eq("weekday", weekday);
    if (proHoursErr) throw new Error("Query failure: " + proHoursErr.message);

    const { data: timeOffs, error: timeOffsErr } = await supabase
      .from("time_off")
      .select("*")
      .in("professional_id", proIdsToFetch);
    if (timeOffsErr) throw new Error("Query failure: " + timeOffsErr.message);

    const { data: conflicts, error: conflictsErr } = await supabase.rpc("get_public_appointments", {
      p_barbershop_id: barbershopId,
      p_date: dateStr,
    });
    if (conflictsErr) throw new Error("Query failure: " + conflictsErr.message);

    if (import.meta.env.DEV) {
      console.debug("[booking/availability]", {
        barbershopId,
        professionalId,
        date: date?.toISOString?.() ?? date,
        weekday,
        durationMinutes,
        intervalMinutes,
        shopHoursCount: shopHours?.length ?? 0,
        professionalHoursCount: proHours?.length ?? 0,
        timeOffCount: timeOffs?.length ?? 0,
        conflictCount: conflicts?.length ?? 0,
      });
    }

    const allSlots: AvailableSlot[] = [];

    const toMinutes = (timeStr: string) => {
      if (!timeStr) return 0;
      const [h, m] = timeStr.split(":");
      return parseInt(h, 10) * 60 + parseInt(m, 10);
    };

    for (const pId of proIdsToFetch) {
      const intervals: { start: string; end: string }[] = [];

      const specificProHours = (proHours || []).filter((ph) => ph.professional_id === pId);
      if (specificProHours.length === 0) {
        // Professional does not work on this weekday (day off)
        continue;
      }

      for (const ph of specificProHours) {
        // Split around break if applicable
        const proIntervals: { start: string; end: string }[] = [];
        if (ph.break_start && ph.break_end) {
          proIntervals.push({ start: ph.start_time, end: ph.break_start });
          proIntervals.push({ start: ph.break_end, end: ph.end_time });
        } else {
          proIntervals.push({ start: ph.start_time, end: ph.end_time });
        }

        // Intersect professional intervals with barbershop business hours
        for (const pi of proIntervals) {
          for (const sh of shopHours) {
            const piStartMin = toMinutes(pi.start);
            const piEndMin = toMinutes(pi.end);
            const shOpenMin = toMinutes(sh.opens_at);
            const shCloseMin = toMinutes(sh.closes_at);
            const effStartMin = Math.max(piStartMin, shOpenMin);
            const effEndMin = Math.min(piEndMin, shCloseMin);
            if (effStartMin < effEndMin) {
              const startStr = `${Math.floor(effStartMin / 60)
                .toString()
                .padStart(2, "0")}:${(effStartMin % 60).toString().padStart(2, "0")}`;
              const endStr = `${Math.floor(effEndMin / 60)
                .toString()
                .padStart(2, "0")}:${(effEndMin % 60).toString().padStart(2, "0")}`;
              intervals.push({ start: startStr, end: endStr });
            }
          }
        }
      }

      const proTimeOffs = (timeOffs || []).filter((to) => to.professional_id === pId);
      const proConflicts = (conflicts || []).filter((c: any) => c.professional_id === pId);

      for (const inv of intervals) {
        let currentMins = toMinutes(inv.start);
        const endMins = toMinutes(inv.end);

        while (currentMins + durationMinutes <= endMins) {
          const slotStart = new Date(
            `${dateStr}T${Math.floor(currentMins / 60)
              .toString()
              .padStart(2, "0")}:${(currentMins % 60).toString().padStart(2, "0")}:00`,
          );
          const slotEnd = addMinutes(slotStart, durationMinutes);

          if (isBefore(slotStart, now)) {
            currentMins += intervalMinutes;
            continue;
          }

          let hasTimeOff = false;
          for (const to of proTimeOffs) {
            const toStart = new Date(to.start_at);
            const toEnd = new Date(to.end_at);
            if (isBefore(slotStart, toEnd) && isAfter(slotEnd, toStart)) {
              hasTimeOff = true;
              break;
            }
          }

          if (hasTimeOff) {
            currentMins += intervalMinutes;
            continue;
          }

          let hasConflict = false;
          for (const c of proConflicts) {
            const cStart = new Date(c.scheduled_start);
            const cEnd = new Date(c.scheduled_end);
            if (isBefore(slotStart, cEnd) && isAfter(slotEnd, cStart)) {
              hasConflict = true;
              break;
            }
          }

          if (!hasConflict) {
            allSlots.push({
              time: format(slotStart, "HH:mm"),
              professionalId: pId,
            });
          }
          currentMins += intervalMinutes;
        }
      }
    }

    const times = new Set<string>();
    const timeToPros: Record<string, string[]> = {};

    for (const s of allSlots) {
      times.add(s.time);
      if (!timeToPros[s.time]) timeToPros[s.time] = [];
      if (s.professionalId) {
        timeToPros[s.time].push(s.professionalId);
      }
    }

    if (import.meta.env.DEV) {
      console.debug("[booking/availability] generatedSlotsCount:", times.size);
    }

    return {
      times: Array.from(times).sort(),
      timeToPros,
      emptyReason: times.size === 0 ? "all_booked" : null,
    };
  }
}

export const availabilityService = new AvailabilityService();
