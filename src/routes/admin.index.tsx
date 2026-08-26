import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { appointmentService } from "@/services/appointment.service";
import { reportService } from "@/services/report.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  DollarSign,
  Users,
  Clock,
  ArrowRight,
  Plus,
  UserPlus,
  ShoppingBag,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RefreshCcw,
} from "lucide-react";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  in_progress: { label: "Em atendimento", className: "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse" },
  completed: { label: "Concluído", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelado", className: "border-border bg-muted/40 text-muted-foreground line-through" },
  no_show: { label: "Falta", className: "border-destructive/30 bg-destructive/10 text-destructive" },
};

function formatCurrency(value: number | string | undefined | null): string {
  if (value == null) return "R$ 0,00";
  return brl(Number(value) || 0);
}

function Dashboard() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();

  const now = new Date();
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);
  const startWeek = subDays(now, 7);

  // 1. KPIs de Hoje
  const { data: todayRevenue, isLoading: loadingRev, isError: isErrRev, refetch: refetchRev } = useQuery({
    queryKey: ["admin-today-revenue", shopId],
    enabled: Boolean(shopId),
    queryFn: () => reportService.getRevenueReport(shopId!, startToday, endToday),
  });

  const { data: todayAppts, isLoading: loadingAppts, isError: isErrAppts, refetch: refetchAppts } = useQuery({
    queryKey: ["admin-today-appts", shopId],
    enabled: Boolean(shopId),
    queryFn: () => reportService.getAppointmentsReport(shopId!, startToday, endToday),
  });

  const { data: todayCustomers, isLoading: loadingCustomers, isError: isErrCust, refetch: refetchCust } = useQuery({
    queryKey: ["admin-today-customers", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const appts = await appointmentService.getByDate(shopId!, now);
      // count unique customers in completed/in_progress appts
      const activeAppts = appts.filter(a => a.status === "completed" || a.status === "in_progress");
      const uniqueIds = new Set(activeAppts.map(a => a.customer_id).filter(Boolean));
      return uniqueIds.size;
    },
  });

  // 2. Próximos Agendamentos (com serviços incluídos via query customizada)
  const { data: nextAppts, isLoading: loadingNext, isError: isErrNext, refetch: refetchNext } = useQuery({
    queryKey: ["admin-next-appts", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, scheduled_start, status, total_amount,
          professional:professionals(display_name),
          customer:customers(full_name),
          services:appointment_services(service:services(name))
        `)
        .eq("barbershop_id", shopId!)
        .gte("scheduled_start", now.toISOString())
        .in("status", ["scheduled", "in_progress"])
        .order("scheduled_start", { ascending: true })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  // 3. Alertas Operacionais
  const { data: alertsData, isLoading: loadingAlerts } = useQuery({
    queryKey: ["admin-alerts", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      // a. Pendentes de confirmação (agendados hoje que ainda não iniciaram, mas sem status específico pending, então pegamos 'scheduled' de hoje no futuro)
      // O prompt diz "Pendentes de confirmação". Vou pegar appointments agendados para os próximos 7 dias só pra constar como pendentes.
      const { count: pendingCount } = await supabase
        .from("appointments")
        .select("*", { count: "exact", head: true })
        .eq("barbershop_id", shopId!)
        .eq("status", "scheduled")
        .gte("scheduled_start", now.toISOString());

      // b. Estoque baixo
      const { count: lowStockCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("barbershop_id", shopId!)
        .eq("active", true)
        .lte("stock_quantity", 5); // Fallback to 5 if min_stock logic is complex

      // c. Comissões pendentes
      const { count: pendingCommCount } = await supabase
        .from("commissions")
        .select("*", { count: "exact", head: true })
        .eq("barbershop_id", shopId!)
        .eq("status", "pending");

      return {
        pendingAppts: pendingCount || 0,
        lowStock: lowStockCount || 0,
        pendingCommissions: pendingCommCount || 0,
      };
    }
  });

  // 4. Resumo da Semana
  const { data: weekSummary, isLoading: loadingWeek } = useQuery({
    queryKey: ["admin-week-summary", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const rev = await reportService.getRevenueReport(shopId!, startWeek, endToday);
      const appts = await reportService.getAppointmentsReport(shopId!, startWeek, endToday);
      
      const { count } = await supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .eq("barbershop_id", shopId!)
        .gte("created_at", startWeek.toISOString());

      return {
        revenue: rev.totalRevenue,
        completed: appts.byStatus.completed || 0,
        newCustomers: count || 0,
      };
    }
  });

  const retryAll = () => {
    refetchRev();
    refetchAppts();
    refetchCust();
    refetchNext();
  };

  if (!shopId) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-muted-foreground">
        Nenhuma barbearia selecionada.
      </div>
    );
  }

  const hasError = isErrRev || isErrAppts || isErrCust || isErrNext;

  if (hasError) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <div>
          <p className="font-semibold text-foreground">Ocorreu um erro ao carregar os dados.</p>
          <p className="text-sm text-muted-foreground">Verifique sua conexão ou tente novamente.</p>
        </div>
        <Button onClick={retryAll} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  // Header Logic
  const currentHour = now.getHours();
  let greeting = "Boa noite";
  if (currentHour >= 5 && currentHour < 12) greeting = "Bom dia";
  else if (currentHour >= 12 && currentHour < 18) greeting = "Boa tarde";

  const firstName = user?.email ? user.email.split("@")[0] : "Usuário";
  const formattedDate = format(now, "EEEE, d 'de' MMMM", { locale: ptBR });
  
  const pendingCountTotal = todayAppts?.byStatus?.scheduled || 0;
  const completedCountToday = todayAppts?.byStatus?.completed || 0;

  return (
    <div className="space-y-6 md:space-y-8 pb-10 max-w-7xl mx-auto">
      
      {/* 1. HEADER */}
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-foreground capitalize">
          {greeting}, {firstName}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="capitalize">{formattedDate}</span>
          <span>•</span>
          <span className="font-medium text-foreground">{shop?.name || "Minha barbearia"}</span>
        </div>
      </div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Agendamentos */}
        <Card className="flex flex-col justify-between p-5 border-border/40 bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="rounded-lg bg-accent/10 p-2 text-accent">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider">Agendamentos</span>
          </div>
          <div className="mt-4">
            {loadingAppts ? <Skeleton className="h-8 w-16" /> : (
              <span className="text-3xl font-bold font-serif text-foreground">
                {todayAppts?.totalAppointments || 0}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total de marcações hoje</p>
          </div>
        </Card>

        {/* Faturamento */}
        <Card className="flex flex-col justify-between p-5 border-border/40 bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider">Faturamento</span>
          </div>
          <div className="mt-4">
            {loadingRev ? <Skeleton className="h-8 w-24" /> : (
              <span className="text-3xl font-bold font-serif text-foreground">
                {formatCurrency(todayRevenue?.totalRevenue)}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Concluídos e PDV hoje</p>
          </div>
        </Card>

        {/* Clientes */}
        <Card className="flex flex-col justify-between p-5 border-border/40 bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider">Clientes Atendidos</span>
          </div>
          <div className="mt-4">
            {loadingCustomers ? <Skeleton className="h-8 w-16" /> : (
              <span className="text-3xl font-bold font-serif text-foreground">
                {todayCustomers || 0}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Clientes únicos hoje</p>
          </div>
        </Card>

        {/* Pendentes */}
        <Card className="flex flex-col justify-between p-5 border-border/40 bg-card/40 backdrop-blur-md">
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-wider">Pendentes</span>
          </div>
          <div className="mt-4">
            {loadingAppts ? <Skeleton className="h-8 w-16" /> : (
              <span className="text-3xl font-bold font-serif text-foreground">
                {pendingCountTotal}
              </span>
            )}
            <p className="text-xs text-muted-foreground mt-1">Aguardando atendimento</p>
          </div>
        </Card>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-muted-foreground">Ações Rápidas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Button asChild variant="outline" className="h-14 justify-start gap-3 border-border/40 bg-card/40 backdrop-blur-md hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all">
            <Link to="/admin/agenda">
              <Plus className="h-5 w-5 text-accent" />
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-semibold">Novo</span>
                <span className="text-[10px] text-muted-foreground">Agendamento</span>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-14 justify-start gap-3 border-border/40 bg-card/40 backdrop-blur-md hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all">
            <Link to="/admin/pdv">
              <ShoppingBag className="h-5 w-5 text-accent" />
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-semibold">Abrir</span>
                <span className="text-[10px] text-muted-foreground">PDV Rápido</span>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-14 justify-start gap-3 border-border/40 bg-card/40 backdrop-blur-md hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all">
            <Link to="/admin/clientes">
              <UserPlus className="h-5 w-5 text-accent" />
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-semibold">Novo</span>
                <span className="text-[10px] text-muted-foreground">Cliente</span>
              </div>
            </Link>
          </Button>

          <Button asChild variant="outline" className="h-14 justify-start gap-3 border-border/40 bg-card/40 backdrop-blur-md hover:bg-accent/10 hover:text-accent hover:border-accent/30 transition-all">
            <Link to="/admin/servicos">
              <Scissors className="h-5 w-5 text-accent" />
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-semibold">Novo</span>
                <span className="text-[10px] text-muted-foreground">Serviço</span>
              </div>
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 4. TODAY'S SCHEDULE */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Agenda de Hoje (Próximos)</h2>
            <Button asChild variant="link" size="sm" className="text-xs text-accent hover:text-accent/80 p-0 h-auto">
              <Link to="/admin/agenda">Ver agenda completa <ArrowRight className="ml-1 h-3 w-3" /></Link>
            </Button>
          </div>
          <Card className="overflow-hidden border-border/40 bg-card/40 backdrop-blur-md">
            {loadingNext ? (
              <div className="flex flex-col gap-4 p-5">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ) : Array.isArray(nextAppts) && nextAppts.length > 0 ? (
              <div className="divide-y divide-border/20">
                {nextAppts.map((appt: any) => {
                  const statusInfo = STATUS_LABELS[appt.status] || { label: appt.status, className: "bg-muted text-muted-foreground" };
                  const serviceNames = Array.isArray(appt.services) && appt.services.length > 0 
                    ? appt.services.map((s: any) => s.service?.name).filter(Boolean).join(", ")
                    : "Serviço";
                  
                  return (
                    <div key={appt.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-accent/5 transition-colors gap-3">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="flex flex-col items-center justify-center rounded-xl bg-muted/40 p-2 min-w-[70px]">
                          <span className="text-sm font-bold text-foreground">
                            {format(new Date(appt.scheduled_start), "HH:mm")}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground text-sm">
                            {appt.customer?.full_name || "Cliente sem nome"}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {serviceNames} • {appt.professional?.display_name || "Sem prof."}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center self-start sm:self-auto shrink-0">
                        <Badge variant="outline" className={`font-semibold ${statusInfo.className}`}>
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/50 mb-3" />
                <p className="text-sm font-medium text-foreground">Nenhum agendamento para hoje.</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">Aproveite para divulgar seus serviços!</p>
                <Button asChild variant="outline" size="sm" className="rounded-xl">
                  <Link to="/admin/agenda">Ver agenda</Link>
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* 5. OPERATIONAL ALERTS & 6. WEEKLY SUMMARY */}
        <div className="space-y-6">
          
          {/* Alertas */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Atenção Hoje</h2>
            <Card className="p-4 border-border/40 bg-card/40 backdrop-blur-md">
              {loadingAlerts ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full rounded-xl" />
                  <Skeleton className="h-10 w-full rounded-xl" />
                </div>
              ) : (alertsData?.pendingAppts || alertsData?.lowStock || alertsData?.pendingCommissions) ? (
                <div className="flex flex-col gap-3">
                  {alertsData.pendingAppts > 0 && (
                    <Link to="/admin/agenda" className="flex items-center justify-between rounded-xl bg-blue-500/10 p-3 border border-blue-500/20 hover:bg-blue-500/20 transition-colors group">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium text-blue-100">{alertsData.pendingAppts} agendamentos pendentes</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                  {alertsData.lowStock > 0 && (
                    <Link to="/admin/estoque" className="flex items-center justify-between rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 hover:bg-amber-500/20 transition-colors group">
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-amber-100">{alertsData.lowStock} produtos com estoque baixo</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-amber-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                  {alertsData.pendingCommissions > 0 && (
                    <Link to="/admin/comissoes" className="flex items-center justify-between rounded-xl bg-rose-500/10 p-3 border border-rose-500/20 hover:bg-rose-500/20 transition-colors group">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-4 w-4 text-rose-500" />
                        <span className="text-sm font-medium text-rose-100">{alertsData.pendingCommissions} comissões pendentes</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-rose-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500/50 mb-2" />
                  <p className="text-sm font-medium text-muted-foreground">Tudo sob controle por aqui.</p>
                </div>
              )}
            </Card>
          </div>

          {/* Resumo da Semana */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Resumo da Semana</h2>
            <Card className="p-5 border-border/40 bg-card/40 backdrop-blur-md">
              {loadingWeek ? (
                <div className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-sm text-muted-foreground">Atendimentos</span>
                    <span className="font-serif font-bold text-foreground">{weekSummary?.completed || 0} concluídos</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border/40 pb-3">
                    <span className="text-sm text-muted-foreground">Faturamento</span>
                    <span className="font-serif font-bold text-emerald-400">{formatCurrency(weekSummary?.revenue)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Novos clientes</span>
                    <span className="font-serif font-bold text-blue-400">+{weekSummary?.newCustomers || 0} na semana</span>
                  </div>
                </div>
              )}
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
