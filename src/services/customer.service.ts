import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Customer = Database["public"]["Tables"]["customers"]["Row"];

export interface CustomerStats {
  totalSpent: number;
  totalAppointments: number;
  lastVisit: string | null;
}

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

  async unblockCustomer(id: string) {
    const { error } = await supabase
      .from("customers")
      .update({ blocked: false, no_show_count: 0 })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Obtém lista de clientes de uma barbearia
   */
  async getCustomers(barbershopId: string, params?: { q?: string; blocked?: boolean; page?: number; limit?: number }) {
    const page = params?.page ?? 0;
    const limit = params?.limit ?? 20;
    const from = page * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("barbershop_id", barbershopId)
      .range(from, to);

    if (params?.q) {
      const q = params.q.trim();
      query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
    }

    if (params?.blocked !== undefined) {
      query = query.eq("blocked", params.blocked);
    }

    const { data, count, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;

    return {
      data: (data ?? []) as Customer[],
      totalCount: count ?? 0,
      nextPage: (data?.length ?? 0) === limit ? page + 1 : undefined,
    };
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
   * Calcula estatísticas resumidas de um cliente (gastos, visitas, última visita)
   */
  async getCustomerStats(customerId: string): Promise<CustomerStats> {
    const { data, error } = await supabase
      .from("appointments")
      .select("scheduled_start, total_amount, status")
      .eq("customer_id", customerId)
      .order("scheduled_start", { ascending: false });

    if (error) throw error;

    const completed = (data ?? []).filter((a) => a.status === "completed");
    const totalSpent = completed.reduce((sum, a) => sum + Number(a.total_amount || 0), 0);
    const lastVisit = completed.length > 0 ? completed[0].scheduled_start : null;

    return {
      totalSpent,
      totalAppointments: data?.length ?? 0,
      lastVisit,
    };
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
