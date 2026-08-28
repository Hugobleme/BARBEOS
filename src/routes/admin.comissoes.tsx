import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { commissionService, type Commission } from "@/services/commission.service";
import { barbershopService } from "@/services/barbershop.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Wallet, Check, Search, Calendar as CalendarIcon, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/comissoes")({
  component: AdminComissoesPage,
});

function AdminComissoesPage() {
  const { shopId, shop } = useCurrentShop();
  const isOwner = shop?.role === 'owner';
  const isAdmin = shop?.role === 'admin' || shop?.role === 'manager';
  const canManage = isOwner || isAdmin;
  const qc = useQueryClient();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [month, setMonth] = useState(currentMonth.toString());
  const [year, setYear] = useState(currentYear.toString());
  const [statusFilter, setStatusFilter] = useState("all");
  const [proFilter, setProFilter] = useState("all");

  const { data: professionals = [] } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["admin-commissions", shopId, parseInt(month), parseInt(year)],
    enabled: !!shopId,
    queryFn: () => commissionService.getCommissions(shopId!, parseInt(month), parseInt(year)),
  });

  const payMut = useMutation({
    mutationFn: (id: string) => commissionService.payCommission(id),
    onSuccess: () => {
      toast.success("Comissão marcada como paga.");
      qc.invalidateQueries({ queryKey: ["admin-commissions"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao pagar comissão.")
  });

  const handlePay = (c: Commission) => {
    if (confirm(`Confirmar o pagamento de ${brl(c.amount)} para ${c.professional?.display_name}?`)) {
      payMut.mutate(c.id);
    }
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(commissions)) return [];
    return commissions.filter(c => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (proFilter !== "all" && c.professional_id !== proFilter) return false;
      return true;
    });
  }, [commissions, statusFilter, proFilter]);

  const summary = useMemo(() => {
    const totalPending = filtered.filter(c => c.status === "pending").reduce((acc, c) => acc + Number(c.amount), 0);
    const totalPaid = filtered.filter(c => c.status === "paid").reduce((acc, c) => acc + Number(c.amount), 0);
    
    // Group by professional
    const byPro: Record<string, { name: string, total: number }> = {};
    filtered.forEach(c => {
      if (!c.professional?.display_name) return;
      if (!byPro[c.professional_id]) byPro[c.professional_id] = { name: c.professional.display_name, total: 0 };
      byPro[c.professional_id].total += Number(c.amount);
    });

    return { totalPending, totalPaid, byPro: Object.values(byPro).sort((a,b) => b.total - a.total) };
  }, [filtered]);

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-accent" /> Comissões
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Acompanhamento e pagamento de profissionais</p>
        </div>
      </div>

      <div className="p-4 sm:p-5 border-b border-border/40 bg-card/20 shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <Select value={month} onValueChange={setMonth}>
            <SelectTrigger className="w-full sm:w-[140px] h-11"><SelectValue placeholder="Mês" /></SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                <SelectItem key={m} value={m.toString()}>{format(new Date(2000, m - 1), "MMMM", { locale: ptBR })}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-full sm:w-[100px] h-11"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              {[currentYear-1, currentYear, currentYear+1].map(y => (
                <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[140px] h-11"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={proFilter} onValueChange={setProFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11"><SelectValue placeholder="Profissional" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {professionals.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 pb-24 space-y-6 sm:space-y-8">
          
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <Card className="p-4 bg-card/40 flex items-center gap-3 border-border/40">
              <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase">Pendente</p>
                <p className="text-lg sm:text-2xl font-black text-foreground">{brl(summary.totalPending)}</p>
              </div>
            </Card>
            <Card className="p-4 bg-card/40 flex items-center gap-3 border-border/40">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold uppercase">Pago</p>
                <p className="text-lg sm:text-2xl font-black text-foreground">{brl(summary.totalPaid)}</p>
              </div>
            </Card>
            <div className="col-span-2 lg:col-span-1 hidden lg:block">
              {summary.byPro.length > 0 && (
                <Card className="p-3 bg-card/40 border-border/40 h-full overflow-y-auto max-h-[72px]">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Top Profissionais (Total)</p>
                  <div className="text-xs text-foreground font-mono space-y-0.5">
                    {summary.byPro.slice(0, 2).map((p, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate mr-2">{p.name}</span>
                        <span className="font-bold shrink-0">{brl(p.total)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>

          <div>
            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/40 rounded-xl bg-muted/10">
                <Wallet className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-bold">Nenhuma comissão</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-1">Nenhum registro encontrado para os filtros selecionados.</p>
              </div>
            ) : (
              <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/30 border-b border-border/40 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Data</th>
                        <th className="px-4 sm:px-6 py-3 whitespace-nowrap">Profissional</th>
                        <th className="px-4 sm:px-6 py-3 whitespace-nowrap text-right">Base / %</th>
                        <th className="px-4 sm:px-6 py-3 whitespace-nowrap text-right">Comissão</th>
                        <th className="px-4 sm:px-6 py-3 whitespace-nowrap text-center">Status</th>
                        <th className="px-4 sm:px-6 py-3 whitespace-nowrap text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {filtered.map(c => (
                        <tr key={c.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                            <div className="font-medium">
                              {format(new Date(c.created_at), "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {c.appointment?.customer?.full_name || "Serviço Avulso"}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 font-bold text-foreground">
                            {c.professional?.display_name || "Desconhecido"}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right font-mono text-xs">
                            <div className="text-muted-foreground">{brl(Number(c.base_amount))}</div>
                            <div>{(Number(c.rate) * 100).toFixed(0)}%</div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right">
                            <span className="font-black text-accent">{brl(Number(c.amount))}</span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-center">
                            {c.status === "paid" ? (
                              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] uppercase font-bold">
                                Paga
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-500 text-[10px] uppercase font-bold">
                                Pendente
                              </Badge>
                            )}
                            {c.paid_at && (
                              <div className="text-[9px] text-muted-foreground mt-1">
                                {format(new Date(c.paid_at), "dd/MM")}
                              </div>
                            )}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-right">
                            {canManage && c.status === "pending" ? (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs border-emerald-500/30 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                                onClick={() => handlePay(c)}
                                disabled={payMut.isPending}
                              >
                                Pagar
                              </Button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground/30">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

        </div>
      </ScrollArea>
    </div>
  );
}
