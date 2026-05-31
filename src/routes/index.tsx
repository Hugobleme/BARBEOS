import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight, Calendar, Clock, MapPin, Phone, Scissors, Star } from "lucide-react";
import { brl, minutes, DEMO_BARBERSHOP_ID } from "@/lib/format";
import { AuroraFab } from "@/components/aurora/AuroraFab";
import heroImage from "@/assets/hero-barbershop.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BarberOS — Barbearia premium em São Paulo" },
      { name: "description", content: "Atendimento exclusivo. Reserve sua experiência em 30 segundos, disponível 24/7." },
      { property: "og:title", content: "BarberOS — Barbearia premium em São Paulo" },
      { property: "og:description", content: "Reserve sua experiência em 30 segundos, 24/7." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HealthAndBeautyBusiness",
          name: "BarberOS",
          description: "Barbearia premium com agendamento online 24/7.",
          areaServed: "São Paulo",
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data: services } = useQuery({
    queryKey: ["services-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, description, price, duration_min, sort")
        .eq("barbershop_id", DEMO_BARBERSHOP_ID)
        .eq("active", true)
        .order("sort")
        .limit(6);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60, // Services rarely change, cache for 1 hour
  });
  const { data: pros } = useQuery({
    queryKey: ["pros-featured"],
    queryFn: async () => {
      const { data } = await supabase
        .from("professionals")
        .select("id, display_name, specialties")
        .eq("barbershop_id", DEMO_BARBERSHOP_ID)
        .eq("active", true);
      return data ?? [];
    },
    staleTime: 1000 * 60 * 60, // Professionals rarely change, cache for 1 hour
  });

  return (
    <PublicLayout>
      {/* Hero — Midnight Prestige */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/40 px-4 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_8px_currentColor]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
                Atendimento Premium
              </span>
            </div>

            <h1 className="font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              Cortes que
              <br />
              <span className="italic font-normal text-accent">marcam.</span>
            </h1>

            <p className="max-w-md text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
              Reserve seu horário em 30 segundos. Sem ligações, sem espera —
              disponível 24 horas por dia.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="h-auto rounded-none bg-accent px-10 py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-accent-foreground transition-all hover:scale-[1.02] hover:bg-foreground hover:text-background"
              >
                <Link to="/agendar">Agendar agora</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-auto rounded-none border-border bg-transparent px-10 py-5 text-[11px] font-bold uppercase tracking-[0.25em] backdrop-blur-sm hover:border-accent hover:bg-transparent hover:text-accent"
              >
                <Link to="/servicos">Ver serviços</Link>
              </Button>
            </div>

            <div className="flex items-center gap-10 border-t border-border/60 pt-10">
              <div className="space-y-1.5">
                <div className="flex gap-0.5 text-accent">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  4.9 em 230 avaliações
                </p>
              </div>
              <div className="h-10 w-px bg-border/60" />
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  Aberto agora
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Até as 20h
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-accent/10 blur-[100px]" />
            <div className="group relative aspect-[3/4] overflow-hidden border border-border">
              <img
                src={heroImage}
                alt="Interior moderno da BarberOS"
                width={1024}
                height={1280}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-90" />

              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                <div className="flex items-center justify-between border border-border bg-background/40 p-5 backdrop-blur-xl">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg font-bold">BarberOS HQ</h3>
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <MapPin className="h-3 w-3" /> Rua Augusta, 1500 · SP
                    </p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-full border border-accent text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Serviços — grade com hairline */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              — Nossa curadoria
            </div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">
              Serviços <span className="italic font-normal">selecionados</span>
            </h2>
            <p className="max-w-md text-muted-foreground">
              Onde a tradição encontra o requinte contemporâneo.
            </p>
          </div>
          <Link
            to="/servicos"
            className="group inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-accent transition-colors hover:text-foreground"
          >
            Ver catálogo completo
            <span className="h-px w-8 bg-accent transition-all group-hover:w-12" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {services?.map((s, idx) => (
            <article
              key={s.id}
              className="group flex flex-col gap-8 bg-background p-8 transition-colors duration-500 hover:bg-card md:p-10"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent/60">
                  {String(idx + 1).padStart(2, "0")} / {String(services.length).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {minutes(s.duration_min)}
                </span>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-2xl font-bold">{s.name}</h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {s.description}
                </p>
              </div>
              <div className="mt-auto flex items-center justify-between border-t border-border/40 pt-6">
                <span className="font-serif text-xl">{brl(Number(s.price))}</span>
                <Button
                  asChild
                  size="icon"
                  variant="outline"
                  className="h-11 w-11 rounded-full border-border bg-transparent transition-all group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground"
                >
                  <Link to="/agendar" aria-label={`Agendar ${s.name}`}>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Equipe */}
      <section className="border-y border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
          <div className="mb-14 max-w-2xl space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              — Os artesãos
            </div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">
              Nossa <span className="italic font-normal">equipe</span>
            </h2>
            <p className="text-muted-foreground">
              Profissionais com olhar técnico e paixão pelo ofício.
            </p>
          </div>
          <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {pros?.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-5 bg-background p-7 transition-colors hover:bg-card"
              >
                <Avatar className="h-14 w-14 rounded-none">
                  <AvatarFallback className="rounded-none bg-accent/15 font-serif text-lg text-accent">
                    {p.display_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-serif text-lg">{p.display_name}</div>
                  <div className="truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {p.specialties?.slice(0, 2).join(" · ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre + CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              — A casa
            </div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">
              Sobre a <span className="italic font-normal">BarberOS</span>
            </h2>
            <p className="max-w-md text-muted-foreground">
              Mais que uma barbearia: uma experiência. Combinamos tradição e modernidade
              num ambiente acolhedor para o homem que cuida da imagem.
            </p>
            <div className="space-y-4 border-t border-border/60 pt-6 text-sm">
              <div className="flex items-center gap-4">
                <MapPin className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">
                  Rua Augusta, 1500 — São Paulo / SP
                </span>
              </div>
              <div className="flex items-center gap-4">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">(11) 99999-0000</span>
              </div>
              <div className="flex items-center gap-4">
                <Calendar className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">Seg a Sáb</span>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden border border-border bg-card/40 p-10 md:p-16">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" />

            <div className="space-y-8 text-center">
              <div className="mx-auto grid h-14 w-14 rotate-45 place-items-center border border-accent">
                <Scissors className="h-5 w-5 -rotate-45 text-accent" />
              </div>
              <h3 className="font-serif text-3xl font-bold md:text-4xl">
                Pronto para um novo visual?
              </h3>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                Reserve sua experiência em poucos toques. Disponibilidade em tempo real.
              </p>
              <Button
                asChild
                size="lg"
                className="h-auto rounded-none bg-foreground px-12 py-5 text-[11px] font-black uppercase tracking-[0.4em] text-background transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground"
              >
                <Link to="/agendar">Agendar agora</Link>
              </Button>
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <Clock className="h-3 w-3" /> Confirmação instantânea
              </div>
            </div>
          </div>
        </div>
      </section>
      <AuroraFab barbershopId={DEMO_BARBERSHOP_ID} barbershopName="BarberOS Demo" />
    </PublicLayout>
  );
}
