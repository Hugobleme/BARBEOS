import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { barbershopService, BarbershopWithStats } from "@/services/barbershop.service";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Scissors, Search, ArrowRight, Star, Filter, RotateCcw } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  minRating: z.coerce.number().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().optional(),
});

export const Route = createFileRoute("/barbearias")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [
      { title: "Barbearias Parceiras — Encontre a sua no BarberOS" },
      {
        name: "description",
        content:
          "Diretório completo de barbearias parceiras. Filtre por cidade, bairro e avaliação e agende online em segundos.",
      },
      { property: "og:title", content: "Barbearias Parceiras — BarberOS" },
      {
        property: "og:description",
        content: "Diretório de barbearias com agendamento online 24/7.",
      },
      { property: "og:url", content: "/barbearias" },
    ],
    links: [{ rel: "canonical", href: "/barbearias" }],
  }),
  component: Directory,
});

function Directory() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();

  const [city, setCity] = useState(searchParams.city || "");
  const [neighborhood, setNeighborhood] = useState(searchParams.neighborhood || "");
  const [minRating, setMinRating] = useState<string>(searchParams.minRating ? String(searchParams.minRating) : "all");
  const [sort, setSort] = useState(searchParams.sort || "rating");
  const [page, setPage] = useState(searchParams.page || 1);

  const { data, isLoading } = useQuery({
    queryKey: ["barbershops-directory", city, neighborhood, minRating, sort, page],
    queryFn: () =>
      barbershopService.getBarbershops({
        city: city || undefined,
        neighborhood: neighborhood || undefined,
        minRating: minRating !== "all" ? Number(minRating) : undefined,
        sort,
        page,
        limit: 20,
      }),
  });

  const shops = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;

  function applyFilters() {
    setPage(1);
    navigate({
      to: "/barbearias",
      search: {
        city: city || undefined,
        neighborhood: neighborhood || undefined,
        minRating: minRating !== "all" ? Number(minRating) : undefined,
        sort,
        page: 1,
      },
    });
  }

  function resetFilters() {
    setCity("");
    setNeighborhood("");
    setMinRating("all");
    setSort("rating");
    setPage(1);
    navigate({
      to: "/barbearias",
      search: {},
    });
  }

  return (
    <PublicLayout>
      {/* Header com estilo Midnight Prestige */}
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-2xl space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              — Diretório oficial
            </div>
            <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
              Encontre sua <span className="italic font-normal">barbearia</span>
            </h1>
            <p className="text-muted-foreground">
              Explore as unidades parceiras, compare avaliações e agende seu horário em segundos.
            </p>
          </div>

          {/* Painel de Filtros e Busca */}
          <div className="mt-10 rounded-none border border-border/80 bg-background/80 p-6 backdrop-blur-md">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cidade</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ex: São Paulo"
                    className="h-11 rounded-none pl-9 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Bairro</label>
                <Input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex: Jardins, Pinheiros"
                  className="h-11 rounded-none text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avaliação Mínima</label>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="h-11 rounded-none text-sm">
                    <SelectValue placeholder="Todas as notas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="all">Todas as notas</SelectItem>
                    <SelectItem value="4.5">★ 4.5 ou mais</SelectItem>
                    <SelectItem value="4.0">★ 4.0 ou mais</SelectItem>
                    <SelectItem value="3.5">★ 3.5 ou mais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ordenar por</label>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-11 rounded-none text-sm">
                    <SelectValue placeholder="Ordenação" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="rating">Mais bem avaliadas</SelectItem>
                    <SelectItem value="popular">Mais populares</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4">
              <span className="text-xs text-muted-foreground">
                {totalCount} {totalCount === 1 ? "barbearia encontrada" : "barbearias encontradas"}
              </span>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="rounded-none text-xs uppercase tracking-wider"
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Limpar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={applyFilters}
                  className="rounded-none bg-accent text-xs font-bold uppercase tracking-wider text-accent-foreground hover:bg-foreground hover:text-background"
                >
                  <Filter className="mr-1.5 h-3.5 w-3.5" /> Filtrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista de Barbearias */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse border border-border bg-card/40" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <Scissors className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-serif text-2xl font-bold">Nenhuma barbearia encontrada</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente ajustar seus filtros de cidade, bairro ou avaliação.
            </p>
            <Button onClick={resetFilters} variant="outline" className="mt-6 rounded-none">
              Limpar todos os filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => {
                const addr = (shop.address ?? {}) as any;
                const locationText = [addr.street, addr.neighborhood || addr.district, addr.city]
                  .filter(Boolean)
                  .join(", ");

                return (
                  <article
                    key={shop.id}
                    className="group relative flex flex-col justify-between overflow-hidden border border-border bg-background p-6 transition-all duration-300 hover:border-accent hover:bg-card/40"
                  >
                    <div>
                      {shop.banner_url && (
                        <div className="mb-4 aspect-[4/3] w-full max-w-full overflow-hidden border border-border/40">
                          <img
                            src={shop.banner_url}
                            alt={shop.name}
                            loading="lazy"
                            className="h-full w-full max-w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-serif text-2xl font-bold transition-colors group-hover:text-accent">
                          {shop.name}
                        </h3>
                        <Badge variant="outline" className="rounded-none border-accent/40 bg-accent/5 text-accent shrink-0">
                          <Star className="mr-1 h-3 w-3 fill-current" />
                          {shop.rating?.toFixed(1) ?? "5.0"}
                        </Badge>
                      </div>

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                        <span className="truncate">{locationText || "São Paulo, SP"}</span>
                      </p>

                      <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                        {shop.description || "Unidade especializada em cortes clássicos e modernos com atendimento de excelência."}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {shop.review_count ? `${shop.review_count} avaliações` : "Nova no BarberOS"}
                      </span>

                      <div className="flex gap-2">
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="rounded-none text-[10px] font-bold uppercase tracking-wider"
                        >
                          <Link to="/b/$slug" params={{ slug: shop.slug }}>
                            Ver unidade
                          </Link>
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          className="rounded-none bg-accent text-[10px] font-bold uppercase tracking-wider text-accent-foreground hover:bg-foreground hover:text-background"
                        >
                          <Link to="/agendar" search={{ shop: shop.slug }}>
                            Agendar
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="mt-14 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-none text-xs"
                >
                  Anterior
                </Button>
                <span className="px-4 text-xs font-mono text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="rounded-none text-xs"
                >
                  Próxima
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </PublicLayout>
  );
}
