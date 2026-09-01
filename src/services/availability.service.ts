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

export class AvailabilityService {
  async getAvailableSlots(params: AvailabilityParams): Promise<{ times: string[], timeToPros: Record<string, string[]> }> {
    const { barbershopId, professionalId, date, durationMinutes, intervalMinutes = 30 } = params;

    const now = new Date();
    // 1. Validate date
    if (isBefore(date, new Date(now.getFullYear(), now.getMonth(), now.getDate()))) {
      return { times: [], timeToPros: {} };
    }

    const weekday = date.getDay(); 
    const dateStr = format(date, "yyyy-MM-dd");

    // 2. Load barbershop operating intervals
    const { data: shopHours, error: shopErr } = await supabase
      .from("barbershop_business_hours")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("weekday", weekday);

    if (shopErr) throw new Error("Query failure: " + shopErr.message);
    if (!shopHours || shopHours.length === 0) {
      // throw new Error("No business hours configured");
      return { times: [], timeToPros: {} }; // gracefully return empty
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
      if (!pros || pros.length === 0) return { times: [], timeToPros: {} };
      proIdsToFetch = pros.map(p => p.id);
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

    const { data: conflicts, error: conflictsErr } = await supabase
      .rpc("get_public_appointments", {
        p_barbershop_id: barbershopId,
        p_date: dateStr
      });
    if (conflictsErr) throw new Error("Query failure: " + conflictsErr.message);

    let allSlots: AvailableSlot[] = [];

    for (const pId of proIdsToFetch) {
      let intervals = [];

      const specificProHours = (proHours || []).filter(ph => ph.professional_id === pId);
      if (specificProHours.length > 0) {
        for (const ph of specificProHours) {
           if (ph.break_start && ph.break_end) {
             intervals.push({ start: ph.start_time, end: ph.break_start });
             intervals.push({ start: ph.break_end, end: ph.end_time });
           } else {
             intervals.push({ start: ph.start_time, end: ph.end_time });
           }
        }
      } else {
        for (const sh of shopHours) {
          intervals.push({ start: sh.opens_at, end: sh.closes_at });
        }
      }

      const proTimeOffs = (timeOffs || []).filter(to => to.professional_id === pId);
      const proConflicts = (conflicts || []).filter((c: any) => c.professional_id === pId);


      const toMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(":");
        return parseInt(h, 10) * 60 + parseInt(m, 10);
      };

      for (const inv of intervals) {
        let currentMins = toMinutes(inv.start);
        const endMins = toMinutes(inv.end);

        while (currentMins + durationMinutes <= endMins) {
          const slotStart = new Date(`${dateStr}T${Math.floor(currentMins / 60).toString().padStart(2, '0')}:${(currentMins % 60).toString().padStart(2, '0')}:00`);
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
              professionalId: pId
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

    return {
       times: Array.from(times).sort(),
       timeToPros
    };
  }
}

export const availabilityService = new AvailabilityService();
