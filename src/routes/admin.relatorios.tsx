import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { reportService } from "@/services/report.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brl } from "@/lib/format";
import { BarChart3, TrendingUp, DollarSign, Calendar as Cal, Users, Download, Scissors, CheckCircle2 } from "lucide-react";
import { format, subDays, startOfMonth, subMonths, endOfMonth, endOfDay, startOfDay } from "date-fns";

export const Route = createFileRoute("/admin/relatorios")({ component: RelatoriosPage });

function RelatoriosPage() {
  const { shopId } = useCurrentShop();

  const [period, setPeriod] = useState<"hoje" | "7d" | "mes" | "mes_passado" | "custom">("mes");
  const [customStart, setCustomStart] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [customEnd, setCustomEnd] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const dateRange = useMemo(() => {
    const today = new Date();
    switch (period) {
      case "hoje": return { s: startOfDay(today), e: endOfDay(today) };
      case "7d": return { s: startOfDay(subDays(today, 6)), e: endOfDay(today) };
      case "mes": return { s: startOfMonth(today), e: endOfDay(today) };
      case "mes_passado": {
        const last = subMonths(today, 1);
        return { s: startOfMonth(last), e: endOfDay(last) };
      }
      case "custom": return { s: startOfDay(new Date(customStart + "T12:00:00")), e: endOfDay(new Date(customEnd + "T12:00:00")) };
      default: return { s: startOfMonth(today), e: endOfDay(today) };
    }
  }, [period, customStart, customEnd]);

  // Queries
  const { data: revData, isLoading: loadRev } = useQuery({
    queryKey: ["report-rev", shopId, dateRange.s.toISOString(), dateRange.e.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getRevenueReport(shopId!, dateRange.s, dateRange.e)
  });

  const { data: apptData, isLoading: loadAppt } = useQuery({
    queryKey: ["report-appt", shopId, dateRange.s.toISOString(), dateRange.e.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getAppointmentsReport(shopId!, dateRange.s, dateRange.e)
  });

  const { data: topCust, isLoading: loadCust } = useQuery({
    queryKey: ["report-cust", shopId, dateRange.s.toISOString(), dateRange.e.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getTopCustomers(shopId!, 5)
  });

  const { data: topSvc, isLoading: loadSvc } = useQuery({
    queryKey: ["report-svc", shopId, dateRange.s.toISOString(), dateRange.e.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getTopServices(shopId!, 5)
  });

  const isLoading = loadRev || loadAppt || loadCust || loadSvc;
  const isError = !isLoading && (!revData || !apptData);

  const avgTicket = revData?.transactionsCount ? revData.totalRevenue / revData.transactionsCount : 0;
  
  const completionRate = apptData?.totalAppointments 
    ? (apptData.byStatus['completed'] || 0) / apptData.totalAppointments * 100 
    : 0;

  const exportCSV = () => {
    if (!revData) return;
    
    // Create CSV content (UTF-8 BOM)
    let csv = "\uFEFF";
    csv += "Relatório Gerencial - Barbeos\n";
    csv += `Período: ${format(dateRange.s, "dd/MM/yyyy")} a ${format(dateRange.e, "dd/MM/yyyy")}\n\n`;
    
    csv += "RESUMO\n";
    csv += `Faturamento Total;${revData.totalRevenue}\n`;
    csv += `Total de Vendas/Agendamentos;${revData.transactionsCount}\n`;
    csv += `Ticket Médio;${avgTicket.toFixed(2)}\n`;
    csv += `Taxa de Conclusão (%);${completionRate.toFixed(1)}%\n\n`;

    csv += "POR MÉTODO DE PAGAMENTO\n";
    csv += "Método;Valor\n";
    Object.entries(revData.byPaymentMethod).forEach(([k, v]) => {
      csv += `${k};${v}\n`;
    });
    csv += "\n";

    if (topSvc && topSvc.length > 0) {
      csv += "TOP SERVIÇOS\n";
      csv += "Serviço;Quantidade;Receita\n";
      topSvc.forEach(s => csv += `${s.name};${s.bookingsCount};${s.totalRevenue}\n`);
      csv += "\n";
    }

    if (topCust && topCust.length > 0) {
      csv += "TOP CLIENTES\n";
      csv += "Nome;Visitas;Gasto Total\n";
      topCust.forEach(c => csv += `${c.customer?.full_name || 'Desconhecido'};${c.appointmentsCount};${c.totalSpent}\n`);
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio-barbeos-${format(dateRange.s, "yyyy-MM-dd")}-a-${format(dateRange.e, "yyyy-MM-dd")}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      
      {/* HEADER */}
      <div className="flex flex-col border-b border-border/40 bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-accent" /> Relatórios
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Métricas e performance da barbearia</p>
          </div>
          
          <Button onClick={exportCSV} disabled={isLoading || isError} variant="outline" className="border-accent/30 text-accent hover:bg-accent/10 h-11">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>

        {/* FILTERS */}
        <div className="p-4 sm:px-5 pt-0 flex flex-wrap gap-2 items-center">
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-[160px] h-10 bg-background"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="hoje">Hoje</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="mes">Este mês</SelectItem>
              <SelectItem value="mes_passado">Mês passado</SelectItem>
              <SelectItem value="custom">Personalizado...</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <div className="flex items-center gap-2">
              <Input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="w-[140px] h-10 bg-background" />
              <span className="text-muted-foreground">até</span>
              <Input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="w-[140px] h-10 bg-background" />
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-5xl p-4 sm:p-6 pb-24 space-y-6">
          
          {isLoading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/30" />)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="h-48 animate-pulse bg-muted/30" />
                <Card className="h-48 animate-pulse bg-muted/30" />
              </div>
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="text-muted-foreground mb-4">Erro ao carregar dados do relatório.</span>
            </div>
          ) : (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <KPICard title="Faturamento" value={brl(revData.totalRevenue)} icon={DollarSign} color="text-emerald-500" />
                <KPICard title="Operações (Vendas)" value={revData.transactionsCount} icon={TrendingUp} color="text-accent" />
                <KPICard title="Ticket Médio" value={brl(avgTicket)} icon={BarChart3} color="text-blue-500" />
                <KPICard title="Taxa de Conclusão" value={`${completionRate.toFixed(1)}%`} icon={CheckCircle2} color="text-purple-500" />
              </div>

              {/* LISTS / BREAKDOWNS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                
                {/* Payments */}
                <Card className="p-4 bg-card border-border/40 flex flex-col h-full rounded-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" /> Por Pagamento
                  </h3>
                  <div className="flex-1 space-y-3">
                    {Object.keys(revData.byPaymentMethod).length === 0 ? (
                      <EmptyState text="Nenhuma transação no período." />
                    ) : (
                      Object.entries(revData.byPaymentMethod)
                        .sort((a,b) => (b[1] as number) - (a[1] as number))
                        .map(([method, amount]) => (
                        <div key={method} className="flex justify-between items-center text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
                          <span className="font-semibold uppercase">{method === 'cash' ? 'Dinheiro' : method}</span>
                          <span className="font-mono text-accent">{brl(amount as number)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Top Services */}
                <Card className="p-4 bg-card border-border/40 flex flex-col h-full rounded-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Scissors className="h-4 w-4" /> Top Serviços
                  </h3>
                  <div className="flex-1 space-y-3">
                    {!topSvc || topSvc.length === 0 ? (
                      <EmptyState text="Nenhum serviço concluído." />
                    ) : (
                      topSvc.map((svc: any) => (
                        <div key={svc.id} className="flex justify-between items-center text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
                          <div className="flex flex-col truncate pr-2">
                            <span className="font-bold truncate">{svc.name}</span>
                            <span className="text-xs text-muted-foreground">{svc.bookingsCount} vezes</span>
                          </div>
                          <span className="font-mono text-emerald-500">{brl(svc.totalRevenue)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

                {/* Top Customers */}
                <Card className="p-4 bg-card border-border/40 flex flex-col h-full rounded-xl md:col-span-2 lg:col-span-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
                    <Users className="h-4 w-4" /> Top Clientes
                  </h3>
                  <div className="flex-1 space-y-3">
                    {!topCust || topCust.length === 0 ? (
                      <EmptyState text="Nenhum cliente no período." />
                    ) : (
                      topCust.map((c: any) => (
                        <div key={c.customer?.id || Math.random()} className="flex justify-between items-center text-sm border-b border-border/40 pb-2 last:border-0 last:pb-0">
                          <div className="flex flex-col truncate pr-2">
                            <span className="font-bold truncate">{c.customer?.full_name || 'Desconhecido'}</span>
                            <span className="text-xs text-muted-foreground">{c.appointmentsCount} visitas</span>
                          </div>
                          <span className="font-mono text-accent">{brl(c.totalSpent)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </Card>

              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function KPICard({ title, value, icon: Icon, color }: any) {
  return (
    <Card className="p-4 bg-card border-border/40 rounded-xl flex flex-col justify-between min-h-[100px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate pr-2">{title}</span>
        <Icon className={`h-4 w-4 shrink-0 opacity-80 ${color}`} />
      </div>
      <span className={`text-lg sm:text-2xl font-mono font-bold truncate ${color}`}>{value}</span>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="h-full flex items-center justify-center text-sm text-muted-foreground italic bg-muted/20 rounded-lg p-4 text-center border border-dashed border-border/40">{text}</div>;
}
