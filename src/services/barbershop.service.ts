import { supabase } from "@/integrations/supabase/client";

export const barbershopService = {
  async getMemberships(userId: string) {
    const { data: ms, error } = await supabase
      .from("barbershop_members")
      .select("barbershop_id, role, barbershops(id, name, settings)")
      .eq("profile_id", userId)
      .eq("active", true);
    
    if (error) throw error;
    
    return (ms ?? []).map((m: any) => ({
      id: m.barbershop_id,
      role: m.role,
      name: m.barbershops?.name ?? "Barbearia",
      settings: m.barbershops?.settings ?? {},
    }));
  },

  async getSettings(shopId: string) {
    const { data, error } = await supabase
      .from("barbershops")
      .select("settings")
      .eq("id", shopId)
      .maybeSingle();
    
    if (error) throw error;
    return data?.settings as any;
  },

  async claimDemo(userId: string, demoId: string) {
    const { error } = await supabase.from("barbershop_members").insert({
      barbershop_id: demoId, profile_id: userId, role: "owner",
    });
    if (error) throw error;
  },

  async create(name: string, slug: string, userId: string) {
    const { data, error } = await supabase
      .from("barbershops")
      .insert({ name, slug })
      .select("id")
      .single();
    
    if (error || !data) throw error || new Error("Falha ao criar barbearia");

    const { error: mErr } = await supabase.from("barbershop_members").insert({
      barbershop_id: data.id, profile_id: userId, role: "owner",
    });

    if (mErr) throw mErr;
    return data;
  }
};
