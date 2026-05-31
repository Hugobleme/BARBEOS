import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  professional?: { id: string; display_name: string; commission_rule?: any };
  customer?: { full_name: string; phone?: string | null };
};

export type AppointmentStatus = Database["public"]["Enums"]["appointment_status"];

export const appointmentService = {
  async getByDate(shopId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from("appointments")
      .select("*, professional:professionals(id, display_name, commission_rule), customer:customers(full_name, phone)")
      .eq("barbershop_id", shopId)
      .gte("scheduled_start", startOfDay.toISOString())
      .lte("scheduled_start", endOfDay.toISOString())
      .order("scheduled_start");

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
          description: `Comissão (${(rate * 100).toFixed(0)}%) sobre ${params.amount}`,
        });
      }
    }

    return tx;
  }
};
