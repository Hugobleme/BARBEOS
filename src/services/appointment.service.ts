// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  professional?: { id: string; display_name: string; commission_rule?: any };
  customer?: { full_name: string; phone?: string | null };
};

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export interface ServiceItem {
  id: string;
  name?: string;
  price?: number;
  duration_min?: number;
  durationMinutes?: number;
}

export interface CreateAppointmentInput {
  barbershopId: string;
  professionalId?: string | null;
  services: ServiceItem[];
  scheduledStart?: Date;
  startsAt?: Date;
  customerId?: string;
  customerData: {
    name: string;
    phone: string;
    email?: string;
  };
  userId?: string | null;
  notes?: string;
  source?: string;
  status?: AppointmentStatus;
}

export const appointmentService = {
  /**
   * Verifica se o horário possui conflito com outro agendamento existente
   */
  async checkSlotAvailable(params: {
    barbershopId: string;
    professionalId?: string | null;
    start: Date;
    end: Date;
    excludeAppointmentId?: string;
  }): Promise<boolean> {
    const { barbershopId, professionalId, start, end, excludeAppointmentId } = params;

    // 1. Não permitir agendamento no passado
    if (start < new Date()) {
      throw new Error("Não Ã© possível agendar no passado");
    }

    // 2. Verificar sobreposiÃ§Ã£o com agendamentos existentes
    let query = supabase
      .from("appointments")
      .select("id")
      .eq("barbershop_id", barbershopId)
      .in("status", ["scheduled", "in_progress"])
      .lt("scheduled_start", end.toISOString())
      .gt("scheduled_end", start.toISOString());

    if (professionalId) {
      query = query.eq("professional_id", professionalId);
    }

    if (excludeAppointmentId) {
      query = query.neq("id", excludeAppointmentId);
    }

    const { data: overlapping, error } = await query;

    if (error) {
      console.error("Erro ao verificar disponibilidade:", error);
      throw error;
    }

    // 3. Verificar time-offs
    let timeOffQuery = supabase
      .from("time_off")
      .select("id")
      .lt("start_at", end.toISOString())
      .gt("end_at", start.toISOString());

    if (professionalId) {
      timeOffQuery = timeOffQuery.eq("professional_id", professionalId);
    }
    
    const { data: overlappingTimeOff } = await timeOffQuery;

    return overlapping.length === 0 && (overlappingTimeOff?.length || 0) === 0;
  },

  /**
   * Cria um novo agendamento com validaÃ§Ã£o completa de disponibilidade e cÃ¡lculo de tÃ©rmino
   */
  async createAppointment(input: CreateAppointmentInput) {
    const {
      barbershopId,
      professionalId,
      services,
      customerData,
      customerId: providedCustomerId,
      userId,
      notes,
      source = "web",
    } = input;

    const startsAt = input.startsAt || input.scheduledStart;
    if (!startsAt) {
      throw new Error("Data e horário de inÃ­cio são obrigatÃ³rios.");
    }

    // 1. ValidaÃ§Ã£o de agendamento no passado
    if (startsAt < new Date()) {
      throw new Error("Não Ã© possível agendar no passado");
    }

    if (!services || services.length === 0) {
      throw new Error("Selecione pelo menos um serviço.");
    }

    // 2. CÃ¡lculo do horário de tÃ©rmino baseado na duraÃ§Ã£o dos serviços
    const totalDurationMinutes = services.reduce((acc, s) => {
      return acc + Number(s.duration_min ?? s.durationMinutes ?? 30);
    }, 0);

    const endsAt = new Date(startsAt.getTime() + totalDurationMinutes * 60000);

    // 3. VerificaÃ§Ã£o de disponibilidade
    const isAvailable = await this.checkSlotAvailable({
      barbershopId,
      professionalId: professionalId || null,
      start: startsAt,
      end: endsAt,
    });

    if (!isAvailable) {
      throw new Error("O horário selecionado já estÃ¡ reservado ou o profissional estÃ¡ indisponível.");
    }

    // 4. Obter ou registrar o cliente
    let customerId: string | null = providedCustomerId || null;
    if (!customerId && userId) {
      const { data: existingCustomer } = await supabase
        .from("customers")
        .select("id, blocked")
        .eq("barbershop_id", barbershopId)
        .eq("profile_id", userId)
        .maybeSingle();

      if (existingCustomer) {
        if (existingCustomer.blocked) {
          throw new Error("Seu cadastro estÃ¡ temporariamente bloqueado. Entre em contato com a barbearia.");
        }
        customerId = existingCustomer.id;
      }
    }
    
    if (!customerId) {
      const { data: newCust, error: custErr } = await supabase
        .from("customers")
        .insert({
          barbershop_id: barbershopId,
          profile_id: userId || null,
          full_name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || null,
        })
        .select("id")
        .single();

      if (custErr) throw custErr;
      customerId = newCust.id;
    }

    // 5. Inserir o agendamento
    const totalPrice = services.reduce((acc, s) => acc + Number(s.price ?? 0), 0);
    const initialStatus: AppointmentStatus = input.status || "scheduled";

    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .insert({
        barbershop_id: barbershopId,
        customer_id: customerId,
        professional_id: professionalId || null,
        scheduled_start: startsAt.toISOString(),
        scheduled_end: endsAt.toISOString(),
        total_amount: totalPrice,
        status: initialStatus,
        source,
        notes: notes || null,
        created_by: userId || null,
      })
      .select("id, scheduled_start, scheduled_end, total_amount, status")
      .single();

    if (apptErr) throw apptErr;

    // 6. Vincular serviços ao agendamento
    const apptServices = services.map((s) => ({
      appointment_id: appt.id,
      service_id: s.id,
      price_snapshot: s.price ?? 0,
      duration_snapshot: s.duration_min ?? s.durationMinutes ?? 30,
    }));

    const { error: servErr } = await supabase
      .from("appointment_services")
      .insert(apptServices);

    if (servErr) throw servErr;

    return appt;
  },

  async getByDate(shopId: string, date: Date, filters?: { status?: string; professionalId?: string; source?: string; q?: string }) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let query = supabase
      .from("appointments")
      .select("*, barbershop:barbershops(name), professional:professionals(id, display_name, commission_rule), customer:customers(full_name, phone)")
      .eq("barbershop_id", shopId)
      .gte("scheduled_start", startOfDay.toISOString())
      .lte("scheduled_start", endOfDay.toISOString());

    if (filters?.status && filters.status !== "all") {
      query = query.eq("status", filters.status as AppointmentStatus);
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
    return (data as Appointment[]) ?? [];
  },

  async getTodayAppointments(shopId: string): Promise<Appointment[]> {
    return this.getByDate(shopId, new Date());
  },

  async getNextAppointments(shopId: string, limit: number = 5): Promise<Appointment[]> {
    const now = new Date();
    const { data, error } = await supabase
      .from("appointments")
      .select("*, barbershop:barbershops(name), professional:professionals(id, display_name, commission_rule), customer:customers(full_name, phone)")
      .eq("barbershop_id", shopId)
      .gte("scheduled_start", now.toISOString())
      .in("status", ["scheduled", "in_progress"])
      .order("scheduled_start", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return (data as Appointment[]) ?? [];
  },

  async updateStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) throw error;
  },

  async completeAndPay(params: {
    appointmentId: string;
    barbershopId: string;
    customerId: string;
    professionalId: string;
    amount: number;
    method: string;
    userId: string;
    sessionId: string;
  }) {
    // 1. Update appointment status
    const { error: apptErr } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", params.appointmentId);
    if (apptErr) throw apptErr;

    // 2. Insert cash transaction
    const { data: tx, error: txErr } = await supabase.from("cash_transactions").insert({
      barbershop_id: params.barbershopId,
      session_id: params.sessionId,
      appointment_id: params.appointmentId,
      customer_id: params.customerId,
      professional_id: params.professionalId,
      kind: "sale",
      method: params.method as any,
      amount: params.amount,
      description: "Serviço realizado (Agenda)",
      created_by: params.userId,
    }).select().single();
    if (txErr) throw txErr;

    // 3. Handle commissions (if any)
    const { data: appt } = await supabase
      .from("appointments")
      .select("professional:professionals(commission_rule)")
      .eq("id", params.appointmentId)
      .single();

    if (appt?.professional?.commission_rule) {
      const rule = appt.professional.commission_rule as any;
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
          rate: rate,
          status: "pending"
        });
      }
    }

    return tx;
  }
};

