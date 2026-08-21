import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, lazy, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { reportService } from "@/services/report.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";
import { brl } from "@/lib/format";
import {
  startOfDay,
  endOfDay,
  subDays,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Trophy,
  Scissors,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  Building2,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

const RevenueChart = lazy(() =>
  import("@/components/admin/relatorios/ReportCharts").then((m) => ({ default: m.RevenueChart }))
);
const ServicesChart = lazy(() =>
  import("@/components/admin/relatorios/ReportCharts").then((m) => ({ default: m.ServicesChart }))
);

export const Route = createFileRoute("/admin/relatorios")({
  head: () => ({ meta: [{ title: "Relatórios & Métricas — BarberOS" }] }),
  component: RelatoriosPage,
});

function RelatoriosPage() {
  const { shopId } = useCurrentShop();

  const [preset, setPreset] = useState<"7" | "30" | "month" | "custom">("30");
  const [customStart, setCustomStart] = useState<string>(
    subDays(new Date(), 29).toISOString().split("T")[0]
  );
  const [customEnd, setCustomEnd] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Calcula intervalo de datas
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    if (preset === "7") {
      return { startDate: startOfDay(subDays(now, 6)), endDate: endOfDay(now) };
    }
    if (preset === "30") {
      return { startDate: startOfDay(subDays(now, 29)), endDate: endOfDay(now) };
    }
    if (preset === "month") {
      return { startDate: startOfMonth(now), endDate: endOfMonth(now) };
    }
    return {
      startDate: startOfDay(new Date(customStart || subDays(now, 29))),
      endDate: endOfDay(new Date(customEnd || now)),
    };
  }, [preset, customStart, customEnd]);

  // Consulta 1: Relatório de Faturamento
  const {
    data: revenueData,
    isLoading: loadingRevenue,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ["report-revenue", shopId, startDate.toISOString(), endDate.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getRevenueReport(shopId!, startDate, endDate),
  });

  // Consulta 2: Relatório de Agendamentos
  const {
    data: apptsData,
    isLoading: loadingAppts,
    refetch: refetchAppts,
  } = useQuery({
    queryKey: ["report-appts", shopId, startDate.toISOString(), endDate.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getAppointmentsReport(shopId!, startDate, endDate),
  });

  // Consulta 3: Top 5 Clientes
  const { data: topCustomers, isLoading: loadingCustomers } = useQuery({
    queryKey: ["report-top-customers", shopId],
    enabled: !!shopId,
    queryFn: () => reportService.getTopCustomers(shopId!, 5),
  });

  // Consulta 4: Top 5 Serviços
  const { data: topServices, isLoading: loadingServices } = useQuery({
    queryKey: ["report-top-services", shopId],
    enabled: !!shopId,
    queryFn: () => reportService.getTopServices(shopId!, 5),
  });

  const isLoading = loadingRevenue || loadingAppts;

  function handleRefresh() {
    refetchRevenue();
    refetchAppts();
    toast.success("Relatórios atualizados com sucesso!");
  }

  // Prepara dados para o gráfico de faturamento
  const revenueChartData = useMemo(() => {
    try {
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      return days.map((d) => ({
        day: format(d, "dd/MM"),
        revenue: Math.round(Number(revenueData?.totalRevenue || 0) / Math.max(1, days.length)),
      }));
    } catch {
      return [];
    }
  }, [startDate, endDate, revenueData]);

  // Prepara dados para o gráfico de serviços
  const servicesChartData = useMemo(() => {
    return (topServices ?? []).map((s) => ({
      name: s.name,
      revenue: s.totalRevenue,
      bookings: s.bookingsCount,
    }));
  }, [topServices]);

  const totalAppts = apptsData?.totalAppointments ?? 0;
  const completedAppts = apptsData?.byStatus.completed ?? 0;
  const cancelledAppts = (apptsData?.byStatus.cancelled ?? 0) + (apptsData?.byStatus.no_show ?? 0);
  const ticketMedio = completedAppts > 0 ? (revenueData?.totalRevenue ?? 0) / completedAppts : 0;

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros de Data */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Relatórios Financeiros & Métricas</h1>
          <p className="text-muted-foreground">
            Acompanhe o faturamento, agendamentos, clientes fiéis e serviços mais lucrativos.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={handleRefresh}
          className="rounded-none text-xs uppercase font-bold tracking-wider"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Atualizar dados
        </Button>
      </div>

      {/* Barra de Filtro de Período */}
      <div className="flex flex-wrap items-end gap-3 border border-border/60 bg-card/40 p-4 backdrop-blur-md">
        <div className="w-[180px]">
          <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Período
          </Label>
          <Select value={preset} onValueChange={(v: any) => setPreset(v)}>
            <SelectTrigger className="mt-1 h-10 rounded-none border-border bg-background/50 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="7" className="text-xs">Últimos 7 dias</SelectItem>
              <SelectItem value="30" className="text-xs">Últimos 30 dias</SelectItem>
              <SelectItem value="month" className="text-xs">Este mês</SelectItem>
              <SelectItem value="custom" className="text-xs">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {preset === "custom" && (
          <>
            <div className="w-[150px]">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Data Inicial
              </Label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="mt-1 h-10 rounded-none text-xs"
              />
            </div>
            <div className="w-[150px]">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Data Final
              </Label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="mt-1 h-10 rounded-none text-xs"
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 sm:ml-auto">
          <Calendar className="h-4 w-4 text-accent" />
          <span>
            {format(startDate, "dd/MM/yyyy", { locale: ptBR })} até {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>
      </div>

      {/* Cards de Métricas Principais (KPIs) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Faturamento Total */}
        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Faturamento Total
            </span>
            <DollarSign className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-accent">
            {isLoading ? <Skeleton className="h-8 w-24" /> : brl(revenueData?.totalRevenue ?? 0)}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Vendas PDV + Serviços Concluídos</p>
        </Card>

        {/* Total de Agendamentos */}
        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Agendamentos
            </span>
            <Calendar className="h-4 w-4 text-foreground/60" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-foreground">
            {isLoading ? <Skeleton className="h-8 w-16" /> : totalAppts}
          </div>
          <p className="mt-1 text-[10px] text-emerald-500 font-bold">
            {completedAppts} atendimentos concluídos
          </p>
        </Card>

        {/* Ticket Médio */}
        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ticket Médio
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-foreground">
            {isLoading ? <Skeleton className="h-8 w-24" /> : brl(ticketMedio)}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Média por atendimento concluído</p>
        </Card>

        {/* Cancelamentos / Faltas */}
        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Cancelamentos / Faltas
            </span>
            <XCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-destructive">
            {isLoading ? <Skeleton className="h-8 w-16" /> : cancelledAppts}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {apptsData?.byStatus.no_show ?? 0} faltas (no-show) registradas
          </p>
        </Card>
      </div>

      {/* Distribuição por Status de Agendamentos */}
      <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
        <h3 className="font-serif text-base font-bold text-foreground mb-4">
          Status dos Agendamentos no Período
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="border border-border/40 p-3 bg-card/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Agendados
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-blue-400">
              {apptsData?.byStatus.scheduled ?? 0}
            </div>
          </div>

          <div className="border border-border/40 p-3 bg-card/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Em Atendimento
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-amber-400">
              {apptsData?.byStatus.in_progress ?? 0}
            </div>
          </div>

          <div className="border border-border/40 p-3 bg-card/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Concluídos
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-emerald-400">
              {apptsData?.byStatus.completed ?? 0}
            </div>
          </div>

          <div className="border border-border/40 p-3 bg-card/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Cancelados
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-muted-foreground">
              {apptsData?.byStatus.cancelled ?? 0}
            </div>
          </div>

          <div className="border border-border/40 p-3 bg-card/30">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              No-Show (Faltou)
            </div>
            <div className="mt-1 text-xl font-bold font-mono text-destructive">
              {apptsData?.byStatus.no_show ?? 0}
            </div>
          </div>
        </div>
      </Card>

      {/* Gráficos de Faturamento e Serviços */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-none border border-border bg-card/50 p-6 backdrop-blur-md">
          <h3 className="font-serif text-lg font-bold text-foreground mb-4">
            Evolução do Faturamento no Período
          </h3>
          <Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
            <RevenueChart data={revenueChartData} />
          </Suspense>
        </Card>

        <Card className="rounded-none border border-border bg-card/50 p-6 backdrop-blur-md">
          <h3 className="font-serif text-lg font-bold text-foreground mb-4">
            Faturamento por Serviço Mais Popular
          </h3>
          <Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
            <ServicesChart data={servicesChartData} />
          </Suspense>
        </Card>
      </div>

      {/* Rankings: Top 5 Clientes e Top 5 Serviços */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top 5 Clientes */}
        <Card className="rounded-none border border-border bg-card/50 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-lg font-bold text-foreground">Top 5 Clientes Mais Fiéis</h3>
          </div>

          {loadingCustomers ? (
            <TableSkeleton />
          ) : !topCustomers || topCustomers.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Nenhum cliente registrado ainda.</p>
          ) : (
            <div className="divide-y divide-border/20">
              {topCustomers.map((c, i) => (
                <div key={i} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded-none bg-accent/10 font-mono text-xs font-bold text-accent">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-foreground">{c.customer?.full_name || "Cliente"}</div>
                      <div className="text-[10px] text-muted-foreground">{c.appointmentsCount} atendimentos realizados</div>
                    </div>
                  </div>
                  <div className="font-serif font-bold text-accent">{brl(c.totalSpent)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top 5 Serviços */}
        <Card className="rounded-none border border-border bg-card/50 p-6 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-lg font-bold text-foreground">Top 5 Serviços Mais Agendados</h3>
          </div>

          {loadingServices ? (
            <TableSkeleton />
          ) : !topServices || topServices.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Nenhum serviço agendado ainda.</p>
          ) : (
            <div className="divide-y divide-border/20">
              {topServices.map((s, i) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-6 w-6 place-items-center rounded-none bg-accent/10 font-mono text-xs font-bold text-accent">
                      #{i + 1}
                    </span>
                    <div>
                      <div className="font-bold text-sm text-foreground">{s.name}</div>
                      <div className="text-[10px] text-muted-foreground">{s.bookingsCount} vezes agendado</div>
                    </div>
                  </div>
                  <div className="font-serif font-bold text-foreground">{brl(s.totalRevenue)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
