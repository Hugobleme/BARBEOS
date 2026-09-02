import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { brl, minutes } from "@/lib/format";
import { ArrowRight, MapPin, Scissors, Search } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços e Cuidados — BarberOS" },
      {
        name: "description",
        content:
          "Catálogo completo de cortes, barba e cuidados estéticos masculinos nas barbearias parceiras BarberOS.",
      },
      { property: "og:title", content: "Serviços — BarberOS" },
      { property: "og:description", content: "Cortes, barba e cuidados premium." },
      { property: "og:url", content: "/servicos" },
    ],
    links: [{ rel: "canonical", href: "/servicos" }],
  }),
  component: ServicesDirectoryPage,
});

function ServicesDirectoryPage() {
  const [search, setSearch] = useState("");

  const { data: servicesWithShop, isLoading } = useQuery({
    queryKey: ["all-services-by-shop"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select(
          `
          id,
          name,
          description,
          price,
          duration_min,
          barbershop:barbershops!inner(
            id,
            name,
            slug,
            address,
            active
          )
        `,
        )
        .eq("active", true)
        .eq("barbershops.active", true)
        .order("name");

      if (error) throw error;
      return data ?? [];
    },
  });

  // Agrupamento por barbearia
  const groupedByShop = useMemo(() => {
    if (!servicesWithShop) return [];

    const query = search.trim().toLowerCase();
    const map: Record<string, { shop: any; services: any[] }> = {};

    servicesWithShop.forEach((item: any) => {
      const matchService =
        !query ||
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query));

      const matchShop =
        !query ||
        item.barbershop?.name.toLowerCase().includes(query) ||
        JSON.stringify(item.barbershop?.address ?? {})
          .toLowerCase()
          .includes(query);

      if (matchService || matchShop) {
        const shopId = item.barbershop.id;
        if (!map[shopId]) {
          map[shopId] = {
            shop: item.barbershop,
            services: [],
          };
        }
        map[shopId].services.push(item);
      }
    });

    return Object.values(map);
  }, [servicesWithShop, search]);

  return (
    <PublicLayout>
      <section className="border-b border-border/60 bg-card/30">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
          <div className="max-w-2xl space-y-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              — Catálogo Completo
            </div>
            <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight md:text-6xl">
              Serviços <span className="italic font-normal">por barbearia</span>
            </h1>
            <p className="text-muted-foreground">
              Encontre o serviço ideal e agende diretamente na unidade de sua preferência.
            </p>
          </div>

          <div className="relative mt-8 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar serviço (ex: Degradê, Barba, Hidratação, Barba Terapia)..."
              className="h-14 rounded-none border-border bg-background/80 pl-12 text-sm backdrop-blur"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        {isLoading ? (
          <div className="space-y-12">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse border border-border bg-card/40" />
            ))}
          </div>
        ) : groupedByShop.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <Scissors className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <h2 className="mt-4 font-serif text-2xl font-bold">Nenhum serviço encontrado</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente buscar por outro termo ou explore o diretório de barbearias.
            </p>
            <Button asChild variant="outline" className="mt-6 rounded-none">
              <Link to="/barbearias">Ver barbearias parceiras</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-16">
            {groupedByShop.map(({ shop, services }) => {
              const addr = (shop.address ?? {}) as any;
              const locationStr = [addr.neighborhood || addr.district, addr.city, addr.state]
                .filter(Boolean)
                .join(" · ");

              return (
                <div key={shop.id} className="border border-border/80 bg-background p-6 md:p-10">
                  {/* Cabeçalho da Barbearia */}
                  <div className="mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-serif text-3xl font-bold">{shop.name}</h2>
                        <Badge
                          variant="outline"
                          className="rounded-none border-accent/40 bg-accent/5 text-accent text-[10px]"
                        >
                          Unidade Parceira
                        </Badge>
                      </div>
                      {locationStr && (
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          {locationStr}
                        </p>
                      )}
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="rounded-none border-border text-xs uppercase tracking-wider hover:border-accent hover:text-accent"
                    >
                      <Link to="/b/$slug" params={{ slug: shop.slug }}>
                        Ver perfil da barbearia
                      </Link>
                    </Button>
                  </div>

                  {/* Grid de Serviços desta Barbearia */}
                  <div className="grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
                    {services.map((s: any) => (
                      <article
                        key={s.id}
                        className="group flex flex-col justify-between bg-card/40 p-6 transition-colors hover:bg-card"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-serif text-xl font-bold">{s.name}</h3>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {minutes(s.duration_min)}
                            </span>
                          </div>
                          {s.description && (
                            <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                              {s.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                          <span className="font-serif text-xl font-bold text-accent">
                            {brl(Number(s.price))}
                          </span>
                          <Button
                            asChild
                            size="sm"
                            className="rounded-none bg-amber-500 text-[10px] font-bold uppercase tracking-wider text-amber-950 hover:bg-amber-600"
                          >
                            <Link to="/agendar" search={{ barbershop: shop.slug }}>
                              Agendar <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
