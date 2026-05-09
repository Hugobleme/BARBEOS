import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { brl, minutes, DEMO_BARBERSHOP_ID } from "@/lib/format";
import { Scissors } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({ meta: [{ title: "Serviços — BarberOS" }, { name: "description", content: "Catálogo de serviços da BarberOS." }] }),
  component: Page,
});

function Page() {
  const { data, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true).order("sort")).data ?? [],
  });
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h1 className="font-display text-4xl font-bold">Serviços</h1>
        <p className="mt-2 text-muted-foreground">Tudo que oferecemos, com preço e duração.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading && Array.from({length:6}).map((_,i)=> <Card key={i} className="h-44 animate-pulse bg-muted" />)}
          {data?.map((s) => (
            <Card key={s.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Scissors className="h-5 w-5"/></div>
                <span className="text-xs text-muted-foreground">{minutes(s.duration_min)}</span>
              </div>
              <div className="font-display text-lg font-semibold">{s.name}</div>
              <p className="text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-xl font-semibold">{brl(Number(s.price))}</span>
                <Button asChild size="sm"><Link to="/agendar">Agendar</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
