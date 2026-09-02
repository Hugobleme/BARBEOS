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

export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Professional = Database["public"]["Tables"]["professionals"]["Row"];

export type BarbershopMembership = {
  id: string;
  role: Database["public"]["Enums"]["app_role"];
  name: string;
  settings: any;
};

export interface BarbershopFilters {
  city?: string;
  neighborhood?: string;
  minRating?: number;
  sort?: "rating" | "recent" | "popular" | "nearest" | string;
  page?: number;
  limit?: number;
  sponsored?: boolean;
  q?: string;
}

export interface BarbershopWithStats extends Barbershop {
  rating?: number;
  review_count?: number;
  distance_km?: number | null;
  services_count?: number;
}

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

  async createBarbershop(data: {
    name: string;
    slug?: string;
    description?: string | null;
    logo_url?: string | null;
    banner_url?: string | null;
    address?: any;
    contacts?: any;
    phone?: string;
    social?: any;
    settings?: any;
    ownerId?: string;
    userId?: string;
  }) {
    const owner = data.ownerId || data.userId;
    const generatedSlug =
      data.slug ||
      data.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
        "-" +
        Math.floor(Math.random() * 1000);

    const contacts =
      data.contacts || (data.phone ? { phone: data.phone, whatsapp: data.phone } : null);

    const { data: shop, error } = await supabase
      .from("barbershops")
      .insert({
        name: data.name,
        slug: generatedSlug,
        description: data.description || null,
        logo_url: data.logo_url || null,
        banner_url: data.banner_url || null,
        contacts,
        address: data.address || null,
        social: data.social || null,
        settings: data.settings || null,
        active: true,
      })
      .select()
      .single();

    if (error || !shop) throw error || new Error("Erro ao criar barbearia");

    if (owner) {
      await this.addMember(shop.id, owner, "owner");
      await supabase.from("profiles").update({ default_barbershop_id: shop.id }).eq("id", owner);
    }

    return shop;
  },

  async getBarbershopsByOwner(userId: string): Promise<Barbershop[]> {
    const { data, error } = await supabase
      .from("barbershop_members")
      .select("barbershop:barbershops(*)")
      .eq("profile_id", userId)
      .eq("role", "owner")
      .eq("active", true);

    if (error) throw error;
    return (data ?? []).map((d: any) => d.barbershop).filter(Boolean);
  },

  /**
   * Lista barbearias com filtros de busca, localização, avaliação e paginação
   */
  async getBarbershops(
    filters?: BarbershopFilters,
  ): Promise<{ data: BarbershopWithStats[]; count: number }> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;

    let query = supabase.from("barbershops").select("*", { count: "exact" }).eq("active", true);

    if (filters?.q) {
      const term = `%${filters.q.trim()}%`;
      query = query.or(`name.ilike.${term},slug.ilike.${term},description.ilike.${term}`);
    }

    const { data, count, error } = await query;
    if (error) throw error;

    let shops: BarbershopWithStats[] = (data ?? []).map((shop: any) => {
      const surveys = shop.satisfaction_surveys ?? [];
      const validRatings = surveys
        .map((s: any) => Number(s.shop_rating))
        .filter((r: number) => !isNaN(r) && r > 0);

      const review_count = validRatings.length;
      const rating =
        review_count > 0
          ? Number(
              (validRatings.reduce((a: number, b: number) => a + b, 0) / review_count).toFixed(1),
            )
          : 5.0;

      const address = (shop.address ?? {}) as any;
      const city = address?.city ?? "";
      const neighborhood = address?.neighborhood ?? address?.district ?? "";

      return {
        ...shop,
        rating,
        review_count,
        _city: city.toLowerCase(),
        _neighborhood: neighborhood.toLowerCase(),
        _appointments_count: shop.appointments?.length ?? 0,
      };
    });

    if (filters?.city) {
      const c = filters.city.trim().toLowerCase();
      shops = shops.filter(
        (s: any) =>
          s._city.includes(c) ||
          JSON.stringify(s.address ?? {})
            .toLowerCase()
            .includes(c),
      );
    }

    if (filters?.neighborhood) {
      const n = filters.neighborhood.trim().toLowerCase();
      shops = shops.filter(
        (s: any) =>
          s._neighborhood.includes(n) ||
          JSON.stringify(s.address ?? {})
            .toLowerCase()
            .includes(n),
      );
    }

    if (filters?.minRating) {
      shops = shops.filter((s) => (s.rating ?? 0) >= filters.minRating!);
    }

    const sort = filters?.sort || "rating";
    if (sort === "rating") {
      shops.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === "recent") {
      shops.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "popular") {
      shops.sort((a: any, b: any) => (b._appointments_count ?? 0) - (a._appointments_count ?? 0));
    }

    const paginatedData = shops.slice(offset, offset + limit);

    return {
      data: paginatedData,
      count: shops.length || (count ?? 0),
    };
  },

  /**
   * Obtém os detalhes completos de uma barbearia pelo slug para a página pública
   */

  async getPublicBarbershopBySlug(slug: string) {
    const normalizedSlug = (slug ?? "").trim().toLowerCase();
    if (!normalizedSlug) return null;
    const { data, error } = await supabase
      .from("barbershops")
      .select("id, name, slug, logo_url")
      .eq("slug", normalizedSlug)
      .eq("active", true)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getBarbershopBySlug(slug: string) {
    const { data: shop, error: sErr } = await supabase
      .from("barbershops")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle();

    if (sErr || !shop) throw sErr || new Error("Barbearia não encontrada.");

    const [servicesRes, prosRes, portfolioRes, reviewsRes] = await Promise.all([
      supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", shop.id)
        .eq("active", true)
        .order("sort"),
      supabase.from("professionals").select("*").eq("barbershop_id", shop.id).eq("active", true),
      supabase.from("portfolio_items").select("*").eq("barbershop_id", shop.id).order("sort"),
      supabase
        .from("satisfaction_surveys")
        .select(
          `
          id,
          shop_rating,
          comment,
          answered_at,
          appointment:appointments(
            customer:customers(full_name)
          )
        `,
        )
        .eq("barbershop_id", shop.id)
        .eq("is_public", true)
        .order("answered_at", { ascending: false })
        .limit(5),
    ]);

    const reviews = (reviewsRes.data ?? []).map((r: any) => ({
      id: r.id,
      rating: r.shop_rating ?? 5,
      comment: r.comment,
      answered_at: r.answered_at,
      customer_name: r.appointment?.customer?.full_name ?? "Cliente BarberOS",
    }));

    const validRatings = reviews
      .map((r: any) => Number(r.rating))
      .filter((n: number) => !isNaN(n) && n > 0);
    const avgRating =
      validRatings.length > 0
        ? Number(
            (validRatings.reduce((a: number, b: number) => a + b, 0) / validRatings.length).toFixed(
              1,
            ),
          )
        : 5.0;

    return {
      shop: {
        ...shop,
        rating: avgRating,
        review_count: validRatings.length,
      },
      services: servicesRes.data ?? [],
      professionals: prosRes.data ?? [],
      portfolio: portfolioRes.data ?? [],
      reviews,
    };
  },

  /**
   * Métodos CRUD para Serviços (Services)
   */
  async getServices(barbershopId: string): Promise<Service[]> {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("sort")
      .order("name");

    if (error) throw error;
    return (data as Service[]) ?? [];
  },

  async createService(data: {
    barbershop_id: string;
    name: string;
    description?: string | null;
    duration_min: number;
    price?: number;
    active?: boolean;
    sort?: number;
  }): Promise<Service> {
    const finalPrice = data.price ?? 0;

    const payload = {
      barbershop_id: data.barbershop_id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      duration_min: data.duration_min,
      price: finalPrice,
      active: data.active ?? true,
      sort: data.sort ?? 0,
    };

    const { data: service, error } = await supabase
      .from("services")
      .insert(payload)
      .select("id, barbershop_id, name, description, duration_min, price, active, sort")
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[admin/servicos] create failed", {
          code: error?.code,
          message: error?.message,
          details: error?.details,
        });
      }
      throw error;
    }
    return service as Service;
  },

  async updateService(id: string, data: Partial<Service>): Promise<Service> {
    const updatePayload: any = { ...data };

    const { data: updated, error } = await supabase
      .from("services")
      .update(updatePayload)
      .eq("id", id)
      .select("id, barbershop_id, name, description, duration_min, price, active, sort")
      .single();

    if (error) {
      if (import.meta.env.DEV) {
        console.error("[admin/servicos] update failed", {
          code: error?.code,
          message: error?.message,
          details: error?.details,
        });
      }
      throw error;
    }
    return updated as Service;
  },

  async deleteService(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) throw error;
  },

  /**
   * Métodos CRUD para Barbeiros / Profissionais (Barbers)
   */
  async getBarbers(barbershopId: string): Promise<Professional[]> {
    const { data, error } = await supabase
      .from("professionals")
      .select("*")
      .eq("barbershop_id", barbershopId)
      .order("display_name");

    if (error) throw error;
    return (data as Professional[]) ?? [];
  },

  async createBarber(data: {
    barbershop_id: string;
    display_name: string;
    bio?: string | null;
    specialties?: string[];
    commission_percent?: number;
    phone?: string | null;
    email?: string | null;
    active?: boolean;
  }): Promise<Professional> {
    const slug =
      data.display_name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || crypto.randomUUID().slice(0, 8);

    const commission_rule = {
      percentage: data.commission_percent ?? 40,
    };

    const { data: pro, error } = await supabase
      .from("professionals")
      .insert({
        barbershop_id: data.barbershop_id,
        display_name: data.display_name.trim(),
        bio: data.bio?.trim() || null,
        specialties: data.specialties ?? ["Corte", "Barba"],
        commission_rule,
        slug,
        active: data.active ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return pro;
  },

  async updateBarber(
    id: string,
    data: Partial<Professional> & { commission_percent?: number },
  ): Promise<Professional> {
    const updatePayload: any = { ...data };
    if (data.commission_percent !== undefined) {
      updatePayload.commission_rule = {
        ...(typeof updatePayload.commission_rule === "object" ? updatePayload.commission_rule : {}),
        percentage: data.commission_percent,
      };
      delete updatePayload.commission_percent;
    }

    const { data: updated, error } = await supabase
      .from("professionals")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async deleteBarber(id: string) {
    const { error } = await supabase.from("professionals").delete().eq("id", id);

    if (error) throw error;
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
    const { error } = await supabase.from("barbershops").update({ active: false }).eq("id", id);

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
  async addMember(
    barbershopId: string,
    userId: string,
    role: Database["public"]["Enums"]["app_role"] = "professional",
  ) {
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
