import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { productService, Product } from "@/services/product.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Boxes,
  Package,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Search,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [{ title: "Controle de Estoque — BarberOS" }] }),
  component: Page,
});

type Movement = {
  id: string;
  product_id: string;
  kind: "in" | "out" | "sale" | "adjust";
  quantity: number;
  unit_cost: number | null;
  notes: string | null;
  created_at: string;
};

function Page() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const { data: products, refetch } = useQuery({
    enabled: !!shopId,
    queryKey: ["admin-products", shopId],
    queryFn: () => productService.getProducts(shopId!),
  });

  const totals = useMemo(() => {
    const list = products ?? [];
    const value = list.reduce((s, p) => s + Number(p.stock_qty) * Number(p.cost || 0), 0);
    const low = list.filter((p) => p.active && Number(p.stock_qty) <= Number(p.min_stock)).length;
    return { count: list.filter((p) => p.active).length, value, low };
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Estoque & Produtos</h1>
          <p className="text-muted-foreground">Catálogo de produtos, entradas, saídas e alertas de estoque mínimo.</p>
        </div>

        {canManage ? (
          <ProductDialog
            onSaved={refetch}
            shopId={shopId!}
            trigger={
              <Button className="rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background">
                <Plus className="mr-1.5 h-4 w-4" /> Novo produto
              </Button>
            }
          />
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Modo somente leitura
          </Badge>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPI icon={Package} label="Produtos ativos" value={totals.count} />
        <KPI icon={Boxes} label="Valor em estoque" value={brl(totals.value)} hint="Custo Total" />
        <KPI
          icon={AlertTriangle}
          label="Itens em alerta"
          value={totals.low}
          hint="Abaixo do estoque mín."
          tone={totals.low > 0 ? "warn" : undefined}
        />
      </div>

      <Tabs defaultValue="catalogo">
        <TabsList className="rounded-none border border-border/60 bg-card/40">
          <TabsTrigger value="catalogo" className="rounded-none text-xs uppercase tracking-wider">
            Catálogo de Produtos
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="rounded-none text-xs uppercase tracking-wider">
            Histórico de Movimentações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4">
          <ProductsList products={products ?? []} shopId={shopId!} canManage={canManage} onChange={refetch} />
        </TabsContent>

        <TabsContent value="movimentacoes" className="mt-4">
          <MovementsList shopId={shopId!} products={products ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint, tone }: any) {
  return (
    <Card className="rounded-none border border-border bg-card/50 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "warn" ? "text-destructive" : "text-accent"}`} />
      </div>
      <div className={`mt-2 font-serif text-3xl font-bold ${tone === "warn" ? "text-destructive" : ""}`}>{value}</div>
      {hint && <div className="mt-1 text-[10px] text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function ProductsList({
  products,
  shopId,
  canManage,
  onChange,
}: {
  products: Product[];
  shopId: string;
  canManage: boolean;
  onChange: () => void;
}) {
  const [q, setQ] = useState("");
  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      (p.sku ?? "").toLowerCase().includes(q.toLowerCase())
  );

  async function remove(p: Product) {
    if (!canManage) {
      toast.error("Permissão insuficiente para excluir produtos.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o produto "${p.name}"?`)) return;

    try {
      await productService.deleteProduct(p.id);
      toast.success("Produto excluído com sucesso!");
      onChange();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir produto.");
    }
  }

  if (!products.length) {
    return (
      <Card className="grid place-items-center gap-3 p-12 text-center rounded-none border border-border bg-card/40">
        <Package className="h-10 w-10 text-muted-foreground/40" />
        <div>
          <h3 className="font-serif text-xl font-bold">Nenhum produto cadastrado</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Cadastre os produtos de pomadas, óleos, lâminas e bebidas para controlar o estoque.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto por nome ou SKU…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-11 rounded-none pl-9 text-xs"
        />
      </div>

      <div className="grid gap-3">
        {filtered.map((p) => {
          const low = Number(p.stock_qty) <= Number(p.min_stock);

          return (
            <Card
              key={p.id}
              className="flex flex-col gap-4 border border-border bg-card/50 p-5 rounded-none backdrop-blur-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-none bg-accent/10 text-accent">
                  <Package className="h-6 w-6" />
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif text-lg font-bold text-foreground">{p.name}</span>
                    {p.sku && (
                      <Badge variant="outline" className="rounded-none text-[9px] uppercase border-border/60">
                        {p.sku}
                      </Badge>
                    )}
                    {low && p.active && (
                      <Badge
                        variant="destructive"
                        className="rounded-none gap-1 bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-bold uppercase"
                      >
                        <AlertTriangle className="h-3 w-3" /> Crítico
                      </Badge>
                    )}
                  </div>
                  {p.description && <p className="line-clamp-1 text-xs text-muted-foreground">{p.description}</p>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 border-y border-border/20 py-3 sm:border-none sm:py-0 text-xs">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Venda</div>
                  <div className="font-serif font-bold text-accent">{brl(Number(p.price))}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Custo</div>
                  <div className="font-serif text-foreground">{brl(Number(p.cost || 0))}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estoque</div>
                  <div className={`font-mono font-bold ${low ? "text-destructive" : "text-foreground"}`}>
                    {Number(p.stock_qty)} {p.unit}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <MovementDialog
                  product={p}
                  shopId={shopId}
                  onSaved={onChange}
                  trigger={
                    <Button size="sm" variant="outline" className="rounded-none text-xs font-bold uppercase">
                      <Settings2 className="mr-1.5 h-3.5 w-3.5" /> Ajustar
                    </Button>
                  }
                />
                {canManage && (
                  <>
                    <ProductDialog
                      product={p}
                      shopId={shopId}
                      onSaved={onChange}
                      trigger={
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => remove(p)}
                      className="h-8 w-8 rounded-none text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function ProductDialog({
  product,
  shopId,
  onSaved,
  trigger,
}: {
  product?: Product;
  shopId: string;
  onSaved: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    cost: product?.cost ?? 0,
    stock_qty: product?.stock_qty ?? 0,
    min_stock: product?.min_stock ?? 0,
    unit: product?.unit ?? "un",
    active: product?.active ?? true,
  });
  const [busy, setBusy] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Informe o nome do produto.");

    setBusy(true);
    try {
      if (product) {
        await productService.updateProduct(product.id, {
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          description: form.description.trim() || null,
          price: Number(form.price) || 0,
          cost: Number(form.cost) || 0,
          stock_qty: Number(form.stock_qty) || 0,
          min_stock: Number(form.min_stock) || 0,
          unit: form.unit.trim() || "un",
          active: form.active,
        });
        toast.success("Produto atualizado com sucesso!");
      } else {
        await productService.createProduct({
          barbershop_id: shopId,
          name: form.name.trim(),
          sku: form.sku.trim() || null,
          description: form.description.trim() || null,
          price: Number(form.price) || 0,
          cost: Number(form.cost) || 0,
          stock_qty: Number(form.stock_qty) || 0,
          min_stock: Number(form.min_stock) || 0,
          unit: form.unit.trim() || "un",
          active: form.active,
        });
        toast.success("Produto cadastrado com sucesso!");
      }
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">
              {product ? "Editar produto" : "Novo produto"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <div className="space-y-1">
              <Label>Nome do produto *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Pomada Modeladora Efeito Matte"
                className="rounded-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>SKU / Código</Label>
                <Input
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="POM-MATTE-01"
                  className="rounded-none"
                />
              </div>
              <div className="space-y-1">
                <Label>Unidade de medida</Label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  placeholder="un, ml, g…"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Preço de venda (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="rounded-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Custo de compra (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Estoque atual *</Label>
                <Input
                  type="number"
                  step="1"
                  min={0}
                  value={form.stock_qty}
                  onChange={(e) => setForm({ ...form, stock_qty: Number(e.target.value) })}
                  className="rounded-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Estoque mínimo para alerta</Label>
                <Input
                  type="number"
                  step="1"
                  min={0}
                  value={form.min_stock}
                  onChange={(e) => setForm({ ...form, min_stock: Number(e.target.value) })}
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Detalhes, modo de uso e características do produto..."
                className="rounded-none"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <Label htmlFor="prod_active" className="cursor-pointer">
                Produto ativo no catálogo
              </Label>
              <Switch
                id="prod_active"
                checked={form.active}
                onCheckedChange={(v) => setForm({ ...form, active: v })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Salvando…" : "Salvar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({
  product,
  shopId,
  onSaved,
  trigger,
}: {
  product: Product;
  shopId: string;
  onSaved: () => void;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"in" | "out" | "adjust">("in");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!quantity || quantity <= 0) return toast.error("A quantidade deve ser maior que zero.");

    setBusy(true);
    try {
      const delta =
        kind === "in"
          ? Number(quantity)
          : kind === "out"
          ? -Number(quantity)
          : Number(quantity) - Number(product.stock_qty);

      const reasonStr = notes.trim() || (kind === "in" ? "Entrada / Reposição" : kind === "out" ? "Saída / Uso" : "Ajuste de inventário");

      await productService.updateStock(product.id, delta, reasonStr, user?.id);
      toast.success("Movimentação de estoque registrada com sucesso!");
      setOpen(false);
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Erro ao movimentar estoque.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Ajustar Estoque — {product.name}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-3 py-4">
            <div className="space-y-1">
              <Label>Tipo de Movimentação</Label>
              <Select value={kind} onValueChange={(v) => setKind(v as any)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="in">Entrada (+ estoque)</SelectItem>
                  <SelectItem value="out">Saída / Perda (- estoque)</SelectItem>
                  <SelectItem value="adjust">Ajuste de inventário (novo saldo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>{kind === "adjust" ? "Novo Saldo Total" : "Quantidade a Movimentar"}</Label>
              <Input
                type="number"
                step="1"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-1">
              <Label>Motivo / Observações</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Compra de lote #4829, frasco quebrado, etc."
                className="rounded-none"
              />
            </div>

            <p className="text-xs text-muted-foreground">
              Estoque atual: <span className="font-mono font-bold text-foreground">{Number(product.stock_qty)} {product.unit}</span>
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Registrando…" : "Confirmar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MovementsList({ shopId, products }: { shopId: string; products: Product[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [kindFilter, setKindFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["stock-movements", shopId, kindFilter, productFilter],
    enabled: !!shopId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("stock_movements")
        .select("*")
        .eq("barbershop_id", shopId)
        .order("created_at", { ascending: false })
        .range(pageParam * 20, (pageParam + 1) * 20 - 1);

      if (kindFilter !== "all") {
        query = query.eq("kind", kindFilter);
      }
      if (productFilter !== "all") {
        query = query.eq("product_id", productFilter);
      }

      const { data } = await query;
      return {
        data: (data ?? []) as Movement[],
        nextPage: (data?.length ?? 0) === 20 ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const allRows = data?.pages.flatMap((page) => page.data) ?? [];
  const nameById = new Map(products.map((p) => [p.id, p.name]));

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (lastItem && lastItem.index >= allRows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, allRows.length, isFetchingNextPage, rowVirtualizer.getVirtualItems()]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-20 animate-pulse rounded-none border-border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (allRows.length === 0) {
    return <Card className="p-12 text-center text-xs text-muted-foreground rounded-none border border-border">Sem movimentações registradas.</Card>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 border border-border/40 bg-card/50 p-4">
        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tipo de Movimento</label>
          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="h-10 rounded-none text-xs">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="in">Entradas (+)</SelectItem>
              <SelectItem value="out">Saídas (-)</SelectItem>
              <SelectItem value="sale">Vendas PDV (-)</SelectItem>
              <SelectItem value="adjust">Ajustes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[180px] flex-1 flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Filtrar por Produto</label>
          <Select value={productFilter} onValueChange={setProductFilter}>
            <SelectTrigger className="h-10 rounded-none text-xs">
              <SelectValue placeholder="Filtrar por produto" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Todos os produtos</SelectItem>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-none border border-border bg-card/50 shadow-xl overflow-hidden">
        <div ref={parentRef} className="h-[480px] overflow-auto">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const isLoaderRow = virtualRow.index > allRows.length - 1;
              const m = allRows[virtualRow.index];

              if (isLoaderRow) {
                return (
                  <div
                    key="loader"
                    className="flex items-center justify-center py-4"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                );
              }

              const iconCfg =
                m.kind === "in"
                  ? { Icon: ArrowDownCircle, color: "text-emerald-500", label: "Entrada", bg: "bg-emerald-500/10" }
                  : m.kind === "out" || m.kind === "sale"
                  ? { Icon: ArrowUpCircle, color: "text-destructive", label: m.kind === "out" ? "Saída" : "Venda", bg: "bg-destructive/10" }
                  : { Icon: Settings2, color: "text-accent", label: "Ajuste", bg: "bg-accent/10" };

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 p-4 border-b border-border/20 last:border-0 hover:bg-card/80"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-none ${iconCfg.bg} ${iconCfg.color}`}>
                    <iconCfg.Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs text-foreground">{nameById.get(m.product_id) ?? "—"}</span>
                      <Badge
                        variant="outline"
                        className={`rounded-none text-[8px] font-bold uppercase tracking-widest ${iconCfg.bg} ${iconCfg.color} border-transparent`}
                      >
                        {iconCfg.label}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                      {m.notes && <span className="line-clamp-1">{m.notes}</span>}
                      <span>{format(new Date(m.created_at), "dd/MM/yyyy · HH:mm")}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-sm text-foreground">
                      {m.kind === "in" ? "+" : "-"}{Number(m.quantity)}
                    </div>
                    {m.unit_cost != null && <div className="text-[10px] text-muted-foreground">{brl(Number(m.unit_cost))} un.</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
