import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Phone, Scissors, Sparkles, Star } from "lucide-react";
import { brl, minutes } from "@/lib/format";

type Shop = {
  id: string; name: string; slug: string; description: string | null;
  logo_url: string | null; banner_url: string | null;
  address: any; contacts: any; social: any;
};

export const Route = createFileRoute("/b/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("barbershops")
      .select("id,name,slug,description,logo_url,banner_url,address,contacts,social,active")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { shop: data as Shop };
  },
  head: ({ loaderData }) => {
    const shop = loaderData?.shop;
    if (!shop) return { meta: [{ title: "Barbearia — BarberOS" }] };
    const desc = shop.description ?? `Agende online na ${shop.name}. Cortes, barba e cuidados.`;
    return {
      meta: [
        { title: `${shop.name} — Agende online` },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: shop.name },
        { property: "og:description", content: desc.slice(0, 155) },
        { property: "og:type", content: "website" },
        ...(shop.banner_url ? [{ property: "og:image", content: shop.banner_url }] : []),
      ],
      links: [{ rel: "canonical", href: `/b/${shop.slug}` }],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Barbearia não encontrada</h1>
        <p className="mt-2 text-muted-foreground">O endereço pode estar incorreto ou a unidade está inativa.</p>
        <Button asChild className="mt-6"><Link to="/">Voltar à home</Link></Button>
      </div>
      <PublicFooter />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Algo deu errado</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
      <PublicFooter />
    </div>
  ),
  component: ShopPage,
});

function ShopPage() {
  const { shop } = Route.useLoaderData();

  const { data: services = [] } = useQuery({
    queryKey: ["shop-services", shop.id],
    queryFn: async () => (await supabase.from("services").select("*")
      .eq("barbershop_id", shop.id).eq("active", true).order("sort")).data ?? [],
  });
  const { data: pros = [] } = useQuery({
    queryKey: ["shop-pros", shop.id],
    queryFn: async () => (await supabase.from("professionals").select("*")
      .eq("barbershop_id", shop.id).eq("active", true)).data ?? [],
  });

  const addr = shop.address ?? {};
  const phone = shop.contacts?.phone ?? shop.contacts?.whatsapp;
  const fullAddr = [addr.street, addr.number].filter(Boolean).join(", ");
  const cityLine = [addr.city, addr.state].filter(Boolean).join(" / ");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    name: shop.name,
    description: shop.description ?? undefined,
    image: shop.banner_url ?? shop.logo_url ?? undefined,
    telephone: phone ?? undefined,
    address: addr.street ? {
      "@type": "PostalAddress",
      streetAddress: fullAddr,
      addressLocality: addr.city ?? undefined,
      addressRegion: addr.state ?? undefined,
      postalCode: addr.zip ?? undefined,
      addressCountry: "BR",
    } : undefined,
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.74_0.09_85/0.18),transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Agendamento online
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] md:text-6xl">{shop.name}</h1>
            {shop.description && <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">{shop.description}</p>}
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/agendar" search={{ shop: shop.slug } as any}>Agendar agora</Link>
              </Button>
              {phone && (
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                  <a href={`tel:${phone}`}><Phone className="mr-2 h-4 w-4" />{phone}</a>
                </Button>
              )}
            </div>
            {(fullAddr || cityLine) && (
              <div className="mt-6 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 text-accent" />
                <div>
                  {fullAddr && <div>{fullAddr}</div>}
                  {cityLine && <div>{cityLine}</div>}
                </div>
              </div>
            )}
          </div>
          <div className="relative">
            {shop.banner_url ? (
              <img src={shop.banner_url} alt={shop.name} loading="lazy" className="aspect-[4/5] w-full rounded-3xl border border-border object-cover shadow-xl" />
            ) : (
              <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/70 p-8 shadow-xl">
                <div className="flex h-full flex-col justify-between text-primary-foreground">
                  <Scissors className="h-10 w-10 text-accent" />
                  <div>
                    <div className="font-display text-3xl font-semibold">{shop.name}</div>
                    {cityLine && <div className="mt-1 text-sm opacity-80">{cityLine}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Serviços</h2>
            <p className="mt-2 text-muted-foreground">Escolha, agende e relaxe.</p>
          </div>
        </div>
        {services.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s: any) => (
              <Card key={s.id} className="group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
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
                  <Button asChild size="sm" variant="secondary">
                    <Link to="/agendar" search={{ shop: shop.slug } as any}>Agendar</Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Equipe */}
      {pros.length > 0 && (
        <section className="bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Equipe</h2>
            <p className="mt-2 text-muted-foreground">Profissionais com paixão pelo ofício.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pros.map((p: any) => (
                <Card key={p.id} className="flex items-center gap-4 p-5">
                  <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary text-primary-foreground">{p.display_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                  <div className="min-w-0">
                    <div className="font-semibold">{p.display_name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {p.specialties?.slice(0, 3).map((s: string) => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <Card className="flex flex-col items-start gap-4 bg-primary p-8 text-primary-foreground">
          <Sparkles className="h-8 w-8 text-accent" />
          <div>
            <h3 className="font-display text-2xl font-semibold">Pronto pra um novo visual?</h3>
            <p className="mt-2 text-sm opacity-80">Reserve seu horário em poucos toques na {shop.name}.</p>
          </div>
          <Button asChild size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
            <Link to="/agendar" search={{ shop: shop.slug } as any}>Agendar agora</Link>
          </Button>
        </Card>
      </section>

      <PublicFooter />
    </div>
  );
}
