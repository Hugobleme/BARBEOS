import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Calendar, DollarSign, Download, TrendingUp, Users, Star, Trophy } from "lucide-react";

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios — BarberOS" }] }),
  component: Relatorios,
});

function Relatorios() {
  const shopId = useCurrentShopId();
  const [range, setRange] = useState<"7" | "30" | "90">("30");
  const days = parseInt(range);
  const start = useMemo(() => startOfDay(subDays(new Date(), days - 1)), [days]);
  const end = useMemo(() => endOfDay(new Date()), [days]);

  const { data } = useQuery({
    enabled: !!shopId,
    queryKey: ["report", shopId, range],
    queryFn: async () => {
      const [apptsRes, svcRes, prosRes, surveysRes] = await Promise.all([
        supabase.from("appointments")
          .select("id,status,total_amount,scheduled_start,scheduled_end,professional_id,customer_id")
          .eq("barbershop_id", shopId)
          .gte("scheduled_start", start.toISOString())
          .lte("scheduled_start", end.toISOString()),
        supabase.from("appointment_services")
          .select("service_id, price_snapshot, appointment:appointments!inner(barbershop_id, status, scheduled_start), service:services(name)")
          .eq("appointment.barbershop_id", shopId)
          .gte("appointment.scheduled_start", start.toISOString())
          .lte("appointment.scheduled_start", end.toISOString()),
        supabase.from("professionals").select("id, display_name").eq("barbershop_id", shopId),
        supabase.from("satisfaction_surveys")
          .select("shop_rating, professional_rating, nps, answered_at")
          .eq("barbershop_id", shopId)
          .gte("answered_at", start.toISOString()),
      ]);
      return { appts: apptsRes.data ?? [], svcRows: svcRes.data ?? [], pros: prosRes.data ?? [], surveys: surveysRes.data ?? [] };
    },
  });

  const kpis = useMemo(() => {
    const a = data?.appts ?? [];
    const completed = a.filter((x: any) => x.status === "completed");
    const cancelled = a.filter((x: any) => x.status === "cancelled" || x.status === "no_show");
    const revenue = completed.reduce((s: number, x: any) => s + Number(x.total_amount || 0), 0);
    const ticket = completed.length ? revenue / completed.length : 0;
    const uniq = new Set(completed.map((x: any) => x.customer_id)).size;
    return { total: a.length, completed: completed.length, cancelled: cancelled.length, revenue, ticket, uniq };
  }, [data]);

  const daily = useMemo(() => {
    const buckets = new Map<string, { day: string; revenue: number; count: number }>();
    for (const d of eachDayOfInterval({ start, end })) {
      const k = format(d, "yyyy-MM-dd");
      buckets.set(k, { day: format(d, "dd/MM"), revenue: 0, count: 0 });
    }
    for (const a of data?.appts ?? []) {
      if (a.status !== "completed") continue;
      const k = format(new Date(a.scheduled_start), "yyyy-MM-dd");
      const b = buckets.get(k);
      if (b) { b.revenue += Number(a.total_amount || 0); b.count += 1; }
    }
    return Array.from(buckets.values());
  }, [data, start, end]);

  const topServices = useMemo(() => {
    const m = new Map<string, { name: string; count: number; revenue: number }>();
    for (const r of data?.svcRows ?? []) {
      const name = (r as any).service?.name ?? "—";
      const cur = m.get(name) ?? { name, count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number((r as any).price_snapshot || 0);
      m.set(name, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 6);
  }, [data]);

  const ranking = useMemo(() => {
    const m = new Map<string, { name: string; count: number; revenue: number }>();
    const proName = new Map((data?.pros ?? []).map((p: any) => [p.id, p.display_name]));
    for (const a of data?.appts ?? []) {
      if (a.status !== "completed") continue;
      const id = a.professional_id;
      const cur = m.get(id) ?? { name: proName.get(id) ?? "—", count: 0, revenue: 0 };
      cur.count += 1;
      cur.revenue += Number(a.total_amount || 0);
      m.set(id, cur);
    }
    return Array.from(m.values()).sort((a, b) => b.revenue - a.revenue);
  }, [data]);

  const satisfaction = useMemo(() => {
    const s = data?.surveys ?? [];
    if (!s.length) return { avgShop: 0, avgPro: 0, nps: 0, count: 0 };
    const avg = (key: "shop_rating" | "professional_rating") => {
      const vals = s.map((x: any) => x[key]).filter((v: any) => v != null);
      return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : 0;
    };
    const npsVals = s.map((x: any) => x.nps).filter((v: any) => v != null);
    const promo = npsVals.filter((v: number) => v >= 9).length;
    const detr = npsVals.filter((v: number) => v <= 6).length;
    const nps = npsVals.length ? Math.round(((promo - detr) / npsVals.length) * 100) : 0;
    return { avgShop: avg("shop_rating"), avgPro: avg("professional_rating"), nps, count: s.length };
  }, [data]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">
            {format(start, "dd 'de' MMM", { locale: ptBR })} — {format(end, "dd 'de' MMM yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCSV(daily, ranking, topServices)}>
            <Download className="mr-1 h-4 w-4" /> Exportar CSV
          </Button>
          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={DollarSign} label="Faturamento" value={brl(kpis.revenue)} />
        <KPI icon={TrendingUp} label="Ticket médio" value={brl(kpis.ticket)} />
        <KPI icon={Calendar} label="Atendimentos" value={`${kpis.completed} / ${kpis.total}`} hint={`${kpis.cancelled} cancelados`} />
        <KPI icon={Users} label="Clientes únicos" value={kpis.uniq} />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">Faturamento por dia</h2>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v: any) => brl(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Top serviços</h2>
          {topServices.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem dados no período.</p>
          ) : (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServices} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `R$${v}`} />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={120} />
                  <Tooltip formatter={(v: any) => brl(Number(v))} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
                  <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Trophy className="h-5 w-5 text-accent"/>Ranking de profissionais</h2>
          {ranking.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem atendimentos concluídos.</p>
          ) : (
            <ul className="divide-y divide-border">
              {ranking.map((r, i) => (
                <li key={r.name} className="flex items-center justify-between py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/15 font-mono text-xs font-semibold text-accent">{i + 1}</span>
                    <span className="font-medium">{r.name}</span>
                    <span className="text-muted-foreground">· {r.count} atend.</span>
                  </div>
                  <span className="font-semibold">{brl(r.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Star className="h-5 w-5 text-accent"/>Satisfação dos clientes</h2>
        {satisfaction.count === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma avaliação no período.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-4">
            <Mini label="Avaliações" value={satisfaction.count} />
            <Mini label="Nota da barbearia" value={satisfaction.avgShop.toFixed(1)} />
            <Mini label="Nota do profissional" value={satisfaction.avgPro.toFixed(1)} />
            <Mini label="NPS" value={satisfaction.nps} />
          </div>
        )}
      </Card>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
