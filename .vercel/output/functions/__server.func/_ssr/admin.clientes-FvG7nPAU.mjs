import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, r as customerService, I as Input, a as Badge, b as brl, B as Button, q as TableSkeleton, E as EmptyState, C as Card } from "./router-CQpyXUQj.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription } from "./dialog-iYf2tXSL.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { b as Search, a4 as Phone, ac as Mail, au as History, o as Calendar, av as ShieldCheck, aw as ShieldOff, U as Users } from "../_libs/lucide-react.mjs";
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
function Page() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const [search, setSearch] = reactExports.useState("");
  const [filterBlocked, setFilterBlocked] = reactExports.useState("all");
  const [selectedCustomer, setSelectedCustomer] = reactExports.useState(null);
  const {
    data: result,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["admin-customers", shopId, search, filterBlocked],
    enabled: !!shopId,
    queryFn: () => customerService.getCustomers(shopId, {
      q: search || void 0,
      blocked: filterBlocked === "blocked" ? true : filterBlocked === "active" ? false : void 0,
      limit: 100
    })
  });
  const customers = result?.data ?? [];
  const {
    data: customerHistory,
    isLoading: loadingHistory
  } = useQuery({
    queryKey: ["customer-history", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id,
    queryFn: () => customerService.getCustomerHistory(selectedCustomer.id)
  });
  const {
    data: customerStats
  } = useQuery({
    queryKey: ["customer-stats", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id,
    queryFn: () => customerService.getCustomerStats(selectedCustomer.id)
  });
  async function handleToggleBlock(c, e) {
    if (!canManage) {
      toast.error("Permissão insuficiente para alterar status de clientes.");
      return;
    }
    try {
      if (c.blocked) {
        await customerService.unblockCustomer(c.id);
        toast.success(`Cliente "${c.full_name}" desbloqueado com sucesso!`);
      } else {
        await customerService.blockCustomer(c.id);
        toast.warning(`Cliente "${c.full_name}" foi bloqueado.`);
      }
      refetch();
      if (selectedCustomer?.id === c.id) {
        setSelectedCustomer((prev) => prev ? {
          ...prev,
          blocked: !prev.blocked
        } : null);
      }
    } catch (err) {
      toast.error(err.message || "Erro ao atualizar cliente.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Clientes" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Base de clientes e histórico detalhado de atendimentos." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4 border border-border/60 bg-card/40 p-4 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[280px] flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-11 rounded-none border-border bg-background/50 pl-9 text-sm", placeholder: "Buscar por nome, telefone ou e-mail...", value: search, onChange: (e) => setSearch(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[180px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterBlocked, onValueChange: setFilterBlocked, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-11 rounded-none border-border bg-background/50 text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Status" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos os clientes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "active", children: "Apenas ativos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "blocked", children: "Apenas bloqueados" })
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!selectedCustomer, onOpenChange: (open) => !open && setSelectedCustomer(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "max-w-2xl rounded-none border-border p-6", children: selectedCustomer && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl font-bold", children: selectedCustomer.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground", children: [
            selectedCustomer.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5 text-accent" }),
              " ",
              selectedCustomer.phone
            ] }),
            selectedCustomer.email && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3.5 w-3.5 text-accent" }),
              " ",
              selectedCustomer.email
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `rounded-none font-bold uppercase text-[10px] ${selectedCustomer.blocked ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"}`, children: selectedCustomer.blocked ? "Bloqueado" : "Ativo" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 border-y border-border/40 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Total Gasto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-xl font-bold text-accent", children: brl(customerStats?.totalSpent ?? 0) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Atendimentos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-xl font-bold text-foreground", children: customerStats?.totalAppointments ?? 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Última Visita" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-foreground", children: customerStats?.lastVisit ? format(new Date(customerStats.lastVisit), "dd/MM/yyyy", {
            locale: ptBR
          }) : "Nunca" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "h-4 w-4 text-accent" }),
          " Histórico de Agendamentos"
        ] }),
        loadingHistory ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-8 text-center text-xs text-muted-foreground animate-pulse", children: "Carregando histórico..." }) : !customerHistory || customerHistory.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-border/40 p-8 text-center text-xs text-muted-foreground", children: "Nenhum agendamento registrado para este cliente." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[300px] divide-y divide-border/20 overflow-y-auto border border-border/40", children: customerHistory.map((appt) => {
          const serviceNames = (appt.services ?? []).map((s) => s.service?.name).filter(Boolean).join(", ") || "Atendimento";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-4 text-xs hover:bg-card/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground", children: serviceNames }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
                  format(new Date(appt.scheduled_start), "dd/MM/yyyy · HH:mm", {
                    locale: ptBR
                  })
                ] }),
                appt.professional?.display_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "Profissional: ",
                  appt.professional.display_name
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-accent", children: brl(Number(appt.total_amount || 0)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "mt-1 rounded-none text-[9px] uppercase border-border/40", children: appt.status })
            ] })
          ] }, appt.id);
        }) })
      ] }),
      canManage && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end border-t border-border/40 pt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: () => handleToggleBlock(selectedCustomer), className: "rounded-none text-xs", children: selectedCustomer.blocked ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mr-1.5 h-3.5 w-3.5 text-emerald-500" }),
        " Desbloquear cliente"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldOff, { className: "mr-1.5 h-3.5 w-3.5 text-destructive" }),
        " Bloquear agendamentos"
      ] }) }) })
    ] }) }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : customers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Users, title: search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado", description: search ? "Tente outro termo de busca." : "Os clientes são registrados automaticamente ao realizar agendamentos ou compras." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Nome do Cliente" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Telefone" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "E-mail" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Faltas (No-Show)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-right", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: customers.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { onClick: () => setSelectedCustomer(c), className: "cursor-pointer transition-colors hover:bg-card/80", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-foreground", children: c.full_name }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: c.phone || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: c.email || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: Number(c.no_show_count ?? 0) > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold", children: [
          c.no_show_count,
          " ",
          Number(c.no_show_count) === 1 ? "falta" : "faltas"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/60", children: "0" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: c.blocked ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase", children: "Bloqueado" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase", children: "Ativo" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "ghost", onClick: (e) => {
          e.stopPropagation();
          setSelectedCustomer(c);
        }, className: "rounded-none text-xs hover:text-accent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(History, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Ver histórico"
        ] }) })
      ] }, c.id)) })
    ] }) }) })
  ] });
}
export {
  Page as component
};
