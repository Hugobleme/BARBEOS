import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DEMO_BARBERSHOP_ID } from "@/lib/format";

export const Route = createFileRoute("/profissionais")({
  head: () => ({ meta: [{ title: "Equipe — BarberOS" }] }),
  component: Page,
});

function Page() {
  const { data } = useQuery({
    queryKey: ["pros"],
    queryFn: async () => (await supabase.from("professionals").select("*").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true)).data ?? [],
  });
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <h1 className="font-display text-4xl font-bold">Equipe</h1>
        <p className="mt-2 text-muted-foreground">Conheça nossos barbeiros.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data?.map((p) => (
            <Card key={p.id} className="flex flex-col gap-4 p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16"><AvatarFallback className="bg-primary text-lg text-primary-foreground">{p.display_name.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div>
                  <div className="font-display text-lg font-semibold">{p.display_name}</div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{p.bio}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.specialties?.map((s) => <Badge key={s} variant="secondary" className="font-normal">{s}</Badge>)}
              </div>
              <Button asChild className="mt-2"><Link to="/agendar">Agendar com {p.display_name.split(" ")[0]}</Link></Button>
            </Card>
          ))}
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}
