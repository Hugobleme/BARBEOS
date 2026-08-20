import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { barbershopService } from "@/services/barbershop.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, MessageCircle, Phone, Scissors, Sparkles, Check, Star, Quote, ExternalLink, Calendar } from "lucide-react";
import { brl, minutes, formatCurrency } from "@/lib/format";
import { AuroraFab } from "@/components/aurora/AuroraFab";

export const Route = createFileRoute("/b/$slug")({
  loader: async ({ params }) => {
    try {
      const data = await barbershopService.getBarbershopBySlug(params.slug);
      if (!data || !data.shop) throw notFound();
      return data;
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => {
    const shop = loaderData?.shop;
    if (!shop) return { meta: [{ title: "Barbearia — BarberOS" }] };
    const desc = shop.description ?? `Agende online na ${shop.name}. Cortes, barba e cuidados exclusivos.`;
    const addr = (shop.address ?? {}) as any;
    const contacts = (shop.contacts ?? {}) as any;
    const phone = contacts?.phone ?? contacts?.whatsapp;
    const ld: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: shop.name,
      description: desc,
      url: `/b/${shop.slug}`,
      ...(shop.logo_url ? { image: shop.logo_url } : {}),
      ...(phone ? { telephone: phone } : {}),
      ...(addr.street || addr.city
        ? {
            address: {
              "@type": "PostalAddress",
              streetAddress: addr.street ?? undefined,
              addressLocality: addr.city ?? undefined,
              addressRegion: addr.state ?? undefined,
              postalCode: addr.zip ?? undefined,
              addressCountry: addr.country ?? "BR",
            },
          }
        : {}),
    };
    return {
      meta: [
        { title: `${shop.name} — Agende Online | BarberOS` },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: `${shop.name} — BarberOS` },
        { property: "og:description", content: desc.slice(0, 155) },
        { property: "og:type", content: "website" },
        { property: "og:url", content: `/b/${params.slug}` },
        ...(shop.banner_url ? [{ property: "og:image", content: shop.banner_url }] : []),
      ],
      links: [{ rel: "canonical", href: `/b/${shop.slug}` }],
      scripts: [
        { type: "application/ld+json", children: JSON.stringify(ld) },
      ],
    };
  },
  notFoundComponent: () => (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-serif text-4xl font-bold">Barbearia não encontrada</h1>
        <p className="mt-2 text-muted-foreground">O endereço pode estar incorreto ou a unidade está inativa.</p>
        <Button asChild className="mt-6 rounded-none bg-accent text-accent-foreground"><Link to="/barbearias">Ver todas as barbearias</Link></Button>
      </div>
    </PublicLayout>
  ),
  component: ShopPage,
});

const DEFAULT_GALLERY = [
  "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80",
];

