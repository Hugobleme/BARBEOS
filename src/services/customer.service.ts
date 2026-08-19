import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export const customerService = {
  async getById(id: string) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async incrementNoShow(id: string) {
    const cur = await this.getById(id);
    const next = Number(cur?.no_show_count ?? 0) + 1;
    const { error } = await supabase
      .from("customers")
      .update({ no_show_count: next })
      .eq("id", id);

    if (error) throw error;
    return next;
  },

  async blockCustomer(id: string) {
    const { error } = await supabase
      .from("customers")
      .update({ blocked: true })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Obtém o histórico completo de agendamentos e serviços de um cliente
   */
  async getCustomerHistory(customerId: string) {
    const { data, error } = await supabase
      .from("appointments")
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        total_amount,
        status,
        notes,
        created_at,
        professional:professionals(id, display_name),
        services:appointment_services(
          id,
          price_snapshot,
          duration_snapshot,
          service:services(id, name, description)
        )
      `)
      .eq("customer_id", customerId)
      .order("scheduled_start", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Atualiza os dados de cadastro de um cliente
   */
  async updateCustomer(id: string, data: Partial<Customer>) {
    const { data: updated, error } = await supabase
      .from("customers")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },
};
