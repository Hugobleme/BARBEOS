import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package, Plus, Trash2, ShoppingBag, MinusCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pacotes")({
  head: () => ({ meta: [{ title: "Pacotes — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Pacotes,
});

function Pacotes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Pacotes & assinaturas</h1>
        <p className="text-muted-foreground">Venda combos pré-pagos e controle o saldo de sessões dos clientes.</p>
      </div>
      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages"><Package className="mr-1 h-4 w-4"/>Pacotes</TabsTrigger>
          <TabsTrigger value="subscriptions"><ShoppingBag className="mr-1 h-4 w-4"/>Assinaturas</TabsTrigger>
        </TabsList>
        <TabsContent value="packages" className="mt-4"><PackagesTab/></TabsContent>
        <TabsContent value="subscriptions" className="mt-4"><SubscriptionsTab/></TabsContent>
      </Tabs>
    </div>
  );
}

function PackagesTab() {
  const shopId = useCurrentShopId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: rows } = useQuery({
    queryKey: ["packages", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("packages")
      .select("*").eq("barbershop_id", shopId).order("created_at", { ascending: false })).data ?? [],
  });

  async function toggleActive(id: string, active: boolean) {
    await supabase.from("packages").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["packages", shopId] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir este pacote?")) return;
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Pacote excluído");
    qc.invalidateQueries({ queryKey: ["packages", shopId] });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4"/>Novo pacote</Button>
      </div>
      {(!rows || rows.length === 0) ? (
        <Card className="grid place-items-center p-12 text-center">
          <Package className="h-8 w-8 text-muted-foreground"/>
          <p className="mt-2 text-sm text-muted-foreground">Nenhum pacote cadastrado.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((p: any) => (
            <Card key={p.id} className={`p-4 ${!p.active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                  {p.description && <p className="mt-0.5 text-xs text-muted-foreground">{p.description}</p>}
                </div>
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p.id, p.active)} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-muted/30 px-2 py-1.5">
                  <div className="text-[11px] text-muted-foreground">Preço</div>
                  <div className="font-mono font-semibold">{brl(Number(p.price))}</div>
                </div>
                <div className="rounded-md bg-muted/30 px-2 py-1.5">
                  <div className="text-[11px] text-muted-foreground">Sessões</div>
                  <div className="font-mono font-semibold">{p.sessions_total}</div>
                </div>
              </div>
              {p.validity_days && (
                <p className="mt-2 text-xs text-muted-foreground">Validade: {p.validity_days} dias</p>
              )}
              <div className="mt-3 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5"/>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      <PackageDialog open={open} onOpenChange={setOpen} onDone={() => qc.invalidateQueries({ queryKey: ["packages", shopId] })} />
    </div>
  );
}

function PackageDialog({ open, onOpenChange, onDone }: any) {
  const shopId = useCurrentShopId();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [sessions, setSessions] = useState("5");
  const [validity, setValidity] = useState("90");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!name.trim()) return toast.error("Informe o nome");
    setBusy(true);
    const { error } = await supabase.from("packages").insert({
      barbershop_id: shopId, name: name.trim(), description: desc || null,
      price: Number(price) || 0, sessions_total: Number(sessions) || 1,
      validity_days: validity ? Number(validity) : null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Pacote criado");
    setName(""); setDesc(""); setPrice(""); setSessions("5"); setValidity("90");
    onOpenChange(false); onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Novo pacote</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Ex: 5 cortes premium"/></div>
          <div><Label>Descrição</Label><Textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2}/></div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Preço (R$)</Label><Input type="number" value={price} onChange={e=>setPrice(e.target.value)}/></div>
            <div><Label>Sessões</Label><Input type="number" value={sessions} onChange={e=>setSessions(e.target.value)}/></div>
            <div><Label>Validade (dias)</Label><Input type="number" value={validity} onChange={e=>setValidity(e.target.value)} placeholder="Sem"/></div>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy}>{busy?"Salvando…":"Criar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubscriptionsTab() {
  const shopId = useCurrentShopId();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: subs } = useQuery({
    queryKey: ["subs", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("customer_subscriptions")
      .select("*, customer:customers(full_name, phone), package:packages(name, sessions_total)")
      .eq("barbershop_id", shopId).order("purchased_at", { ascending: false })).data ?? [],
  });

  async function redeem(s: any) {
    if (s.sessions_remaining <= 0) return toast.error("Sem sessões restantes");
    const remaining = s.sessions_remaining - 1;
    const { error } = await supabase.from("customer_subscriptions").update({
      sessions_remaining: remaining,
      status: remaining === 0 ? "completed" : s.status,
    }).eq("id", s.id);
    if (error) return toast.error(error.message);
    await supabase.from("subscription_redemptions").insert({
      subscription_id: s.id, barbershop_id: shopId,
    });
    toast.success("Sessão registrada");
    qc.invalidateQueries({ queryKey: ["subs", shopId] });
  }

  async function cancel(id: string) {
    if (!confirm("Cancelar esta assinatura?")) return;
    await supabase.from("customer_subscriptions").update({ status: "cancelled" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["subs", shopId] });
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}><Plus className="mr-1 h-4 w-4"/>Vender pacote</Button>
      </div>
      {(!subs || subs.length === 0) ? (
        <Card className="grid place-items-center p-12 text-center">
          <ShoppingBag className="h-8 w-8 text-muted-foreground"/>
          <p className="mt-2 text-sm text-muted-foreground">Nenhuma assinatura ativa.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {subs.map((s: any) => {
              const expired = s.expires_at && new Date(s.expires_at) < new Date();
              const total = s.package?.sessions_total ?? 0;
              return (
                <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{s.customer?.full_name ?? "—"}</span>
                      {s.status === "active" && !expired && <Badge variant="outline" className="bg-success/10 text-success">Ativo</Badge>}
                      {s.status === "completed" && <Badge variant="outline">Concluído</Badge>}
                      {s.status === "cancelled" && <Badge variant="outline" className="bg-destructive/10 text-destructive">Cancelado</Badge>}
                      {expired && s.status === "active" && <Badge variant="outline" className="bg-destructive/10 text-destructive">Expirado</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s.package?.name ?? "Pacote"} · {s.sessions_remaining}/{total} sessões
                      {s.expires_at && <> · expira {format(new Date(s.expires_at), "dd/MM/yyyy", { locale: ptBR })}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {s.status === "active" && !expired && s.sessions_remaining > 0 && (
                      <Button size="sm" variant="outline" onClick={() => redeem(s)}>
                        <MinusCircle className="mr-1 h-3.5 w-3.5"/>Usar sessão
                      </Button>
                    )}
                    {s.status === "active" && (
                      <Button size="sm" variant="ghost" onClick={() => cancel(s.id)} className="text-destructive">
                        <Trash2 className="h-3.5 w-3.5"/>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
      <SellDialog open={open} onOpenChange={setOpen} onDone={() => qc.invalidateQueries({ queryKey: ["subs", shopId] })} />
    </div>
  );
}

function SellDialog({ open, onOpenChange, onDone }: any) {
  const shopId = useCurrentShopId();
  const { user } = useAuth();
  const [customerId, setCustomerId] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [method, setMethod] = useState<"cash"|"pix"|"debit"|"credit"|"transfer"|"other">("cash");
  const [busy, setBusy] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["sell-customers", shopId], enabled: !!shopId && open,
    queryFn: async () => (await supabase.from("customers").select("id, full_name")
      .eq("barbershop_id", shopId).order("full_name").limit(200)).data ?? [],
  });
  const { data: pkgs } = useQuery({
    queryKey: ["sell-packages", shopId], enabled: !!shopId && open,
    queryFn: async () => (await supabase.from("packages").select("*")
      .eq("barbershop_id", shopId).eq("active", true).order("name")).data ?? [],
  });

  async function submit() {
    if (!customerId || !packageId) return toast.error("Selecione cliente e pacote");
    const pkg = (pkgs ?? []).find((p: any) => p.id === packageId);
    if (!pkg) return;
    setBusy(true);

    // Registra venda no caixa, se houver sessão aberta
    const { data: session } = await supabase.from("cash_sessions")
      .select("id").eq("barbershop_id", shopId).eq("status", "open")
      .order("opened_at", { ascending: false }).limit(1).maybeSingle();

    let txId: string | null = null;
    if (session) {
      const { data: tx } = await supabase.from("cash_transactions").insert({
        barbershop_id: shopId, session_id: session.id, kind: "sale", method,
        amount: Number(pkg.price), description: `Pacote: ${pkg.name}`,
        customer_id: customerId, created_by: user?.id,
      }).select("id").single();
      txId = tx?.id ?? null;
    }

    const expires_at = pkg.validity_days ? addDays(new Date(), pkg.validity_days).toISOString() : null;
    const { error } = await supabase.from("customer_subscriptions").insert({
      barbershop_id: shopId, customer_id: customerId, package_id: packageId,
      sessions_remaining: pkg.sessions_total, expires_at, transaction_id: txId,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(session ? "Pacote vendido e lançado no caixa" : "Pacote vendido (caixa fechado, sem lançamento)");
    setCustomerId(""); setPackageId("");
    onOpenChange(false); onDone();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Vender pacote</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Cliente</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger><SelectValue placeholder="Selecionar cliente"/></SelectTrigger>
              <SelectContent>
                {(customers ?? []).map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Pacote</Label>
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger><SelectValue placeholder="Selecionar pacote"/></SelectTrigger>
              <SelectContent>
                {(pkgs ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name} — {brl(Number(p.price))}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Método de pagamento</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Dinheiro</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="debit">Débito</SelectItem>
                <SelectItem value="credit">Crédito</SelectItem>
                <SelectItem value="transfer">Transferência</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter><Button onClick={submit} disabled={busy}>{busy?"Vendendo…":"Vender"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
