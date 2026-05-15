import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Calendar, DollarSign, TrendingUp, Users, ArrowRight } from "lucide-react";
import { KPISkeleton, CardGridSkeleton } from "@/components/site/LoadingState";

export const Route = createFileRoute("/admin/franquia")({
  head: () => ({ meta: [{ title: "Franquia — BarberOS" }] }),
  component: Page,
});

type ShopStats = {
  id: string;
  name: string;
  role: string;
  todayCount: number;
  monthRevenue: number;
  monthCount: number;
  avgTicket: number;
  customers: number;
};

function Page() {
  const { shops, setShopId } = useCurrentShop();
  const ownedShops = shops.filter((s) => s.role === "owner");

  const { data: stats, isLoading } = useQuery({
    queryKey: ["franquia-stats", ownedShops.map((s) => s.id).join(",")],
    enabled: ownedShops.length > 0,
    queryFn: async (): Promise<ShopStats[]> => {
      const now = new Date();
      const todayStart = startOfDay(now).toISOString();
      const todayEnd = endOfDay(now).toISOString();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      return Promise.all(
        ownedShops.map(async (s) => {
          const [todayRes, monthRes, customersRes] = await Promise.all([
            supabase.from("appointments").select("id", { count: "exact", head: true })
              .eq("barbershop_id", s.id).gte("scheduled_start", todayStart).lte("scheduled_start", todayEnd),
            supabase.from("appointments").select("total_amount, status")
              .eq("barbershop_id", s.id).gte("scheduled_start", monthStart).lte("scheduled_start", monthEnd),
            supabase.from("customers").select("id", { count: "exact", head: true }).eq("barbershop_id", s.id),
          ]);
          const completed = (monthRes.data ?? []).filter((a: any) => a.status === "completed");
          const revenue = completed.reduce((acc: number, a: any) => acc + Number(a.total_amount), 0);
          return {
            id: s.id,
            name: s.name,
            role: s.role,
            todayCount: todayRes.count ?? 0,
            monthRevenue: revenue,
            monthCount: completed.length,
            avgTicket: completed.length ? revenue / completed.length : 0,
            customers: customersRes.count ?? 0,
          };
        }),
      );
    },
  });

  const totals = (stats ?? []).reduce(
    (acc, s) => ({
      today: acc.today + s.todayCount,
      revenue: acc.revenue + s.monthRevenue,
      count: acc.count + s.monthCount,
      customers: acc.customers + s.customers,
    }),
    { today: 0, revenue: 0, count: 0, customers: 0 },
  );
  const avgTicket = totals.count ? totals.revenue / totals.count : 0;
  const best = (stats ?? []).slice().sort((a, b) => b.monthRevenue - a.monthRevenue)[0];

  if (ownedShops.length < 2) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold">Franquia</h1>
          <p className="text-muted-foreground">Painel consolidado para donos de várias barbearias.</p>
        </div>
        <Card className="grid place-items-center gap-3 p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold">Você ainda gerencia uma única unidade</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Quando você for dono de duas ou mais barbearias, esta página mostra um painel
              consolidado com KPIs comparativos, melhor unidade do mês e atalhos de troca.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Franquia</h1>
          <p className="text-muted-foreground">
            Visão consolidada de {ownedShops.length} unidades · {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      {isLoading ? <KPISkeleton /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI icon={Calendar} label="Agendamentos hoje" value={totals.today} sub={`em ${ownedShops.length} unidades`} />
          <KPI icon={TrendingUp} label="Atendimentos no mês" value={totals.count} />
          <KPI icon={DollarSign} label="Faturamento do mês" value={brl(totals.revenue)} sub={`Ticket médio ${brl(avgTicket)}`} />
          <KPI icon={Users} label="Total de clientes" value={totals.customers} />
        </div>
      )}

      {best && best.monthRevenue > 0 && (
        <Card className="flex flex-col gap-2 border-accent/40 bg-accent/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent"><TrendingUp className="h-5 w-5"/></div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Unidade destaque do mês</div>
              <div className="font-display text-lg font-semibold">{best.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold">{brl(best.monthRevenue)}</div>
            <div className="text-xs text-muted-foreground">{best.monthCount} atendimentos</div>
          </div>
        </Card>
      )}

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Comparativo por unidade</h2>
        {isLoading ? (
          <CardGridSkeleton count={ownedShops.length} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(stats ?? []).map((s) => {
              const sharePct = totals.revenue ? Math.round((s.monthRevenue / totals.revenue) * 100) : 0;
              return (
                <Card key={s.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Building2 className="h-5 w-5"/></div>
                    <Badge variant="secondary">{sharePct}% do faturamento</Badge>
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">{s.name}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">{s.role}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Stat label="Hoje" value={s.todayCount} />
                    <Stat label="Mês" value={s.monthCount} />
                    <Stat label="Faturamento" value={brl(s.monthRevenue)} />
                    <Stat label="Ticket médio" value={brl(s.avgTicket)} />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-accent transition-all" style={{ width: `${sharePct}%` }} />
                  </div>
                  <Button asChild size="sm" variant="outline" onClick={() => setShopId(s.id)}>
                    <Link to="/admin">Abrir painel<ArrowRight className="ml-1 h-3.5 w-3.5"/></Link>
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, label, value, sub }: { icon: any; label: string; value: any; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
