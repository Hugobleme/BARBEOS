import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Barbershop = Database["public"]["Tables"]["barbershops"]["Row"];
export type BarbershopMember = Database["public"]["Tables"]["barbershop_members"]["Row"] & {
  profile?: {
    id: string;
    full_name: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
};

export type BarbershopMembership = {
  id: string;
  role: Database["public"]["Enums"]["app_role"];
  name: string;
  settings: any;
};

export const barbershopService = {
  async getMemberships(userId: string): Promise<BarbershopMembership[]> {
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
    return data?.settings;
  },

  async claimDemo(userId: string, demoId: string) {
    const { error } = await supabase.from("barbershop_members").insert({
      barbershop_id: demoId,
      profile_id: userId,
      role: "owner",
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
      barbershop_id: data.id,
      profile_id: userId,
      role: "owner",
    });

    if (mErr) throw mErr;
    return data;
  },

  /**
   * Criação completa de barbearia com dados estendidos
   */
  async createBarbershop(data: {
    name: string;
    slug: string;
    description?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
    address?: any;
    contacts?: any;
    social?: any;
    settings?: any;
    userId?: string;
  }) {
    const { userId, ...shopData } = data;
    const { data: shop, error } = await supabase
      .from("barbershops")
      .insert(shopData)
      .select()
      .single();

    if (error) throw error;

    if (userId) {
      await this.addMember(shop.id, userId, "owner");
    }

    return shop;
  },

  /**
   * Atualização de dados da barbearia
   */
  async updateBarbershop(id: string, data: Partial<Barbershop>) {
    const { data: updated, error } = await supabase
      .from("barbershops")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Exclusão ou desativação suave (soft delete) da barbearia
   */
  async deleteBarbershop(id: string) {
    const { error } = await supabase
      .from("barbershops")
      .update({ active: false })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Lista membros da equipe da barbearia
   */
  async getMembers(barbershopId: string): Promise<BarbershopMember[]> {
    const { data, error } = await supabase
      .from("barbershop_members")
      .select("*, profile:profiles(id, full_name, phone, avatar_url)")
      .eq("barbershop_id", barbershopId)
      .eq("active", true);

    if (error) throw error;
    return (data as any) ?? [];
  },

  /**
   * Adiciona um novo membro à equipe da barbearia
   */
  async addMember(barbershopId: string, userId: string, role: Database["public"]["Enums"]["app_role"] = "professional") {
    const { data, error } = await supabase
      .from("barbershop_members")
      .insert({
        barbershop_id: barbershopId,
        profile_id: userId,
        role,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove ou desativa um membro da equipe da barbearia
   */
  async removeMember(barbershopId: string, userId: string) {
    const { error } = await supabase
      .from("barbershop_members")
      .update({ active: false })
      .eq("barbershop_id", barbershopId)
      .eq("profile_id", userId);

    if (error) throw error;
  },
};
