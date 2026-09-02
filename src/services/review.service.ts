import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type SatisfactionSurvey = Database["public"]["Tables"]["satisfaction_surveys"]["Row"];

export interface CreateReviewInput {
  barbershop_id: string;
  appointment_id: string;
  professional_id?: string | null;
  shop_rating?: number | null;
  professional_rating?: number | null;
  nps?: number | null;
  comment?: string | null;
  is_public?: boolean;
}

export const reviewService = {
  /**
   * Registra uma nova avaliação de satisfação
   */
  async createReview(data: CreateReviewInput) {
    const { data: review, error } = await supabase
      .from("satisfaction_surveys")
      .insert({
        barbershop_id: data.barbershop_id,
        appointment_id: data.appointment_id,
        professional_id: data.professional_id || null,
        shop_rating: data.shop_rating ?? null,
        professional_rating: data.professional_rating ?? null,
        nps: data.nps ?? null,
        comment: data.comment || null,
        is_public: data.is_public ?? true,
        answered_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return review;
  },

  /**
   * Obtém as avaliações de uma barbearia com dados do cliente e profissional
   */
  async getReviews(barbershopId: string) {
    const { data, error } = await supabase
      .from("satisfaction_surveys")
      .select(
        `
        *,
        professional:professionals(id, display_name),
        appointment:appointments(
          id,
          scheduled_start,
          customer:customers(id, full_name)
        )
      `,
      )
      .eq("barbershop_id", barbershopId)
      .order("answered_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Atualiza uma avaliação existente
   */
  async updateReview(id: string, data: Partial<SatisfactionSurvey>) {
    const { data: updated, error } = await supabase
      .from("satisfaction_surveys")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  /**
   * Exclui uma avaliação
   */
  async deleteReview(id: string) {
    const { error } = await supabase.from("satisfaction_surveys").delete().eq("id", id);

    if (error) throw error;
  },
};
