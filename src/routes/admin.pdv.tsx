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
import { Banknote, CreditCard, QrCode, ArrowLeftRight, Wallet, Check, ShoppingCart, Trash2, Lock, Package, Scissors, Plus, Minus, TicketPercent, X, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (Number(coupon.min_amount ?? 0) > 0 && subtotal < Number(coupon.min_amount)) return 0;
    if (coupon.kind === "percent" || coupon.kind === "first_visit") {
      return +(subtotal * Number(coupon.value) / 100).toFixed(2);
    }
    return Math.min(subtotal, Number(coupon.value));
  }, [coupon, subtotal]);
  const total = Math.max(0, +(subtotal - discount).toFixed(2));

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    const { data, error } = await supabase.from("coupons" as any)
      .select("*").eq("barbershop_id", shopId).eq("code", code).maybeSingle();
    setCouponBusy(false);
    if (!data || !("active" in data)) return toast.error("Cupom inválido");
    const c = data as any;

    if (!c.active) return toast.error("Cupom inativo");
    const now = Date.now();
    if (c.valid_from && now < new Date(c.valid_from).getTime()) return toast.error("Cupom ainda não está válido");
    if (c.valid_until && now > new Date(c.valid_until).getTime()) return toast.error("Cupom expirado");
    if (c.usage_limit != null && Number(c.used_count) >= Number(c.usage_limit)) return toast.error("Limite de uso atingido");
    if (Number(c.min_amount ?? 0) > 0 && subtotal < Number(c.min_amount)) return toast.error(`Valor mínimo de ${brl(Number(c.min_amount))}`);
    setCoupon(c);
    toast.success(`Cupom ${c.code} aplicado`);
  }
  function clearCoupon() { setCoupon(null); setCouponInput(""); }

  function addService(s: any) {
    setCart(c => [...c, { id: `${s.id}-${Date.now()}`, name: s.name, price: Number(s.price), qty: 1 }]);
    toast.success(`${s.name} adicionado`);
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
    toast.success(`${p.name} adicionado`);
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

    const productItems = cart.filter(i => i.productId);
    for (const item of productItems) {
      await supabase.from("stock_movements").insert({
        barbershop_id: shopId, product_id: item.productId!, kind: "out",
        quantity: item.qty, transaction_id: tx.id, created_by: user?.id,
        notes: `Venda PDV`,
      });
      const newQty = Math.max(0, (item.stockLeft ?? 0) - item.qty);
      await supabase.from("products").update({ stock_qty: newQty }).eq("id", item.productId!);
    }

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

    if (coupon && discount > 0) {
      await supabase.from("coupon_redemptions" as any).insert({
        barbershop_id: shopId, coupon_id: coupon.id, transaction_id: tx.id, discount_amount: discount,
      });
      await supabase.from("coupons" as any).update({ used_count: Number(coupon.used_count) + 1 }).eq("id", coupon.id);
    }

    setCart([]); setCustom(""); clearCoupon();
    if (productItems.length) refetchProducts();
  }

  if (!session) {
    return (
      <div className="grid place-items-center py-20 text-center px-4">
        <Card className="max-w-sm p-8 border-none bg-card/50 shadow-xl backdrop-blur-md">
          <div className="mx-auto h-16 w-16 grid place-items-center rounded-2xl bg-muted/20 text-muted-foreground/40 mb-4">
            <Lock className="h-8 w-8"/>
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Caixa fechado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Abra o caixa para iniciar vendas pelo PDV.</p>
          <Button asChild className="mt-6 w-full rounded-xl h-12 font-bold"><Link to="/admin/caixa">Ir para o caixa</Link></Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Catálogo */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl font-bold tracking-tight">PDV</h1>
          <p className="text-sm font-medium text-muted-foreground">Selecione os itens para realizar uma venda rápida</p>
        </div>

        <Card className="overflow-hidden border-none bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            <Users className="h-4 w-4 text-accent" /> Profissional
          </div>
          <div className="flex flex-wrap gap-2">
            {(pros ?? []).map((p: any) => (
              <button key={p.id} onClick={() => setProId(p.id === proId ? null : p.id)}
                className={`rounded-xl border px-4 py-2 text-sm font-bold transition-all active:scale-95 ${proId === p.id ? "border-accent bg-accent/10 text-accent shadow-sm" : "border-border/40 bg-background/40 hover:bg-muted/40"}`}>
                {p.display_name}
              </button>
            ))}
            {(pros ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhum profissional cadastrado.</p>}
          </div>
        </Card>

        <Card className="overflow-hidden border-none bg-card/50 shadow-xl shadow-black/5 backdrop-blur-md">
          <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex rounded-xl border border-border/40 bg-muted/20 p-1">
              <button onClick={()=>setTab("services")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-tight transition-all ${tab==="services"?"bg-background text-accent shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
                <Scissors className="h-3.5 w-3.5"/> Serviços
              </button>
              <button onClick={()=>setTab("products")}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-tight transition-all ${tab==="products"?"bg-background text-accent shadow-sm":"text-muted-foreground hover:text-foreground"}`}>
                <Package className="h-3.5 w-3.5"/> Produtos
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
              <Input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Buscar itens…" className="h-10 w-full pl-9 rounded-xl border-border/40 bg-background/40 sm:w-[240px]"/>
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-6 pt-0">
            {tab === "services" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredServices.map((s: any) => (
                  <button key={s.id} onClick={() => addService(s)}
                    className="group flex flex-col items-start gap-2 rounded-2xl border border-border/40 bg-background/40 p-4 text-left transition-all hover:border-accent hover:bg-accent/5 active:scale-[0.97]">
                    <span className="line-clamp-2 text-sm font-bold leading-tight">{s.name}</span>
                    <span className="font-display font-bold text-accent">{brl(Number(s.price))}</span>
                  </button>
                ))}
                {filteredServices.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nenhum serviço encontrado.</p>}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredProducts.map((p: any) => {
                  const stock = Number(p.stock_qty ?? 0);
                  const out = stock < 1;
                  return (
                    <button key={p.id} onClick={() => !out && addProduct(p)} disabled={out}
                      className={`group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all active:scale-[0.97] ${out?"cursor-not-allowed border-border/20 opacity-40":"border-border/40 bg-background/40 hover:border-accent hover:bg-accent/5"}`}>
                      <span className="line-clamp-2 text-sm font-bold leading-tight">{p.name}</span>
                      <div className="flex w-full items-center justify-between mt-auto">
                        <span className="font-display font-bold text-accent">{brl(Number(p.price))}</span>
                        <span className={`text-[10px] font-bold ${out?"text-destructive":"text-muted-foreground/60"}`}>EST. {stock}</span>
                      </div>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && <p className="col-span-full py-8 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
              </div>
            )}
          </div>
        </Card>

        <Card className="overflow-hidden border-none bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
          <div className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Lançamento avulso</div>
          <div className="flex gap-3">
            <Input inputMode="decimal" value={custom} onChange={e=>setCustom(e.target.value)} placeholder="R$ 0,00" className="h-12 rounded-xl border-border/40 bg-background/40 text-lg font-bold" />
            <Button variant="outline" onClick={addCustom} className="h-12 rounded-xl px-6 font-bold">Adicionar</Button>
          </div>
        </Card>
      </div>

      {/* Carrinho */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="flex flex-col border-none bg-card/50 shadow-2xl shadow-black/10 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/40 p-5">
            <div className="flex items-center gap-3 font-display text-lg font-bold">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/10 text-accent">
                <ShoppingCart className="h-4 w-4" />
              </div>
              Venda atual
            </div>
            {cart.length > 0 && <Badge className="bg-accent/10 text-accent border-accent/20 font-bold">{cart.length} itens</Badge>}
          </div>

          <div className="max-h-[40vh] divide-y divide-border/20 overflow-y-auto lg:max-h-[calc(100vh-500px)]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
                <ShoppingCart className="mb-4 h-12 w-12 opacity-10" />
                <p className="text-sm font-medium">Carrinho vazio</p>
              </div>
            ) : cart.map(i => (
              <div key={i.id} className="group flex items-center justify-between gap-4 p-5 transition-colors hover:bg-black/5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-foreground">{i.name}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    <span>{brl(i.price)}</span>
                    {i.qty > 1 && <span className="text-accent">× {i.qty}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-border/40 bg-background/40 overflow-hidden">
                    <button onClick={()=>changeQty(i.id,-1)} className="p-1.5 hover:bg-muted/60 transition-colors"><Minus className="h-3 w-3"/></button>
                    <span className="w-8 text-center font-mono text-xs font-bold">{i.qty}</span>
                    <button onClick={()=>changeQty(i.id,+1)} className="p-1.5 hover:bg-muted/60 transition-colors"><Plus className="h-3 w-3"/></button>
                  </div>
                  <button onClick={()=>removeItem(i.id)} className="rounded-lg p-2 text-muted-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 className="h-4 w-4"/>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto border-t border-border/40 bg-muted/10 p-5">
            <div className="mb-6 space-y-4">
              <div className="flex items-center gap-2">
                {coupon ? (
                  <div className="flex flex-1 items-center justify-between rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5">
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                      <TicketPercent className="h-4 w-4"/> {coupon.code}
                    </span>
                    <button onClick={clearCoupon} className="text-accent/60 hover:text-accent"><X className="h-4 w-4"/></button>
                  </div>
                ) : (
                  <div className="flex flex-1 gap-2">
                    <Input value={couponInput} onChange={e=>setCouponInput(e.target.value.toUpperCase())} placeholder="CUPOM" className="h-10 rounded-xl bg-background/40 font-bold uppercase" />
                    <Button variant="outline" size="sm" onClick={applyCoupon} disabled={couponBusy || !couponInput} className="h-10 rounded-xl font-bold">Aplicar</Button>
                  </div>
                )}
              </div>

              <div className="space-y-2 border-y border-border/20 py-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                  <span>Subtotal</span>
                  <span className="font-mono">{brl(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-accent">
                    <span>Desconto</span>
                    <span className="font-mono">-{brl(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="font-display text-xl font-bold text-foreground">Total</span>
                  <span className="font-display text-xl font-black text-accent">{brl(total)}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {METHODS.map(m => (
                  <button key={m.id} onClick={()=>setMethod(m.id)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3 transition-all active:scale-95 ${method === m.id ? "border-accent bg-accent/10 text-accent shadow-sm" : "border-border/40 bg-background/40 text-muted-foreground/60 hover:bg-muted/40 hover:text-foreground"}`}>
                    <m.icon className="h-4 w-4" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={finalize} disabled={busy || cart.length === 0} className="h-14 w-full rounded-2xl bg-accent text-lg font-black uppercase tracking-[0.2em] text-accent-foreground shadow-xl shadow-accent/20 hover:scale-[1.02] hover:bg-accent/90 active:scale-95">
              {busy ? "Processando…" : "Finalizar Venda"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PDV;
