import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, lazy, Suspense, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, DollarSign, Download, TrendingUp, Users, Star, Trophy, ChartBar, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/admin/layout/EmptyState";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";


const RevenueChart = lazy(() => import("@/components/admin/relatorios/ReportCharts").then(m => ({ default: m.RevenueChart })));
const ServicesChart = lazy(() => import("@/components/admin/relatorios/ReportCharts").then(m => ({ default: m.ServicesChart })));

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
        <Suspense fallback={<Skeleton className="h-[260px] w-full rounded-lg" />}>
          <RevenueChart data={daily} />
        </Suspense>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-lg font-semibold">Top serviços</h2>
          {topServices.length === 0 ? (
            <EmptyState 
              icon={ChartBar} 
              title="Sem dados de serviços" 
              description="Nenhum serviço foi realizado no período selecionado." 
            />
          ) : (
            <Suspense fallback={<Skeleton className="h-[260px] w-full rounded-lg" />}>
              <ServicesChart data={topServices} />
            </Suspense>
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

      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold tracking-tight">Histórico detalhado</h2>
        <DetailedHistoryTable shopId={shopId} start={start} end={end} />
      </Card>
    </div>
  );
}

const PAGE_SIZE = 15;

function DetailedHistoryTable({ shopId, start, end }: { shopId: string | null; start: Date; end: Date }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [pro, setPro] = useState("all");
  const [sortBy, setSortBy] = useState("scheduled_start");

  const { data: pros } = useQuery({
    queryKey: ["professionals", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("id, display_name").eq("barbershop_id", shopId);
      return data ?? [];
    },
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["history", shopId, start.toISOString(), end.toISOString(), q, status, pro, sortBy],
    enabled: !!shopId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      if (!shopId) return { data: [], nextPage: undefined };
      let query = supabase
        .from("appointments")
        .select(`
          id, 
          status, 
          total_amount, 
          scheduled_start,
          customer:customers!inner(full_name),
          professional:professionals(display_name)
        `)
        .eq("barbershop_id", shopId)
        .gte("scheduled_start", start.toISOString())
        .lte("scheduled_start", end.toISOString())
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (q) {
        query = query.ilike("customer.full_name", `%${q}%`);
      }
      if (status !== "all") {
        query = query.eq("status", status);
      }
      if (pro !== "all") {
        query = query.eq("professional_id", pro);
      }

      if (sortBy === "scheduled_start") {
        query = query.order("scheduled_start", { ascending: false });
      } else if (sortBy === "total_amount") {
        query = query.order("total_amount", { ascending: false });
      }

      const { data } = await query;

      return {
        data: data ?? [],
        nextPage: (data?.length ?? 0) === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const allRows = data?.pages.flatMap((page) => page.data) ?? [];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (
      lastItem &&
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, allRows.length, isFetchingNextPage, rowVirtualizer.getVirtualItems()]);

  if (isLoading) return <Skeleton className="h-[400px] w-full rounded-lg" />;
  if (allRows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Nenhum registro encontrado.</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border/40">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"/>
          <Input className="pl-9 h-10 bg-background/50 border-border/40 rounded-lg" placeholder="Buscar cliente..." value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-10 w-[140px] bg-background/50 border-border/40 rounded-lg text-xs">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Status: Todos</SelectItem>
            <SelectItem value="completed">Concluídos</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
            <SelectItem value="no_show">Faltas</SelectItem>
            <SelectItem value="scheduled">Agendados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={pro} onValueChange={setPro}>
          <SelectTrigger className="h-10 w-[160px] bg-background/50 border-border/40 rounded-lg text-xs">
            <SelectValue placeholder="Profissional" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Profissional: Todos</SelectItem>
            {pros?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="h-10 w-[140px] bg-background/50 border-border/40 rounded-lg text-xs">
            <SelectValue placeholder="Ordenar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled_start">Data (Novo)</SelectItem>
            <SelectItem value="total_amount">Valor (Maior)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div 
        ref={parentRef}
        className="h-[400px] overflow-auto scrollbar-thin rounded-lg border border-border/20"
      >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md text-left text-xs uppercase tracking-widest text-muted-foreground/60">
            <tr>
              <th className="px-6 py-4 font-bold">Data/Hora</th>
              <th className="px-6 py-4 font-bold">Cliente</th>
              <th className="px-6 py-4 font-bold">Profissional</th>
              <th className="px-6 py-4 font-bold">Valor</th>
              <th className="px-6 py-4 font-bold text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const isLoaderRow = virtualRow.index > allRows.length - 1;
              const a = allRows[virtualRow.index] as any;

              if (isLoaderRow) {
                return (
                  <tr 
                    key="loader"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <td colSpan={5} className="py-4 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                );
              }

              return (
                <tr 
                  key={a.id} 
                  className="transition-colors hover:bg-black/5"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <td className="px-6 py-4 font-medium text-muted-foreground">
                    {format(new Date(a.scheduled_start), "dd/MM HH:mm")}
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">{a.customer?.full_name ?? "—"}</td>
                  <td className="px-6 py-4 text-muted-foreground">{a.professional?.display_name ?? "—"}</td>
                  <td className="px-6 py-4 font-bold">{brl(Number(a.total_amount || 0))}</td>
                  <td className="px-6 py-4 text-right">
                    <Badge variant="outline" className={`
                      ${a.status === 'completed' ? 'bg-success/10 text-success border-success/20' : 
                        a.status === 'cancelled' || a.status === 'no_show' ? 'bg-destructive/10 text-destructive border-destructive/20' : 
                        'bg-warning/10 text-warning border-warning/20'} font-bold
                    `}>
                      {a.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function exportCSV(daily: any[], ranking: any[], topServices: any[]) {
  const lines: string[] = [];
  lines.push("Faturamento por dia");
  lines.push("Dia;Faturamento;Atendimentos");
  daily.forEach((d) => lines.push(`${d.day};${d.revenue.toFixed(2)};${d.count}`));
  lines.push("");
  lines.push("Ranking de profissionais");
  lines.push("Profissional;Atendimentos;Faturamento");
  ranking.forEach((r) => lines.push(`${r.name};${r.count};${r.revenue.toFixed(2)}`));
  lines.push("");
  lines.push("Top servicos");
  lines.push("Servico;Quantidade;Faturamento");
  topServices.forEach((s) => lines.push(`${s.name};${s.count};${s.revenue.toFixed(2)}`));
  const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `relatorio-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
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
