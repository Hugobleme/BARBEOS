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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">{format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Badge className="bg-success/15 text-success" variant="outline"><Unlock className="mr-1 h-3 w-3"/>Caixa aberto</Badge>
              <CloseSessionButton session={session} onDone={refetchSession} />
              <Button onClick={() => openNewTx()}><Plus className="mr-1 h-4 w-4"/>Lançamento</Button>
            </>
          ) : (
            <Button onClick={() => setOpenDlg(true)}><Unlock className="mr-1 h-4 w-4"/>Abrir caixa</Button>
          )}
        </div>
      </div>

      {session && <CashShortcuts onOpenTx={openNewTx} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Vendas (dia)" value={brl(totals.sales)} accent />
        <KPI label="Despesas" value={brl(totals.expenses)} />
        <KPI label="Resultado" value={brl(net)} />
        <KPI label="Em dinheiro" value={brl(totals.byMethod.cash ?? 0)} />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Por método de pagamento</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map(m => (
            <div key={m} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{METHOD_LABEL[m]}</span>
              <span className="font-medium">{brl(totals.byMethod[m] ?? 0)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
          <Users className="h-4 w-4 text-accent"/> Por profissional (vendas do dia)
        </h2>
        {proRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem vendas registradas a profissionais.</p>
        ) : (
          <ul className="divide-y divide-border">
            {proRows.map((p, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  <Badge variant="outline" className="text-xs">{p.count} atend.</Badge>
                </div>
                <span className="font-mono font-medium">{brl(p.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

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
