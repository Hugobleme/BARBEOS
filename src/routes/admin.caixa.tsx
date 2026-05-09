import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Plus, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/caixa")({ component: Caixa });

type Method = "cash" | "debit" | "credit" | "pix" | "transfer" | "other";
const METHOD_LABEL: Record<Method, string> = {
  cash: "Dinheiro", debit: "Débito", credit: "Crédito", pix: "Pix", transfer: "Transferência", other: "Outro"
};

function Caixa() {
  const shopId = useCurrentShopId();
  const { user } = useAuth();
  const today = new Date();
  const [openDlg, setOpenDlg] = useState(false);
  const [txDlg, setTxDlg] = useState(false);

  const { data: session, refetch: refetchSession } = useQuery({
    queryKey: ["cash-session", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("cash_sessions")
      .select("*").eq("barbershop_id").eq("status", "open")
      .order("opened_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const { data: txs, refetch: refetchTxs } = useQuery({
    queryKey: ["cash-tx", today.toDateString(), shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("cash_transactions")
      .select("*, professional:professionals(display_name), customer:customers(full_name)")
      .eq("barbershop_id")
      .gte("created_at", startOfDay(today).toISOString())
      .lte("created_at", endOfDay(today).toISOString())
      .order("created_at", { ascending: false })).data ?? [],
  });

  const totals = (txs ?? []).reduce((acc: any, t: any) => {
    const v = Number(t.amount);
    if (t.kind === "sale") { acc.sales += v; acc.byMethod[t.method] = (acc.byMethod[t.method] ?? 0) + v; }
    if (t.kind === "expense") acc.expenses += v;
    return acc;
  }, { sales: 0, expenses: 0, byMethod: {} as Record<string, number> });
  const net = totals.sales - totals.expenses;

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
              <CloseSessionButton session={session} onDone={() => { refetchSession(); }} />
              <Button onClick={() => setTxDlg(true)}><Plus className="mr-1 h-4 w-4"/>Lançamento</Button>
            </>
          ) : (
            <Button onClick={() => setOpenDlg(true)}><Unlock className="mr-1 h-4 w-4"/>Abrir caixa</Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI label="Vendas (dia)" value={brl(totals.sales)} accent />
        <KPI label="Despesas" value={brl(totals.expenses)} />
        <KPI label="Resultado" value={brl(net)} />
        <KPI label="Em dinheiro" value={brl(totals.byMethod.cash ?? 0)} />
      </div>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Por método de pagamento</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(METHOD_LABEL) as Method[]).map(m => (
            <div key={m} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span className="text-muted-foreground">{METHOD_LABEL[m]}</span>
              <span className="font-medium">{brl(totals.byMethod[m] ?? 0)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">Lançamentos do dia</h2>
        {(!txs || txs.length === 0) ? (
          <div className="grid place-items-center py-10 text-center">
            <DollarSign className="h-8 w-8 text-muted-foreground"/>
            <p className="mt-2 text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {txs.map((t: any) => (
              <li key={t.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={t.kind==="sale"?"bg-success/10 text-success":t.kind==="expense"?"bg-destructive/10 text-destructive":""}>
                    {t.kind === "sale" ? "Venda" : t.kind === "expense" ? "Despesa" : "Ajuste"}
                  </Badge>
                  <span className="font-mono text-xs text-muted-foreground">{format(new Date(t.created_at), "HH:mm")}</span>
                  <span>{t.description ?? (t.customer?.full_name ? `Cliente: ${t.customer.full_name}` : "—")}</span>
                  <span className="text-xs text-muted-foreground">{METHOD_LABEL[t.method as Method]}</span>
                </div>
                <span className={`font-medium ${t.kind==="expense"?"text-destructive":""}`}>{t.kind==="expense"?"-":""}{brl(Number(t.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <OpenSessionDialog open={openDlg} onOpenChange={setOpenDlg} userId={user?.id} onDone={() => refetchSession()} />
      <NewTxDialog open={txDlg} onOpenChange={setTxDlg} sessionId={session?.id} userId={user?.id} onDone={() => refetchTxs()} />
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`p-5 ${accent ? "border-accent/40" : ""}`}>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl font-semibold">{value}</div>
    </Card>
  );
}

function OpenSessionDialog({ open, onOpenChange, userId, onDone }: any) {
  const [amount, setAmount] = useState("0");
  async function submit() {
    const { error } = await supabase.from("cash_sessions").insert({
      barbershop_id: opened_by: userId, opening_amount: Number(amount) || 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Caixa aberto"); onOpenChange(false); onDone();
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Abrir caixa</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Valor de abertura (R$)</Label>
          <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
        </div>
        <DialogFooter><Button onClick={submit}>Abrir</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CloseSessionButton({ session, onDone }: any) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  async function submit() {
    const { error } = await supabase.from("cash_sessions").update({
      status: "closed", closed_at: new Date().toISOString(), closing_amount: Number(amount) || 0,
    }).eq("id", session.id);
    if (error) return toast.error(error.message);
    toast.success("Caixa fechado"); setOpen(false); onDone();
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><Lock className="mr-1 h-4 w-4"/>Fechar caixa</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Fechar caixa</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Valor em caixa no fechamento (R$)</Label>
            <Input type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={submit}>Fechar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NewTxDialog({ open, onOpenChange, sessionId, userId, onDone }: any) {
  const [kind, setKind] = useState<"sale"|"expense"|"adjustment">("sale");
  const [method, setMethod] = useState<Method>("cash");
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  async function submit() {
    if (!sessionId) return toast.error("Abra o caixa antes");
    const { error } = await supabase.from("cash_transactions").insert({
      barbershop_id: session_id: sessionId, kind, method,
      amount: Number(amount), description: desc || null, created_by: userId,
    });
    if (error) return toast.error(error.message);
    toast.success("Lançamento registrado");
    setAmount(""); setDesc(""); onOpenChange(false); onDone();
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo lançamento</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Tipo</Label>
              <Select value={kind} onValueChange={(v:any)=>setKind(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Método</Label>
              <Select value={method} onValueChange={(v:any)=>setMethod(v)}>
                <SelectTrigger><SelectValue/></SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABEL) as Method[]).map(m=> <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Valor (R$)</Label><Input type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          <div><Label>Descrição</Label><Input value={desc} onChange={e=>setDesc(e.target.value)}/></div>
        </div>
        <DialogFooter><Button onClick={submit}>Lançar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
