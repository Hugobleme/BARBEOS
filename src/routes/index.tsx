import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { barbershopService, BarbershopWithStats } from "@/services/barbershop.service";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Scissors,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { brl, minutes, DEMO_BARBERSHOP_ID } from "@/lib/format";
import { AuroraFab } from "@/components/aurora/AuroraFab";
import { OptimizedImage } from "@/components/OptimizedImage";
import { Image } from "@/components/Image";
import heroImage from "@/assets/hero-barbershop.jpg";
import { z } from "zod";

const searchSchema = z.object({
  city: z.string().optional(),
});

export const Route = createFileRoute("/")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "BarberOS — Encontre e Agende nas MelhoreSábarbearias" },
      {
        name: "description",
        content:
          "Atendimento exclusivo nas melhores barbearias do Brasil. Agende online em 30 segundos, disponível 24/7.",
      },
      { property: "og:title", content: "BarberOS — Barbearias Premium" },
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
          description: "Rede de barbearias premium com agendamento online 24/7.",
          areaServed: "Brasil",
        }),
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [searchCity, setSearchCity] = useState(searchParams.city || "");
  const [sortBy, setSortBy] = useState<string>("rating");

  const { data: featuredShops, isLoading: loadingShops } = useQuery({
    queryKey: ["featured-barbershops", searchCity, sortBy],
    queryFn: async () => {
      const res = await barbershopService.getBarbershops({
        city: searchCity || undefined,
        sort: sortBy,
        limit: 6,
      });
      return res.data;
    },
  });

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
    staleTime: 1000 * 60 * 60,
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
    staleTime: 1000 * 60 * 60,
  });

  function handleSearchsubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate({
      to: "/barbearias",
      search: {
        city: searchCity ? searchCity.trim() : undefined,
        sort: sortBy,
      },
    });
  }

  return (
    <PublicLayout>
      {/* Hero — Midnight Prestige */}
      <header className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-full max-w-full max-w-[480px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2">
          <div className="space-y-10">
            <div className="inline-flex items-center gap-3 rounded-full border border-border bg-card/40 px-4 py-1.5 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_8px_currentColor]" />
              <span className="text-[10px] font-medium uppercase tracking-[0.3em] text-accent">
                Atendimento Premium
              </span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl">
              Cortes que
              <br />
              <span className="italic font-normal text-accent">marcam.</span>
            </h1>

            <p className="max-w-md text-lg font-light leading-relaxed text-muted-foreground md:text-xl">
              Encontre as melhores barbearias e reserve seu horário em 30 segundos. Sem ligações,
              sem espera — 24 horas por dia.
            </p>

            {/* Caixa de Busca Rápida por Cidade/Bairro */}
            <form
              onsubmit={handleSearchsubmit}
              className="flex flex-col gap-3 sm:flex-row max-w-lg w-full"
            >
              <div className="relative flex-1 w-full">
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" />
                <Input
                  value={searchCity}
                  onChange={(e) => setSearchCity(e.target.value)}
                  placeholder="Cidade ou bairro (ex: São Paulo, Jardins)..."
                  className="h-14 rounded-none border-border bg-card/60 pl-11 text-sm backdrop-blur focus-visible:ring-accent w-full"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-14 min-h-11 w-full sm:w-auto rounded-none bg-accent px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background active:scale-95"
              >
                Buscar
              </Button>
            </form>

            {/* Chips de Cidades Populares */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">
                Populares:
              </span>
              {["São Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte"].map((c) => (
                <Link
                  key={c}
                  to="/barbearias"
                  search={{ city: c, sort: sortBy }}
                  className="rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[11px] text-muted-foreground transition hover:border-accent hover:text-accent hover:bg-accent/5"
                >
                  {c}
                </Link>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2 w-full max-w-lg">
              <Button
                asChild
                size="lg"
                className="h-auto min-h-11 w-full sm:w-auto rounded-none bg-accent px-10 py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-accent-foreground transition-all hover:scale-[1.02] hover:bg-foreground hover:text-background shadow-lg shadow-accent/20"
              >
                <Link to="/barbearias">Agendar agora</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-auto min-h-11 w-full sm:w-auto rounded-none border-border bg-transparent px-10 py-5 text-[11px] font-bold uppercase tracking-[0.25em] backdrop-blur-sm hover:border-accent hover:bg-transparent hover:text-accent"
              >
                <Link to="/barbearias">Explorar locais</Link>
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
                  4.9 em milhares de avaliações
                </p>
              </div>
              <div className="h-10 w-px bg-border/60" />
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
                  Agendamento 24/7
                </span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Confirmação instantânea
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-accent/20 blur-[120px]" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-accent/15 blur-[100px]" />

            <div
              className="group relative min-h-[400px] sm:aspect-[3/4] overflow-hidden rounded-none border border-accent/40 shadow-[0_0_50px_rgba(212,175,55,0.18)]"
              style={{
                backgroundImage: "url('/hero-barbershop.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* Gradient overlay sutil para manter a imagem brilhante e visível */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 pointer-events-none transition-opacity duration-1000 group-hover:opacity-90" />

              {/* Badge superior */}
              <div className="absolute left-6 top-6 z-20">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                    Experiência Exclusiva
                  </span>
                </div>
              </div>

              {/* Card Inferior BarberOS Prestige */}
              <div className="absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8">
                <div className="flex items-center justify-between border border-white/15 bg-black/70 p-5 backdrop-blur-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      <h3 className="font-serif text-lg font-bold text-white">BarberOS Prestige</h3>
                    </div>
                    <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300">
                      <MapPin className="h-3 w-3 text-accent" /> Unidades selecionadas no Brasil
                    </p>
                  </div>
                  <Link
                    to="/barbearias"
                    aria-label="Ver barbearias"
                    className="grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground transition-all hover:scale-105 hover:bg-white hover:text-black shadow-lg"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Seção: Barbearias em Destaque */}
      <section className="border-y border-border/60 bg-card/20 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                <Sparkles className="h-3.5 w-3.5" /> Unidades Recomendadas
              </div>
              <h2 className="font-serif text-3xl font-bold md:text-5xl">
                Barbearias em <span className="italic font-normal">Destaque</span>
              </h2>
              <p className="text-sm text-muted-foreground">
                As unidades mais bem avaliadas para você agendar sua experiência.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                Ordenar:
              </span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] rounded-none border-border bg-background/60 text-xs">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent className="rounded-none border-border">
                  <SelectItem value="rating">MaiSábem avaliadas</SelectItem>
                  <SelectItem value="popular">Mais populares</SelectItem>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingShops ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse border border-border bg-card/40" />
              ))}
            </div>
          ) : !featuredShops || featuredShops.length === 0 ? (
            <div className="border border-border p-12 text-center text-muted-foreground">
              Nenhuma barbearia encontrada para esta localização.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredShops.map((shop) => {
                const addr = (shop.address ?? {}) as any;
                const cityState = [
                  addr.neighborhood || addr.district,
                  addr.city || "São Paulo",
                  addr.state || "SP",
                ]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <article
                    key={shop.id}
                    className="group relative flex flex-col justify-between overflow-hidden border border-border bg-background/60 p-6 transition-all duration-300 hover:border-accent hover:bg-card/40"
                  >
                    <div>
                      {shop.banner_url && (
                        <div className="mb-4 aspect-video w-full overflow-hidden border border-border/40 max-w-full">
                          <Image
                            src={shop.banner_url}
                            alt={shop.name}
                            aspectRatio="video"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h3 className="font-serif text-2xl font-bold transition-colors group-hover:text-accent">
                            {shop.name}
                          </h3>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                            <span className="truncate">{cityState}</span>
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-none border-accent/40 bg-accent/5 text-accent shrink-0"
                        >
                          Destaque
                        </Badge>
                      </div>

                      <p className="mt-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {shop.description ||
                          "Atendimento premium com os melhores profissionais da região."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-accent">
                          <Star className="h-4 w-4 fill-current" />
                        </div>
                        <span className="font-mono text-sm font-bold">
                          {shop.rating?.toFixed(1) ?? "5.0"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ({shop.review_count || 12} avaliações)
                        </span>
                      </div>

                      <Button
                        asChild
                        size="sm"
                        className="rounded-none bg-accent text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background"
                      >
                        <Link to="/b/$slug" params={{ slug: shop.slug }}>
                          Ver detalhes
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="mt-12 text-center">
            <Button
              asChild
              variant="outline"
              className="rounded-none border-border px-8 text-xs uppercase tracking-[0.2em]"
            >
              <Link to="/barbearias">Ver todas as barbearias premium</Link>
            </Button>
          </div>
        </div>
      </section>

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
              Sua melhor versão exige os melhores profissionais. Encontre barbearias de alto padrão
              e reserve seu horário em 30 segundos.
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
                  <Link to="/barbearias" aria-label={`Agendar ${s.name}`}>
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

      {/* Seção: Depoimentos & Confiança */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="mb-14 flex flex-col gap-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            — Opinião de quem frequenta
          </div>
          <h2 className="font-serif text-4xl font-bold md:text-5xl">
            Aprovado por <span className="italic font-normal">homens exigentes</span>
          </h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Confira a experiência de clientes reais que agendam suas sessões pelo BarberOS.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Guilherme Sampaio",
              city: "São Paulo, SP",
              rating: 5,
              text: "Melhor experiência de barbearia que já tive. Agendei em menos de um minuto pelo celular, cheguei no horário e o barbeiro já estava pronto me esperando com um café espresso.",
            },
            {
              name: "Rodrigo Mendonça",
              city: "Rio de Janeiro, RJ",
              rating: 5,
              text: "A qualidade do corte degradê e o cuidado com a barba foram impecáveis. Sem fila, sem estresse. O lembrete no WhatsApp 24h antes ajudou demais!",
            },
            {
              name: "Lucas Vasconcelos",
              city: "Belo Horizonte, MG",
              rating: 5,
              text: "Ambiente de primeiro mundo e profissionais extremamente atenciosos. Já assinei o plano de recorrência e não troco de barbearia por nada.",
            },
          ].map((t, idx) => (
            <div
              key={idx}
              className="flex flex-col justify-between border border-border/60 bg-card/40 p-8 backdrop-blur-sm transition-all hover:border-accent"
            >
              <div className="space-y-4">
                <div className="flex gap-1 text-accent">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-foreground/90 italic">"{t.text}"</p>
              </div>

              <div className="mt-6 flex items-center gap-3 border-t border-border/40 pt-4">
                <div className="grid h-10 w-10 place-items-center bg-accent/20 font-serif font-bold text-accent text-sm">
                  {t.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="font-serif font-bold text-sm text-foreground">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {t.city} · Cliente Verificado
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sobre + CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <div className="grid gap-12 md:grid-cols-2">
          <div className="space-y-6">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
                — A casa
              </div>
            </div>
            <h2 className="font-serif text-4xl font-bold md:text-5xl">
              Sobre a <span className="italic font-normal">BarberOS</span>
            </h2>
            <p className="max-w-md text-muted-foreground">
              Mais que uma barbearia: uma experiência. Combinamos tradição e modernidade num
              ambiente acolhedor para o homem que cuida da imagem.
            </p>
            <div className="space-y-4 border-t border-border/60 pt-6 text-sm">
              <div className="flex items-center gap-4">
                <MapPin className="h-4 w-4 shrink-0 text-accent" />
                <span className="text-muted-foreground">Rua Augusta, 1500 — São Paulo / SP</span>
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
                <Link to="/barbearias">Agendar agora</Link>
              </Button>
              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                <Clock className="h-3 w-3" /> Confirmação instantânea
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
