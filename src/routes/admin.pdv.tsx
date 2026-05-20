import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import { Banknote, CreditCard, QrCode, ArrowLeftRight, Wallet, Check, ShoppingCart, Trash2, Lock, Package, Scissors, Plus, Minus, TicketPercent, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pdv")({
  head: () => ({ meta: [{ title: "PDV — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PDV,
});

type Method = "cash" | "debit" | "credit" | "pix" | "transfer" | "other";
const METHODS: { id: Method; label: string; icon: any }[] = [
  { id: "cash", label: "Dinheiro", icon: Banknote },
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "debit", label: "Débito", icon: CreditCard },
  { id: "credit", label: "Crédito", icon: CreditCard },
  { id: "transfer", label: "Transf.", icon: ArrowLeftRight },
  { id: "other", label: "Outro", icon: Wallet },
];

type CartItem = {
  id: string;
  name: string;
  price: number;
  productId?: string;
  qty: number;
  stockLeft?: number;
};

function PDV() {
  const shopId = useCurrentShopId();
  const { user } = useAuth();
  const [proId, setProId] = useState<string | null>(null);
  const [method, setMethod] = useState<Method>("cash");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [custom, setCustom] = useState("");
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"services" | "products">("services");
  const [busy, setBusy] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<any>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  const { data: session } = useQuery({
    queryKey: ["pdv-session", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("cash_sessions")
      .select("id").eq("barbershop_id", shopId).eq("status", "open")
      .order("opened_at", { ascending: false }).limit(1).maybeSingle()).data,
  });

  const { data: pros } = useQuery({
    queryKey: ["pdv-pros", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("professionals")
      .select("id, display_name, commission_rule").eq("barbershop_id", shopId).eq("active", true)
      .order("display_name")).data ?? [],
  });

  const { data: services } = useQuery({
    queryKey: ["pdv-services", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("services")
      .select("id, name, price").eq("barbershop_id", shopId).eq("active", true)
      .order("sort").order("name")).data ?? [],
  });

  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ["pdv-products", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("products")
      .select("id, name, price, stock_qty").eq("barbershop_id", shopId).eq("active", true)
      .order("name")).data ?? [],
  });

  const filteredServices = useMemo(() => {
    const list = services ?? [];
    if (!filter.trim()) return list;
    const f = filter.toLowerCase();
    return list.filter((s: any) => s.name.toLowerCase().includes(f));
  }, [services, filter]);

  const filteredProducts = useMemo(() => {
    const list = products ?? [];
    if (!filter.trim()) return list;
    const f = filter.toLowerCase();
    return list.filter((p: any) => p.name.toLowerCase().includes(f));
  }, [products, filter]);

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  function addService(s: any) {
    setCart(c => [...c, { id: `${s.id}-${Date.now()}`, name: s.name, price: Number(s.price), qty: 1 }]);
  }
  function addProduct(p: any) {
    const stock = Number(p.stock_qty ?? 0);
    setCart(c => {
      const existing = c.find(i => i.productId === p.id);
      if (existing) {
        if (existing.qty + 1 > stock) { toast.error(`Estoque insuficiente (${stock})`); return c; }
        return c.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      if (stock < 1) { toast.error("Sem estoque"); return c; }
      return [...c, { id: `prod-${p.id}-${Date.now()}`, productId: p.id, name: p.name, price: Number(p.price), qty: 1, stockLeft: stock }];
    });
  }
  function changeQty(id: string, delta: number) {
    setCart(c => c.flatMap(i => {
      if (i.id !== id) return [i];
      const next = i.qty + delta;
      if (next <= 0) return [];
      if (i.productId && i.stockLeft != null && next > i.stockLeft) {
        toast.error(`Estoque insuficiente (${i.stockLeft})`);
        return [i];
      }
      return [{ ...i, qty: next }];
    }));
  }
  function addCustom() {
    const v = Number(custom.replace(",", "."));
    if (!v || v <= 0) return;
    setCart(c => [...c, { id: `custom-${Date.now()}`, name: "Avulso", price: v, qty: 1 }]);
    setCustom("");
  }
  function removeItem(id: string) { setCart(c => c.filter(i => i.id !== id)); }

  async function finalize() {
    if (!session) return toast.error("Abra o caixa antes de vender");
    if (cart.length === 0) return toast.error("Adicione itens à venda");
    setBusy(true);
    const pro = (pros ?? []).find((p: any) => p.id === proId);
    const description = cart.map(i => i.qty > 1 ? `${i.qty}× ${i.name}` : i.name).join(", ");
    const { data: tx, error } = await supabase.from("cash_transactions").insert({
      barbershop_id: shopId, session_id: session.id, kind: "sale", method,
      amount: total, description, created_by: user?.id, professional_id: proId,
    }).select("id").single();
    if (error || !tx) { setBusy(false); return toast.error(error?.message ?? "Erro ao registrar venda"); }

    // Baixa de estoque para produtos
    const productItems = cart.filter(i => i.productId);
    for (const item of productItems) {
      const { error: smErr } = await supabase.from("stock_movements").insert({
        barbershop_id: shopId, product_id: item.productId!, kind: "out",
        quantity: item.qty, transaction_id: tx.id, created_by: user?.id,
        notes: `Venda PDV`,
      });
      if (smErr) { toast.error(`Estoque: ${smErr.message}`); continue; }
      const newQty = Math.max(0, (item.stockLeft ?? 0) - item.qty);
      await supabase.from("products").update({ stock_qty: newQty }).eq("id", item.productId!);
    }

    // Cria comissão se houver regra (sobre o total da venda)
    if (pro && proId) {
      const rule: any = pro.commission_rule ?? {};
      const rate = Number(rule.rate ?? rule.percent ?? 0);
      if (rate > 0) {
        const amount = +(total * rate / 100).toFixed(2);
        await supabase.from("commissions").insert({
          barbershop_id: shopId, professional_id: proId, transaction_id: tx.id,
          base_amount: total, rate, amount, status: "pending",
        });
      }
    }
    setBusy(false);
    toast.success(`Venda de ${brl(total)} registrada`);
    setCart([]); setCustom("");
    if (productItems.length) refetchProducts();
  }

  if (!session) {
    return (
      <div className="grid place-items-center py-20 text-center">
        <Card className="max-w-sm p-8">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground"/>
          <h1 className="mt-3 font-display text-xl font-semibold">Caixa fechado</h1>
          <p className="mt-1 text-sm text-muted-foreground">Abra o caixa para iniciar vendas pelo PDV.</p>
          <Button asChild className="mt-4 w-full"><Link to="/admin/caixa">Ir para o caixa</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      {/* Catálogo / lado esquerdo */}
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-3xl font-bold">PDV</h1>
          <p className="text-sm text-muted-foreground">Toque nos itens para adicionar à venda</p>
        </div>

        <Card className="p-4">
          <div className="mb-3 text-sm font-medium text-muted-foreground">Profissional</div>
          <div className="flex flex-wrap gap-2">
            {(pros ?? []).map((p: any) => (
              <button key={p.id} onClick={() => setProId(p.id === proId ? null : p.id)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${proId === p.id ? "border-accent bg-accent/15 text-accent" : "border-border hover:bg-muted/40"}`}>
                {p.display_name}
              </button>
            ))}
            {(pros ?? []).length === 0 && <p className="text-sm text-muted-foreground">Nenhum profissional ativo.</p>}
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="inline-flex rounded-md border border-border p-0.5">
              <button onClick={()=>setTab("services")}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${tab==="services"?"bg-accent/15 text-accent":"text-muted-foreground hover:bg-muted/40"}`}>
                <Scissors className="h-3.5 w-3.5"/> Serviços
              </button>
              <button onClick={()=>setTab("products")}
                className={`inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-sm transition ${tab==="products"?"bg-accent/15 text-accent":"text-muted-foreground hover:bg-muted/40"}`}>
                <Package className="h-3.5 w-3.5"/> Produtos
              </button>
            </div>
            <Input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar…" className="h-8 max-w-[200px]"/>
          </div>

          {tab === "services" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filteredServices.map((s: any) => (
                <button key={s.id} onClick={() => addService(s)}
                  className="group flex flex-col items-start gap-1 rounded-lg border border-border p-3 text-left transition hover:border-accent hover:bg-accent/5 active:scale-[0.98]">
                  <span className="line-clamp-2 text-sm font-medium">{s.name}</span>
                  <span className="font-mono text-xs text-muted-foreground group-hover:text-accent">{brl(Number(s.price))}</span>
                </button>
              ))}
              {filteredServices.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum serviço.</p>}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filteredProducts.map((p: any) => {
                const stock = Number(p.stock_qty ?? 0);
                const out = stock < 1;
                return (
                  <button key={p.id} onClick={() => !out && addProduct(p)} disabled={out}
                    className={`group flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition ${out?"cursor-not-allowed border-border opacity-50":"border-border hover:border-accent hover:bg-accent/5 active:scale-[0.98]"}`}>
                    <span className="line-clamp-2 text-sm font-medium">{p.name}</span>
                    <div className="flex w-full items-center justify-between">
                      <span className="font-mono text-xs text-muted-foreground group-hover:text-accent">{brl(Number(p.price))}</span>
                      <span className={`text-[10px] ${out?"text-destructive":"text-muted-foreground"}`}>est. {stock}</span>
                    </div>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum produto.</p>}
            </div>
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-2 text-sm font-medium text-muted-foreground">Valor avulso</div>
          <div className="flex gap-2">
            <Input inputMode="decimal" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="R$ 0,00" />
            <Button variant="outline" onClick={addCustom}>Adicionar</Button>
          </div>
        </Card>
      </div>

      {/* Carrinho / lado direito (sticky no desktop) */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 font-display text-base font-semibold">
              <ShoppingCart className="h-4 w-4 text-accent"/> Venda atual
            </div>
            {cart.length > 0 && <Badge variant="outline">{cart.length} {cart.length===1?"item":"itens"}</Badge>}
          </div>

          <div className="max-h-[40vh] divide-y divide-border overflow-y-auto">
            {cart.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">Carrinho vazio</p>
            ) : cart.map(i => (
              <div key={i.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    {i.productId && <Package className="h-3 w-3 text-muted-foreground"/>}
                    <span className="truncate">{i.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground">{brl(i.price)} {i.qty>1 && `× ${i.qty}`}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={()=>changeQty(i.id,-1)} className="rounded border border-border p-1 hover:bg-muted/40"><Minus className="h-3 w-3"/></button>
                  <span className="w-6 text-center font-mono text-xs">{i.qty}</span>
                  <button onClick={()=>changeQty(i.id,+1)} className="rounded border border-border p-1 hover:bg-muted/40"><Plus className="h-3 w-3"/></button>
                  <span className="ml-2 font-mono text-xs">{brl(i.price * i.qty)}</span>
                  <button onClick={()=>removeItem(i.id)} className="ml-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5"/></button>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-3">
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {METHODS.map(m => (
                <button key={m.id} onClick={()=>setMethod(m.id)}
                  className={`flex flex-col items-center gap-1 rounded-md border px-2 py-2 text-[11px] transition ${method===m.id?"border-accent bg-accent/15 text-accent":"border-border text-muted-foreground hover:bg-muted/40"}`}>
                  <m.icon className="h-4 w-4"/>{m.label}
                </button>
              ))}
            </div>
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-display text-2xl font-bold">{brl(total)}</span>
            </div>
            <Button className="h-12 w-full text-base" onClick={finalize} disabled={busy || cart.length === 0}>
              <Check className="mr-2 h-4 w-4"/>{busy ? "Registrando…" : "Confirmar venda"}
            </Button>
            {!proId && cart.length > 0 && (
              <p className="mt-2 text-center text-[11px] text-muted-foreground">Sem profissional — comissão não será gerada.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
