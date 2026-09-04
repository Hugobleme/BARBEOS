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

      // 4. Business Hours
      const { data: businessHours, error: hoursErr } = await supabase
        .from("barbershop_business_hours")
        .select("id")
        .eq("barbershop_id", shopId)
        .limit(1);

      if (hoursErr) throw hoursErr;

      // 5. Professional Working Hours
      let hasProHours = false;
      if (professionals && professionals.length > 0) {
        const proIds = professionals.map((p) => p.id);
        const { data: proWorkingHours, error: proHoursErr } = await supabase
          .from("working_hours")
          .select("id")
          .in("professional_id", proIds)
          .limit(1);

        if (proHoursErr) throw proHoursErr;
        hasProHours = !!proWorkingHours && proWorkingHours.length > 0;
      }

      const hasProfile =
        !!shop &&
        !!shop.name &&
        !!shop.slug &&
        (!!shop.address || !!shop.contacts || !!shop.logo_url);
      const hasServices = !!services && services.length > 0;
      const hasProfessionals = !!professionals && professionals.length > 0;
      const hasShopHours = !!businessHours && businessHours.length > 0;
      const hasHours = hasShopHours && hasProHours;

      // Total 5 steps: Profile, Services, Professionals, Horários, Review.
      const hasReview = hasProfile && hasServices && hasProfessionals && hasHours;

      const completedCount =
        (hasProfile ? 1 : 0) +
        (hasServices ? 1 : 0) +
        (hasProfessionals ? 1 : 0) +
        (hasHours ? 1 : 0) +
        (hasReview ? 1 : 0);

      const isFullyComplete = completedCount === 5;

      return {
        shop,
        hasProfile,
        hasServices,
        hasProfessionals,
        hasShopHours,
        hasProHours,
        hasHours,
        hasReview,
        completedCount,
        totalSteps: 5,
        isFullyComplete,
      };
    },
  });
}
