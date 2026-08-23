import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery, b as useInfiniteQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { h as useCurrentShop, t as productService, B as Button, a as Badge, b as brl, L as Label, I as Input, T as Textarea, C as Card, u as useAuth } from "./router-CU6k9yR1.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BfBZegWa.mjs";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-whcht_wB.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-C30H0gvg.mjs";
import { S as Switch } from "./switch-DV87h8C5.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { u as useVirtualizer } from "../_libs/tanstack__react-virtual.mjs";
import { d as Plus, f as ShieldAlert, P as Package, H as Boxes, k as TriangleAlert, b as Search, ao as Settings2, af as Pencil, T as Trash2, ap as LoaderCircle, aq as CircleArrowDown, ar as CircleArrowUp } from "../_libs/lucide-react.mjs";
import { f as format } from "../_libs/date-fns.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/tanstack__virtual-core.mjs";
function Page() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const {
    data: products,
    refetch
  } = useQuery({
    enabled: !!shopId,
    queryKey: ["admin-products", shopId],
    queryFn: () => productService.getProducts(shopId)
  });
  const totals = reactExports.useMemo(() => {
    const list = products ?? [];
    const value = list.reduce((s, p) => s + Number(p.stock_qty) * Number(p.cost || 0), 0);
    const low = list.filter((p) => p.active && Number(p.stock_qty) <= Number(p.min_stock)).length;
    return {
      count: list.filter((p) => p.active).length,
      value,
      low
    };
  }, [products]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Estoque & Produtos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Catálogo de produtos, entradas, saídas e alertas de estoque mínimo." })
      ] }),
      canManage ? /* @__PURE__ */ jsxRuntimeExports.jsx(ProductDialog, { onSaved: refetch, shopId, trigger: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        " Novo produto"
      ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
        " Modo somente leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(KPI, { icon: Package, label: "Produtos ativos", value: totals.count }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KPI, { icon: Boxes, label: "Valor em estoque", value: brl(totals.value), hint: "Custo Total" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(KPI, { icon: TriangleAlert, label: "Itens em alerta", value: totals.low, hint: "Abaixo do estoque mín.", tone: totals.low > 0 ? "warn" : void 0 })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "catalogo", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "rounded-none border border-border/60 bg-card/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "catalogo", className: "rounded-none text-xs uppercase tracking-wider", children: "Catálogo de Produtos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TabsTrigger, { value: "movimentacoes", className: "rounded-none text-xs uppercase tracking-wider", children: "Histórico de Movimentações" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "catalogo", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ProductsList, { products: products ?? [], shopId, canManage, onChange: refetch }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "movimentacoes", className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MovementsList, { shopId, products: products ?? [] }) })
    ] })
  ] });
}
function KPI({
  icon: Icon,
  label,
  value,
  hint,
  tone
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `h-4 w-4 ${tone === "warn" ? "text-destructive" : "text-accent"}` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-2 font-serif text-3xl font-bold ${tone === "warn" ? "text-destructive" : ""}`, children: value }),
    hint && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[10px] text-muted-foreground", children: hint })
  ] });
}
function ProductsList({
  products,
  shopId,
  canManage,
  onChange
}) {
  const [q, setQ] = reactExports.useState("");
  const filtered = products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || (p.sku ?? "").toLowerCase().includes(q.toLowerCase()));
  async function remove(p) {
    if (!canManage) {
      toast.error("Permissão insuficiente para excluir produtos.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o produto "${p.name}"?`)) return;
    try {
      await productService.deleteProduct(p.id);
      toast.success("Produto excluído com sucesso!");
      onChange();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir produto.");
    }
  }
  if (!products.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "grid place-items-center gap-3 p-12 text-center rounded-none border border-border bg-card/40", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-10 w-10 text-muted-foreground/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold", children: "Nenhum produto cadastrado" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Cadastre os produtos de pomadas, óleos, lâminas e bebidas para controlar o estoque." })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar produto por nome ou SKU…", value: q, onChange: (e) => setQ(e.target.value), className: "h-11 rounded-none pl-9 text-xs" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3", children: filtered.map((p) => {
      const low = Number(p.stock_qty) <= Number(p.min_stock);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col gap-4 border border-border bg-card/50 p-5 rounded-none backdrop-blur-md sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-12 w-12 shrink-0 place-items-center rounded-none bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-6 w-6" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-lg font-bold text-foreground", children: p.name }),
              p.sku && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none text-[9px] uppercase border-border/60", children: p.sku }),
              low && p.active && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "destructive", className: "rounded-none gap-1 bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-bold uppercase", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-3 w-3" }),
                " Crítico"
              ] })
            ] }),
            p.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-1 text-xs text-muted-foreground", children: p.description })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-6 border-y border-border/20 py-3 sm:border-none sm:py-0 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Venda" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-accent", children: brl(Number(p.price)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Custo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-foreground", children: brl(Number(p.cost || 0)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Estoque" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `font-mono font-bold ${low ? "text-destructive" : "text-foreground"}`, children: [
              Number(p.stock_qty),
              " ",
              p.unit
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 self-end sm:self-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MovementDialog, { product: p, shopId, onSaved: onChange, trigger: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", className: "rounded-none text-xs font-bold uppercase", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Ajustar"
          ] }) }),
          canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ProductDialog, { product: p, shopId, onSaved: onChange, trigger: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "h-8 w-8 rounded-none text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => remove(p), className: "h-8 w-8 rounded-none text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] })
        ] })
      ] }, p.id);
    }) })
  ] });
}
function ProductDialog({
  product,
  shopId,
  onSaved,
  trigger
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    name: product?.name ?? "",
    sku: product?.sku ?? "",
    description: product?.description ?? "",
    price: product?.price ?? 0,
    cost: product?.cost ?? 0,
    stock_qty: product?.stock_qty ?? 0,
    min_stock: product?.min_stock ?? 0,
    unit: product?.unit ?? "un",
    active: product?.active ?? true
  });
  const [busy, setBusy] = reactExports.useState(false);
  async function handleSave(e) {
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
          active: form.active
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
          active: form.active
        });
        toast.success("Produto cadastrado com sucesso!");
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar produto.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: product ? "Editar produto" : "Novo produto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome do produto *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => setForm({
            ...form,
            name: e.target.value
          }), placeholder: "Ex: Pomada Modeladora Efeito Matte", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "SKU / Código" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.sku, onChange: (e) => setForm({
              ...form,
              sku: e.target.value
            }), placeholder: "POM-MATTE-01", className: "rounded-none" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Unidade de medida" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.unit, onChange: (e) => setForm({
              ...form,
              unit: e.target.value
            }), placeholder: "un, ml, g…", className: "rounded-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Preço de venda (R$) *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.01", min: 0, value: form.price, onChange: (e) => setForm({
              ...form,
              price: Number(e.target.value)
            }), className: "rounded-none", required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Custo de compra (R$)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "0.01", min: 0, value: form.cost, onChange: (e) => setForm({
              ...form,
              cost: Number(e.target.value)
            }), className: "rounded-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Estoque atual *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "1", min: 0, value: form.stock_qty, onChange: (e) => setForm({
              ...form,
              stock_qty: Number(e.target.value)
            }), className: "rounded-none", required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Estoque mínimo para alerta" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "1", min: 0, value: form.min_stock, onChange: (e) => setForm({
              ...form,
              min_stock: Number(e.target.value)
            }), className: "rounded-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Descrição" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: form.description, onChange: (e) => setForm({
            ...form,
            description: e.target.value
          }), placeholder: "Detalhes, modo de uso e características do produto...", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-border/40 pt-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "prod_active", className: "cursor-pointer", children: "Produto ativo no catálogo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "prod_active", checked: form.active, onCheckedChange: (v) => setForm({
            ...form,
            active: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Salvando…" : "Salvar produto" })
      ] })
    ] }) })
  ] });
}
function MovementDialog({
  product,
  shopId,
  onSaved,
  trigger
}) {
  const {
    user
  } = useAuth();
  const [open, setOpen] = reactExports.useState(false);
  const [kind, setKind] = reactExports.useState("in");
  const [quantity, setQuantity] = reactExports.useState(1);
  const [notes, setNotes] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  async function handleSave(e) {
    e.preventDefault();
    if (!quantity || quantity <= 0) return toast.error("A quantidade deve ser maior que zero.");
    setBusy(true);
    try {
      const delta = kind === "in" ? Number(quantity) : kind === "out" ? -Number(quantity) : Number(quantity) - Number(product.stock_qty);
      const reasonStr = notes.trim() || (kind === "in" ? "Entrada / Reposição" : kind === "out" ? "Saída / Uso" : "Ajuste de inventário");
      await productService.updateStock(product.id, delta, reasonStr, user?.id);
      toast.success("Movimentação de estoque registrada com sucesso!");
      setOpen(false);
      onSaved();
    } catch (err) {
      toast.error(err.message || "Erro ao movimentar estoque.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "font-serif text-xl", children: [
        "Ajustar Estoque — ",
        product.name
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Tipo de Movimentação" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: kind, onValueChange: (v) => setKind(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "in", children: "Entrada (+ estoque)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "out", children: "Saída / Perda (- estoque)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "adjust", children: "Ajuste de inventário (novo saldo)" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: kind === "adjust" ? "Novo Saldo Total" : "Quantidade a Movimentar" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", step: "1", min: 1, value: quantity, onChange: (e) => setQuantity(Number(e.target.value)), className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Motivo / Observações" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { rows: 2, value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Ex: Compra de lote #4829, frasco quebrado, etc.", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Estoque atual: ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono font-bold text-foreground", children: [
            Number(product.stock_qty),
            " ",
            product.unit
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Registrando…" : "Confirmar Ajuste" })
      ] })
    ] }) })
  ] });
}
function MovementsList({
  shopId,
  products
}) {
  const parentRef = reactExports.useRef(null);
  const [kindFilter, setKindFilter] = reactExports.useState("all");
  const [productFilter, setProductFilter] = reactExports.useState("all");
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading
  } = useInfiniteQuery({
    queryKey: ["stock-movements", shopId, kindFilter, productFilter],
    enabled: !!shopId,
    initialPageParam: 0,
    queryFn: async ({
      pageParam = 0
    }) => {
      let query = supabase.from("stock_movements").select("*").eq("barbershop_id", shopId).order("created_at", {
        ascending: false
      }).range(pageParam * 20, (pageParam + 1) * 20 - 1);
      if (kindFilter !== "all") {
        query = query.eq("kind", kindFilter);
      }
      if (productFilter !== "all") {
        query = query.eq("product_id", productFilter);
      }
      const {
        data: data2
      } = await query;
      return {
        data: data2 ?? [],
        nextPage: (data2?.length ?? 0) === 20 ? pageParam + 1 : void 0
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage
  });
  const allRows = data?.pages.flatMap((page) => page.data) ?? [];
  const nameById = new Map(products.map((p) => [p.id, p.name]));
  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  });
  reactExports.useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (lastItem && lastItem.index >= allRows.length - 1 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, allRows.length, isFetchingNextPage, rowVirtualizer.getVirtualItems()]);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "h-20 animate-pulse rounded-none border-border bg-muted/30" }, i)) });
  }
  if (allRows.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-12 text-center text-xs text-muted-foreground rounded-none border border-border", children: "Sem movimentações registradas." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 border border-border/40 bg-card/50 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-[180px] flex-1 flex-col gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Tipo de Movimento" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: kindFilter, onValueChange: setKindFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Filtrar por tipo" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos os tipos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "in", children: "Entradas (+)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "out", children: "Saídas (-)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "sale", children: "Vendas PDV (-)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "adjust", children: "Ajustes" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-[180px] flex-1 flex-col gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Filtrar por Produto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: productFilter, onValueChange: setProductFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Filtrar por produto" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos os produtos" }),
            products.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.name }, p.id))
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-none border border-border bg-card/50 shadow-xl overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: parentRef, className: "h-[480px] overflow-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
      height: `${rowVirtualizer.getTotalSize()}px`,
      width: "100%",
      position: "relative"
    }, children: rowVirtualizer.getVirtualItems().map((virtualRow) => {
      const isLoaderRow = virtualRow.index > allRows.length - 1;
      const m = allRows[virtualRow.index];
      if (isLoaderRow) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center py-4", style: {
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: `${virtualRow.size}px`,
          transform: `translateY(${virtualRow.start}px)`
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin text-muted-foreground" }) }, "loader");
      }
      const iconCfg = m.kind === "in" ? {
        Icon: CircleArrowDown,
        color: "text-emerald-500",
        label: "Entrada",
        bg: "bg-emerald-500/10"
      } : m.kind === "out" || m.kind === "sale" ? {
        Icon: CircleArrowUp,
        color: "text-destructive",
        label: m.kind === "out" ? "Saída" : "Venda",
        bg: "bg-destructive/10"
      } : {
        Icon: Settings2,
        color: "text-accent",
        label: "Ajuste",
        bg: "bg-accent/10"
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 p-4 border-b border-border/20 last:border-0 hover:bg-card/80", style: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `grid h-9 w-9 shrink-0 place-items-center rounded-none ${iconCfg.bg} ${iconCfg.color}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(iconCfg.Icon, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1 space-y-0.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-xs text-foreground", children: nameById.get(m.product_id) ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `rounded-none text-[8px] font-bold uppercase tracking-widest ${iconCfg.bg} ${iconCfg.color} border-transparent`, children: iconCfg.label })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-0.5 text-[10px] text-muted-foreground", children: [
            m.notes && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-1", children: m.notes }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: format(new Date(m.created_at), "dd/MM/yyyy · HH:mm") })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-mono font-bold text-sm text-foreground", children: [
            m.kind === "in" ? "+" : "-",
            Number(m.quantity)
          ] }),
          m.unit_cost != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
            brl(Number(m.unit_cost)),
            " un."
          ] })
        ] })
      ] }, m.id);
    }) }) }) })
  ] });
}
export {
  Page as component
};
