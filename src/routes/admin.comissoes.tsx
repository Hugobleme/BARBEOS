import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { commissionService, Commission } from "@/services/commission.service";
import { barbershopService } from "@/services/barbershop.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Coins, CheckCircle, ShieldAlert, Calendar, User, DollarSign, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/comissoes")({
  head: () => ({ meta: [{ title: "Comissões — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: ComissoesPage,
});

const MONTHS = [
  { value: "1", label: "Janeiro" },
  { value: "2", label: "Fevereiro" },
  { value: "3", label: "Março" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Maio" },
  { value: "6", label: "Junho" },
  { value: "7", label: "Julho" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Setembro" },
  { value: "10", label: "Outubro" },
  { value: "11", label: "Novembro" },
  { value: "12", label: "Dezembro" },
];

function ComissoesPage() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState<string>(String(now.getFullYear()));
  const [selectedPro, setSelectedPro] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [payingId, setPayingId] = useState<string | null>(null);

  // Lista de barbeiros para o filtro
  const { data: pros } = useQuery({
    queryKey: ["admin-pros-list", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  // Lista de comissões
  const { data: commissions, isLoading, refetch } = useQuery({
    queryKey: ["admin-commissions", shopId, selectedMonth, selectedYear],
    enabled: !!shopId,
    queryFn: () => commissionService.getCommissions(shopId!, Number(selectedMonth), Number(selectedYear)),
  });

  // Filtros aplicados em memória
  const filteredCommissions = (commissions ?? []).filter((c) => {
    if (selectedPro !== "all" && c.professional_id !== selectedPro) return false;
    if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
    return true;
  });

  // Totais
  const totalPending = filteredCommissions
    .filter((c) => c.status === "pending")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalPaid = filteredCommissions
    .filter((c) => c.status === "paid")
    .reduce((sum, c) => sum + Number(c.amount || 0), 0);

  const totalAll = filteredCommissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);

  async function handlePayCommission(id: string) {
    if (!canManage) {
      toast.error("Permissão insuficiente para alterar comissões.");
      return;
    }

    setPayingId(id);
    try {
      await commissionService.payCommission(id);
      toast.success("Comissão marcada como paga com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao pagar comissão.");
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Comissões da Equipe</h1>
          <p className="text-muted-foreground">
            Acompanhe e efetue o pagamento de comissões sobre atendimentos e vendas.
          </p>
        </div>

        {!canManage && (
          <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Modo somente leitura
          </Badge>
        )}
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Comissões Pendentes
            </span>
            <Coins className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-amber-500">{brl(totalPending)}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Aguardando pagamento aos profissionais</p>
        </Card>

        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Comissões Pagas
            </span>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-emerald-500">{brl(totalPaid)}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Pagas no período selecionado</p>
        </Card>

        <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Acumulado
            </span>
            <Wallet className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-foreground">{brl(totalAll)}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {filteredCommissions.length} lançamentos no período
          </p>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-3 border border-border/60 bg-card/40 p-4 backdrop-blur-md">
        <div className="w-[140px]">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="h-10 rounded-none border-border bg-background/50 text-xs">
              <SelectValue placeholder="Mês" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[110px]">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="h-10 rounded-none border-border bg-background/50 text-xs">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="2025" className="text-xs">2025</SelectItem>
              <SelectItem value="2026" className="text-xs">2026</SelectItem>
              <SelectItem value="2027" className="text-xs">2027</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[180px] flex-1">
          <Select value={selectedPro} onValueChange={setSelectedPro}>
            <SelectTrigger className="h-10 rounded-none border-border bg-background/50 text-xs">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all" className="text-xs">Todos os profissionais</SelectItem>
              {pros?.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs">
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-[150px]">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="h-10 rounded-none border-border bg-background/50 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all" className="text-xs">Todos os status</SelectItem>
              <SelectItem value="pending" className="text-xs">Pendentes</SelectItem>
              <SelectItem value="paid" className="text-xs">Pagas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Lançamentos de Comissão */}
      {isLoading ? (
        <TableSkeleton />
      ) : filteredCommissions.length === 0 ? (
        <EmptyState
          icon={Coins}
          title="Nenhuma comissão encontrada"
          description="Nenhuma comissão foi gerada para o mês e filtros selecionados."
        />
      ) : (
        <Card className="overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Profissional</th>
                  <th className="px-6 py-4">Data / Atendimento</th>
                  <th className="px-6 py-4">Valor Base</th>
                  <th className="px-6 py-4">Taxa (%)</th>
                  <th className="px-6 py-4">Comissão</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredCommissions.map((c) => {
                  const proName = c.professional?.display_name || "Profissional";
                  const dateStr = c.appointment?.scheduled_start || c.created_at;
                  const ratePercent = Number(c.rate) > 1 ? Number(c.rate) : Number(c.rate) * 100;
                  const isPaid = c.status === "paid";

                  return (
                    <tr key={c.id} className="transition-colors hover:bg-card/80">
                      <td className="px-6 py-4">
                        <div className="font-serif font-bold text-foreground">{proName}</div>
                        {c.appointment?.customer?.full_name && (
                          <div className="text-[11px] text-muted-foreground">
                            Cliente: {c.appointment.customer.full_name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {format(new Date(dateStr), "dd/MM/yyyy · HH:mm", { locale: ptBR })}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-foreground">
                        {brl(Number(c.base_amount || 0))}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-none text-[10px] font-mono border-accent/40 text-accent">
                          {ratePercent.toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-serif font-bold text-accent">
                        {brl(Number(c.amount || 0))}
                      </td>
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <Badge variant="outline" className="rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                            Paga
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">
                            Pendente
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isPaid && canManage ? (
                          <Button
                            size="sm"
                            disabled={payingId === c.id}
                            onClick={() => handlePayCommission(c.id)}
                            className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
                          >
                            {payingId === c.id ? "Salvando..." : "Pagar"}
                          </Button>
                        ) : isPaid ? (
                          <span className="text-xs text-muted-foreground/60">Paga em {c.paid_at ? format(new Date(c.paid_at), "dd/MM") : "—"}</span>
                        ) : (
                          <span className="text-xs text-muted-foreground/40">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
