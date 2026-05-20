import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, MessageCircle, Phone, Scissors, Sparkles, Check, Star, Quote } from "lucide-react";
import { brl, minutes } from "@/lib/format";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Shop = {
  id: string; name: string; slug: string; description: string | null;
  logo_url: string | null; banner_url: string | null;
  address: any; contacts: any; social: any; settings: any;
};

export const Route = createFileRoute("/b/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("barbershops")
      .select("id,name,slug,description,logo_url,banner_url,address,contacts,social,settings,active")
      .eq("slug", params.slug)
      .eq("active", true)
      .maybeSingle();
    if (error || !data) throw notFound();
    return { shop: data as Shop };
  },
  head: ({ loaderData, params }) => {
    const shop = loaderData?.shop;
    if (!shop) return { meta: [{ title: "Barbearia — BarberOS" }] };
    const desc = shop.description ?? `Agende online na ${shop.name}. Cortes, barba e cuidados.`;
    const addr = (shop.address ?? {}) as any;
    const phone = shop.contacts?.phone ?? shop.contacts?.whatsapp;
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
        { title: `${shop.name} — Agende online` },
        { name: "description", content: desc.slice(0, 155) },
        { property: "og:title", content: shop.name },
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
        <h1 className="font-display text-3xl font-bold">Barbearia não encontrada</h1>
        <p className="mt-2 text-muted-foreground">O endereço pode estar incorreto ou a unidade está inativa.</p>
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
  component: ShopPage,
});

const DAYS: { key: string; label: string }[] = [
  { key: "mon", label: "Segunda" },
  { key: "tue", label: "Terça" },
  { key: "wed", label: "Quarta" },
  { key: "thu", label: "Quinta" },
  { key: "fri", label: "Sexta" },
  { key: "sat", label: "Sábado" },
  { key: "sun", label: "Domingo" },
];

const DEFAULT_HOURS: Record<string, string> = {
  mon: "09h – 19h", tue: "09h – 19h", wed: "09h – 19h",
  thu: "09h – 19h", fri: "09h – 19h", sat: "09h – 17h", sun: "Fechado",
};

function todayKey() {
  return ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];
}

