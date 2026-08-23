import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, B as Button, a as Badge, L as Label, I as Input, q as TableSkeleton, E as EmptyState, C as Card, b as brl } from "./router-CU6k9yR1.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-whcht_wB.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-C30H0gvg.mjs";
import { S as Switch } from "./switch-DV87h8C5.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { d as Plus, f as ShieldAlert, e as TicketPercent, af as Pencil, T as Trash2 } from "../_libs/lucide-react.mjs";
import { f as format, H as ptBR } from "../_libs/date-fns.mjs";
import "../_libs/tanstack__query-core.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
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
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
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
const couponService = {
  /**
   * Lista todos os cupons de uma barbearia
   */
  async getCoupons(barbershopId) {
    const { data, error } = await supabase.from("coupons").select("*").eq("barbershop_id", barbershopId).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Cria um novo cupom de desconto
   */
  async createCoupon(data) {
    const isPercent = data.discount_percent !== void 0;
    const kind = data.kind || (isPercent ? "percent" : "fixed");
    const value = data.value ?? (data.discount_percent ?? (data.discount_cents ? data.discount_cents / 100 : 0));
    const { data: coupon, error } = await supabase.from("coupons").insert({
      barbershop_id: data.barbershop_id,
      code: data.code.toUpperCase().trim(),
      kind,
      value,
      valid_from: data.valid_from || (/* @__PURE__ */ new Date()).toISOString(),
      valid_until: data.valid_until || null,
      usage_limit: data.usage_limit || null,
      min_amount: data.min_amount ?? 0,
      active: true
    }).select().single();
    if (error) throw error;
    return coupon;
  },
  /**
   * Valida se um cupom pode ser aplicado a uma compra
   */
  async validateCoupon(code, barbershopId, orderAmount = 0) {
    const cleanCode = code.toUpperCase().trim();
    const { data: coupon, error } = await supabase.from("coupons").select("*").eq("barbershop_id", barbershopId).eq("code", cleanCode).eq("active", true).maybeSingle();
    if (error || !coupon) {
      throw new Error("Cupom inválido ou não encontrado.");
    }
    const now = /* @__PURE__ */ new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
      throw new Error("Este cupom ainda não está ativo.");
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
      throw new Error("Este cupom expirou.");
    }
    if (coupon.usage_limit && (coupon.used_count || 0) >= coupon.usage_limit) {
      throw new Error("Limite de utilização deste cupom foi atingido.");
    }
    if (coupon.min_amount && orderAmount < coupon.min_amount) {
      throw new Error(`Valor mínimo para utilizar este cupom: R$ ${coupon.min_amount.toFixed(2)}.`);
    }
    let discount = 0;
    if (coupon.kind === "percent") {
      discount = orderAmount * Number(coupon.value) / 100;
    } else {
      discount = Number(coupon.value);
    }
    return {
      valid: true,
      coupon,
      discount: Math.min(discount, orderAmount)
    };
  },
  /**
   * Incrementa a contagem de uso do cupom
   */
  async useCoupon(code, barbershopId) {
    let query = supabase.from("coupons").select("id, used_count").eq("code", code.toUpperCase().trim());
    if (barbershopId) {
      query = query.eq("barbershop_id", barbershopId);
    }
    const { data: coupon, error } = await query.maybeSingle();
    if (error || !coupon) return;
    const nextCount = (coupon.used_count || 0) + 1;
    await supabase.from("coupons").update({ used_count: nextCount }).eq("id", coupon.id);
  },
  /**
   * Atualiza um cupom de desconto existente
   */
  async updateCoupon(id, data) {
    const { data: updated, error } = await supabase.from("coupons").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  /**
   * Exclui ou desativa um cupom
   */
  async deleteCoupon(id) {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) throw error;
  }
};
function Page() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const {
    data: coupons,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["admin-coupons", shopId],
    enabled: !!shopId,
    queryFn: () => couponService.getCoupons(shopId)
  });
  const [open, setOpen] = reactExports.useState(false);
  const [editingCoupon, setEditingCoupon] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    code: "",
    kind: "percent",
    value: 10,
    min_amount: 0,
    valid_until: "",
    usage_limit: "",
    active: true
  });
  function openNew() {
    if (!canManage) {
      toast.error("Permissão insuficiente para criar cupons.");
      return;
    }
    setEditingCoupon(null);
    setForm({
      code: "",
      kind: "percent",
      value: 10,
      min_amount: 0,
      valid_until: "",
      usage_limit: "",
      active: true
    });
    setOpen(true);
  }
  function openEdit(c) {
    if (!canManage) {
      toast.error("Permissão insuficiente para editar cupons.");
      return;
    }
    setEditingCoupon(c);
    setForm({
      code: c.code,
      kind: c.kind === "fixed" ? "fixed" : "percent",
      value: Number(c.value),
      min_amount: Number(c.min_amount || 0),
      valid_until: c.valid_until ? c.valid_until.split("T")[0] : "",
      usage_limit: c.usage_limit ? String(c.usage_limit) : "",
      active: c.active
    });
    setOpen(true);
  }
  async function handleSave(e) {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("O código do cupom é obrigatório.");
    if (form.value <= 0) return toast.error("O valor do desconto deve ser maior que 0.");
    if (form.kind === "percent" && form.value > 100) return toast.error("O percentual de desconto não pode exceder 100%.");
    setBusy(true);
    try {
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, {
          code: form.code.toUpperCase().trim(),
          kind: form.kind,
          value: Number(form.value),
          min_amount: Number(form.min_amount) || 0,
          valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
          usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
          active: form.active
        });
        toast.success("Cupom atualizado com sucesso!");
      } else {
        await couponService.createCoupon({
          barbershop_id: shopId,
          code: form.code.toUpperCase().trim(),
          kind: form.kind,
          value: Number(form.value),
          min_amount: Number(form.min_amount) || 0,
          valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
          usage_limit: form.usage_limit ? Number(form.usage_limit) : null
        });
        toast.success("Cupom criado com sucesso!");
      }
      setOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar cupom.");
    } finally {
      setBusy(false);
    }
  }
  async function handleDelete(c) {
    if (!canManage) {
      toast.error("Permissão insuficiente para excluir cupons.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o cupom "${c.code}"?`)) return;
    try {
      await couponService.deleteCoupon(c.id);
      toast.success("Cupom excluído com sucesso!");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir cupom.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Cupons de Desconto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Crie campanhas promocionais para uso no PDV e agendamento online." })
      ] }),
      canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        " Novo cupom"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
        " Modo somente leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: editingCoupon ? "Editar cupom" : "Novo cupom de desconto" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "coupon_code", children: "Código do Cupom *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "coupon_code", value: form.code, onChange: (e) => setForm({
            ...form,
            code: e.target.value.toUpperCase()
          }), placeholder: "EX: PROMO10, CLIENTEVIP", className: "rounded-none font-mono uppercase font-bold", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Tipo de Desconto" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: form.kind, onValueChange: (v) => setForm({
              ...form,
              kind: v
            }), children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "percent", children: "Porcentagem (%)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "fixed", children: "Valor Fixo (R$)" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "coupon_val", children: form.kind === "percent" ? "Desconto (%) *" : "Desconto (R$) *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "coupon_val", type: "number", step: form.kind === "percent" ? "1" : "0.01", min: 1, max: form.kind === "percent" ? 100 : void 0, value: form.value, onChange: (e) => setForm({
              ...form,
              value: Number(e.target.value)
            }), className: "rounded-none font-bold", required: true })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "coupon_valid", children: "Válido até (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "coupon_valid", type: "date", value: form.valid_until, onChange: (e) => setForm({
              ...form,
              valid_until: e.target.value
            }), className: "rounded-none text-xs" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "coupon_limit", children: "Limite de Usos (opcional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "coupon_limit", type: "number", min: 1, value: form.usage_limit, onChange: (e) => setForm({
              ...form,
              usage_limit: e.target.value
            }), placeholder: "Sem limite", className: "rounded-none" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "coupon_min", children: "Valor mínimo do pedido (R$)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "coupon_min", type: "number", step: "0.01", min: 0, value: form.min_amount, onChange: (e) => setForm({
            ...form,
            min_amount: Number(e.target.value)
          }), placeholder: "0.00", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "coupon_active", className: "cursor-pointer", children: "Cupom ativo para uso" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "coupon_active", checked: form.active, onCheckedChange: (v) => setForm({
            ...form,
            active: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: busy ? "Salvando..." : "Salvar cupom" })
      ] })
    ] }) }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !coupons || coupons.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: TicketPercent, title: "Nenhum cupom cadastrado", description: "Crie o primeiro cupom promocional para oferecer descontos aos seus clientes.", action: canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
      " Novo cupom"
    ] }) : void 0 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Código" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Tipo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Desconto" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Validade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Utilizações" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-right", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: coupons.map((c) => {
        const isExpired = c.valid_until && new Date(c.valid_until) < /* @__PURE__ */ new Date();
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "transition-colors hover:bg-card/80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-base font-bold text-accent", children: c.code }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none text-[10px] uppercase border-border/60", children: c.kind === "percent" ? "Percentual" : "Valor fixo" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-bold text-foreground", children: c.kind === "percent" ? `${c.value}%` : brl(Number(c.value)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: c.valid_until ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: isExpired ? "text-destructive font-bold" : "", children: [
            format(new Date(c.valid_until), "dd/MM/yyyy", {
              locale: ptBR
            }),
            isExpired && " (Expirado)"
          ] }) : "Sem validade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 text-xs font-mono", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: c.used_count || 0 }),
            c.usage_limit ? ` / ${c.usage_limit}` : " usos"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: c.active && !isExpired ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase", children: "Ativo" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase", children: "Inativo" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-right", children: canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => openEdit(c), className: "h-8 w-8 rounded-none text-muted-foreground hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "h-3.5 w-3.5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", onClick: () => handleDelete(c), className: "h-8 w-8 rounded-none text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/40", children: "—" }) })
        ] }, c.id);
      }) })
    ] }) }) })
  ] });
}
export {
  Page as component
};
