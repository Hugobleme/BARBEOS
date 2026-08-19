import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Commission = Database["public"]["Tables"]["commissions"]["Row"] & {
  professional?: { display_name: string } | null;
  appointment?: {
    scheduled_start: string;
    total_amount: number;
    customer?: { full_name: string } | null;
  } | null;
};

export const commissionService = {
  /**
   * Obtém comissões de uma barbearia filtradas por mês e ano
   */
  async getCommissions(barbershopId: string, month?: number, year?: number): Promise<Commission[]> {
    let query = supabase
      .from("commissions")
      .select(`
        *,
        professional:professionals(display_name),
        appointment:appointments(
          scheduled_start,
          total_amount,
          customer:customers(full_name)
        )
      `)
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });

    if (month && year) {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      query = query.gte("created_at", startDate).lte("created_at", endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as any) ?? [];
  },

  /**
   * Calcula o valor da comissão com base no agendamento e regra do profissional
   */
  async calculateCommission(appointmentId: string) {
    const { data: appt, error } = await supabase
      .from("appointments")
      .select(`
        id,
        barbershop_id,
        total_amount,
        professional_id,
        professional:professionals(
          id,
          display_name,
          commission_rule
        )
      `)
      .eq("id", appointmentId)
      .single();

    if (error || !appt) throw error || new Error("Agendamento não encontrado.");

    const rule = (appt.professional?.commission_rule as any) ?? {};
    const percentage = Number(rule.percentage ?? 0);
    const rate = percentage / 100;
    const baseAmount = Number(appt.total_amount || 0);
    const commissionAmount = baseAmount * rate;

    return {
      barbershop_id: appt.barbershop_id,
      professional_id: appt.professional_id,
      appointment_id: appt.id,
      base_amount: baseAmount,
      rate,
      amount: commissionAmount,
    };
  },

  /**
   * Registra uma nova comissão
   */
  async createCommission(data: {
    barbershop_id: string;
    professional_id: string;
    appointment_id?: string;
    transaction_id?: string;
    base_amount: number;
    rate: number;
    amount: number;
  }) {
    const { data: comm, error } = await supabase
      .from("commissions")
      .insert({
        barbershop_id: data.barbershop_id,
        professional_id: data.professional_id,
        appointment_id: data.appointment_id || null,
        transaction_id: data.transaction_id || null,
        base_amount: data.base_amount,
        rate: data.rate,
        amount: data.amount,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return comm;
  },

  /**
   * Marca uma comissão como paga
   */
  async payCommission(id: string) {
    const { data, error } = await supabase
      .from("commissions")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
