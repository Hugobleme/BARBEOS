import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import { format } from "date-fns";
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Boxes, Package, Pencil, Plus, Settings2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/estoque")({
  head: () => ({ meta: [{ title: "Estoque — BarberOS" }] }),
  component: Page,
});

type Product = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  price: number;
  cost: number;
  stock_qty: number;
  min_stock: number;
  unit: string;
  active: boolean;
};

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
  const shopId = useCurrentShopId();
  const { data: products, refetch } = useQuery({
    enabled: !!shopId,
    queryKey: ["products", shopId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("barbershop_id", shopId)
        .order("name");
      return (data ?? []) as Product[];
    },
  });

  const totals = useMemo(() => {
    const list = products ?? [];
    const value = list.reduce((s, p) => s + Number(p.stock_qty) * Number(p.cost), 0);
    const low = list.filter((p) => p.active && Number(p.stock_qty) <= Number(p.min_stock)).length;
    return { count: list.filter((p) => p.active).length, value, low };
  }, [products]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Estoque</h1>
          <p className="text-muted-foreground">Produtos, entradas, saídas e alertas de mínimo</p>
        </div>
        <ProductDialog onSaved={refetch} shopId={shopId} trigger={<Button><Plus className="mr-1 h-4 w-4"/>Novo produto</Button>} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <KPI icon={Package} label="Produtos ativos" value={totals.count} />
        <KPI icon={Boxes} label="Valor em estoque" value={brl(totals.value)} hint="Custo Total" />
        <KPI icon={AlertTriangle} label="Itens em alerta" value={totals.low} hint="Abaixo do mín." tone={totals.low > 0 ? "warn" : undefined} />
      </div>

      <Tabs defaultValue="catalogo">
        <TabsList>
          <TabsTrigger value="catalogo">Catálogo</TabsTrigger>
          <TabsTrigger value="movimentacoes">Movimentações</TabsTrigger>
        </TabsList>

        <TabsContent value="catalogo" className="mt-4">
          <ProductsList products={products ?? []} shopId={shopId} onChange={refetch} />
        </TabsContent>

        <TabsContent value="movimentacoes" className="mt-4">
          <MovementsList shopId={shopId} products={products ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function KPI({ icon: Icon, label, value, hint, tone }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={`h-4 w-4 ${tone === "warn" ? "text-destructive" : "text-accent"}`} />
      </div>
      <div className={`mt-2 font-display text-3xl font-semibold ${tone === "warn" ? "text-destructive" : ""}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

function ProductsList({ products, shopId, onChange }: { products: Product[]; shopId: string; onChange: () => void }) {
  const [q, setQ] = useState("");
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(q.toLowerCase()));

  async function toggleActive(p: Product) {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Produto atualizado"); onChange(); }
  }

  async function remove(p: Product) {
    if (!confirm(`Excluir "${p.name}"? As movimentações vinculadas também serão removidas.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) toast.error(error.message); else { toast.success("Produto excluído"); onChange(); }
  }

  if (!products.length) {
    return (
      <Card className="grid place-items-center gap-3 p-12 text-center">
        <Package className="h-10 w-10 text-muted-foreground" />
        <div>
          <h3 className="font-display text-lg font-semibold">Nenhum produto cadastrado</h3>
          <p className="text-sm text-muted-foreground">Crie o primeiro produto para começar a controlar o estoque.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Input placeholder="Buscar por nome ou SKU…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
      <div className="grid gap-3">
        {filtered.map((p) => {
          const low = Number(p.stock_qty) <= Number(p.min_stock);
          return (
            <Card key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-accent/15 text-accent"><Package className="h-5 w-5"/></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-display text-base font-semibold">{p.name}</span>
                  {p.sku && <Badge variant="outline" className="text-xs">{p.sku}</Badge>}
                  {!p.active && <Badge variant="secondary">Inativo</Badge>}
                  {low && p.active && <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3"/>Mínimo</Badge>}
                </div>
                {p.description && <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.description}</p>}
              </div>
              <div className="grid grid-cols-3 gap-4 text-right text-sm">
                <Mini label="Preço" value={brl(Number(p.price))} />
                <Mini label="Custo" value={brl(Number(p.cost))} />
                <Mini label="Estoque" value={`${Number(p.stock_qty)} ${p.unit}`} highlight={low && p.active} />
              </div>
              <div className="flex items-center gap-2">
                <MovementDialog product={p} shopId={shopId} onSaved={onChange} trigger={<Button size="sm" variant="outline"><Settings2 className="mr-1 h-4 w-4"/>Movimentar</Button>} />
                <ProductDialog product={p} shopId={shopId} onSaved={onChange} trigger={<Button size="icon" variant="ghost"><Pencil className="h-4 w-4"/></Button>} />
                <Switch checked={p.active} onCheckedChange={() => toggleActive(p)} />
                <Button size="icon" variant="ghost" onClick={() => remove(p)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Mini({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`font-semibold ${highlight ? "text-destructive" : ""}`}>{value}</div>
    </div>
  );
}

function ProductDialog({ product, shopId, onSaved, trigger }: { product?: Product; shopId: string; onSaved: () => void; trigger: React.ReactNode }) {
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
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!form.name.trim()) return toast.error("Informe o nome");
    setBusy(true);
    const payload = {
      barbershop_id: shopId,
      name: form.name.trim(),
      sku: form.sku.trim() || null,
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      cost: Number(form.cost) || 0,
      stock_qty: Number(form.stock_qty) || 0,
      min_stock: Number(form.min_stock) || 0,
      unit: form.unit.trim() || "un",
    };
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(product ? "Produto atualizado" : "Produto criado");
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5"><Label>Nome</Label><Input value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>SKU</Label><Input value={form.sku} onChange={(e)=>setForm({...form,sku:e.target.value})} /></div>
            <div className="grid gap-1.5"><Label>Unidade</Label><Input value={form.unit} onChange={(e)=>setForm({...form,unit:e.target.value})} placeholder="un, ml, g…" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Preço de venda</Label><Input type="number" step="0.01" value={form.price} onChange={(e)=>setForm({...form,price:Number(e.target.value)})} /></div>
            <div className="grid gap-1.5"><Label>Custo</Label><Input type="number" step="0.01" value={form.cost} onChange={(e)=>setForm({...form,cost:Number(e.target.value)})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5"><Label>Estoque atual</Label><Input type="number" step="0.01" value={form.stock_qty} onChange={(e)=>setForm({...form,stock_qty:Number(e.target.value)})} /></div>
            <div className="grid gap-1.5"><Label>Estoque mínimo</Label><Input type="number" step="0.01" value={form.min_stock} onChange={(e)=>setForm({...form,min_stock:Number(e.target.value)})} /></div>
          </div>
          <div className="grid gap-1.5"><Label>Descrição</Label><Textarea rows={2} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementDialog({ product, shopId, onSaved, trigger }: { product: Product; shopId: string; onSaved: () => void; trigger: React.ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"in" | "out" | "adjust">("in");
  const [quantity, setQuantity] = useState(1);
  const [unitCost, setUnitCost] = useState<number>(Number(product.cost) || 0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!quantity || quantity <= 0) return toast.error("Quantidade inválida");
    setBusy(true);
    const delta = kind === "in" ? Number(quantity) : kind === "out" ? -Number(quantity) : Number(quantity) - Number(product.stock_qty);
    const newQty = kind === "adjust" ? Number(quantity) : Number(product.stock_qty) + delta;
    const newCost = kind === "in" && unitCost > 0 ? unitCost : null;

    const { error: mErr } = await supabase.from("stock_movements").insert({
      barbershop_id: shopId,
      product_id: product.id,
      kind,
      quantity: kind === "adjust" ? Math.abs(delta) : Number(quantity),
      unit_cost: newCost,
      notes: notes.trim() || null,
      created_by: user?.id ?? null,
    });
    if (mErr) { setBusy(false); return toast.error(mErr.message); }

    const update: any = { stock_qty: newQty };
    if (newCost) update.cost = newCost;
    const { error: pErr } = await supabase.from("products").update(update).eq("id", product.id);
    setBusy(false);
    if (pErr) return toast.error(pErr.message);
    toast.success("Movimentação registrada");
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Movimentar — {product.name}</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label>Tipo</Label>
            <Select value={kind} onValueChange={(v)=>setKind(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in">Entrada (compra/reposição)</SelectItem>
                <SelectItem value="out">Saída (uso/perda)</SelectItem>
                <SelectItem value="adjust">Ajuste manual (novo total)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>{kind === "adjust" ? "Novo total" : "Quantidade"}</Label>
              <Input type="number" step="0.01" value={quantity} onChange={(e)=>setQuantity(Number(e.target.value))} />
            </div>
            {kind === "in" && (
              <div className="grid gap-1.5">
                <Label>Custo unitário</Label>
                <Input type="number" step="0.01" value={unitCost} onChange={(e)=>setUnitCost(Number(e.target.value))} />
              </div>
            )}
          </div>
          <div className="grid gap-1.5"><Label>Observações</Label><Textarea rows={2} value={notes} onChange={(e)=>setNotes(e.target.value)} /></div>
          <p className="text-xs text-muted-foreground">Estoque atual: {Number(product.stock_qty)} {product.unit}</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={busy}>{busy ? "Salvando…" : "Registrar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MovementsList({ shopId, products }: { shopId: string; products: Product[] }) {
  const { data } = useQuery({
    enabled: !!shopId,
    queryKey: ["stock-movements", shopId],
    queryFn: async () => {
      const { data } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("barbershop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as Movement[];
    },
  });

  const nameById = new Map(products.map((p) => [p.id, p.name]));

  if (!data?.length) {
    return <Card className="p-12 text-center text-sm text-muted-foreground">Sem movimentações registradas.</Card>;
  }

  return (
    <Card className="divide-y divide-border">
      {data.map((m) => {
        const iconCfg = m.kind === "in"
          ? { Icon: ArrowDownCircle, color: "text-emerald-500", label: "Entrada" }
          : m.kind === "out"
          ? { Icon: ArrowUpCircle, color: "text-destructive", label: "Saída" }
          : m.kind === "sale"
          ? { Icon: ArrowUpCircle, color: "text-destructive", label: "Venda" }
          : { Icon: Settings2, color: "text-accent", label: "Ajuste" };
        return (
          <div key={m.id} className="flex items-center gap-4 p-4">
            <iconCfg.Icon className={`h-5 w-5 ${iconCfg.color}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">{nameById.get(m.product_id) ?? "—"}</span>
                <Badge variant="outline" className="text-xs">{iconCfg.label}</Badge>
              </div>
              {m.notes && <div className="text-xs text-muted-foreground">{m.notes}</div>}
              <div className="text-xs text-muted-foreground">{format(new Date(m.created_at), "dd/MM/yyyy HH:mm")}</div>
            </div>
            <div className="text-right text-sm">
              <div className="font-semibold">{Number(m.quantity)}</div>
              {m.unit_cost != null && <div className="text-xs text-muted-foreground">{brl(Number(m.unit_cost))}</div>}
            </div>
          </div>
        );
      })}
    </Card>
  );
}
