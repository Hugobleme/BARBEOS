// @ts-nocheck
import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Scissors, Star, User, Calendar } from "lucide-react";
import { brl, minutes } from "@/lib/format";

export const Route = createFileRoute("/b/$slug/p/$proSlug")({
  loader: async ({ params }) => {
    return { slug: params.slug, proSlug: params.proSlug };
  },
  component: ProfessionalProfilePage,
});

function ProfessionalProfilePage() {
  const { slug, proSlug } = Route.useLoaderData();

  const { data, isLoading } = useQuery({
    queryKey: ["public-pro", slug, proSlug],
    queryFn: async () => {
      const { data: shop } = await supabase
        .from("barbershops")
        .select("id, name, slug, active")
        .eq("slug", slug)
        .eq("active", true)
        .single();
      
      if (!shop) return null;

      const { data: pro } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", shop.id)
        .eq("slug", proSlug)
        .eq("active", true)
        .single();

      if (!pro) return { shop, pro: null };

      // Get services
      const { data: services } = await supabase
        .from("services")
        .select("*")
        .eq("barbershop_id", shop.id)
        .eq("active", true)
        .order("name");

      // Portfolio
      const { data: portfolio } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("barbershop_id", shop.id)
        .eq("professional_id", pro.id)
        .eq("active", true);

      // Reviews
      const { data: reviews } = await supabase
        .from("satisfaction_surveys")
        .select("id, shop_rating, comment, answered_at, customer:customers(full_name)")
        .eq("barbershop_id", shop.id)
        .eq("professional_id", pro.id)
        .order("answered_at", { ascending: false })
        .limit(10);

      const shop_rating = reviews && reviews.length > 0 
        ? reviews.reduce((acc, r) => acc + r.shop_rating, 0) / reviews.length 
        : null;

      return { shop, pro, services: services ?? [], portfolio: portfolio ?? [], reviews: reviews ?? [], shop_rating };
    }
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
      </PublicLayout>
    );
  }

  if (!data || !data.shop || !data.pro) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <User className="mx-auto h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="font-serif text-3xl font-bold mb-2">Profissional nÃ£o encontrado</h1>
          <p className="text-muted-foreground mb-8">Este profissional nÃ£o estÃ¡ disponÃ­vel ou nÃ£o existe.</p>
          <Button asChild className="h-12 px-8 bg-accent text-accent-foreground font-bold">
            <Link to="/b/$slug" params={{ slug }}>Voltar Ã  barbearia</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const { shop, pro, services, portfolio, reviews, shop_rating } = data;

  return (
    <PublicLayout>
      <div className="bg-muted/30 border-b border-border/40 pb-8 pt-24 md:pt-32">
        <div className="mx-auto max-w-5xl px-4">
          <Button asChild variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
            <Link to="/b/$slug" params={{ slug }}>
              <ArrowLeft className="mr-2 h-4 w-4" /> {shop.name}
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-5">
              <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={pro.avatar_url || ""} />
                <AvatarFallback className="text-3xl font-serif bg-muted text-muted-foreground">{pro.display_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="font-serif text-3xl md:text-5xl font-bold">{pro.display_name}</h1>
                <p className="text-accent font-medium text-lg mt-1">{pro.specialties || "Barbeiro Especialista"}</p>
                {shop_rating && (
                  <Badge variant="secondary" className="mt-3 flex w-fit items-center gap-1 font-bold">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    {shop_rating.toFixed(1)} ({reviews.length} avaliaÃ§Ãµes)
                  </Badge>
                )}
              </div>
            </div>
            
            <div className="hidden md:block">
              <Button asChild className="h-12 px-8 font-bold text-base bg-accent text-accent-foreground shadow-lg hover:scale-105 transition-transform">
                <Link to="/agendar" search={{ barbershop: shop.slug, professional: pro.id }}>
                  Agendar com {pro.display_name.split(" ")[0]}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 grid grid-cols-1 gap-12">
        
        {/* Bio */}
        {pro.bio && (
          <section className="max-w-3xl">
            <h2 className="text-xl font-bold mb-3">Sobre mim</h2>
            <p className="text-muted-foreground leading-relaxed">{pro.bio}</p>
          </section>
        )}

        {/* Services */}
        {services.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">ServiÃ§os realizados</h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {services.map(s => (
                <Card key={s.id} className="p-4 border-border/40 hover:border-accent/40 transition-colors">
                  <h3 className="font-bold">{s.name}</h3>
                  <div className="flex items-center gap-3 mt-3 text-sm">
                    <span className="font-medium text-accent">{brl(s.price)}</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {minutes(s.duration_min)}</span>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Portfolio */}
        {portfolio.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Trabalhos (PortfÃ³lio)</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {portfolio.map(img => (
                <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/40 shadow-sm">
                  <img src={img.image_url} alt="Trabalho" loading="lazy" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <section className="max-w-3xl">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">AvaliaÃ§Ãµes de Clientes</h2>
            <div className="space-y-4">
              {reviews.map(r => (
                <div key={r.id} className="p-4 bg-card/30 border border-border/40 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`h-3.5 w-3.5 ${star <= r.shop_rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-foreground">{r.customer?.full_name || "Cliente"}</span>
                  </div>
                  {r.comment && <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-background/90 backdrop-blur-md border-t border-border/40 z-40">
        <Button asChild className="w-full h-12 font-bold text-base bg-accent text-accent-foreground shadow-lg">
          <Link to="/agendar" search={{ barbershop: shop.slug, professional: pro.id }}>
            Agendar HorÃ¡rio <Calendar className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
      <div className="h-20 md:hidden" />
    </PublicLayout>
  );
}

