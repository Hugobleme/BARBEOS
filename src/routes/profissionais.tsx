import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_BARBERSHOP_ID } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/profissionais")({
  head: () => ({
    meta: [
      { title: "Equipe — BarberOS" },
      { name: "description", content: "Conheça os artesãos por trás de cada corte na BarberOS." },
      { property: "og:title", content: "Equipe — BarberOS" },
      { property: "og:description", content: "Os artesãos da BarberOS." },
      { property: "og:url", content: "/profissionais" },
    ],
    links: [{ rel: "canonical", href: "/profissionais" }],
  }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["pros"],
    queryFn: async () =>
      (
        await supabase
          .from("professionals")
          .select("*")
          .eq("barbershop_id", DEMO_BARBERSHOP_ID)
          .eq("active", true)
      ).data ?? [],
  });

  return (
    <PublicLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24">
        <div className="max-w-2xl space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
            — Os artesãos
          </div>
          <h1 className="font-serif text-5xl font-bold tracking-tight md:text-6xl">
            Nossa <span className="italic font-normal">equipe</span>
          </h1>
          <p className="text-muted-foreground">Conheça os barbeiros que assinam cada corte.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <article
              key={p.id}
              className="flex flex-col gap-6 bg-background p-8 transition-colors hover:bg-card md:p-10"
            >
              <div className="flex items-center gap-5">
                <Avatar className="h-16 w-16 rounded-none">
                  <AvatarFallback className="rounded-none bg-accent/15 font-serif text-xl text-accent">
                    {p.display_name
                      .split(" ")
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="font-serif text-xl font-bold">{p.display_name}</div>
                  <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {p.bio}
                  </p>
                </div>
              </div>
              {p.specialties && p.specialties.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {p.specialties.map((s: string) => (
                    <Badge
                      key={s}
                      variant="outline"
                      className="rounded-none border-border bg-transparent text-[10px] font-normal uppercase tracking-[0.18em] text-muted-foreground"
                    >
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
              <Button
                asChild
                variant="outline"
                className="mt-auto h-auto rounded-none border-border bg-transparent py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:border-accent hover:bg-transparent hover:text-accent"
              >
                <Link to="/agendar">
                  Agendar com {p.display_name.split(" ")[0]}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Link>
              </Button>
            </article>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
