import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { cashService, PaymentMethod } from "@/services/cash.service";
import { barbershopService } from "@/services/barbershop.service";
import { productService } from "@/services/product.service";
import { customerService } from "@/services/customer.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";
import {
  Banknote,
  CreditCard,
  QrCode,
  ArrowLeftRight,
  Wallet,
  ShoppingCart,
  Trash2,
  Lock,
  Package,
  Scissors,
  Plus,
  Minus,
  TicketPercent,
  X,
  Search,
  Users,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pdv")({
  head: () => ({ meta: [{ title: "PDV / Vendas — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PDV,
});

const METHODS: { id: PaymentMethod; label: string; icon: any }[] = [
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
  serviceId?: string;
  qty: number;
  stockLeft?: number;
};

function PDV() {
  const { shopId } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [proId, setProId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customAmount, setCustomAmount] = useState("");
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"services" | "products">("services");
  const [busy, setBusy] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<any>(null);
  const [couponBusy, setCouponBusy] = useState(false);

  // Sessão de caixa aberta
  const { data: session } = useQuery({
    queryKey: ["pdv-session", shopId],
    enabled: !!shopId,
    queryFn: () => cashService.getOpenSession(shopId!),
  });

  // Lista de barbeiros/profissionais
  const { data: pros } = useQuery({
    queryKey: ["pdv-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  // Lista de serviços
  const { data: services } = useQuery({
    queryKey: ["pdv-services", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getServices(shopId!),
  });

  // Lista de produtos
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ["pdv-products", shopId],
    enabled: !!shopId,
    queryFn: () => productService.getProducts(shopId!),
  });

  // Lista de clientes
  const { data: customersData } = useQuery({
    queryKey: ["pdv-customers", shopId, customerSearch],
    enabled: !!shopId && customerSearch.length > 1,
    queryFn: () => customerService.getCustomers(shopId!, { q: customerSearch, limit: 10 }),
  });

  const filteredServices = useMemo(() => {
    const list = services ?? [];
    if (!filter.trim()) return list;
    const f = filter.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(f));
  }, [services, filter]);

  const filteredProducts = useMemo(() => {
    const list = products ?? [];
    if (!filter.trim()) return list;
    const f = filter.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(f));
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
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("barbershop_id", shopId!)
      .eq("code", code)
      .maybeSingle();

    setCouponBusy(false);
    if (!data || !("active" in data)) return toast.error("Cupom inválido ou não encontrado.");
    const c = data as any;

    if (!c.active) return toast.error("Cupom inativo.");
    const now = Date.now();
    if (c.valid_from && now < new Date(c.valid_from).getTime()) return toast.error("Cupom ainda não está ativo.");
    if (c.valid_until && now > new Date(c.valid_until).getTime()) return toast.error("Este cupom expirou.");
    if (c.usage_limit != null && Number(c.used_count) >= Number(c.usage_limit)) return toast.error("Limite de uso atingido.");
    if (Number(c.min_amount ?? 0) > 0 && subtotal < Number(c.min_amount)) {
      return toast.error(`Valor mínimo de ${brl(Number(c.min_amount))}`);
    }

    setCoupon(c);
    toast.success(`Cupom ${c.code} aplicado com sucesso!`);
  }

  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
  }

  function addService(s: any) {
    setCart((c) => [...c, { id: `srv-${s.id}-${Date.now()}`, serviceId: s.id, name: s.name, price: Number(s.price), qty: 1 }]);
    toast.success(`${s.name} adicionado`);
  }

  function addProduct(p: any) {
    const stock = Number(p.stock_qty ?? 0);
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.qty + 1 > stock) {
          toast.error(`Estoque insuficiente (Saldo: ${stock})`);
          return c;
        }
        return c.map((i) => (i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
      }
      if (stock < 1) {
        toast.error("Produto sem estoque.");
        return c;
      }
      return [
        ...c,
        { id: `prod-${p.id}-${Date.now()}`, productId: p.id, name: p.name, price: Number(p.price), qty: 1, stockLeft: stock },
      ];
    });
    toast.success(`${p.name} adicionado`);
  }

  function changeQty(id: string, delta: number) {
    setCart((c) =>
      c.flatMap((i) => {
        if (i.id !== id) return [i];
        const next = i.qty + delta;
        if (next <= 0) return [];
        if (i.productId && i.stockLeft != null && next > i.stockLeft) {
          toast.error(`Estoque insuficiente (${i.stockLeft})`);
          return [i];
        }
        return [{ ...i, qty: next }];
      })
    );
  }

  function addCustom() {
    const v = Number(customAmount.replace(",", "."));
    if (!v || v <= 0) return;
    setCart((c) => [...c, { id: `custom-${Date.now()}`, name: "Item Avulso", price: v, qty: 1 }]);
    setCustomAmount("");
  }

  function removeItem(id: string) {
    setCart((c) => c.filter((i) => i.id !== id));
  }

  async function handleFinalize() {
    if (!session) return toast.error("É necessário abrir o caixa antes de registrar vendas.");
    if (cart.length === 0) return toast.error("Adicione ao menos um item ao carrinho.");

    setBusy(true);
    try {
      const pro = (pros ?? []).find((p) => p.id === proId);
      const description = cart.map((i) => (i.qty > 1 ? `${i.qty}× ${i.name}` : i.name)).join(", ");

      // 1. Criar transação de venda no caixa
      const tx = await cashService.createTransaction({
        barbershop_id: shopId!,
        session_id: session.id,
        kind: "sale",
        method,
        amount: total,
        description,
        created_by: user?.id ?? "",
        customer_id: selectedCustomerId || undefined,
        professional_id: proId || undefined,
      });

      // 2. Dar baixa no estoque dos produtos vendidos
      const productItems = cart.filter((i) => i.productId);
      for (const item of productItems) {
        await productService.updateStock(item.productId!, -item.qty, `Venda PDV — Tx ${tx.id.slice(0, 8)}`, user?.id);
      }

      // 3. Registrar comissão para o profissional se aplicável
      if (pro && proId) {
        const rule: any = pro.commission_rule ?? {};
        const rate = Number(rule.percentage ?? rule.percent ?? rule.rate ?? 0);
        if (rate > 0) {
          const commAmount = +(total * rate / 100).toFixed(2);
          await supabase.from("commissions").insert({
            barbershop_id: shopId!,
            professional_id: proId,
            transaction_id: tx.id,
            base_amount: total,
            rate,
            amount: commAmount,
            status: "pending",
          });
        }
      }

      // 4. Registrar uso de cupom
      if (coupon && discount > 0) {
        await supabase.from("coupons").update({ used_count: Number(coupon.used_count || 0) + 1 }).eq("id", coupon.id);
      }

      toast.success(`Venda de ${brl(total)} finalizada com sucesso!`);
      setCart([]);
      setCustomAmount("");
      clearCoupon();
      setSelectedCustomerId(null);
      setCustomerSearch("");

      if (productItems.length) refetchProducts();
      qc.invalidateQueries({ queryKey: ["cash-transactions", shopId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao finalizar venda.");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <div className="grid place-items-center py-20 text-center px-4">
        <Card className="max-w-sm p-8 border border-border bg-card/60 shadow-xl backdrop-blur-md rounded-none">
          <div className="mx-auto h-16 w-16 grid place-items-center bg-muted/20 text-muted-foreground/40 mb-4">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold">Caixa fechado</h1>
          <p className="mt-2 text-xs text-muted-foreground">
            Abra o caixa diário para realizar cobranças e vendas pelo PDV.
          </p>
          <Button asChild className="mt-6 w-full rounded-none bg-accent text-accent-foreground h-12 font-bold uppercase tracking-wider">
            <Link to="/admin/caixa">Ir para o Caixa</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      {/* Catálogo de Itens */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-4xl font-bold tracking-tight">PDV / Balcão</h1>
          <p className="text-sm text-muted-foreground">Registre vendas rápidas de serviços e produtos no caixa.</p>
        </div>

        {/* Seleção de Cliente e Profissional */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Cliente */}
          <Card className="rounded-none border border-border/80 bg-card/40 p-4 backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-accent" /> Cliente</span>
              {selectedCustomerId && (
                <button onClick={() => { setSelectedCustomerId(null); setCustomerSearch(""); }} className="text-accent hover:underline">
                  Trocar
                </button>
              )}
            </div>
            {selectedCustomerId ? (
              <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                <UserCheck className="h-4 w-4 text-emerald-500" />
                <span>Cliente selecionado</span>
              </div>
            ) : (
              <div className="space-y-2">
                <Input
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente ou deixar avulso..."
                  className="h-10 rounded-none text-xs"
                />
                {customersData?.data && customersData.data.length > 0 && (
                  <div className="max-h-28 divide-y divide-border/20 overflow-y-auto border border-border/40 bg-background text-xs">
                    {customersData.data.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerSearch(c.full_name);
                        }}
                        className="w-full p-2 text-left hover:bg-muted/40 font-medium"
                      >
                        {c.full_name} {c.phone ? `(${c.phone})` : ""}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Profissional Responsável */}
          <Card className="rounded-none border border-border/80 bg-card/40 p-4 backdrop-blur-md">
            <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Profissional (opcional)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(pros ?? []).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProId(p.id === proId ? null : p.id)}
                  className={`rounded-none border px-3 py-1 text-xs font-bold transition-all ${
                    proId === p.id
                      ? "border-accent bg-accent/15 text-accent shadow-sm"
                      : "border-border/60 bg-background/40 hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  {p.display_name}
                </button>
              ))}
              {(pros ?? []).length === 0 && <p className="text-xs text-muted-foreground">Nenhum profissional cadastrado.</p>}
            </div>
          </Card>
        </div>

        {/* Catálogo com Tabs */}
        <Card className="rounded-none border border-border/80 bg-card/40 backdrop-blur-md">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border/40">
            <div className="inline-flex rounded-none border border-border/60 bg-background/60 p-1">
              <button
                onClick={() => setTab("services")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === "services" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Scissors className="h-3.5 w-3.5" /> Serviços
              </button>
              <button
                onClick={() => setTab("products")}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                  tab === "products" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Package className="h-3.5 w-3.5" /> Produtos
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Buscar itens do catálogo…"
                className="h-10 w-full pl-9 rounded-none text-xs sm:w-[240px]"
              />
            </div>
          </div>

          <div className="max-h-[480px] overflow-y-auto p-5">
            {tab === "services" ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredServices.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => addService(s)}
                    className="group flex flex-col justify-between rounded-none border border-border bg-background/60 p-4 text-left transition-all hover:border-accent hover:bg-card"
                  >
                    <span className="line-clamp-2 text-sm font-bold">{s.name}</span>
                    <span className="mt-3 font-serif font-bold text-accent">{brl(Number(s.price))}</span>
                  </button>
                ))}
                {filteredServices.length === 0 && (
                  <p className="col-span-full py-8 text-center text-xs text-muted-foreground">Nenhum serviço encontrado.</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {filteredProducts.map((p) => {
                  const stock = Number(p.stock_qty ?? 0);
                  const out = stock < 1;
                  return (
                    <button
                      key={p.id}
                      onClick={() => !out && addProduct(p)}
                      disabled={out}
                      className={`group flex flex-col justify-between rounded-none border p-4 text-left transition-all ${
                        out
                          ? "cursor-not-allowed border-border/30 opacity-40 bg-background/20"
                          : "border-border bg-background/60 hover:border-accent hover:bg-card"
                      }`}
                    >
                      <span className="line-clamp-2 text-sm font-bold">{p.name}</span>
                      <div className="mt-3 flex w-full items-center justify-between">
                        <span className="font-serif font-bold text-accent">{brl(Number(p.price))}</span>
                        <span className={`text-[10px] font-bold ${out ? "text-destructive" : "text-muted-foreground"}`}>
                          Estoque: {stock}
                        </span>
                      </div>
                    </button>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <p className="col-span-full py-8 text-center text-xs text-muted-foreground">Nenhum produto encontrado.</p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Lançamento Avulso */}
        <Card className="rounded-none border border-border/80 bg-card/40 p-5 backdrop-blur-md">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Lançamento de Valor Avulso
          </div>
          <div className="flex gap-3">
            <Input
              inputMode="decimal"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="R$ 0,00"
              className="h-11 rounded-none text-base font-bold"
            />
            <Button variant="outline" onClick={addCustom} className="h-11 rounded-none px-6 font-bold uppercase text-xs">
              Adicionar
            </Button>
          </div>
        </Card>
      </div>

      {/* Resumo do Carrinho e Pagamento */}
      <div className="lg:sticky lg:top-24 lg:self-start">
        <Card className="flex flex-col rounded-none border border-border bg-card/60 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-border/40 p-4">
            <div className="flex items-center gap-2 font-serif text-lg font-bold">
              <ShoppingCart className="h-4 w-4 text-accent" />
              <span>Itens da Venda</span>
            </div>
            {cart.length > 0 && (
              <Badge variant="outline" className="rounded-none text-accent border-accent/40 text-[10px]">
                {cart.length} itens
              </Badge>
            )}
          </div>

          <div className="max-h-[35vh] divide-y divide-border/20 overflow-y-auto lg:max-h-[calc(100vh-480px)]">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <ShoppingCart className="mb-2 h-10 w-10 opacity-20" />
                <p className="text-xs">Carrinho vazio</p>
              </div>
            ) : (
              cart.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 p-4 hover:bg-card/40">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-xs text-foreground">{i.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {brl(i.price)} {i.qty > 1 && <span className="text-accent">× {i.qty}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-border">
                      <button onClick={() => changeQty(i.id, -1)} className="p-1 hover:bg-muted">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center font-mono text-xs">{i.qty}</span>
                      <button onClick={() => changeQty(i.id, 1)} className="p-1 hover:bg-muted">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(i.id)} className="p-1 text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border/40 bg-background/40 p-5">
            <div className="mb-4 space-y-3">
              {/* Cupom */}
              <div className="flex gap-2">
                {coupon ? (
                  <div className="flex flex-1 items-center justify-between border border-accent/40 bg-accent/10 px-3 py-2 text-xs">
                    <span className="font-bold text-accent uppercase">
                      <TicketPercent className="inline mr-1 h-3.5 w-3.5" /> {coupon.code}
                    </span>
                    <button onClick={clearCoupon} className="text-accent hover:opacity-80">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="CUPOM"
                      className="h-9 rounded-none text-xs uppercase font-bold"
                    />
                    <Button variant="outline" size="sm" onClick={applyCoupon} disabled={couponBusy || !couponInput} className="rounded-none text-xs">
                      Aplicar
                    </Button>
                  </>
                )}
              </div>

              {/* Totais */}
              <div className="space-y-1.5 border-y border-border/20 py-3 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{brl(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-accent font-bold">
                    <span>Desconto</span>
                    <span>-{brl(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 text-base font-bold text-foreground">
                  <span>Total</span>
                  <span className="font-serif text-accent">{brl(total)}</span>
                </div>
              </div>

              {/* Métodos de Pagamento */}
              <div className="grid grid-cols-3 gap-1.5">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`flex flex-col items-center justify-center gap-1 border p-2 text-center transition-all ${
                      method === m.id
                        ? "border-accent bg-accent/15 text-accent font-bold"
                        : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <m.icon className="h-4 w-4" />
                    <span className="text-[9px] uppercase tracking-wider">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Button
              onClick={handleFinalize}
              disabled={busy || cart.length === 0}
              className="h-12 w-full rounded-none bg-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background"
            >
              {busy ? "Registrando venda..." : "Finalizar Cobrança"}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default PDV;
