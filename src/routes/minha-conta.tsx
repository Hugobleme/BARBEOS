import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, Gift, LogOut, Wallet, Crown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — BarberOS" },
      { name: "description", content: "Gerencie seus agendamentos, histórico e avaliações." },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "/minha-conta" }],
  }),
  component: Page,
});

function Page() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const { data: appts } = useQuery({
    enabled: !!user,
    queryKey: ["my-appts", user?.id],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const { data: customers } = await supabase.from("customers").select("id").eq("profile_id", user!.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("appointments")
        .select("id, status, scheduled_start, scheduled_end, total_amount, professional:professionals(display_name), services:appointment_services(service:services(name))")
        .in("customer_id", ids)
        .order("scheduled_start", { ascending: false });
      return data ?? [];
    },
  });

  const { data: loyalty } = useQuery({
    enabled: !!user,
    queryKey: ["my-loyalty", user?.id],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const { data: customers } = await supabase.from("customers").select("id").eq("profile_id", user!.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return { balances: [], txs: [] };
      const [{ data: balances }, { data: txs }] = await Promise.all([
        supabase.from("loyalty_balances").select("points, lifetime_points, barbershop:barbershops(id, name)").in("customer_id", ids),
        supabase.from("loyalty_transactions").select("id, kind, points, description, created_at, barbershop:barbershops(name)").in("customer_id", ids).order("created_at", { ascending: false }).limit(20),
      ]);
      return { balances: balances ?? [], txs: txs ?? [] };
    },
  });

  const { data: wallet } = useQuery({
    enabled: !!user,
    queryKey: ["my-wallet", user?.id],
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const { data: customers } = await supabase.from("customers").select("id").eq("profile_id", user!.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return { balances: [], txs: [] };
      const [{ data: balances }, { data: txs }] = await Promise.all([
        supabase.from("wallet_balances").select("balance, lifetime_credited, barbershop:barbershops(id, name)").in("customer_id", ids),
        supabase.from("wallet_transactions").select("id, kind, amount, description, created_at, barbershop:barbershops(name)").in("customer_id", ids).order("created_at", { ascending: false }).limit(20),
      ]);
      return { balances: balances ?? [], txs: txs ?? [] };
    },
  });

  const { data: subs } = useQuery({
    enabled: !!user,
    queryKey: ["my-subs", user?.id],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: customers } = await supabase.from("customers").select("id").eq("profile_id", user!.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const { data } = await supabase
        .from("customer_subscriptions")
        .select("*, package:packages(name, sessions_total)")
        .in("customer_id", ids)
        .eq("status", "active")
        .order("purchased_at", { ascending: false });
      return data ?? [];
    },
  });

  if (loading || !user) return null;
  const upcoming = (appts ?? []).filter((a) => new Date(a.scheduled_start) >= new Date() && a.status !== "cancelled");
  const past = (appts ?? []).filter((a) => new Date(a.scheduled_start) < new Date() || a.status === "cancelled");

  const { queryClient } = Route.useRouteContext();
  async function cancel(id: string) {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agendamento cancelado");
    queryClient.invalidateQueries({ queryKey: ["my-appts"] });
  }

  return (
    <PublicLayout>
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_70%)]"
        />
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-8">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-accent">Minha conta</p>
              <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl">Olá</h1>
              <p className="mt-2 text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="uppercase tracking-[0.2em]"
              onClick={() => supabase.auth.signOut().then(() => nav({ to: "/" }))}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>

          <VIPStatus lifetimePoints={loyalty?.balances?.reduce((acc: number, b: any) => acc + Number(b.lifetime_points || 0), 0) || 0} />

          {(loyalty?.balances?.length ?? 0) > 0 && (
            <>
              <SectionTitle eyebrow="★" title="Seus pontos de fidelidade" />
              <div className="grid gap-3 sm:grid-cols-2">
                {loyalty!.balances.map((b: any, i: number) => (
                  <article key={i} className="flex items-center justify-between border border-accent/30 bg-accent/5 p-5">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
                        <Gift className="h-4 w-4" /> {b.barbershop?.name}
                      </div>
                      <div className="mt-2 font-serif text-3xl font-bold">{b.points} pts</div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Acumulou {b.lifetime_points} no total</div>
                    </div>
                  </article>
                ))}
              </div>
              {loyalty!.txs.length > 0 && (
                <details className="mt-3 border border-border/50 p-4 text-sm">
                  <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-muted-foreground">Ver extrato (últimos 20)</summary>
                  <ul className="mt-3 divide-y divide-border/40">
                    {loyalty!.txs.map((t: any) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                        <span className="text-muted-foreground">{format(new Date(t.created_at), "d MMM yyyy", { locale: ptBR })} · {t.barbershop?.name}</span>
                        <span className="flex-1 truncate px-2">{t.description ?? (t.kind === "earn" ? "Ganho" : t.kind === "redeem" ? "Resgate" : t.kind)}</span>
                        <span className={`font-mono ${t.points > 0 ? "text-accent" : "text-muted-foreground"}`}>{t.points > 0 ? "+" : ""}{t.points}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}

          {(wallet?.balances?.some((b: any) => Number(b.balance) > 0) || (wallet?.txs?.length ?? 0) > 0) && (
            <>
              <SectionTitle eyebrow="$" title="Sua carteira" />
              <div className="grid gap-3 sm:grid-cols-2">
                {(wallet?.balances ?? []).filter((b: any) => Number(b.balance) > 0 || Number(b.lifetime_credited) > 0).map((b: any, i: number) => (
                  <article key={i} className="flex items-center justify-between border border-accent/30 bg-accent/5 p-5">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
                        <Wallet className="h-4 w-4" /> {b.barbershop?.name}
                      </div>
                      <div className="mt-2 font-serif text-3xl font-bold">{brl(Number(b.balance))}</div>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Recebeu {brl(Number(b.lifetime_credited))} de cashback</div>
                    </div>
                  </article>
                ))}
              </div>
              {(wallet?.txs?.length ?? 0) > 0 && (
                <details className="mt-3 border border-border/50 p-4 text-sm">
                  <summary className="cursor-pointer text-xs uppercase tracking-[0.2em] text-muted-foreground">Ver extrato (últimos 20)</summary>
                  <ul className="mt-3 divide-y divide-border/40">
                    {wallet!.txs.map((t: any) => (
                      <li key={t.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                        <span className="text-muted-foreground">{format(new Date(t.created_at), "d MMM yyyy", { locale: ptBR })} · {t.barbershop?.name}</span>
                        <span className="flex-1 truncate px-2">{t.description ?? t.kind}</span>
                        <span className={`font-mono ${Number(t.amount) > 0 ? "text-accent" : "text-muted-foreground"}`}>{Number(t.amount) > 0 ? "+" : ""}{brl(Number(t.amount))}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}

          {(subs?.length ?? 0) > 0 && (
            <>
              <SectionTitle eyebrow="VIP" title="Seus pacotes ativos" />
              <div className="grid gap-3 sm:grid-cols-2">
                {subs!.map((s: any) => (
                  <article key={s.id} className="flex flex-col gap-2 border border-accent/30 bg-accent/5 p-5">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent">
                      <Gift className="h-4 w-4" /> {s.package?.name}
                    </div>
                    <div className="mt-1 font-serif text-3xl font-bold">
                      {s.sessions_remaining} <span className="text-sm font-sans font-normal text-muted-foreground">/ {s.package?.sessions_total} sessões</span>
                    </div>
                    {s.expires_at && (
                      <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        Expira em: {format(new Date(s.expires_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}

          <SectionTitle eyebrow="01" title="Próximos atendimentos" />
          <div className="grid gap-3">
            {upcoming.length === 0 && (
              <div className="border border-border/60 p-8 text-center text-sm text-muted-foreground">
                Nada agendado.{" "}
                <Link to="/barbearias" className="font-medium text-accent hover:underline">
                  Reservar agora →
                </Link>
              </div>
            )}
            {upcoming.map((a: any) => (
              <article
                key={a.id}
                className="flex flex-col gap-4 border border-border/60 bg-card/40 p-5 transition hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 place-items-center border border-accent/40 text-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-serif text-lg">
                      {format(new Date(a.scheduled_start), "EEEE, d 'de' MMM • HH:mm", { locale: ptBR })}
                    </div>
                    <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                      {a.services?.map((s: any) => s.service.name).join(" + ")} · com {a.professional?.display_name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-none border-accent/50 text-accent">
                    {brl(Number(a.total_amount))}
                  </Badge>
                  <Button size="sm" variant="outline" className="rounded-none uppercase tracking-[0.18em]" onClick={() => cancel(a.id)}>
                    Cancelar
                  </Button>
                </div>
              </article>
            ))}
          </div>

          <SectionTitle eyebrow="02" title="Histórico" />
          <div className="grid gap-2">
            {past.length === 0 && <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>}
            {past.map((a: any) => (
              <article
                key={a.id}
                className="flex flex-col gap-2 border border-border/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-serif">{format(new Date(a.scheduled_start), "d 'de' MMM yyyy • HH:mm", { locale: ptBR })}</span>
                  <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                    · {a.services?.map((s: any) => s.service.name).join(", ")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={a.status === "cancelled" ? "destructive" : "secondary"}
                    className="rounded-none uppercase tracking-[0.15em]"
                  >
                    {a.status === "cancelled" ? "Cancelado" : a.status === "completed" ? "Concluído" : a.status}
                  </Badge>
                  {a.status === "completed" && (
                    <Button asChild size="sm" variant="outline" className="rounded-none uppercase tracking-[0.18em]">
                      <Link to="/avaliar/$appointmentId" params={{ appointmentId: a.id }}>
                        Avaliar
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mt-14 mb-5 flex items-baseline gap-4">
      <span className="font-serif text-sm italic text-accent">{eyebrow}</span>
      <div className="h-px flex-1 bg-border/70" />
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
    </div>
  );
}

function VIPStatus({ lifetimePoints }: { lifetimePoints: number }) {
  const tiers = [
    { name: "Bronze", min: 0, max: 499, color: "text-[#cd7f32]", bg: "bg-[#cd7f32]/20", fill: "bg-[#cd7f32]" },
    { name: "Prata", min: 500, max: 1499, color: "text-slate-300", bg: "bg-slate-300/20", fill: "bg-slate-300" },
    { name: "Ouro", min: 1500, max: 2999, color: "text-yellow-500", bg: "bg-yellow-500/20", fill: "bg-yellow-500" },
    { name: "Diamante", min: 3000, max: Infinity, color: "text-cyan-400", bg: "bg-cyan-400/20", fill: "bg-cyan-400" },
  ];
  
  const currentTierIndex = tiers.findIndex(t => lifetimePoints >= t.min && lifetimePoints <= t.max);
  const currentTier = tiers[currentTierIndex] || tiers[0];
  const nextTier = tiers[currentTierIndex + 1];
  
  const progress = nextTier ? ((lifetimePoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100 : 100;

  return (
    <div className="mt-8 border border-border/60 bg-card/40 p-6 md:p-8 relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] opacity-20 transition-opacity duration-1000 group-hover:opacity-40 ${currentTier.bg}`} />
      
      <div className="relative flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Status de Fidelidade</p>
          <div className="flex items-center gap-2 mt-1">
            <Crown className={`h-6 w-6 ${currentTier.color} drop-shadow-[0_0_8px_currentColor]`} />
            <h2 className={`font-serif text-3xl font-bold tracking-tight ${currentTier.color}`}>Membro {currentTier.name}</h2>
          </div>
        </div>
        {nextTier && (
          <div className="text-left md:text-right">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Próximo Nível</p>
            <p className="text-sm font-medium mt-1">{nextTier.name} ({nextTier.min} pts)</p>
          </div>
        )}
      </div>

      <div className="relative h-2 w-full bg-border/50 rounded-full overflow-hidden">
        <div 
          className={`absolute left-0 top-0 h-full ${currentTier.fill} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`} 
          style={{ width: `${progress}%` }} 
        />
      </div>
      
      {nextTier ? (
        <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-4 text-center">
          Faltam <span className="text-foreground font-bold">{nextTier.min - lifetimePoints} pontos</span> para você alcançar o prestigiado nível {nextTier.name}.
        </p>
      ) : (
        <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-4 text-center">
          Você atingiu o nível máximo de fidelidade. Você é uma lenda! 👑
        </p>
      )}
    </div>
  );
}

