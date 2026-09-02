import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

export interface CreateCouponInput {
  barbershop_id: string;
  code: string;
  kind?: "fixed" | "percent";
  value?: number;
  discount_cents?: number;
  discount_percent?: number;
  valid_from?: string | null;
  valid_until?: string | null;
  usage_limit?: number | null;
  min_amount?: number;
}

export const couponService = {
  /**
   * Lista todos os cupons de uma barbearia
   */
  async getCoupons(barbershopId: string): Promise<Coupon[]> {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Coupon[]) ?? [];
  },

  /**
   * Cria um novo cupom de desconto
   */
  async createCoupon(data: CreateCouponInput): Promise<Coupon> {
    const isPercent = data.discount_percent !== undefined;
    const kind = data.kind || (isPercent ? "percent" : "fixed");
    const value =
      data.value ?? data.discount_percent ?? (data.discount_cents ? data.discount_cents / 100 : 0);

    const { data: coupon, error } = await supabase
      .from("coupons")
      .insert({
        barbershop_id: data.barbershop_id,
        code: data.code.toUpperCase().trim(),
        kind,
        value,
        valid_from: data.valid_from || new Date().toISOString(),
        valid_until: data.valid_until || null,
        usage_limit: data.usage_limit || null,
        min_amount: data.min_amount ?? 0,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return coupon;
  },

  /**
   * Valida se um cupom pode ser aplicado a uma compra
   */
  async validateCoupon(code: string, barbershopId: string, orderAmount: number = 0) {
    const cleanCode = code.toUpperCase().trim();

    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("code", cleanCode)
      .eq("active", true)
      .maybeSingle();

    if (error || !coupon) {
      throw new Error("Cupom inválido ou não encontrado.");
    }

    // 1. Validação de data de validade
    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      throw new Error("Este cupom ainda não está ativo.");
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      throw new Error("Este cupom expirou.");
    }

    // 2. Validação de limite de uso
    if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
      throw new Error("Limite de utilização deste cupom foi atingido.");
    }

    // 3. Validação de valor mínimo
    if (coupon.min_amount && orderAmount < coupon.min_amount) {
      throw new Error(`Valor mínimo para utilizar este cupom: R$ ${coupon.min_amount.toFixed(2)}.`);
    }

    // Cálculo do desconto
    let discount = 0;
    if (coupon.kind === "percent") {
      discount = (orderAmount * Number(coupon.value)) / 100;
    } else {
      discount = Number(coupon.value);
    }

    return {
      valid: true,
      coupon,
      discount: Math.min(discount, orderAmount),
    };
  },

  /**
   * Incrementa a contagem de uso do cupom
   */
  async useCoupon(code: string, barbershopId?: string) {
    let query = supabase
      .from("coupons")
      .select("id, used_count")
      .eq("code", code.toUpperCase().trim());

    if (barbershopId) {
      query = query.eq("barbershop_id", barbershopId);
    }

    const { data: coupon, error } = await query.maybeSingle();
    if (error || !coupon) return;

    const nextCount = (coupon.used_count || 0) + 1;
    await supabase.from("coupons").update({ used_count: nextCount }).eq("id", coupon.id);
  },

  /**
   * Atualiza um cupom de desconto existente
   */
  async updateCoupon(id: string, data: Partial<Coupon>): Promise<Coupon> {
    const { data: updated, error } = await supabase
      .from("coupons")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Exclui ou desativa um cupom
   */
  async deleteCoupon(id: string) {
    const { error } = await supabase.from("coupons").delete().eq("id", id);

    if (error) throw error;
  },
};
