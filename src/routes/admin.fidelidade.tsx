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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Gift, Search, Sparkles } from "lucide-react";

export const Route = createFileRoute("/admin/fidelidade")({
  head: () => ({ meta: [{ title: "Fidelidade — Admin BarberOS" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { shopId } = useCurrentShop();
  const [q, setQ] = useState("");

  const { data: settings, refetch: refetchSettings } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-settings", shopId],
    queryFn: async () => {
      const { data } = await supabase.from("barbershops").select("settings").eq("id", shopId!).single();
      const l = ((data?.settings as any)?.loyalty ?? {}) as { enabled?: boolean; points_per_real?: number; redeem_rate?: number };
      return { enabled: !!l.enabled, points_per_real: Number(l.points_per_real ?? 1), redeem_rate: Number(l.redeem_rate ?? 100) };
    },
  });

  const { data: balances, refetch: refetchBalances } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-balances", shopId],
    queryFn: async () => {
      const { data } = await supabase
        .from("loyalty_balances")
        .select("id, points, lifetime_points, updated_at, customer:customers(id, full_name, phone)")
        .eq("barbershop_id", shopId!)
        .order("points", { ascending: false })
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

  async function saveSettings(next: { enabled: boolean; points_per_real: number; redeem_rate: number }) {
    const { data: cur } = await supabase.from("barbershops").select("settings").eq("id", shopId!).single();
    const merged = { ...((cur?.settings as any) ?? {}), loyalty: next };
    const { error } = await supabase.from("barbershops").update({ settings: merged }).eq("id", shopId!);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
    refetchSettings();
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-accent">Programa de pontos</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Fidelidade</h1>
          <p className="text-sm text-muted-foreground">Premie quem volta sempre. Pontos creditados automaticamente ao concluir atendimentos e vendas.</p>
        </div>
      </header>

      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent"><Sparkles className="h-5 w-5" /></div>
          <div className="flex-1">
            <div className="font-medium">Programa ativo</div>
            <div className="text-xs text-muted-foreground">Quando ligado, clientes acumulam pontos automaticamente.</div>
          </div>
          <Switch checked={!!settings?.enabled} onCheckedChange={(v) => saveSettings({ ...(settings ?? { points_per_real: 1, redeem_rate: 100 }), enabled: v })} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label>Pontos por R$ 1,00 gasto</Label>
            <Input
              type="number" min="0" step="0.1"
              defaultValue={settings?.points_per_real ?? 1}
              onBlur={(e) => saveSettings({ enabled: !!settings?.enabled, redeem_rate: settings?.redeem_rate ?? 100, points_per_real: Number(e.target.value) })}
            />
            <p className="text-xs text-muted-foreground">Ex.: 1 ponto = R$ 1 gasto. Use 0,5 para 1 ponto a cada R$ 2.</p>
          </div>
          <div className="grid gap-2">
            <Label>Pontos necessários para R$ 1,00 de desconto</Label>
            <Input
              type="number" min="1" step="1"
              defaultValue={settings?.redeem_rate ?? 100}
              onBlur={(e) => saveSettings({ enabled: !!settings?.enabled, points_per_real: settings?.points_per_real ?? 1, redeem_rate: Math.max(1, Number(e.target.value)) })}
            />
            <p className="text-xs text-muted-foreground">Ex.: 100 pontos = R$ 1 de desconto. Aplicado no PDV.</p>
          </div>
        </div>
      </Card>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">Saldo dos clientes</h2>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="w-64 pl-9" placeholder="Buscar cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <Card className="divide-y divide-border">
          {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Nenhum cliente com pontos ainda.</div>}
          {filtered.map((b: any) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">{b.customer?.full_name ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{b.customer?.phone ?? "sem telefone"} · atualizado {format(new Date(b.updated_at), "d MMM yyyy", { locale: ptBR })}</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="font-display text-2xl font-bold text-accent">{b.points}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">acumulou {b.lifetime_points}</div>
                </div>
                <RedeemDialog
                  customerId={b.customer?.id}
                  customerName={b.customer?.full_name}
                  current={b.points}
                  onDone={() => refetchBalances()}
                />
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
}

function RedeemDialog({ customerId, customerName, current, onDone }: { customerId: string; customerName?: string; current: number; onDone: () => void }) {
  const { shopId } = useCurrentShop();
  const [open, setOpen] = useState(false);
  const [points, setPoints] = useState<string>("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    const p = Number(points);
    if (!p || p <= 0) return toast.error("Informe quantos pontos resgatar");
    if (p > current) return toast.error("Cliente não tem pontos suficientes");
    setBusy(true);
    const { error } = await supabase.rpc("redeem_loyalty_points", {
      _barbershop_id: shopId!,
      _customer_id: customerId,
      _points: p,
      _description: desc || "Resgate manual",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pontos resgatados");
    setOpen(false); setPoints(""); setDesc("");
    onDone();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Gift className="mr-2 h-4 w-4" />Resgatar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Resgatar pontos · {customerName}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Pontos a resgatar (saldo: {current})</Label>
            <Input type="number" min="1" max={current} value={points} onChange={(e) => setPoints(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Descrição (opcional)</Label>
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ex.: Corte cortesia" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Resgatando…" : "Confirmar resgate"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
