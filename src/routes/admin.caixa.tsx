import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, Unlock, Users } from "lucide-react";
import { useCash } from "@/hooks/queries/useCash";
import { KPI } from "@/components/admin/caixa/KPI";
import { CashShortcuts } from "@/components/admin/caixa/CashShortcuts";
import { TransactionDialog } from "@/components/admin/caixa/TransactionDialog";
import { CloseSessionButton } from "@/components/admin/caixa/CloseSessionButton";
import { PaymentMethod } from "@/services/cash.service";
import { motion } from "framer-motion";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro", debit: "Débito", credit: "Crédito", pix: "Pix", transfer: "Transferência", other: "Outro"
};

export const Route = createFileRoute("/admin/caixa")({ component: Caixa });

function Caixa() {
  const shopId = useCurrentShopId();
  const { user } = useAuth();
  const today = new Date();
  
  const [openDlg, setOpenDlg] = useState(false);
  const [txDlg, setTxDlg] = useState(false);
  const [txPreset, setTxPreset] = useState<{ kind: string; description?: string } | null>(null);

  const { session, useTransactions, refetchSession, openSession } = useCash(shopId);
  const { data: txs, refetch: refetchTxs } = useTransactions(today);

  function openNewTx(preset?: { kind: string; description?: string }) {
    setTxPreset(preset ?? null);
    setTxDlg(true);
  }

  const totals = (txs ?? []).reduce((acc: any, t: any) => {
    const v = Number(t.amount);
    if (t.kind === "sale") { 
      acc.sales += v; 
      acc.byMethod[t.method] = (acc.byMethod[t.method] ?? 0) + v; 
    }
    if (t.kind === "expense") acc.expenses += v;
    return acc;
  }, { sales: 0, expenses: 0, byMethod: {} as Record<string, number> });
  
  const net = totals.sales - totals.expenses;

  // Totais por profissional (apenas vendas)
  const byPro = new Map<string, { name: string; total: number; count: number }>();
  for (const t of (txs ?? [])) {
    if (t.kind !== "sale" || !t.professional_id) continue;
    const cur = byPro.get(t.professional_id) ?? { name: t.professional?.display_name ?? "—", total: 0, count: 0 };
    cur.total += Number(t.amount); cur.count += 1;
    byPro.set(t.professional_id, cur);
  }
  const proRows = Array.from(byPro.values()).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Caixa</h1>
          <div className="mt-1 flex items-center gap-2 text-muted-foreground">
            <span className="text-sm font-medium">{format(today, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session ? (
            <>
              <div className="hidden items-center gap-2 rounded-xl bg-success/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-success sm:flex">
                <Unlock className="h-3 w-3"/>
                Caixa aberto
              </div>
              <CloseSessionButton session={session} onDone={refetchSession} />
              <Button onClick={() => openNewTx()} variant="premium" className="shadow-lg shadow-accent/20">
                <Plus className="mr-2 h-4 w-4"/>
                Novo Lançamento
              </Button>
            </>
          ) : (
            <Button onClick={() => setOpenDlg(true)} variant="premium" className="shadow-lg shadow-accent/20">
              <Unlock className="mr-2 h-4 w-4"/>
              Abrir Caixa
            </Button>
          )}
        </div>
      </div>

      {session && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-muted/20 p-1"
        >
          <CashShortcuts onOpenTx={openNewTx} />
        </motion.div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Vendas (dia)" value={brl(totals.sales)} accent />
        <KPI label="Despesas" value={brl(totals.expenses)} />
        <KPI label="Resultado Líquido" value={brl(net)} />
        <KPI label="Saldo em Dinheiro" value={brl(totals.byMethod.cash ?? 0)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden border-none bg-card/50 shadow-xl shadow-black/5 backdrop-blur-md">
          <div className="border-b border-border/40 p-6">
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground">Por método de pagamento</h2>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map(m => (
              <motion.div 
                key={m} 
                whileHover={{ scale: 1.02 }}
                className="flex items-center justify-between rounded-xl border border-border/40 bg-background/40 p-4 transition-all hover:border-accent/40"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{METHOD_LABEL[m]}</span>
                <span className="font-display font-bold text-foreground">{brl(totals.byMethod[m] ?? 0)}</span>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden border-none bg-card/50 shadow-xl shadow-black/5 backdrop-blur-md">
          <div className="border-b border-border/40 p-6">
            <h2 className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
              <Users className="h-5 w-5 text-accent"/> Produtividade (Vendas)
            </h2>
          </div>
          <div className="p-0">
            {proRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm font-medium text-muted-foreground">Sem vendas registradas para profissionais hoje.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {proRows.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-4 px-6 transition-colors hover:bg-black/5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 font-bold text-accent">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-foreground">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.count} {p.count === 1 ? 'atendimento' : 'atendimentos'}</span>
                      </div>
                    </div>
                    <span className="font-display font-bold text-foreground">{brl(p.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <TransactionDialog 
        open={txDlg} 
        onOpenChange={setTxDlg} 
        shopId={shopId} 
        sessionId={session?.id} 
        preset={txPreset} 
        onDone={() => { refetchTxs(); refetchSession(); }} 
      />
    </div>
  );
}
