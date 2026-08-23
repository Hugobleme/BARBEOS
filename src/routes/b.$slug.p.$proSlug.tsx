import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Scissors, Star, Quote, Sparkles } from "lucide-react";
import { brl, minutes } from "@/lib/format";
import { cn } from "@/lib/utils";

type Pro = {
  id: string; slug: string; display_name: string; bio: string | null;
  avatar_url: string | null; specialties: string[] | null; barbershop_id: string;
};
type Shop = { id: string; name: string; slug: string };

export const Route = createFileRoute("/b/$slug/p/$proSlug")({
  loader: async ({ params }) => {
    const { data: shop } = await supabase
      .from("barbershops")
      .select("id,name,slug,active")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (!shop) throw notFound();
    const { data: pro } = await supabase
      .from("professionals")
      .select("id,slug,display_name,bio,avatar_url,specialties,barbershop_id,active")
      .eq("barbershop_id", shop.id)
      .eq("slug", params.proSlug)
      .eq("active", true)
      .maybeSingle();
    if (!pro) throw notFound();
    return { shop: shop as Shop, pro: pro as Pro };
  },
  head: ({ loaderData, params }) => {
    const pro = loaderData?.pro;
    const shop = loaderData?.shop;
    if (!pro || !shop) return { meta: [{ title: "Profissional — BarberOS" }] };
    const desc = pro.bio ?? `Agende com ${pro.display_name} na ${shop.name}.`;
    return {
      meta: [
        { title: `${pro.display_name} — ${shop.name}` },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: `${pro.display_name} — ${shop.name}` },
        { property: "og:description", content: desc.slice(0, 155) },
        { property: "og:type", content: "profile" },
        ...(pro.avatar_url ? [{ property: "og:image", content: pro.avatar_url }] : []),
      ],
      links: [{ rel: "canonical", href: `/b/${params.slug}/p/${params.proSlug}` }],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Profissional não encontrado</h1>
        <p className="mt-2 text-muted-foreground">O endereço pode estar incorreto ou o profissional está inativo.</p>
        <Button asChild className="mt-6"><Link to="/">Voltar à home</Link></Button>
      </div>
    </PublicLayout>
  ),
  errorComponent: ({ error }) => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </PublicLayout>
  ),
  component: ProPage,
});

function ProPage() {
  const { shop, pro } = Route.useLoaderData();

  const { data: services = [] } = useQuery({
    queryKey: ["pro-services", pro.id],
    queryFn: async () => {
      const { data: links } = await supabase
        .from("service_professionals")
        .select("service_id")
        .eq("professional_id", pro.id);
      const ids = (links ?? []).map((l: any) => l.service_id);
      if (!ids.length) return [];
      const { data } = await supabase
        .from("services")
        .select("*")
        .in("id", ids)
        .eq("active", true)
        .order("sort");
      return data ?? [];
    },
  });

  const { data: portfolio = [] } = useQuery({
    queryKey: ["pro-portfolio", pro.id],
    queryFn: async () => (await supabase
      .from("portfolio_items")
      .select("id, image_url, caption")
      .eq("professional_id", pro.id)
      .order("created_at", { ascending: false })
      .limit(12)).data ?? [],
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["pro-reviews", pro.id],
    queryFn: async () => (await supabase
      .from("satisfaction_surveys")
      .select("id, professional_rating, comment, answered_at")
      .eq("professional_id", pro.id)
      .eq("is_public", true)
      .not("comment", "is", null)
      .order("answered_at", { ascending: false })
      .limit(9)).data ?? [],
  });

  const ratingAvg = (() => {
    const vals = reviews.map((r: any) => r.professional_rating).filter((v: number | null): v is number => v != null);
    if (!vals.length) return null;
    return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
  })();

  const initials = pro.display_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("");

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.74_0.09_85/0.18),transparent_70%)]" />
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16">
          <Link
            to="/b/$slug"
            params={{ slug: shop.slug }}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> {shop.name}
          </Link>

          <div className="mt-8 grid gap-8 md:grid-cols-[auto,1fr] md:items-center">
            <Avatar className="h-32 w-32 md:h-40 md:w-40">
              {pro.avatar_url && <AvatarImage src={pro.avatar_url} alt={pro.display_name} />}
              <AvatarFallback className="bg-primary text-2xl font-display text-primary-foreground md:text-4xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Profissional
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold leading-tight md:text-5xl">{pro.display_name}</h1>
              {pro.specialties && pro.specialties.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pro.specialties.map((s: string) => (
                    <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>
                  ))}
                </div>
              )}
              {pro.bio && <p className="mt-4 max-w-xl text-base text-muted-foreground">{pro.bio}</p>}
              {ratingAvg != null && (
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("h-4 w-4", i <= Math.round(ratingAvg) ? "fill-accent text-accent" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{ratingAvg.toFixed(1)}</span> · {reviews.length} avaliações
                  </span>
                </div>
              )}
              <div className="mt-6">
                <Button asChild size="lg" className="h-12 px-6 text-base">
                  <Link to="/agendar" search={{ shop: shop.slug, pro: pro.id } as any}>
                    Agendar com {pro.display_name.split(" ")[0]}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      {services.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-14 md:px-6">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Serviços oferecidos</h2>
          <p className="mt-2 text-muted-foreground">Selecione um serviço para agendar diretamente.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s: any) => (
              <Card key={s.id} className="flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Scissors className="h-5 w-5" /></div>
                  <span className="text-xs text-muted-foreground">{minutes(s.duration_min)}</span>
                </div>
                <div>
                  <div className="font-display text-lg font-semibold">{s.name}</div>
                  {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xl font-semibold">{brl(Number(s.price))}</span>
                  <Button asChild size="sm">
                    <Link to="/agendar" search={{ shop: shop.slug, service: s.id, pro: pro.id } as any}>Agendar</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Portfólio */}
      {portfolio.length > 0 && (
        <section className="bg-card/40">
          <div className="mx-auto max-w-5xl px-4 py-14 md:px-6">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Portfólio</h2>
            <p className="mt-2 text-muted-foreground">Trabalhos recentes de {pro.display_name.split(" ")[0]}.</p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {portfolio.map((p: any) => (
                <figure key={p.id} className="group relative aspect-square w-full max-w-full overflow-hidden rounded-2xl border border-border">
                  <img
                    src={p.image_url}
                    alt={p.caption ?? "Trabalho realizado"}
                    loading="lazy"
                    className="h-full w-full max-w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  {p.caption && (
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white opacity-0 transition group-hover:opacity-100">
                      {p.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Avaliações */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-5xl px-4 py-14 md:px-6">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Avaliações</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r: any) => (
              <Card key={r.id} className="flex h-full flex-col gap-3 p-5">
                <Quote className="h-6 w-6 text-accent/60" />
                <p className="flex-1 text-sm leading-relaxed text-foreground/90">{r.comment}</p>
                {r.professional_rating != null && (
                  <div className="flex border-t border-border pt-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("h-4 w-4", i <= r.professional_rating ? "fill-accent text-accent" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-4 pb-20 md:px-6">
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <h3 className="font-display text-2xl font-bold md:text-3xl">Pronto para agendar?</h3>
          <p className="max-w-md text-muted-foreground">
            Escolha um horário com {pro.display_name.split(" ")[0]} em poucos cliques.
          </p>
          <Button asChild size="lg" className="h-12 px-6 text-base">
            <Link to="/agendar" search={{ shop: shop.slug, pro: pro.id } as any}>Agendar agora</Link>
          </Button>
        </Card>
      </section>
    </PublicLayout>
  );
}
