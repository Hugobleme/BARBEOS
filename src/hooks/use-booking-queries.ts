import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addDays, startOfDay, parse, addMinutes, isBefore } from "date-fns";

export type Service = { id: string; name: string; duration_min: number; price: number; description: string | null };
export type Pro = { id: string; display_name: string; avatar_url: string | null; specialties: string[] | null };

export function useBookingQueries(shopSlug: string | undefined, date: Date | undefined, proId: string, pickedServices: Service[], totalDuration: number) {
  
  const { data: shop, isLoading: shopLoading, error: shopError } = useQuery({
    queryKey: ["book-shop", shopSlug],
    enabled: !!shopSlug,
    queryFn: async () => {
      const data = await barbershopService.getPublicBarbershopBySlug(shopSlug!);
      return data;
    },
  });

  const { data: services = [], isLoading: svcsLoading, error: svcsError } = useQuery({
    queryKey: ["book-services", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id, name, duration_min, price, description").eq("barbershop_id", shop!.id).eq("active", true).order("name");
      if (error) throw error;
      return (data as Service[]) || [];
    },
  });

  const { data: pros = [], isLoading: prosLoading, error: prosError } = useQuery({
    queryKey: ["book-pros", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("id, display_name, avatar_url, specialties").eq("barbershop_id", shop!.id).eq("active", true);
      if (error) throw error;
      return (data as Pro[]) || [];
    },
  });

  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useQuery({
    queryKey: ["book-slots", shop?.id, proId, date?.toISOString(), totalDuration],
    enabled: !!shop?.id && !!date && pickedServices.length > 0 && pros.length > 0,
    queryFn: async () => {
      try {
        const selectedPros = proId === "any" ? pros : pros.filter(p => p.id === proId);
        if (selectedPros.length === 0) return { times: [], timeToPros: {} };
        
        const proIds = selectedPros.map(p => p.id);
        const jsDay = date!.getDay();
        
        const { data: whData, error: whErr } = await supabase
          .from("working_hours")
          .select("*")
          .in("professional_id", proIds)
          .eq("weekday", jsDay);
        if (whErr) throw whErr;
        
        const dayStart = startOfDay(date!);
        const dayEnd = addDays(dayStart, 1);
        
        const { data: toData, error: toErr } = await supabase
          .from("time_off")
          .select("*")
          .in("professional_id", proIds)
          .gte("end_time", dayStart.toISOString())
          .lte("start_time", dayEnd.toISOString());
        if (toErr) throw toErr;
        
        const { data: apData, error: apErr } = await supabase
          .from("appointments")
          .select("professional_id, scheduled_start, scheduled_end, status")
          .in("professional_id", proIds)
          .gte("scheduled_end", dayStart.toISOString())
          .lt("scheduled_start", dayEnd.toISOString())
          .neq("status", "cancelled");
        if (apErr) throw apErr;

        const times = new Set<string>();
        const timeToPros: Record<string, string[]> = {};
        const now = new Date();

        for (const p of selectedPros) {
          const w = whData?.find(x => x.professional_id === p.id);
          if (!w || !w.is_working) continue;
          
          let curr = parse(w.start_time, "HH:mm:ss", date!);
          const end = parse(w.end_time, "HH:mm:ss", date!);
          
          const pOffs = toData?.filter(x => x.professional_id === p.id) || [];
          const pApts = apData?.filter(x => x.professional_id === p.id) || [];
          
          while (isBefore(addMinutes(curr, totalDuration), end) || curr.getTime() + totalDuration * 60000 === end.getTime()) {
            const cEnd = addMinutes(curr, totalDuration);
            if (isBefore(curr, now)) {
              curr = addMinutes(curr, 15);
              continue;
            }
            
            const overlapsOff = pOffs.some(off => {
              const oS = new Date(off.start_time);
              const oE = new Date(off.end_time);
              return curr < oE && cEnd > oS;
            });
            if (overlapsOff) {
              curr = addMinutes(curr, 15);
              continue;
            }
            
            const overlapsApt = pApts.some(apt => {
              const aS = new Date(apt.scheduled_start);
              const aE = new Date(apt.scheduled_end);
              return curr < aE && cEnd > aS;
            });
            
            if (!overlapsApt) {
              const tStr = `${curr.getHours().toString().padStart(2, "0")}:${curr.getMinutes().toString().padStart(2, "0")}`;
              times.add(tStr);
              if (!timeToPros[tStr]) timeToPros[tStr] = [];
              timeToPros[tStr].push(p.id);
            }
            curr = addMinutes(curr, 15);
          }
        }
        
        return {
          times: Array.from(times).sort(),
          timeToPros
        };
      } catch (err) {
        if (import.meta.env.DEV) console.error("Booking page load failed: slots", err);
        throw err;
      }
    }
  });

  return {
    shop, shopLoading, shopError,
    services, svcsLoading, svcsError,
    pros, prosLoading, prosError,
    slotsData, slotsLoading, slotsError
  };
}
