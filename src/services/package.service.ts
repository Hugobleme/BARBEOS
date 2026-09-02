import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { addDays } from "date-fns";

export type Package = Database["public"]["Tables"]["packages"]["Row"];
export type CustomerSubscription = Database["public"]["Tables"]["customer_subscriptions"]["Row"] & {
  package?: Package | null;
};

export interface CreatePackageInput {
  barbershop_id: string;
  name: string;
  price_cents?: number;
  price?: number;
  sessions_total: number;
  description?: string | null;
  validity_days?: number | null;
  active?: boolean;
}

export const packageService = {
  /**
   * Lista todos os pacotes/planos ativos de uma barbearia
   */
  async getPackages(barbershopId: string): Promise<Package[]> {
    const { data, error } = await supabase
      .from("packages")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .eq("active", true)
      .order("price");

    if (error) throw error;
    return (data as Package[]) ?? [];
  },

  /**
   * Cria um novo pacote de serviços
   */
  async createPackage(data: CreatePackageInput): Promise<Package> {
    const finalPrice = data.price ?? (data.price_cents ? data.price_cents / 100 : 0);

    const { data: pkg, error } = await supabase
      .from("packages")
      .insert({
        barbershop_id: data.barbershop_id,
        name: data.name,
        price: finalPrice,
        sessions_total: data.sessions_total,
        description: data.description || null,
        validity_days: data.validity_days || null,
        active: data.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return pkg;
  },

  /**
   * Atualiza dados de um pacote
   */
  async updatePackage(
    id: string,
    data: Partial<Package> & { price_cents?: number },
  ): Promise<Package> {
    const updatePayload: any = { ...data };
    if (data.price_cents !== undefined) {
      updatePayload.price = data.price_cents / 100;
      delete updatePayload.price_cents;
    }

    const { data: updated, error } = await supabase
      .from("packages")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Exclusão suave (desativação) de um pacote
   */
  async deletePackage(id: string) {
    const { error } = await supabase.from("packages").update({ active: false }).eq("id", id);

    if (error) throw error;
  },

  /**
   * Registra a compra de um pacote por um cliente
   */
  async purchasePackage(params: {
    customerId: string;
    packageId: string;
    barbershopId: string;
    transactionId?: string;
    notes?: string;
  }): Promise<CustomerSubscription> {
    const { customerId, packageId, barbershopId, transactionId, notes } = params;

    // 1. Obter dados do pacote
    const { data: pkg, error: pErr } = await supabase
      .from("packages")
      .select("*")
      .eq("id", packageId)
      .single();

    if (pErr || !pkg) throw pErr || new Error("Pacote não encontrado.");

    const validityDays = pkg.validity_days || 30;
    const expiresAt = addDays(new Date(), validityDays).toISOString();

    // 2. Criar assinatura/pacote ativo para o cliente
    const { data: sub, error: sErr } = await supabase
      .from("customer_subscriptions")
      .insert({
        barbershop_id: barbershopId,
        customer_id: customerId,
        package_id: packageId,
        sessions_remaining: pkg.sessions_total,
        status: "active",
        purchased_at: new Date().toISOString(),
        expires_at: expiresAt,
        transaction_id: transactionId || null,
        notes: notes || null,
      })
      .select("*, package:packages(*)")
      .single();

    if (sErr) throw sErr;
    return sub as any;
  },
};
