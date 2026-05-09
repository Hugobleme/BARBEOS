import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, MapPin, Phone, Scissors, Sparkles, Star } from "lucide-react";
import { brl, minutes, DEMO_BARBERSHOP_ID } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BarberOS Demo — Barbearia premium em São Paulo" },
      { name: "description", content: "Agende seu horário online 24/7. Cortes clássicos e modernos, barba e tratamentos." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { data: services } = useQuery({
    queryKey: ["services-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("services").select("*").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true).order("sort").limit(6);
      return data ?? [];
    },
  });
  const { data: pros } = useQuery({
    queryKey: ["pros-featured"],
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("*").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true);
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.74_0.09_85/0.18),transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:px-6 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Atendimento premium
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] md:text-6xl">
              Cortes que <span className="text-accent">marcam</span>.<br/>Agendamento que <em className="not-italic underline decoration-accent decoration-4 underline-offset-4">simplifica</em>.
            </h1>
            <p className="mt-5 max-w-md text-base text-muted-foreground md:text-lg">
              Reserve seu horário em 30 segundos. Sem ligações, sem espera — disponível 24 horas por dia.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-6 text-base"><Link to="/agendar">Agendar agora</Link></Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base"><Link to="/servicos">Ver serviços</Link></Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" /><span className="font-medium text-foreground">4.9</span> em 230 avaliações</div>
              <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> Aberto agora</div>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary to-primary/70 p-8 shadow-xl">
              <div className="flex h-full flex-col justify-between text-primary-foreground">
                <Scissors className="h-10 w-10 text-accent" />
                <div>
                  <div className="font-display text-3xl font-semibold">BarberOS</div>
                  <div className="mt-1 text-sm opacity-80">Premium · Desde 2024</div>
                  <div className="mt-6 flex items-center gap-2 text-sm opacity-90">
                    <MapPin className="h-4 w-4" /> Rua Augusta, 1500
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Serviços */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold md:text-4xl">Serviços em destaque</h2>
            <p className="mt-2 text-muted-foreground">Escolha, agende e relaxe.</p>
          </div>
          <Button asChild variant="ghost"><Link to="/servicos">Ver todos →</Link></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services?.map((s) => (
            <Card key={s.id} className="group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Scissors className="h-5 w-5" /></div>
                <span className="text-xs text-muted-foreground">{minutes(s.duration_min)}</span>
              </div>
              <div>
                <div className="font-display text-lg font-semibold">{s.name}</div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xl font-semibold">{brl(Number(s.price))}</span>
                <Button asChild size="sm" variant="secondary"><Link to="/agendar">Agendar</Link></Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Equipe */}
      <section className="bg-card/40">
        <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <h2 className="font-display text-3xl font-bold md:text-4xl">Nossa equipe</h2>
          <p className="mt-2 text-muted-foreground">Profissionais com paixão pelo ofício.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pros?.map((p) => (
              <Card key={p.id} className="flex items-center gap-4 p-5">
                <Avatar className="h-14 w-14"><AvatarFallback className="bg-primary text-primary-foreground">{p.display_name.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="font-semibold">{p.display_name}</div>
                  <div className="truncate text-sm text-muted-foreground">{p.specialties?.slice(0,2).join(" · ")}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Sobre + contato */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-bold">Sobre a BarberOS</h2>
            <p className="mt-3 text-muted-foreground">Mais que uma barbearia: uma experiência. Combinamos tradição e modernidade num ambiente acolhedor para o homem que cuida da imagem.</p>
            <div className="mt-6 grid gap-3 text-sm">
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-accent" /> Rua Augusta, 1500 — São Paulo/SP</div>
              <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-accent" /> (11) 99999-0000</div>
              <div className="flex items-center gap-3"><Calendar className="h-4 w-4 text-accent" /> Seg a Sáb</div>
            </div>
          </div>
          <Card className="flex flex-col items-start gap-4 bg-primary p-8 text-primary-foreground">
            <Sparkles className="h-8 w-8 text-accent" />
            <div>
              <h3 className="font-display text-2xl font-semibold">Pronto pra um novo visual?</h3>
              <p className="mt-2 text-sm opacity-80">Reserve seu horário em poucos toques.</p>
            </div>
            <Button asChild size="lg" variant="secondary" className="bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/agendar">Agendar agora</Link></Button>
          </Card>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
