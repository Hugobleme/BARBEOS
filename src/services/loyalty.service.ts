import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type LoyaltyBalance = Database["public"]["Tables"]["loyalty_balances"]["Row"] & {
  customer?: { id: string; full_name: string; phone: string | null } | null;
};
export type LoyaltyTransaction = Database["public"]["Tables"]["loyalty_transactions"]["Row"];
export type Reward = Database["public"]["Tables"]["packages"]["Row"];

export const loyaltyService = {
  /**
   * Obtém o saldo de pontos de fidelidade de um cliente
   */
  async getPoints(customerId: string, barbershopId?: string): Promise<LoyaltyBalance[]> {
    let query = supabase
      .from("loyalty_balances")
      .select("*, barbershop:barbershops(id, name)")
      .eq("customer_id", customerId);

    if (barbershopId) {
      query = query.eq("barbershop_id", barbershopId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as any) ?? [];
  },

  /**
   * Lista todos os clientes com saldo de pontos na barbearia
   */
  async getCustomersWithPoints(barbershopId: string): Promise<LoyaltyBalance[]> {
    const { data, error } = await supabase
      .from("loyalty_balances")
      .select("*, customer:customers(id, full_name, phone)")
      .eq("barbershop_id", barbershopId)
      .gt("points", 0)
      .order("points", { ascending: false });

    if (error) throw error;
    return (data as any) ?? [];
  },

  /**
   * Adiciona pontos ao saldo do cliente e registra a transação
   */
  async addPoints(params: {
    customerId: string;
    points: number;
    reason: string;
    barbershopId: string;
    appointmentId?: string;
    createdBy?: string;
  }) {
    const { customerId, points, reason, barbershopId, appointmentId, createdBy } = params;

    const { data: balance } = await supabase
      .from("loyalty_balances")
      .select("id, points, lifetime_points")
      .eq("customer_id", customerId)
      .eq("barbershop_id", barbershopId)
      .maybeSingle();

    const currentPoints = Number(balance?.points || 0);
    const currentLifetime = Number(balance?.lifetime_points || 0);
    const nextPoints = currentPoints + points;
    const nextLifetime = currentLifetime + points;

    if (balance) {
      await supabase
        .from("loyalty_balances")
        .update({
          points: nextPoints,
          lifetime_points: nextLifetime,
          updated_at: new Date().toISOString(),
        })
        .eq("id", balance.id);
    } else {
      await supabase
        .from("loyalty_balances")
        .insert({
          customer_id: customerId,
          barbershop_id: barbershopId,
          points: nextPoints,
          lifetime_points: nextLifetime,
        });
    }

    const { data: tx, error: txErr } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_id: customerId,
        barbershop_id: barbershopId,
        points,
        kind: "earn",
        description: reason,
        appointment_id: appointmentId || null,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (txErr) throw txErr;
    return tx;
  },

  /**
   * Resgata pontos do saldo do cliente
   */
  async redeemPoints(params: {
    customerId: string;
    points: number;
    reason?: string;
    barbershopId: string;
    createdBy?: string;
  }) {
    const { customerId, points, reason = "Resgate de pontos", barbershopId, createdBy } = params;

    const { data: balance, error: bErr } = await supabase
      .from("loyalty_balances")
      .select("id, points")
      .eq("customer_id", customerId)
      .eq("barbershop_id", barbershopId)
      .single();

    if (bErr || !balance) {
      throw new Error("Saldo de fidelidade não encontrado para este cliente.");
    }

    if (Number(balance.points || 0) < points) {
      throw new Error(`Saldo insuficiente. O cliente possui ${balance.points} pontos.`);
    }

    const nextPoints = Number(balance.points) - points;

    await supabase
      .from("loyalty_balances")
      .update({
        points: nextPoints,
        updated_at: new Date().toISOString(),
      })
      .eq("id", balance.id);

    const { data: tx, error: txErr } = await supabase
      .from("loyalty_transactions")
      .insert({
        customer_id: customerId,
        barbershop_id: barbershopId,
        points: -points,
        kind: "redeem",
        description: reason,
        created_by: createdBy || null,
      })
      .select()
      .single();

    if (txErr) throw txErr;
    return tx;
  },

  /**
   * Obtém recompensas/benefícios disponíveis na barbearia
   */
  async getRewards(barbershopId: string): Promise<Reward[]> {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("price");

    if (error) throw error;
    return (data as Reward[]) ?? [];
  },

  /**
   * Cria uma nova recompensa de fidelidade
   */
  async createReward(data: {
    barbershop_id: string;
    name: string;
    description?: string | null;
    points_required: number;
    active?: boolean;
  }): Promise<Reward> {
    const { data: reward, error } = await supabase
      .from("packages")
      .insert({
        barbershop_id: data.barbershop_id,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: 0,
        sessions_total: data.points_required,
        active: data.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return reward;
  },

  /**
   * Atualiza uma recompensa
   */
  async updateReward(id: string, data: Partial<Reward>): Promise<Reward> {
    const { data: updated, error } = await supabase
      .from("packages")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Exclui uma recompensa
   */
  async deleteReward(id: string) {
    const { error } = await supabase
      .from("packages")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};
