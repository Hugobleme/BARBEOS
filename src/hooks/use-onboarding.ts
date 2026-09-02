import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useOnboardingStatus(shopId: string | null) {
  return useQuery({
    queryKey: ["onboarding-status", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      if (!shopId) return null;

      // 1. Profile
      const { data: shop, error: shopErr } = await supabase
        .from("barbershops")
        .select("name, slug, logo_url, banner_url, address, contacts")
        .eq("id", shopId)
        .maybeSingle();

      if (shopErr) throw shopErr;

      // 2. Services
      const { data: services, error: svcErr } = await supabase
        .from("services")
        .select("id")
        .eq("barbershop_id", shopId)
        .eq("active", true)
        .limit(1);

      if (svcErr) throw svcErr;

      // 3. Professionals
      const { data: professionals, error: proErr } = await supabase
        .from("professionals")
        .select("id")
        .eq("barbershop_id", shopId)
        .eq("active", true)
        .limit(1);

      if (proErr) throw proErr;

      const hasProfile =
        !!shop &&
        !!shop.name &&
        !!shop.slug &&
        (!!shop.address || !!shop.contacts || !!shop.logo_url);
      const hasServices = !!services && services.length > 0;
      const hasProfessionals = !!professionals && professionals.length > 0;

      // denominator is 4 total (Profile, Services, Professionals, Review).
      // Hours is "Em breve" and excluded from denominator.
      // Review is considered complete if the first 3 are complete.
      const hasReview = hasProfile && hasServices && hasProfessionals;

      const completedCount =
        (hasProfile ? 1 : 0) +
        (hasServices ? 1 : 0) +
        (hasProfessionals ? 1 : 0) +
        (hasReview ? 1 : 0);

      const isFullyComplete = completedCount === 4;

      return {
        shop,
        hasProfile,
        hasServices,
        hasProfessionals,
        hasReview,
        completedCount,
        totalSteps: 4,
        isFullyComplete,
      };
    },
  });
}
