import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { brl, minutes, DEMO_BARBERSHOP_ID } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({
    meta: [
      { title: "Serviços — BarberOS" },
      { name: "description", content: "Catálogo completo de serviços da BarberOS." },
    ],
  }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () =>
      (
        await supabase
          .from("services")
          .select("*")
          .eq("barbershop_id", DEMO_BARBERSHOP_ID)
          .eq("active", true)
          .order("sort")
      ).data ?? [],
  });

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            — Catálogo
          </div>
          <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
            Serviços <span className="italic font-normal">selecionados</span>
          </h1>
          <p className="text-muted-foreground">
            Tudo que oferecemos, com preço e duração. Reserve em segundos.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {isLoading &&
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse bg-card" />
            ))}
          {data?.map((s, idx) => (
            <article
              key={s.id}
              className="group flex flex-col gap-8 bg-background p-8 transition-colors duration-500 hover:bg-card md:p-10"
            >
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent/60">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {minutes(s.duration_min)}
                </span>
              </div>
              <div className="space-y-3">
                <h2 className="font-serif text-2xl font-bold">{s.name}</h2>
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
    </PublicLayout>
  );
}
