import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Scissors, Search, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/barbearias")({
  head: () => ({
    meta: [
      { title: "Barbearias — Encontre a sua no BarberOS" },
      {
        name: "description",
        content:
          "Diretório de barbearias parceiras. Encontre por cidade ou nome e agende online em segundos.",
      },
      { property: "og:title", content: "Barbearias parceiras — BarberOS" },
      {
        property: "og:description",
        content: "Diretório de barbearias com agendamento online 24/7.",
      },
    ],
  }),
  component: Directory,
});

type Shop = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  logo_url: string | null;
  address: any;
};

function Directory() {
  const [q, setQ] = useState("");

  const { data: shops } = useQuery({
    queryKey: ["shops-directory"],
    queryFn: async () => {
      const { data } = await supabase
        .from("barbershops")
        .select("id,name,slug,description,banner_url,logo_url,address")
        .eq("active", true)
        .order("name");
      return (data ?? []) as Shop[];
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return shops ?? [];
    return (shops ?? []).filter((x) => {
      const city = (x.address?.city ?? "").toLowerCase();
      const street = (x.address?.street ?? "").toLowerCase();
      return (
        x.name.toLowerCase().includes(s) ||
        city.includes(s) ||
        street.includes(s) ||
        x.slug.includes(s)
      );
    });
  }, [shops, q]);

  return (
    <PublicLayout>
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
              Explore as unidades parceiras e agende seu horário em segundos.
            </p>
          </div>
          <div className="relative mt-10 max-w-xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, cidade ou rua…"
              className="h-14 rounded-none border-border bg-background/60 pl-12 text-base backdrop-blur"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20">
        {!shops ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <div className="border border-border p-16 text-center">
            <p className="text-muted-foreground">
              Nenhuma barbearia encontrada para “{q}”.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const city = s.address?.city as string | undefined;
              const street = s.address?.street as string | undefined;
              return (
                <article
                  key={s.id}
                  className="group flex flex-col bg-background transition-colors hover:bg-card"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-card">
                    {s.banner_url ? (
                      <img
                        src={s.banner_url}
                        alt={s.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-accent/40">
                        <Scissors className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col gap-5 p-7 md:p-8">
                    <div className="space-y-2">
                      <h2 className="font-serif text-xl font-bold">{s.name}</h2>
                      {(city || street) && (
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                          <MapPin className="h-3 w-3 text-accent" />
                          {[street, city].filter(Boolean).join(" — ")}
                        </div>
                      )}
                    </div>
                    {s.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                    <div className="mt-auto flex gap-2 pt-2">
                      <Button
                        asChild
                        variant="outline"
                        className="flex-1 rounded-none border-border bg-transparent text-[11px] font-bold uppercase tracking-[0.2em] hover:border-accent hover:bg-transparent hover:text-accent"
                      >
                        <Link to="/b/$slug" params={{ slug: s.slug }}>
                          Vitrine
                        </Link>
                      </Button>
                      <Button
                        asChild
                        className="flex-1 rounded-none bg-accent text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background"
                      >
                        <Link to="/agendar" search={{ shop: s.slug }}>
                          Agendar
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
