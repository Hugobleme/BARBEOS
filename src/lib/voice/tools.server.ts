// Tool implementations called by Aurora. All scoped to a single barbershop_id.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const auroraTools = [
  {
    type: "function",
    function: {
      name: "listar_servicos",
      description: "Lista os serviços ativos da barbearia (nome, duração, preço).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "listar_profissionais",
      description: "Lista os profissionais ativos. Opcionalmente filtra por serviço.",
      parameters: {
        type: "object",
        properties: { service_id: { type: "string", description: "UUID do serviço (opcional)" } },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "buscar_horarios_disponiveis",
      description: "Retorna horários livres em um intervalo de datas para um serviço, opcionalmente filtrando por profissional.",
      parameters: {
        type: "object",
        properties: {
          service_id: { type: "string" },
          professional_id: { type: "string", description: "Opcional" },
          date_from: { type: "string", description: "ISO date YYYY-MM-DD" },
          date_to: { type: "string", description: "ISO date YYYY-MM-DD" },
        },
        required: ["service_id", "date_from", "date_to"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "identificar_cliente",
      description: "Identifica um cliente pelo telefone (formato livre). Retorna dados básicos ou nulo.",
      parameters: {
        type: "object",
        properties: { phone: { type: "string" } },
        required: ["phone"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_agendamento",
      description: "Cria um agendamento. Se o cliente não existir, cria pelo nome+telefone.",
      parameters: {
        type: "object",
        properties: {
          service_id: { type: "string" },
          professional_id: { type: "string" },
          scheduled_start: { type: "string", description: "ISO datetime" },
          customer_name: { type: "string" },
          customer_phone: { type: "string" },
        },
        required: ["service_id", "professional_id", "scheduled_start", "customer_name", "customer_phone"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cancelar_agendamento",
      description: "Cancela um agendamento existente pelo id.",
      parameters: {
        type: "object",
        properties: { appointment_id: { type: "string" } },
        required: ["appointment_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "informacoes_barbearia",
      description: "Retorna nome, endereço, contatos e descrição da barbearia.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

function normalizePhone(p: string): string {
  return p.replace(/\D+/g, "");
}

export async function runTool(name: string, args: Record<string, unknown>, barbershopId: string): Promise<unknown> {
  const db = supabaseAdmin;

  switch (name) {
    case "listar_servicos": {
      const { data, error } = await db
        .from("services")
        .select("id,name,duration_min,price,description")
        .eq("barbershop_id", barbershopId)
        .eq("active", true)
        .order("sort", { ascending: true });
      if (error) throw error;
      return { services: data ?? [] };
    }

    case "listar_profissionais": {
      const serviceId = args.service_id as string | undefined;
      if (serviceId) {
        const { data, error } = await db
          .from("service_professionals")
          .select("professional:professionals(id,display_name,bio,specialties,active,barbershop_id)")
          .eq("service_id", serviceId);
        if (error) throw error;
        const pros = (data ?? [])
          .map((r: { professional: { id: string; display_name: string; bio: string | null; specialties: string[] | null; active: boolean; barbershop_id: string } | null }) => r.professional)
          .filter((p): p is NonNullable<typeof p> => !!p && p.active && p.barbershop_id === barbershopId);
        return { professionals: pros };
      }
      const { data, error } = await db
        .from("professionals")
        .select("id,display_name,bio,specialties")
        .eq("barbershop_id", barbershopId)
        .eq("active", true);
      if (error) throw error;
      return { professionals: data ?? [] };
    }

    case "buscar_horarios_disponiveis": {
      const serviceId = args.service_id as string;
      const proIdFilter = args.professional_id as string | undefined;
      const dateFrom = args.date_from as string;
      const dateTo = args.date_to as string;

      const { data: svc, error: svcErr } = await db
        .from("services")
        .select("duration_min,barbershop_id")
        .eq("id", serviceId)
        .single();
      if (svcErr || !svc || svc.barbershop_id !== barbershopId) throw new Error("Serviço inválido");
      const durMin = svc.duration_min;

      // Profissionais habilitados
      let proIds: string[] = [];
      if (proIdFilter) {
        proIds = [proIdFilter];
      } else {
        const { data: sp } = await db
          .from("service_professionals")
          .select("professional_id")
          .eq("service_id", serviceId);
        proIds = (sp ?? []).map((r: { professional_id: string }) => r.professional_id);
      }
      if (proIds.length === 0) return { slots: [] };

      const { data: wh } = await db
        .from("working_hours")
        .select("professional_id,weekday,start_time,end_time,break_start,break_end")
        .in("professional_id", proIds);

      const fromTs = new Date(`${dateFrom}T00:00:00-03:00`).toISOString();
      const toTs = new Date(`${dateTo}T23:59:59-03:00`).toISOString();
      const { data: appts } = await db
        .from("appointments")
        .select("professional_id,scheduled_start,scheduled_end,status")
        .in("professional_id", proIds)
        .gte("scheduled_start", fromTs)
        .lte("scheduled_start", toTs)
        .neq("status", "cancelled");

      const slots: Array<{ professional_id: string; start: string; end: string }> = [];
      const start = new Date(dateFrom + "T00:00:00-03:00");
      const end = new Date(dateTo + "T00:00:00-03:00");
      for (let d = new Date(start); d <= end && slots.length < 30; d.setDate(d.getDate() + 1)) {
        const weekday = d.getDay();
        const dateStr = d.toISOString().slice(0, 10);
        for (const proId of proIds) {
          const hours = (wh ?? []).filter((h: { professional_id: string; weekday: number }) => h.professional_id === proId && h.weekday === weekday);
          for (const h of hours as Array<{ professional_id: string; start_time: string; end_time: string; break_start: string | null; break_end: string | null }>) {
            const dayStart = new Date(`${dateStr}T${h.start_time}-03:00`);
            const dayEnd = new Date(`${dateStr}T${h.end_time}-03:00`);
            const breakStart = h.break_start ? new Date(`${dateStr}T${h.break_start}-03:00`) : null;
            const breakEnd = h.break_end ? new Date(`${dateStr}T${h.break_end}-03:00`) : null;
            for (let t = new Date(dayStart); t.getTime() + durMin * 60000 <= dayEnd.getTime(); t = new Date(t.getTime() + 30 * 60000)) {
              const slotEnd = new Date(t.getTime() + durMin * 60000);
              if (t < new Date()) continue;
              if (breakStart && breakEnd && t < breakEnd && slotEnd > breakStart) continue;
              const conflict = (appts ?? []).some((a: { professional_id: string; scheduled_start: string; scheduled_end: string }) =>
                a.professional_id === proId &&
                new Date(a.scheduled_start) < slotEnd &&
                new Date(a.scheduled_end) > t
              );
              if (conflict) continue;
              slots.push({ professional_id: proId, start: t.toISOString(), end: slotEnd.toISOString() });
              if (slots.length >= 30) break;
            }
            if (slots.length >= 30) break;
          }
        }
      }
      return { slots };
    }

    case "identificar_cliente": {
      const phone = normalizePhone(args.phone as string);
      if (!phone) return { customer: null };
      const { data } = await db
        .from("customers")
        .select("id,full_name,phone,no_show_count,blocked")
        .eq("barbershop_id", barbershopId)
        .ilike("phone", `%${phone.slice(-8)}%`)
        .limit(1);
      return { customer: data?.[0] ?? null };
    }

    case "criar_agendamento": {
      const phone = normalizePhone(args.customer_phone as string);
      const name = (args.customer_name as string).trim();
      const serviceId = args.service_id as string;
      const proId = args.professional_id as string;
      const startIso = args.scheduled_start as string;

      // Encontra ou cria cliente
      let customerId: string | null = null;
      if (phone) {
        const { data: existing } = await db
          .from("customers")
          .select("id,blocked")
          .eq("barbershop_id", barbershopId)
          .ilike("phone", `%${phone.slice(-8)}%`)
          .limit(1);
        if (existing?.[0]) {
          if (existing[0].blocked) return { error: "Cliente bloqueado por excesso de faltas." };
          customerId = existing[0].id;
        }
      }
      if (!customerId) {
        const { data: created, error: cErr } = await db
          .from("customers")
          .insert({ barbershop_id: barbershopId, full_name: name, phone })
          .select("id")
          .single();
        if (cErr) throw cErr;
        customerId = created.id;
      }

      const { data: svc } = await db
        .from("services")
        .select("duration_min,price,barbershop_id")
        .eq("id", serviceId)
        .single();
      if (!svc || svc.barbershop_id !== barbershopId) return { error: "Serviço inválido." };
      const start = new Date(startIso);
      const end = new Date(start.getTime() + svc.duration_min * 60000);

      // Verifica conflito
      const { data: conflicts } = await db
        .from("appointments")
        .select("id")
        .eq("professional_id", proId)
        .neq("status", "cancelled")
        .lt("scheduled_start", end.toISOString())
        .gt("scheduled_end", start.toISOString());
      if (conflicts && conflicts.length > 0) return { error: "Horário não disponível." };

      const { data: appt, error: aErr } = await db
        .from("appointments")
        .insert({
          barbershop_id: barbershopId,
          customer_id: customerId,
          professional_id: proId,
          scheduled_start: start.toISOString(),
          scheduled_end: end.toISOString(),
          total_amount: svc.price,
          source: "aurora",
          status: "scheduled",
        })
        .select("id")
        .single();
      if (aErr) throw aErr;

      await db.from("appointment_services").insert({
        appointment_id: appt.id,
        service_id: serviceId,
        price_snapshot: svc.price,
        duration_snapshot: svc.duration_min,
      });

      return { appointment_id: appt.id, scheduled_start: start.toISOString(), scheduled_end: end.toISOString() };
    }

    case "cancelar_agendamento": {
      const id = args.appointment_id as string;
      const { data: appt } = await db.from("appointments").select("barbershop_id").eq("id", id).single();
      if (!appt || appt.barbershop_id !== barbershopId) return { error: "Agendamento não encontrado." };
      const { error } = await db.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      return { ok: true };
    }

    case "informacoes_barbearia": {
      const { data } = await db
        .from("barbershops")
        .select("name,description,address,contacts,social")
        .eq("id", barbershopId)
        .single();
      return { barbershop: data };
    }

    default:
      return { error: `Tool desconhecida: ${name}` };
  }
}
