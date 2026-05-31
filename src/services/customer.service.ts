import { supabase } from "@/integrations/supabase/client";

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
  }
};
