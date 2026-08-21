import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Clock,
  Send,
  ShieldCheck,
  Receipt,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/carteira")({
  head: () => ({ meta: [{ title: "Carteira & Saldo — BarberOS" }] }),
  component: CarteiraPage,
});

const METHOD_LABELS: Record<string, string> = {
  cash: "Dinheiro",
  pix: "PIX",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  transfer: "Transferência",
  other: "Outro",
};

function CarteiraPage() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  const isOwner = shop?.role === "owner";
  const canWithdraw = isOwner;

  // Consulta 1: Resumo da Carteira
  const { data: walletSummary, isLoading: loadingSummary, refetch: refetchSummary } = useQuery({
    queryKey: ["admin-wallet-summary", shopId],
    enabled: !!shopId,
    queryFn: () => cashService.getWalletSummary(shopId!),
  });

  // Consulta 2: Últimas 10 Transações
  const { data: recentTransactions, isLoading: loadingTransactions, refetch: refetchTransactions } = useQuery({
    queryKey: ["admin-wallet-recent-txs", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const now = new Date();
      const past30Days = subDays(now, 30);
      const all = await cashService.getCashEntries(shopId!, past30Days, now);
      return all.slice(0, 10);
    },
  });

  const balance = walletSummary?.balance ?? 0;
  const pendingReceivables = walletSummary?.pendingReceivables ?? 0;

  return (
    <div className="space-y-8">
      {/* Topo / Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Carteira & Saldo da Barbearia</h1>
          <p className="text-muted-foreground">
            Acompanhe o saldo consolidado, recebíveis futuros e realize retiradas de lucros.
          </p>
        </div>

        <div>
          {canWithdraw ? (
            <Button
              onClick={() => setWithdrawModalOpen(true)}
              className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
            >
              <Send className="mr-1.5 h-3.5 w-3.5" /> Retirar Saldo
            </Button>
          ) : (
            <Badge variant="outline" className="rounded-none text-xs text-muted-foreground">
              Apenas sócios e donos podem realizar retiradas
            </Badge>
          )}
        </div>
      </div>

      {/* Cards de Saldo */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* Saldo Atual Disponível */}
        <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Saldo Disponível
            </span>
            <div className="grid h-8 w-8 place-items-center bg-accent/15 text-accent">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className={`mt-3 font-serif text-4xl font-bold ${balance >= 0 ? "text-accent" : "text-destructive"}`}>
            {brl(balance)}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Líquido acumulado de vendas e despesas</p>
        </Card>

        {/* Recebíveis Futuros */}
        <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Recebíveis Futuros
            </span>
            <div className="grid h-8 w-8 place-items-center bg-blue-500/15 text-blue-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-serif text-4xl font-bold text-foreground">
            {brl(pendingReceivables)}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Agendamentos marcados pendentes de atendimento</p>
        </Card>

        {/* Total Movimentações */}
        <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Histórico de Lançamentos
            </span>
            <div className="grid h-8 w-8 place-items-center bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 font-serif text-4xl font-bold text-foreground">
            {walletSummary?.transactionsCount ?? 0}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Transações registradas no caixa</p>
        </Card>
      </div>

      {/* Tabela: Últimas 10 Transações */}
      <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2 font-serif text-lg font-bold">
            <Receipt className="h-5 w-5 text-accent" />
            <span>Últimas Movimentações da Carteira</span>
          </div>
        </div>

        {loadingTransactions ? (
          <TableSkeleton />
        ) : !recentTransactions || recentTransactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Nenhuma movimentação recente"
            description="As movimentações de vendas e retiradas aparecerão aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-3">Data / Hora</th>
                  <th className="py-3">Tipo</th>
                  <th className="py-3">Descrição</th>
                  <th className="py-3">Forma de Pagamento</th>
                  <th className="py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {recentTransactions.map((tx) => {
                  const isEntry = tx.kind === "sale" || tx.kind === "in" || tx.kind === "deposit";

                  return (
                    <tr key={tx.id} className="hover:bg-card/60 transition-colors">
                      <td className="py-3 font-mono text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), "dd/MM/yyyy · HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3">
                        {isEntry ? (
                          <Badge variant="outline" className="rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                            Entrada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
                            Retirada / Saída
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 font-medium text-foreground">{tx.description || "Transação"}</td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {METHOD_LABELS[tx.method] || tx.method}
                      </td>
                      <td className={`py-3 text-right font-mono font-bold ${isEntry ? "text-emerald-500" : "text-destructive"}`}>
                        {isEntry ? `+ ${brl(Number(tx.amount))}` : `- ${brl(Number(tx.amount))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Retirada de Saldo */}
      <WithdrawModal
        open={withdrawModalOpen}
        onOpenChange={setWithdrawModalOpen}
        shopId={shopId!}
        currentBalance={balance}
        userId={user?.id || ""}
        onSuccess={() => {
          setWithdrawModalOpen(false);
          refetchSummary();
          refetchTransactions();
        }}
      />
    </div>
  );
}

function WithdrawModal({
  open,
  onOpenChange,
  shopId,
  currentBalance,
  userId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shopId: string;
  currentBalance: number;
  userId: string;
  onSuccess: () => void;
}) {
  const [amountStr, setAmountStr] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [busy, setBusy] = useState(false);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const amountNum = Number(amountStr.replace(",", "."));

    if (!amountNum || amountNum <= 0) return toast.error("Informe um valor de retirada válido.");
    if (amountNum > currentBalance) return toast.error("O valor de retirada excede o saldo disponível na carteira.");

    setBusy(true);
    try {
      await cashService.createCashEntry({
        barbershop_id: shopId,
        description: description.trim() || "Retirada de lucros / Sangria de carteira",
        amount: amountNum,
        type: "saída",
        payment_method: method,
        created_by: userId,
      });

      toast.success("Retirada registrada com sucesso no fluxo financeiro!");
      setAmountStr("");
      setDescription("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar retirada.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={handleWithdraw}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Retirar Saldo da Barbearia</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="border border-border bg-card/60 p-3">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Saldo Disponível:</span>
              <div className="font-serif text-xl font-bold text-accent">{brl(currentBalance)}</div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w_amount">Valor a Retirar (R$) *</Label>
              <Input
                id="w_amount"
                type="number"
                step="0.01"
                min="0.01"
                max={currentBalance > 0 ? currentBalance : 0.01}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Forma de Saída</Label>
              <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="pix">Transferência PIX</SelectItem>
                  <SelectItem value="transfer">TED / DOC</SelectItem>
                  <SelectItem value="cash">Dinheiro em Espécie</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="w_desc">Motivo / Descrição</Label>
              <Input
                id="w_desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Distribuição de lucros sócios, Transferência para conta PJ"
                className="rounded-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Processando..." : "Confirmar Retirada"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
