import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Scissors, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/barbearias")({
  head: () => ({
    meta: [
      { title: "Barbearias — Encontre a sua no BarberOS" },
      { name: "description", content: "Diretório de barbearias parceiras. Encontre por cidade ou nome e agende online em segundos." },
      { property: "og:title", content: "Barbearias parceiras — BarberOS" },
      { property: "og:description", content: "Diretório de barbearias com agendamento online 24/7." },
    ],
  }),
  component: Directory,
});

type Shop = {
  id: string; name: string; slug: string; description: string | null;
  banner_url: string | null; logo_url: string | null; address: any;
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
      return x.name.toLowerCase().includes(s) || city.includes(s) || street.includes(s) || x.slug.includes(s);
    });
  }, [shops, q]);

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <section className="border-b border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Diretório oficial
          </span>
          <h1 className="mt-4 font-display text-4xl font-bold md:text-5xl">Encontre sua barbearia</h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Explore as unidades parceiras e agende seu horário em segundos.
          </p>
          <div className="relative mt-6 max-w-lg">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, cidade ou rua…"
              className="h-12 pl-9"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        {!shops ? (
          <p className="text-muted-foreground">Carregando…</p>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground">Nenhuma barbearia encontrada para “{q}”.</p>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((s) => {
              const city = s.address?.city as string | undefined;
              const street = s.address?.street as string | undefined;
              return (
                <Card key={s.id} className="group overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary to-primary/60">
                    {s.banner_url ? (
                      <img src={s.banner_url} alt={s.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full place-items-center text-primary-foreground/70">
                        <Scissors className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="font-display text-lg font-semibold">{s.name}</div>
                    {(city || street) && (
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {[street, city].filter(Boolean).join(" — ")}
                      </div>
                    )}
                    {s.description && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                    <div className="mt-4 flex gap-2">
                      <Button asChild size="sm" className="flex-1"><Link to="/b/$slug" params={{ slug: s.slug }}>Ver vitrine</Link></Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link to="/agendar" search={{ shop: s.slug }}>Agendar</Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <PublicFooter />
    </div>
  );
}