function ShopPage() {
  const { shop } = Route.useLoaderData();
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedPro, setSelectedPro] = useState<string | null>(null);

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
  const { data: portfolio = [] } = useQuery({
    queryKey: ["shop-portfolio", shop.id],
    queryFn: async () => (await supabase.from("portfolio_items")
      .select("id, image_url, caption, professional_id")
      .eq("barbershop_id", shop.id)
      .order("created_at", { ascending: false })
      .limit(12)).data ?? [],
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["shop-reviews", shop.id],
    queryFn: async () => (await supabase.from("satisfaction_surveys")
      .select("id, shop_rating, professional_rating, comment, answered_at, professional:professionals(display_name)")
      .eq("barbershop_id", shop.id)
      .eq("is_public", true)
      .not("comment", "is", null)
      .order("answered_at", { ascending: false })
      .limit(9)).data ?? [],
  });
  const ratingAvg = (() => {
    const vals = reviews.map((r: any) => r.shop_rating).filter((v: number | null): v is number => v != null);
    if (!vals.length) return null;
    return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length);
  })();

  const addr = shop.address ?? {};
  const phone = shop.contacts?.phone ?? shop.contacts?.whatsapp;
  const whatsapp = shop.contacts?.whatsapp;
  const whatsappNumber = whatsapp ? String(whatsapp).replace(/\D/g, "") : null;
  const fullAddr = [addr.street, addr.number].filter(Boolean).join(", ");
  const cityLine = [addr.city, addr.state].filter(Boolean).join(" / ");

  const hours: Record<string, string> = (shop.settings?.hours && typeof shop.settings.hours === "object")
    ? { ...DEFAULT_HOURS, ...shop.settings.hours }
    : DEFAULT_HOURS;
  const today = todayKey();
  const todayHours = hours[today] ?? "—";

  // Builds the booking search params with current selection so /agendar pre-fills.
  const bookingSearch = () => ({
    shop: shop.slug,
    ...(selectedService ? { service: selectedService } : {}),
    ...(selectedPro ? { pro: selectedPro } : {}),
  }) as any;

  const waUrl = whatsappNumber
    ? `https://wa.me/55${whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de agendar na ${shop.name}.`)}`
    : null;

  return (
    <PublicLayout>
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

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5 text-xs text-foreground">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span className="font-medium">Hoje:</span>
              <span className="text-muted-foreground">{todayHours}</span>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base">
                <Link to="/agendar" search={bookingSearch()}>Agendar agora</Link>
              </Button>
              {waUrl && (
                <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
                  <a href={waUrl} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" />WhatsApp
                  </a>
                </Button>
              )}
              {phone && !waUrl && (
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
            <p className="mt-2 text-muted-foreground">Toque em um serviço para destacá-lo no agendamento.</p>
          </div>
        </div>
        {services.length === 0 ? (
          <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s: any) => {
              const active = selectedService === s.id;
              return (
                <Card
                  key={s.id}
                  onClick={() => setSelectedService(active ? null : s.id)}
                  className={cn(
                    "group relative flex cursor-pointer flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md",
                    active && "border-accent ring-2 ring-accent/40 shadow-md",
                  )}
                >
                  {active && (
                    <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
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
                    <Button asChild size="sm" variant={active ? "default" : "secondary"} onClick={(e) => e.stopPropagation()}>
                      <Link to="/agendar" search={{ shop: shop.slug, service: s.id, ...(selectedPro ? { pro: selectedPro } : {}) } as any}>Agendar</Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Equipe */}
      {pros.length > 0 && (
        <section className="bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Equipe</h2>
            <p className="mt-2 text-muted-foreground">Escolha seu profissional preferido.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pros.map((p: any) => {
                const active = selectedPro === p.id;
                return (
                  <Card
                    key={p.id}
                    onClick={() => setSelectedPro(active ? null : p.id)}
                    className={cn(
                      "relative flex cursor-pointer items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md",
                      active && "border-accent ring-2 ring-accent/40 shadow-md",
                    )}
                  >
                    {active && (
                      <span className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-foreground">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary text-primary-foreground">{p.display_name.split(" ").map((n: string) => n[0]).slice(0, 2).join("")}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="font-semibold">{p.display_name}</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {p.specialties?.slice(0, 3).map((s: string) => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Portfólio */}
      {portfolio.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <div className="mb-6">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Portfólio</h2>
            <p className="mt-2 text-muted-foreground">Alguns dos nossos trabalhos recentes.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {portfolio.map((p: any) => (
              <figure key={p.id} className="group relative overflow-hidden rounded-2xl border border-border">
                <img
                  src={p.image_url}
                  alt={p.caption ?? "Trabalho realizado"}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
                />
                {p.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white opacity-0 transition group-hover:opacity-100">
                    {p.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Avaliações */}
      {reviews.length > 0 && (
        <section className="bg-card/40">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-3xl font-bold md:text-4xl">O que dizem</h2>
                <p className="mt-2 text-muted-foreground">Depoimentos reais de clientes da {shop.name}.</p>
              </div>
              {ratingAvg != null && (
                <div className="flex items-center gap-3">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className={cn("h-5 w-5", i <= Math.round(ratingAvg) ? "fill-accent text-accent" : "text-muted-foreground/30")} />
                    ))}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{ratingAvg.toFixed(1)}</span> · {reviews.length} avaliações
                  </div>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r: any) => (
                <Card key={r.id} className="flex h-full flex-col gap-3 p-5">
                  <Quote className="h-6 w-6 text-accent/60" />
                  <p className="flex-1 text-sm leading-relaxed text-foreground/90">{r.comment}</p>
                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className={cn("h-3.5 w-3.5", i <= (r.shop_rating ?? 0) ? "fill-accent text-accent" : "text-muted-foreground/30")} />
                      ))}
                    </div>
                    {r.professional?.display_name && (
                      <span className="text-xs text-muted-foreground">com {r.professional.display_name}</span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Horário de funcionamento */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="font-display text-3xl font-bold md:text-4xl">Horários</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Atendimento mediante agendamento. Cancelamento gratuito até 2h antes.
            </p>
          </div>
          <Card className="md:col-span-2 p-6">
            <ul className="divide-y divide-border">
              {DAYS.map((d) => {
                const isToday = d.key === today;
                return (
                  <li key={d.key} className={cn("flex items-center justify-between py-2.5", isToday && "font-semibold text-accent")}>
                    <span>{d.label}{isToday && " · hoje"}</span>
                    <span className={cn("text-sm", !isToday && "text-muted-foreground")}>{hours[d.key]}</span>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6">
        <Card className="flex flex-col items-start gap-4 bg-primary p-8 text-primary-foreground">
          <Sparkles className="h-8 w-8 text-accent" />
          <div>
            <h3 className="font-display text-2xl font-semibold">Pronto pra um novo visual?</h3>
            <p className="mt-2 text-sm opacity-80">
              {selectedService || selectedPro
                ? "Sua seleção será aplicada no agendamento."
                : `Reserve seu horário em poucos toques na ${shop.name}.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Link to="/agendar" search={bookingSearch()}>Agendar agora</Link>
            </Button>
            {waUrl && (
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" />Falar no WhatsApp
                </a>
              </Button>
            )}
          </div>
        </Card>
      </section>

      </PublicLayout>
  );
}
