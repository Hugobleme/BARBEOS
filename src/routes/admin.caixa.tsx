import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { cashService, CashTransaction, PaymentMethod } from "@/services/cash.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { brl } from "@/lib/format";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, ArrowDownRight, ArrowUpRight, DollarSign, Wallet, Receipt, Trash2, Calendar } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/caixa")({
  head: () => ({ meta: [{ title: "Fluxo de Caixa — BarberOS" }] }),
  component: CaixaPage,
});

const METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  transfer: "Transferência",
  other: "Outro",
};

function CaixaPage() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const canManage = shop?.role === "owner" || shop?.role === "admin" || shop?.role === "receptionist";

  const dateRange = useMemo(() => {
    const d = new Date(selectedDate + "T12:00:00");
    return {
      start: startOfDay(d),
      end: endOfDay(d),
    };
  }, [selectedDate]);

  // Consulta de transações do dia
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ["admin-cash-entries", shopId, selectedDate],
    enabled: !!shopId,
    queryFn: () => cashService.getCashEntries(shopId!, dateRange.start, dateRange.end),
  });

  // Cálculo de Totais
  const totals = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    (transactions ?? []).forEach((tx) => {
      const val = Number(tx.amount || 0);
      if (tx.kind === "sale" || tx.kind === "in" || tx.kind === "deposit") {
        entradas += val;
      } else if (tx.kind === "withdraw" || tx.kind === "expense" || tx.kind === "out" || tx.kind === "fee") {
        saidas += val;
      }
    });

    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      count: transactions?.length ?? 0,
    };
  }, [transactions]);

  async function handleDeleteEntry(id: string) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm("Deseja realmente excluir este lançamento do caixa?")) return;

    try {
      await cashService.deleteCashEntry(id);
      toast.success("Lançamento excluído com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir lançamento.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Fluxo de Caixa</h1>
          <p className="text-muted-foreground">
            Controle de entradas, saídas, sangrias e movimentações diárias da barbearia.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 border border-border bg-card/60 px-3 py-1.5 backdrop-blur">
            <Calendar className="h-4 w-4 text-accent" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-mono text-foreground focus:outline-none"
            />
          </div>

          <Button
            onClick={() => setCreateModalOpen(true)}
            className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Entradas */}
        <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total de Entradas
            </span>
            <div className="grid h-8 w-8 place-items-center bg-emerald-500/10 text-emerald-500">
              <ArrowDownRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-emerald-500">
            {brl(totals.entradas)}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Vendas, serviços e suprimentos</p>
        </Card>

        {/* Saídas */}
        <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total de Saídas
            </span>
            <div className="grid h-8 w-8 place-items-center bg-destructive/10 text-destructive">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-destructive">
            {brl(totals.saidas)}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Despesas, sangrias e retiradas</p>
        </Card>

        {/* Saldo do Dia */}
        <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Saldo Líquido do Dia
            </span>
            <div className="grid h-8 w-8 place-items-center bg-accent/10 text-accent">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className={`mt-2 font-serif text-3xl font-bold ${totals.saldo >= 0 ? "text-accent" : "text-destructive"}`}>
            {brl(totals.saldo)}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {totals.count} {totals.count === 1 ? "lançamento registrado" : "lançamentos registrados"}
          </p>
        </Card>
      </div>

      {/* Tabela de Lançamentos */}
      <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2 font-serif text-lg font-bold">
            <Receipt className="h-5 w-5 text-accent" />
            <span>Extrato de Movimentações ({format(new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy")})</span>
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton />
        ) : !transactions || transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhum lançamento neste dia"
            description="Clique em 'Novo Lançamento' para registrar entradas ou saídas avulsas."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-3">Horário</th>
                  <th className="py-3">Tipo</th>
                  <th className="py-3">Descrição</th>
                  <th className="py-3">Forma de Pagamento</th>
                  <th className="py-3">Profissional / Cliente</th>
                  <th className="py-3 text-right">Valor</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {transactions.map((t) => {
                  const isEntry = t.kind === "sale" || t.kind === "in" || t.kind === "deposit";
                  const person = t.professional?.display_name || t.customer?.full_name || "—";

                  return (
                    <tr key={t.id} className="hover:bg-card/60 transition-colors">
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {format(new Date(t.created_at), "HH:mm")}
                      </td>
                      <td className="py-3">
                        {isEntry ? (
                          <Badge variant="outline" className="rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                            Entrada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
                            Saída
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 font-medium text-foreground">{t.description || "Lançamento de caixa"}</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {METHOD_LABELS[t.method] || t.method}
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">{person}</td>
                      <td className={`py-3 text-right font-mono font-bold ${isEntry ? "text-emerald-500" : "text-destructive"}`}>
                        {isEntry ? `+ ${brl(Number(t.amount))}` : `- ${brl(Number(t.amount))}`}
                      </td>
                      <td className="py-3 text-right">
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEntry(t.id)}
                            className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Criação de Lançamento */}
      <CreateCashEntryModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        shopId={shopId!}
        userId={user?.id || ""}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

function CreateCashEntryModal({
  open,
  onOpenChange,
  shopId,
  userId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shopId: string;
  userId: string;
  onSuccess: () => void;
}) {
  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [type, setType] = useState<"entrada" | "saída">("entrada");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = Number(amountStr.replace(",", "."));

    if (!description.trim()) return toast.error("Informe a descrição do lançamento.");
    if (!amountNum || amountNum <= 0) return toast.error("Informe um valor válido.");

    setBusy(true);
    try {
      await cashService.createCashEntry({
        barbershop_id: shopId,
        description: description.trim(),
        amount: amountNum,
        type: type,
        payment_method: paymentMethod,
        created_by: userId,
      });

      toast.success("Lançamento registrado com sucesso!");
      setDescription("");
      setAmountStr("");
      setType("entrada");
      setPaymentMethod("cash");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar lançamento no caixa.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Novo Lançamento no Caixa</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label>Tipo de Movimentação *</Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="entrada">Entrada (Suprimento / Venda avulsa)</SelectItem>
                  <SelectItem value="saída">Saída (Sangria / Pagamento / Despesa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tx_desc">Descrição do Lançamento *</Label>
              <Input
                id="tx_desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Troco inicial, Compra de café, Lâminas..."
                className="rounded-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tx_amount">Valor (R$) *</Label>
                <Input
                  id="tx_amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="rounded-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Método de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger className="rounded-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-none">
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="credit">Cartão de Crédito</SelectItem>
                    <SelectItem value="debit">Cartão de Débito</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Salvando..." : "Confirmar Lançamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
