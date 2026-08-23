import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, u as useAuth, w as cashService, B as Button, a as Badge, C as Card, b as brl, q as TableSkeleton, E as EmptyState, L as Label, I as Input } from "./router-CU6k9yR1.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-C30H0gvg.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-whcht_wB.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as subDays, f as format, H as ptBR } from "../_libs/date-fns.mjs";
import { ax as Send, W as Wallet, i as Clock, av as ShieldCheck, a7 as Receipt } from "../_libs/lucide-react.mjs";
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
import "./client-BKVQGVvU.mjs";
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
function CarteiraPage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const {
    user
  } = useAuth();
  const [withdrawModalOpen, setWithdrawModalOpen] = reactExports.useState(false);
  const isOwner = shop?.role === "owner";
  const canWithdraw = isOwner;
  const {
    data: walletSummary,
    isLoading: loadingSummary,
    refetch: refetchSummary
  } = useQuery({
    queryKey: ["admin-wallet-summary", shopId],
    enabled: !!shopId,
    queryFn: () => cashService.getWalletSummary(shopId)
  });
  const {
    data: recentTransactions,
    isLoading: loadingTransactions,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ["admin-wallet-recent-txs", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const now = /* @__PURE__ */ new Date();
      const past30Days = subDays(now, 30);
      const all = await cashService.getCashEntries(shopId, past30Days, now);
      return all.slice(0, 10);
    }
  });
  const balance = walletSummary?.balance ?? 0;
  const pendingReceivables = walletSummary?.pendingReceivables ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Carteira & Saldo da Barbearia" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Acompanhe o saldo consolidado, recebíveis futuros e realize retiradas de lucros." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: canWithdraw ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setWithdrawModalOpen(true), className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "mr-1.5 h-3.5 w-3.5" }),
        " Retirar Saldo"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none text-xs text-muted-foreground", children: "Apenas sócios e donos podem realizar retiradas" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Saldo Disponível" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center bg-accent/15 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-3 font-serif text-4xl font-bold ${balance >= 0 ? "text-accent" : "text-destructive"}`, children: brl(balance) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Líquido acumulado de vendas e despesas" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Recebíveis Futuros" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center bg-blue-500/15 text-blue-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-serif text-4xl font-bold text-foreground", children: brl(pendingReceivables) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Agendamentos marcados pendentes de atendimento" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Histórico de Lançamentos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-8 w-8 place-items-center bg-emerald-500/15 text-emerald-400", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-4 w-4" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-serif text-4xl font-bold text-foreground", children: walletSummary?.transactionsCount ?? 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Transações registradas no caixa" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex items-center justify-between border-b border-border/40 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-serif text-lg font-bold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "h-5 w-5 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Últimas Movimentações da Carteira" })
      ] }) }),
      loadingTransactions ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !recentTransactions || recentTransactions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Receipt, title: "Nenhuma movimentação recente", description: "As movimentações de vendas e retiradas aparecerão aqui." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Data / Hora" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Tipo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Descrição" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Forma de Pagamento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right", children: "Valor" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: recentTransactions.map((tx) => {
          const isEntry = tx.kind === "sale" || tx.kind === "in" || tx.kind === "deposit";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-card/60 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-mono text-xs text-muted-foreground", children: format(new Date(tx.created_at), "dd/MM/yyyy · HH:mm", {
              locale: ptBR
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: isEntry ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase", children: "Entrada" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase", children: "Retirada / Saída" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-medium text-foreground", children: tx.description || "Transação" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs text-muted-foreground", children: METHOD_LABELS[tx.method] || tx.method }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `py-3 text-right font-mono font-bold ${isEntry ? "text-emerald-500" : "text-destructive"}`, children: isEntry ? `+ ${brl(Number(tx.amount))}` : `- ${brl(Number(tx.amount))}` })
          ] }, tx.id);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(WithdrawModal, { open: withdrawModalOpen, onOpenChange: setWithdrawModalOpen, shopId, currentBalance: balance, userId: user?.id || "", onSuccess: () => {
      setWithdrawModalOpen(false);
      refetchSummary();
      refetchTransactions();
    } })
  ] });
}
function WithdrawModal({
  open,
  onOpenChange,
  shopId,
  currentBalance,
  userId,
  onSuccess
}) {
  const [amountStr, setAmountStr] = reactExports.useState("");
  const [description, setDescription] = reactExports.useState("");
  const [method, setMethod] = reactExports.useState("pix");
  const [busy, setBusy] = reactExports.useState(false);
  async function handleWithdraw(e) {
    e.preventDefault();
    const amountNum = Number(amountStr.replace(",", "."));
    if (!amountNum || amountNum <= 0) return toast.error("Informe um valor de retirada válido.");
    if (amountNum > currentBalance) return toast.error("O valor de retirada excede o saldo disponível na carteira.");
    setBusy(true);
    try {
      await cashService.createCashEntry({
        barbershop_id: shopId,
        description: description.trim() || "Retirada de lucros / Sangria de carteira",
        amount: amountNum,
        type: "saída",
        payment_method: method,
        created_by: userId
      });
      toast.success("Retirada registrada com sucesso no fluxo financeiro!");
      setAmountStr("");
      setDescription("");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Erro ao registrar retirada.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleWithdraw, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Retirar Saldo da Barbearia" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border bg-card/60 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold text-muted-foreground", children: "Saldo Disponível:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-xl font-bold text-accent", children: brl(currentBalance) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "w_amount", children: "Valor a Retirar (R$) *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "w_amount", type: "number", step: "0.01", min: "0.01", max: currentBalance > 0 ? currentBalance : 0.01, value: amountStr, onChange: (e) => setAmountStr(e.target.value), placeholder: "0,00", className: "rounded-none", required: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Forma de Saída" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: method, onValueChange: (v) => setMethod(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pix", children: "Transferência PIX" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "transfer", children: "TED / DOC" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cash", children: "Dinheiro em Espécie" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "w_desc", children: "Motivo / Descrição" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "w_desc", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Ex.: Distribuição de lucros sócios, Transferência para conta PJ", className: "rounded-none" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), className: "rounded-none", children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Processando..." : "Confirmar Retirada" })
    ] })
  ] }) }) });
}
export {
  CarteiraPage as component
};