function ShopPage() {
  const loaderData = Route.useLoaderData();
  const { shop, services, professionals, portfolio, reviews } = loaderData;

  const addr = (shop.address ?? {}) as any;
  const contacts = (shop.contacts ?? {}) as any;
  const fullAddress = [addr.street, addr.number, addr.neighborhood || addr.district, addr.city, addr.state]
    .filter(Boolean)
    .join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${shop.name}, ${fullAddress}`
  )}`;

  const galleryImages = portfolio && portfolio.length > 0
    ? portfolio.map((p: any) => p.image_url)
    : DEFAULT_GALLERY;

  return (
    <PublicLayout>
      {/* 1. Header Hero */}
      <header className="relative border-b border-border/60 bg-card/30">
        {shop.banner_url && (
          <div className="absolute inset-0 -z-10 opacity-20">
            <img src={shop.banner_url} alt="" className="h-full w-full object-cover blur-sm" />
            <div className="absolute inset-0 bg-background/80" />
          </div>
        )}

        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="rounded-none border-accent/40 bg-accent/10 text-accent">
                  Barbearia Parceira
                </Badge>
                <div className="flex items-center gap-1 text-sm text-accent">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-bold">{shop.rating?.toFixed(1) ?? "5.0"}</span>
                  <span className="text-xs text-muted-foreground">({shop.review_count || 12} avaliações)</span>
                </div>
              </div>

              <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">{shop.name}</h1>
              <p className="text-base text-muted-foreground leading-relaxed">
                {shop.description || "Experiência de barbearia tradicional e cuidados masculinos em ambiente de luxo."}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-muted-foreground">
                {fullAddress && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors hover:text-accent"
                  >
                    <MapPin className="h-4 w-4 text-accent" />
                    {fullAddress}
                  </a>
                )}
                {contacts.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-accent" />
                    {contacts.phone}
                  </div>
                )}
              </div>
            </div>

            <div className="hidden md:block">
              <Button
                asChild
                size="lg"
                className="h-auto rounded-none bg-accent px-10 py-5 text-xs font-bold uppercase tracking-[0.25em] text-accent-foreground hover:bg-foreground hover:text-background"
              >
                <Link to="/agendar" search={{ shop: shop.slug }}>
                  Agendar horário
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Galeria de Fotos */}
      <section className="border-b border-border/60 bg-background py-14">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold">Galeria de fotos</h2>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">{galleryImages.length} fotos</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {galleryImages.slice(0, 4).map((imgUrl: string, idx: number) => (
              <div key={idx} className="group relative aspect-[4/3] overflow-hidden border border-border bg-card">
                <img
                  src={imgUrl}
                  alt={`Ambiente da barbearia ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Catálogo de Serviços */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-10 max-w-2xl space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">— Cardápio de serviços</div>
          <h2 className="font-serif text-4xl font-bold">Serviços e Preços</h2>
          <p className="text-sm text-muted-foreground">Escolha os serviços desejados para o seu atendimento.</p>
        </div>

        <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s: any) => (
            <div key={s.id} className="flex flex-col justify-between bg-background p-7 transition-colors hover:bg-card">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold">{s.name}</h3>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{minutes(s.duration_min)}</span>
                </div>
                {s.description && (
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                <span className="font-serif text-xl font-bold text-accent">{brl(Number(s.price))}</span>
                <Button asChild size="sm" variant="outline" className="rounded-none text-xs uppercase tracking-wider">
                  <Link to="/agendar" search={{ shop: shop.slug }}>
                    Agendar
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Equipe de Profissionais */}
      {professionals && professionals.length > 0 && (
        <section className="border-y border-border/60 bg-card/20 py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-10 max-w-2xl space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">— Equipe de mestres</div>
              <h2 className="font-serif text-4xl font-bold">Profissionais</h2>
              <p className="text-sm text-muted-foreground">Especialistas prontos para cuidar do seu estilo.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {professionals.map((p: any) => (
                <div key={p.id} className="flex items-center gap-4 border border-border bg-background p-5">
                  <Avatar className="h-12 w-12 rounded-none">
                    <AvatarFallback className="rounded-none bg-accent/15 font-serif text-accent">
                      {p.display_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="font-serif font-bold truncate">{p.display_name}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                      {p.specialties?.slice(0, 2).join(" · ") || "Especialista em Cortes"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. Avaliações de Clientes */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-10 max-w-2xl space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">— Experiência comprovada</div>
          <h2 className="font-serif text-4xl font-bold">Avaliações dos Clientes</h2>
          <p className="text-sm text-muted-foreground">O que nossos clientes dizem sobre o atendimento.</p>
        </div>

        {reviews.length === 0 ? (
          <div className="border border-border p-10 text-center text-sm text-muted-foreground">
            Seja o primeiro a avaliar após o seu atendimento!
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-3">
            {reviews.map((r: any) => (
              <div key={r.id} className="flex flex-col justify-between border border-border bg-card/30 p-6">
                <div className="space-y-3">
                  <div className="flex gap-0.5 text-accent">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="text-xs italic leading-relaxed text-foreground/90">
                    "{r.comment || "Excelente atendimento, pontualidade e acabamento impecável."}"
                  </p>
                </div>
                <div className="mt-6 border-t border-border/40 pt-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground">
                  — {r.customer_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. Localização e Mapa */}
      <section className="border-t border-border/60 bg-card/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid gap-10 md:grid-cols-2 items-center">
            <div className="space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">— Como chegar</div>
              <h2 className="font-serif text-4xl font-bold">Localização & Contato</h2>
              <div className="space-y-3 text-sm text-muted-foreground">
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <span>{fullAddress || "São Paulo, SP"}</span>
                </p>
                {contacts.phone && (
                  <p className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-accent shrink-0" />
                    <span>{contacts.phone}</span>
                  </p>
                )}
              </div>

              {fullAddress && (
                <Button asChild variant="outline" className="rounded-none text-xs uppercase tracking-wider">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" /> Abrir no Google Maps
                  </a>
                </Button>
              )}
            </div>

            {/* CTA Final */}
            <div className="border border-accent/40 bg-accent/5 p-8 text-center md:p-12">
              <Scissors className="mx-auto h-10 w-10 text-accent mb-4" />
              <h3 className="font-serif text-2xl font-bold">Pronto para seu atendimento?</h3>
              <p className="mt-2 text-xs text-muted-foreground">
                Garanta seu horário com os melhores barbeiros da {shop.name}.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-6 rounded-none bg-accent px-10 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background"
              >
                <Link to="/agendar" search={{ shop: shop.slug }}>
                  Agendar agora
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky bar no mobile para agendamento rápido */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-serif font-bold text-sm truncate max-w-[180px]">{shop.name}</div>
            <div className="flex items-center gap-1 text-[10px] text-accent">
              <Star className="h-3 w-3 fill-current" />
              <span>{shop.rating?.toFixed(1) ?? "5.0"}</span>
            </div>
          </div>
          <Button
            asChild
            className="flex-1 rounded-none bg-accent text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground"
          >
            <Link to="/agendar" search={{ shop: shop.slug }}>
              Agendar horário
            </Link>
          </Button>
        </div>
      </div>

      <AuroraFab barbershopId={shop.id} barbershopName={shop.name} />
    </PublicLayout>
  );
}
