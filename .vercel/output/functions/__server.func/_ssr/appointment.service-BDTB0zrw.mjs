import { s as supabase } from "./client-BmPKwOzk.mjs";
const appointmentService = {
  /**
   * Verifica se o horário possui conflito com outro agendamento existente
   */
  async checkSlotAvailable(params) {
    const { barbershopId, professionalId, start, end, excludeAppointmentId } = params;
    if (start < /* @__PURE__ */ new Date()) {
      throw new Error("Não é possível agendar no passado");
    }
    let query = supabase.from("appointments").select("id").eq("barbershop_id", barbershopId).neq("status", "cancelled").lt("scheduled_start", end.toISOString()).gt("scheduled_end", start.toISOString());
    if (professionalId) {
      query = query.eq("professional_id", professionalId);
    }
    if (excludeAppointmentId) {
      query = query.neq("id", excludeAppointmentId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data?.length ?? 0) === 0;
  },
  /**
   * Cria um novo agendamento com validação completa de disponibilidade e cálculo de término
   */
  async createAppointment(input) {
    const {
      barbershopId,
      professionalId,
      services,
      customerData,
      userId,
      notes,
      source = "web"
    } = input;
    const startsAt = input.startsAt || input.scheduledStart;
    if (!startsAt) {
      throw new Error("Data e horário de início são obrigatórios.");
    }
    if (startsAt < /* @__PURE__ */ new Date()) {
      throw new Error("Não é possível agendar no passado");
    }
    if (!services || services.length === 0) {
      throw new Error("Selecione pelo menos um serviço.");
    }
    const totalDurationMinutes = services.reduce((acc, s) => {
      const dur = s.duration_min ?? s.durationMinutes ?? 30;
      return acc + dur;
    }, 0);
    const endsAt = new Date(startsAt.getTime() + totalDurationMinutes * 6e4);
    const totalPrice = services.reduce((acc, s) => acc + Number(s.price ?? 0), 0);
    const isAvailable = await this.checkSlotAvailable({
      barbershopId,
      professionalId: professionalId || null,
      start: startsAt,
      end: endsAt
    });
    if (!isAvailable) {
      throw new Error("O horário selecionado já está reservado. Por favor, escolha outro horário.");
    }
    let customerId = null;
    if (userId) {
      const { data: existingCustomer } = await supabase.from("customers").select("id, blocked").eq("barbershop_id", barbershopId).eq("profile_id", userId).maybeSingle();
      if (existingCustomer) {
        if (existingCustomer.blocked) {
          throw new Error("Seu cadastro está temporariamente bloqueado. Entre em contato com a barbearia.");
        }
        customerId = existingCustomer.id;
      } else {
        const { data: newCust, error: custErr } = await supabase.from("customers").insert({
          barbershop_id: barbershopId,
          profile_id: userId,
          full_name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || null
        }).select("id").single();
        if (custErr) throw custErr;
        customerId = newCust.id;
      }
    } else {
      const { data: newCust, error: custErr } = await supabase.from("customers").insert({
        barbershop_id: barbershopId,
        full_name: customerData.name,
        phone: customerData.phone,
        email: customerData.email || null
      }).select("id").single();
      if (custErr) throw custErr;
      customerId = newCust.id;
    }
    if (!customerId) {
      throw new Error("Falha ao registrar cliente para o agendamento.");
    }
    const initialStatus = input.status || "scheduled";
    const { data: appt, error: apptErr } = await supabase.from("appointments").insert({
      barbershop_id: barbershopId,
      customer_id: customerId,
      professional_id: professionalId || "",
      scheduled_start: startsAt.toISOString(),
      scheduled_end: endsAt.toISOString(),
      total_amount: totalPrice,
      status: initialStatus,
      source,
      notes: notes || null,
      created_by: userId || null
    }).select("id, scheduled_start, scheduled_end, total_amount, status").single();
    if (apptErr) throw apptErr;
    const apptServices = services.map((s) => ({
      appointment_id: appt.id,
      service_id: s.id,
      price_snapshot: s.price ?? 0,
      duration_snapshot: s.duration_min ?? s.durationMinutes ?? 30
    }));
    const { error: servErr } = await supabase.from("appointment_services").insert(apptServices);
    if (servErr) throw servErr;
    return appt;
  },
  async getByDate(shopId, date, filters) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    let query = supabase.from("appointments").select("*, barbershop:barbershops(name), professional:professionals(id, display_name, commission_rule), customer:customers(full_name, phone)").eq("barbershop_id", shopId).gte("scheduled_start", startOfDay.toISOString()).lte("scheduled_start", endOfDay.toISOString());
    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters?.professionalId && filters.professionalId !== "all") {
      query = query.eq("professional_id", filters.professionalId);
    }
    if (filters?.source && filters.source !== "all") {
      query = query.eq("source", filters.source);
    }
    if (filters?.q) {
      query = query.or(`customer.full_name.ilike.%${filters.q}%,customer.phone.ilike.%${filters.q}%`);
    }
    const { data, error } = await query.order("scheduled_start", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  async getTodayAppointments(shopId) {
    return this.getByDate(shopId, /* @__PURE__ */ new Date());
  },
  async getNextAppointments(shopId, limit = 5) {
    const now = /* @__PURE__ */ new Date();
    const { data, error } = await supabase.from("appointments").select("*, barbershop:barbershops(name), professional:professionals(id, display_name, commission_rule), customer:customers(full_name, phone)").eq("barbershop_id", shopId).gte("scheduled_start", now.toISOString()).in("status", ["scheduled", "in_progress"]).order("scheduled_start", { ascending: true }).limit(limit);
    if (error) throw error;
    return data ?? [];
  },
  async updateStatus(id, status) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) throw error;
  },
  async completeAndPay(params) {
    const { error: apptErr } = await supabase.from("appointments").update({ status: "completed" }).eq("id", params.appointmentId);
    if (apptErr) throw apptErr;
    const { data: tx, error: txErr } = await supabase.from("cash_transactions").insert({
      barbershop_id: params.barbershopId,
      session_id: params.sessionId,
      appointment_id: params.appointmentId,
      customer_id: params.customerId,
      professional_id: params.professionalId,
      kind: "sale",
      method: params.method,
      amount: params.amount,
      description: "Serviço realizado (Agenda)",
      created_by: params.userId
    }).select().single();
    if (txErr) throw txErr;
    const { data: appt } = await supabase.from("appointments").select("professional:professionals(commission_rule)").eq("id", params.appointmentId).single();
    if (appt?.professional?.commission_rule) {
      const rule = appt.professional.commission_rule;
      const rate = Number(rule.percentage ?? 0) / 100;
      if (rate > 0) {
        const commissionAmount = params.amount * rate;
        await supabase.from("commissions").insert({
          barbershop_id: params.barbershopId,
          professional_id: params.professionalId,
          appointment_id: params.appointmentId,
          transaction_id: tx.id,
          amount: commissionAmount,
          base_amount: params.amount,
          rate,
          status: "pending"
        });
      }
    }
    return tx;
  }
};
export {
  appointmentService as a
};
