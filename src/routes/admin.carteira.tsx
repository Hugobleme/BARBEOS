import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { brl } from "@/lib/format";
import { Wallet, Search, Plus, Minus, Percent } from "lucide-react";

export const Route = createFileRoute("/admin/carteira")({
  head: () => ({ meta: [{ title: "Carteira — Admin BarberOS" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { shopId } = useCurrentShop();
  const [q, setQ] = useState("");

  const { data: settings, refetch: refetchSettings } = useQuery({
    enabled: !!shopId,
    queryKey: ["wallet-settings", shopId],
    queryFn: async () => {
      const { data } = await supabase.from("barbershops").select("settings").eq("id", shopId!).single();
      const c = ((data?.settings as any)?.cashback ?? {}) as { enabled?: boolean; percent?: number };
      return { enabled: !!c.enabled, percent: Number(c.percent ?? 5) };
    },
  });

  const { data: balances, refetch: refetchBalances } = useQuery({
    enabled: !!shopId,
    queryKey: ["wallet-balances", shopId],
    queryFn: async () => {
      const { data } = await supabase
        .from("wallet_balances")
        .select("id, balance, lifetime_credited, updated_at, customer:customers(id, full_name, phone)")
        .eq("barbershop_id", shopId!)
        .order("balance", { ascending: false })
        .limit(500);
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return balances ?? [];
    return (balances ?? []).filter((b: any) =>
      (b.customer?.full_name ?? "").toLowerCase().includes(term) ||
      (b.customer?.phone ?? "").toLowerCase().includes(term),
    );
  }, [balances, q]);

  async function saveSettings(next: { enabled: boolean; percent: number }) {
    const { data: cur } = await supabase.from("barbershops").select("settings").eq("id", shopId!).single();
    const merged = { ...((cur?.settings as any) ?? {}), cashback: next };
    const { error } = await supabase.from("barbershops").update({ settings: merged }).eq("id", shopId!);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    refetchSettings();
  }

  const totalCredits = (balances ?? []).reduce((acc: number, b: any) => acc + Number(b.balance), 0);

  return (
    <div className="space-y-8">
      <header>
        <div className="text-xs uppercase tracking-[0.3em] text-accent">Cashback & créditos</div>
        <h1 className="mt-1 font-display text-3xl font-bold">Carteira</h1>
        <p className="text-sm text-muted-foreground">Devolva uma % de cada atendimento em crédito. Use no PDV como forma de pagamento.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-5"><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Saldo total dos clientes</div><div className="mt-2 font-display text-3xl font-bold text-accent">{brl(totalCredits)}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Clientes com saldo</div><div className="mt-2 font-display text-3xl font-bold">{(balances ?? []).filter((b: any) => Number(b.balance) > 0).length}</div></Card>
        <Card className="p-5"><div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Cashback configurado</div><div className="mt-2 font-display text-3xl font-bold">{settings?.enabled ? `${settings.percent}%` : "—"}</div></Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent"><Percent className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="font-medium">Cashback ativo</div>
            <div className="text-xs text-muted-foreground">Quando ligado, % do valor pago volta como crédito para o cliente.</div>
          </div>
          <Switch checked={!!settings?.enabled} onCheckedChange={(v) => saveSettings({ percent: settings?.percent ?? 5, enabled: v })} />
        </div>
        <div className="mt-6 grid gap-2 md:max-w-sm">
          <Label>Percentual de cashback (%)</Label>
          <Input
            type="number" min="0" max="100" step="0.5"
            defaultValue={settings?.percent ?? 5}
            onBlur={(e) => saveSettings({ enabled: !!settings?.enabled, percent: Math.max(0, Math.min(100, Number(e.target.value))) })}
          />
          <p className="text-xs text-muted-foreground">Ex.: 5% → em um corte de R$ 50 o cliente ganha R$ 2,50 de crédito.</p>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Saldos dos clientes</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-64 pl-9" placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <Card className="divide-y divide-border">
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Ninguém com saldo ainda.</div>}
          {filtered.map((b: any) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">{b.customer?.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{b.customer?.phone ?? "sem telefone"} · atualizado {format(new Date(b.updated_at), "d MMM yyyy", { locale: ptBR })}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-accent">{brl(Number(b.balance))}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">recebeu {brl(Number(b.lifetime_credited))}</div>
                </div>
                <WalletActions customerId={b.customer?.id} customerName={b.customer?.full_name} current={Number(b.balance)} onDone={() => refetchBalances()} />
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

function WalletActions({ customerId, customerName, current, onDone }: { customerId: string; customerName?: string; current: number; onDone: () => void }) {
  const { shopId } = useCurrentShop();
  const [open, setOpen] = useState<null | "credit" | "debit">(null);
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const a = Number(amount.replace(",", "."));
    if (!a || a <= 0) return toast.error("Informe um valor válido");
    if (open === "debit" && a > current) return toast.error("Saldo insuficiente");
    setBusy(true);
    const rpc = open === "credit" ? "credit_wallet_manual" : "redeem_wallet";
    const args: any = open === "credit"
      ? { _barbershop_id: shopId!, _customer_id: customerId, _amount: a, _description: desc || "Crédito manual" }
      : { _barbershop_id: shopId!, _customer_id: customerId, _amount: a, _description: desc || "Uso de crédito" };
    const { error } = await supabase.rpc(rpc as any, args);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(open === "credit" ? "Crédito lançado" : "Crédito utilizado");
    setOpen(null); setAmount(""); setDesc("");
    onDone();
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen("credit")}><Plus className="mr-1 h-4 w-4" />Creditar</Button>
      <Button size="sm" variant="outline" onClick={() => setOpen("debit")} disabled={current <= 0}><Minus className="mr-1 h-4 w-4" />Usar</Button>
      <Dialog open={open !== null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{open === "credit" ? "Creditar" : "Usar crédito"} · {customerName}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label>Valor em R$ {open === "debit" ? `(saldo: ${brl(current)})` : ""}</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Descrição (opcional)</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={open === "credit" ? "Ex.: Cortesia aniversário" : "Ex.: Pagamento parcial corte"} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(null)}>Cancelar</Button>
            <Button onClick={submit} disabled={busy}>{busy ? "Salvando…" : "Confirmar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
