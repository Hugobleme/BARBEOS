import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { brl } from "@/lib/format";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
  subDays,
  eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import { KPISkeleton, CardGridSkeleton } from "@/components/site/LoadingState";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

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

type RangeKey = "7d" | "30d" | "90d";
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "7d", label: "Últimos 7 dias", days: 7 },
  { key: "30d", label: "Últimos 30 dias", days: 30 },
  { key: "90d", label: "Últimos 90 dias", days: 90 },
];

// Cores cíclicas usando tokens HSL — fallback para paletas grandes.
const SERIES_COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "hsl(var(--chart-3, 200 70% 50%))",
  "hsl(var(--chart-4, 30 80% 55%))",
  "hsl(var(--chart-5, 280 60% 60%))",
  "hsl(var(--chart-1, 160 60% 45%))",
];

function Page() {
  const { shops, setShopId } = useCurrentShop();
  const ownedShops = shops.filter((s) => s.role === "owner");
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGES.find((r) => r.key === range)!.days;

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
            supabase
              .from("appointments")
              .select("id", { count: "exact", head: true })
              .eq("barbershop_id", s.id)
              .gte("scheduled_start", todayStart)
              .lte("scheduled_start", todayEnd),
            supabase
              .from("appointments")
              .select("total_amount, status")
              .eq("barbershop_id", s.id)
              .gte("scheduled_start", monthStart)
              .lte("scheduled_start", monthEnd),
            supabase
              .from("customers")
              .select("id", { count: "exact", head: true })
              .eq("barbershop_id", s.id),
          ]);
          const completed = (monthRes.data ?? []).filter(
            (a: any) => a.status === "completed",
          );
          const revenue = completed.reduce(
            (acc: number, a: any) => acc + Number(a.total_amount),
            0,
          );
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

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ["franquia-trend", days, ownedShops.map((s) => s.id).join(",")],
    enabled: ownedShops.length > 1,
    queryFn: async () => {
      const end = endOfDay(new Date());
      const start = startOfDay(subDays(end, days - 1));
      const ids = ownedShops.map((s) => s.id);
      const { data, error } = await supabase
        .from("appointments")
        .select("barbershop_id, scheduled_start, total_amount, status")
        .in("barbershop_id", ids)
        .gte("scheduled_start", start.toISOString())
        .lte("scheduled_start", end.toISOString());
      if (error) throw error;
      return { rows: data ?? [], start, end };
    },
  });

  const { revenueSeries, countSeries } = useMemo(() => {
    if (!trend) return { revenueSeries: [], countSeries: [] };
    const days = eachDayOfInterval({ start: trend.start, end: trend.end });
    const empty = () =>
      Object.fromEntries(ownedShops.map((s) => [s.name, 0])) as Record<
        string,
        number
      >;
    const revByDay = new Map<string, Record<string, number>>();
    const cntByDay = new Map<string, Record<string, number>>();
    days.forEach((d) => {
      const k = format(d, "yyyy-MM-dd");
      revByDay.set(k, empty());
      cntByDay.set(k, empty());
    });
    const nameById = new Map(ownedShops.map((s) => [s.id, s.name]));
    for (const r of trend.rows as any[]) {
      const k = format(new Date(r.scheduled_start), "yyyy-MM-dd");
      const name = nameById.get(r.barbershop_id);
      if (!name || !revByDay.has(k)) continue;
      cntByDay.get(k)![name] += 1;
      if (r.status === "completed") {
        revByDay.get(k)![name] += Number(r.total_amount);
      }
    }
    const fmt = (d: Date) =>
      format(d, days.length > 31 ? "dd/MM" : "dd/MM", { locale: ptBR });
    return {
      revenueSeries: days.map((d) => ({
        date: fmt(d),
        ...revByDay.get(format(d, "yyyy-MM-dd"))!,
      })),
      countSeries: days.map((d) => ({
        date: fmt(d),
        ...cntByDay.get(format(d, "yyyy-MM-dd"))!,
      })),
    };
  }, [trend, ownedShops]);

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
          <p className="text-muted-foreground">
            Painel consolidado para donos de várias barbearias.
          </p>
        </div>
        <Card className="grid place-items-center gap-3 p-12 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-lg font-semibold">
              Você ainda gerencia uma única unidade
            </h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Quando você for dono de duas ou mais barbearias, esta página mostra
              KPIs comparativos, gráficos de tendência e melhor unidade do mês.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Franquia</h1>
          <p className="text-muted-foreground">
            Visão consolidada de {ownedShops.length} unidades ·{" "}
            {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                range === r.key
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <KPISkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPI
            icon={Calendar}
            label="Agendamentos hoje"
            value={totals.today}
            sub={`em ${ownedShops.length} unidades`}
          />
          <KPI
            icon={TrendingUp}
            label="Atendimentos no mês"
            value={totals.count}
          />
          <KPI
            icon={DollarSign}
            label="Faturamento do mês"
            value={brl(totals.revenue)}
            sub={`Ticket médio ${brl(avgTicket)}`}
          />
          <KPI icon={Users} label="Total de clientes" value={totals.customers} />
        </div>
      )}

      {best && best.monthRevenue > 0 && (
        <Card className="flex flex-col gap-2 border-accent/40 bg-accent/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/20 text-accent">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Unidade destaque do mês
              </div>
              <div className="font-display text-lg font-semibold">{best.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl font-semibold">
              {brl(best.monthRevenue)}
            </div>
            <div className="text-xs text-muted-foreground">
              {best.monthCount} atendimentos
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Tendência de faturamento"
          subtitle={`Receita diária por unidade — ${RANGES.find((r) => r.key === range)!.label.toLowerCase()}`}
          loading={trendLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueSeries} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v: any) => brl(Number(v))}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {ownedShops.map((s, i) => (
                <Line
                  key={s.id}
                  type="monotone"
                  dataKey={s.name}
                  stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Atendimentos por unidade"
          subtitle="Volume diário de agendamentos"
          loading={trendLoading}
        >
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={countSeries} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {ownedShops.map((s, i) => (
                <Bar
                  key={s.id}
                  dataKey={s.name}
                  stackId="a"
                  fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">
          Comparativo por unidade
        </h2>
        {isLoading ? (
          <CardGridSkeleton count={ownedShops.length} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(stats ?? []).map((s) => {
              const sharePct = totals.revenue
                ? Math.round((s.monthRevenue / totals.revenue) * 100)
                : 0;
              return (
                <Card key={s.id} className="flex flex-col gap-4 p-5">
                  <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <Badge variant="secondary">{sharePct}% do faturamento</Badge>
                  </div>
                  <div>
                    <div className="font-display text-lg font-semibold">{s.name}</div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {s.role}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Stat label="Hoje" value={s.todayCount} />
                    <Stat label="Mês" value={s.monthCount} />
                    <Stat label="Faturamento" value={brl(s.monthRevenue)} />
                    <Stat label="Ticket médio" value={brl(s.avgTicket)} />
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-accent transition-all"
                      style={{ width: `${sharePct}%` }}
                    />
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    onClick={() => setShopId(s.id)}
                  >
                    <Link to="/admin">
                      Abrir painel
                      <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
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

function ChartCard({
  title,
  subtitle,
  loading,
  children,
}: {
  title: string;
  subtitle?: string;
  loading?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold">{title}</h3>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {loading ? (
        <div className="grid h-[280px] place-items-center text-sm text-muted-foreground">
          Carregando dados…
        </div>
      ) : (
        children
      )}
    </Card>
  );
}

function KPI({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: any;
  sub?: string;
}) {
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
