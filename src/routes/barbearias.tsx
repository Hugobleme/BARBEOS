import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { barbershopService, BarbershopWithStats } from "@/services/barbershop.service";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Scissors, Search, Star, Filter, RotateCcw } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  city: z.string().optional(),
  neighborhood: z.string().optional(),
  minRating: z.coerce.number().optional(),
  sort: z.string().optional(),
  page: z.coerce.number().optional(),
});

export const Route = createFileRoute("/barbearias")({
  head: () => ({
    meta: [
      { title: "Encontrar Barbearias | BARBEOS" },
      {
        name: "description",
        content: "Encontre as melhores barbearias na sua região e agende seu horário.",
      },
    ],
  }),
  validateSearch: (search) => searchSchema.parse(search),
  component: BarbeariasPage,
});

function BarbeariasPage() {
  const navigate = useNavigate({ from: Route.fullPath });
  const searchParams = Route.useSearch();

  // Estados locais para os filtros
  const [city, setCity] = useState(searchParams.city || "");
  const [neighborhood, setNeighborhood] = useState(searchParams.neighborhood || "");
  const [minRating, setMinRating] = useState(searchParams.minRating?.toString() || "");
  const [sort, setSort] = useState(searchParams.sort || "rating");
  const [page, setPage] = useState(searchParams.page || 1);

  // Busca de barbearias
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "public-barbershops",
      searchParams.city,
      searchParams.neighborhood,
      searchParams.minRating,
      searchParams.sort,
      searchParams.page,
    ],
    queryFn: () =>
      barbershopService.getBarbershops({
        city: searchParams.city,
        neighborhood: searchParams.neighborhood,
        minRating: searchParams.minRating,
        sort: searchParams.sort as any,
        page: searchParams.page,
        limit: 12,
      }),
  });

  const shops = Array.isArray(data?.data)
    ? data!.data.map((s: any) => ({
        id: s.id,
        name: s.name ?? "Barbearia",
        slug: s.slug ?? "",
        banner_url: s.banner_url,
        description: s.description,
        rating: s.rating,
        address: s.address,
      }))
    : [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil((data?.count ?? 0) / 12) || 1;

  if (error && import.meta.env.DEV) {
    console.error("Failed to load barbershops", error);
  }

  const applyFilters = () => {
    navigate({
      search: {
        city: city || undefined,
        neighborhood: neighborhood || undefined,
        minRating: minRating ? Number(minRating) : undefined,
        sort: sort || undefined,
        page: 1,
      },
    });
  };

  const resetFilters = () => {
    setCity("");
    setNeighborhood("");
    setMinRating("");
    setSort("rating");
    navigate({ search: {} });
  };

  return (
    <PublicLayout>
      {/* Cabeçalho */}
      <section className="border-b border-border bg-background pt-24 pb-8 md:pt-32 md:pb-12">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <h1 className="font-serif text-3xl font-bold md:text-5xl max-w-2xl">
            Encontre a barbearia ideal para o seu <span className="text-accent italic">estilo</span>
            .
          </h1>

          <div className="mt-8 bg-card/50 border border-border/60 p-4 md:p-6 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Cidade"
                  className="pl-9 h-11 text-base md:text-sm bg-background border-border/40"
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="pl-9 h-11 text-base md:text-sm bg-background border-border/40"
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                />
              </div>
              <div>
                <Select value={minRating} onValueChange={setMinRating}>
                  <SelectTrigger className="h-11 text-base md:text-sm bg-background border-border/40">
                    <SelectValue placeholder="Avaliação mínima" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Qualquer avaliação</SelectItem>
                    <SelectItem value="4.5">Acima de 4.5</SelectItem>
                    <SelectItem value="4.0">Acima de 4.0</SelectItem>
                    <SelectItem value="3.0">Acima de 3.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-11 text-base md:text-sm bg-background border-border/40">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Mais bem avaliadas</SelectItem>
                    <SelectItem value="recent">Mais recentes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/20 pt-4">
              <span className="text-sm text-muted-foreground font-medium">
                {isLoading
                  ? "Buscando..."
                  : error
                    ? ""
                    : `${totalCount} ${totalCount === 1 ? "resultado" : "resultados"}`}
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="h-11 flex-1 sm:flex-none border-border/40 hover:bg-muted"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Limpar
                </Button>
                <Button
                  onClick={applyFilters}
                  className="h-11 flex-1 sm:flex-none bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Filter className="mr-2 h-4 w-4" /> Filtrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12 bg-background/50">
        {isLoading ? (
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[360px] animate-pulse bg-muted rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="border border-destructive/20 bg-destructive/5 p-8 text-center rounded-xl">
            <h2 className="text-xl font-bold text-destructive">
              N�o foi poss�vel carregar as barbearias.
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente novamente em alguns instantes.
            </p>
            <Button
              onClick={() => refetch()}
              variant="outline"
              className="mt-4 border-destructive/30 text-destructive"
            >
              Tentar novamente
            </Button>
          </div>
        ) : shops.length === 0 ? (
          <div className="border border-border/40 bg-card/20 p-12 text-center rounded-xl">
            <Scissors className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
            <h2 className="text-xl font-bold">Nenhum local encontrado com estes filtros.</h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Tente outra cidade ou remova os filtros.
            </p>
            <Button onClick={resetFilters} variant="outline" className="mt-6 border-border/40">
              Limpar filtros
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => {
                const addr = (shop.address ?? {}) as any;
                const locationText = [addr.street, addr.neighborhood || addr.district, addr.city]
                  .filter(Boolean)
                  .join(", ");
                const hasValidSlug = Boolean(shop.slug);

                return (
                  <article
                    key={shop.id}
                    className="group flex flex-col bg-card border border-border/40 rounded-xl overflow-hidden hover:border-accent/40 transition-colors"
                  >
                    {shop.banner_url ? (
                      <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
                        <img
                          src={shop.banner_url}
                          alt={shop.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] w-full bg-muted/40 flex items-center justify-center">
                        <Scissors className="h-10 w-10 text-muted-foreground/20" />
                      </div>
                    )}

                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <h3 className="font-serif text-xl font-bold text-foreground line-clamp-1">
                            {shop.name}
                          </h3>
                          <Badge variant="secondary" className="shrink-0 flex items-center gap-1">
                            <Star className="h-3 w-3 fill-accent text-accent" />
                            {shop.rating?.toFixed(1) ?? "5.0"}
                          </Badge>
                        </div>

                        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mb-3">
                          <MapPin className="h-4 w-4 text-accent shrink-0" />
                          <span className="truncate">
                            {locationText || "Endereço não informado"}
                          </span>
                        </p>

                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {shop.description || "Barbearia parceira BarberOS."}
                        </p>
                      </div>

                      <div className="mt-5 pt-4 border-t border-border/40">
                        {hasValidSlug ? (
                          <Button
                            asChild
                            className="w-full h-11 bg-card hover:bg-accent hover:text-accent-foreground border border-border/40 text-foreground font-medium"
                          >
                            <Link to="/b/$slug" params={{ slug: shop.slug }}>
                              Ver barbearia
                            </Link>
                          </Button>
                        ) : (
                          <Button disabled className="w-full h-11 opacity-50 cursor-not-allowed">
                            Indisponível
                          </Button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo(0, 0);
                  }}
                  className="h-11"
                >
                  Anterior
                </Button>
                <span className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo(0, 0);
                  }}
                  className="h-11"
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
