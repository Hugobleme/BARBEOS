import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, u as useAuth, w as cashService, B as Button, C as Card, b as brl, q as TableSkeleton, E as EmptyState, a as Badge, L as Label, I as Input } from "./router-CQpyXUQj.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { f as format, K as endOfDay, C as startOfDay } from "../_libs/date-fns.mjs";
import { o as Calendar, d as Plus, ay as ArrowDownRight, aa as ArrowUpRight, z as DollarSign, a7 as Receipt, T as Trash2 } from "../_libs/lucide-react.mjs";
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
import "./client-BmPKwOzk.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-presence.mjs";
const METHOD_LABELS = {
  cash: "Dinheiro",
  pix: "PIX",
  credit: "Cartão de Crédito",
  debit: "Cartão de Débito",
  transfer: "Transferência",
  other: "Outro"
};
function CaixaPage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const {
    user
  } = useAuth();
  const [selectedDate, setSelectedDate] = reactExports.useState(format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
  const [createModalOpen, setCreateModalOpen] = reactExports.useState(false);
  const canManage = shop?.role === "owner" || shop?.role === "admin" || shop?.role === "receptionist";
  const dateRange = reactExports.useMemo(() => {
    const d = /* @__PURE__ */ new Date(selectedDate + "T12:00:00");
    return {
      start: startOfDay(d),
      end: endOfDay(d)
    };
  }, [selectedDate]);
  const {
    data: transactions,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["admin-cash-entries", shopId, selectedDate],
    enabled: !!shopId,
    queryFn: () => cashService.getCashEntries(shopId, dateRange.start, dateRange.end)
  });
  const totals = reactExports.useMemo(() => {
    let entradas = 0;
    let saidas = 0;
    (transactions ?? []).forEach((tx) => {
      const val = Number(tx.amount || 0);
      if (tx.kind === "sale" || tx.kind === "in" || tx.kind === "deposit") {
        entradas += val;
      } else if (tx.kind === "withdraw" || tx.kind === "expense" || tx.kind === "out" || tx.kind === "fee") {
        saidas += val;
      }
    });
    return {
      entradas,
      saidas,
      saldo: entradas - saidas,
      count: transactions?.length ?? 0
    };
  }, [transactions]);
  async function handleDeleteEntry(id) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm("Deseja realmente excluir este lançamento do caixa?")) return;
    try {
      await cashService.deleteCashEntry(id);
      toast.success("Lançamento excluído com sucesso!");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir lançamento.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Fluxo de Caixa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Controle de entradas, saídas, sangrias e movimentações diárias da barbearia." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border border-border bg-card/60 px-3 py-1.5 backdrop-blur", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: selectedDate, onChange: (e) => setSelectedDate(e.target.value), className: "bg-transparent text-xs font-mono text-foreground focus:outline-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setCreateModalOpen(true), className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Novo Lançamento"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Total de Entradas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center bg-emerald-500/10 text-emerald-500", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-emerald-500", children: brl(totals.entradas) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Vendas, serviços e suprimentos" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Total de Saídas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center bg-destructive/10 text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-destructive", children: brl(totals.saidas) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Despesas, sangrias e retiradas" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Saldo Líquido do Dia" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-2 font-serif text-3xl font-bold ${totals.saldo >= 0 ? "text-accent" : "text-destructive"}`, children: brl(totals.saldo) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-muted-foreground", children: [
          totals.count,
          " ",
          totals.count === 1 ? "lançamento registrado" : "lançamentos registrados"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex items-center justify-between border-b border-border/40 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-serif text-lg font-bold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-5 w-5 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          "Extrato de Movimentações (",
          format(/* @__PURE__ */ new Date(selectedDate + "T12:00:00"), "dd/MM/yyyy"),
          ")"
        ] })
      ] }) }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !transactions || transactions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Receipt, title: "Nenhum lançamento neste dia", description: "Clique em 'Novo Lançamento' para registrar entradas ou saídas avulsas." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Horário" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Tipo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Descrição" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Forma de Pagamento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Profissional / Cliente" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right", children: "Valor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: transactions.map((t) => {
          const isEntry = t.kind === "sale" || t.kind === "in" || t.kind === "deposit";
          const person = t.professional?.display_name || t.customer?.full_name || "—";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-card/60 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-mono text-xs text-muted-foreground", children: format(new Date(t.created_at), "HH:mm") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: isEntry ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase", children: "Entrada" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase", children: "Saída" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-medium text-foreground", children: t.description || "Lançamento de caixa" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs text-muted-foreground", children: METHOD_LABELS[t.method] || t.method }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs text-muted-foreground", children: person }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `py-3 text-right font-mono font-bold ${isEntry ? "text-emerald-500" : "text-destructive"}`, children: isEntry ? `+ ${brl(Number(t.amount))}` : `- ${brl(Number(t.amount))}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right", children: canManage && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDeleteEntry(t.id), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) }) })
          ] }, t.id);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CreateCashEntryModal, { open: createModalOpen, onOpenChange: setCreateModalOpen, shopId, userId: user?.id || "", onSuccess: () => {
      setCreateModalOpen(false);
      refetch();
    } })
  ] });
}
function CreateCashEntryModal({
  open,
  onOpenChange,
  shopId,
  userId,
  onSuccess
}) {
  const [description, setDescription] = reactExports.useState("");
  const [amountStr, setAmountStr] = reactExports.useState("");
  const [type, setType] = reactExports.useState("entrada");
  const [paymentMethod, setPaymentMethod] = reactExports.useState("cash");
  const [busy, setBusy] = reactExports.useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    const amountNum = Number(amountStr.replace(",", "."));
    if (!description.trim()) return toast.error("Informe a descrição do lançamento.");
    if (!amountNum || amountNum <= 0) return toast.error("Informe um valor válido.");
    setBusy(true);
    try {
      await cashService.createCashEntry({
        barbershop_id: shopId,
        description: description.trim(),
        amount: amountNum,
        type,
        payment_method: paymentMethod,
        created_by: userId
      });
      toast.success("Lançamento registrado com sucesso!");
      setDescription("");
      setAmountStr("");
      setType("entrada");
      setPaymentMethod("cash");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Erro ao registrar lançamento no caixa.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Novo Lançamento no Caixa" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Tipo de Movimentação *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: type, onValueChange: (v) => setType(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "entrada", children: "Entrada (Suprimento / Venda avulsa)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "saída", children: "Saída (Sangria / Pagamento / Despesa)" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "tx_desc", children: "Descrição do Lançamento *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "tx_desc", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Ex.: Troco inicial, Compra de café, Lâminas...", className: "rounded-none", required: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "tx_amount", children: "Valor (R$) *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "tx_amount", type: "number", step: "0.01", min: "0.01", value: amountStr, onChange: (e) => setAmountStr(e.target.value), placeholder: "0,00", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Método de Pagamento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: paymentMethod, onValueChange: (v) => setPaymentMethod(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cash", children: "Dinheiro" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pix", children: "PIX" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "credit", children: "Cartão de Crédito" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "debit", children: "Cartão de Débito" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "other", children: "Outro" })
            ] })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), className: "rounded-none", children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Salvando..." : "Confirmar Lançamento" })
    ] })
  ] }) }) });
}
export {
  CaixaPage as component
};
