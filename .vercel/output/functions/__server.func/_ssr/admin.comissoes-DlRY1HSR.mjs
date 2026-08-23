import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, d as barbershopService, a as Badge, C as Card, b as brl, q as TableSkeleton, E as EmptyState, B as Button } from "./router-CQpyXUQj.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { f as ShieldAlert, E as Coins, at as CircleCheckBig, W as Wallet } from "../_libs/lucide-react.mjs";
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
const commissionService = {
  /**
   * Obtém comissões de uma barbearia filtradas por mês e ano
   */
  async getCommissions(barbershopId, month, year) {
    let query = supabase.from("commissions").select(`
        *,
        professional:professionals(display_name),
        appointment:appointments(
          scheduled_start,
          total_amount,
          customer:customers(full_name)
        )
      `).eq("barbershop_id", barbershopId).order("created_at", { ascending: false });
    if (month && year) {
      const startDate = new Date(year, month - 1, 1).toISOString();
      const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
      query = query.gte("created_at", startDate).lte("created_at", endDate);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Calcula o valor da comissão com base no agendamento e regra do profissional
   */
  async calculateCommission(appointmentId) {
    const { data: appt, error } = await supabase.from("appointments").select(`
        id,
        barbershop_id,
        total_amount,
        professional_id,
        professional:professionals(
          id,
          display_name,
          commission_rule
        )
      `).eq("id", appointmentId).single();
    if (error || !appt) throw error || new Error("Agendamento não encontrado.");
    const rule = appt.professional?.commission_rule ?? {};
    const percentage = Number(rule.percentage ?? 0);
    const rate = percentage / 100;
    const baseAmount = Number(appt.total_amount || 0);
    const commissionAmount = baseAmount * rate;
    return {
      barbershop_id: appt.barbershop_id,
      professional_id: appt.professional_id,
      appointment_id: appt.id,
      base_amount: baseAmount,
      rate,
      amount: commissionAmount
    };
  },
  /**
   * Registra uma nova comissão
   */
  async createCommission(data) {
    const { data: comm, error } = await supabase.from("commissions").insert({
      barbershop_id: data.barbershop_id,
      professional_id: data.professional_id,
      appointment_id: data.appointment_id || null,
      transaction_id: data.transaction_id || null,
      base_amount: data.base_amount,
      rate: data.rate,
      amount: data.amount,
      status: "pending"
    }).select().single();
    if (error) throw error;
    return comm;
  },
  /**
   * Marca uma comissão como paga
   */
  async payCommission(id) {
    const { data, error } = await supabase.from("commissions").update({
      status: "paid",
      paid_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", id).select().single();
    if (error) throw error;
    return data;
  }
};
const MONTHS = [{
  value: "1",
  label: "Janeiro"
}, {
  value: "2",
  label: "Fevereiro"
}, {
  value: "3",
  label: "Março"
}, {
  value: "4",
  label: "Abril"
}, {
  value: "5",
  label: "Maio"
}, {
  value: "6",
  label: "Junho"
}, {
  value: "7",
  label: "Julho"
}, {
  value: "8",
  label: "Agosto"
}, {
  value: "9",
  label: "Setembro"
}, {
  value: "10",
  label: "Outubro"
}, {
  value: "11",
  label: "Novembro"
}, {
  value: "12",
  label: "Dezembro"
}];
function ComissoesPage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const now = /* @__PURE__ */ new Date();
  const [selectedMonth, setSelectedMonth] = reactExports.useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = reactExports.useState(String(now.getFullYear()));
  const [selectedPro, setSelectedPro] = reactExports.useState("all");
  const [selectedStatus, setSelectedStatus] = reactExports.useState("all");
  const [payingId, setPayingId] = reactExports.useState(null);
  const {
    data: pros
  } = useQuery({
    queryKey: ["admin-pros-list", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId)
  });
  const {
    data: commissions,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["admin-commissions", shopId, selectedMonth, selectedYear],
    enabled: !!shopId,
    queryFn: () => commissionService.getCommissions(shopId, Number(selectedMonth), Number(selectedYear))
  });
  const filteredCommissions = (commissions ?? []).filter((c) => {
    if (selectedPro !== "all" && c.professional_id !== selectedPro) return false;
    if (selectedStatus !== "all" && c.status !== selectedStatus) return false;
    return true;
  });
  const totalPending = filteredCommissions.filter((c) => c.status === "pending").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalPaid = filteredCommissions.filter((c) => c.status === "paid").reduce((sum, c) => sum + Number(c.amount || 0), 0);
  const totalAll = filteredCommissions.reduce((sum, c) => sum + Number(c.amount || 0), 0);
  async function handlePayCommission(id) {
    if (!canManage) {
      toast.error("Permissão insuficiente para alterar comissões.");
      return;
    }
    setPayingId(id);
    try {
      await commissionService.payCommission(id);
      toast.success("Comissão marcada como paga com sucesso!");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao pagar comissão.");
    } finally {
      setPayingId(null);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Comissões da Equipe" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Acompanhe e efetue o pagamento de comissões sobre atendimentos e vendas." })
      ] }),
      !canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
        " Modo somente leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Comissões Pendentes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Coins, { className: "h-4 w-4 text-amber-500" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-amber-500", children: brl(totalPending) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Aguardando pagamento aos profissionais" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Comissões Pagas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "h-4 w-4 text-emerald-500" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-emerald-500", children: brl(totalPaid) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Pagas no período selecionado" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Total Acumulado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4 text-accent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: brl(totalAll) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-muted-foreground", children: [
          filteredCommissions.length,
          " lançamentos no período"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 border border-border/60 bg-card/40 p-4 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[140px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedMonth, onValueChange: setSelectedMonth, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none border-border bg-background/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Mês" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-none", children: MONTHS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m.value, className: "text-xs", children: m.label }, m.value)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[110px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedYear, onValueChange: setSelectedYear, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none border-border bg-background/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Ano" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2025", className: "text-xs", children: "2025" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2026", className: "text-xs", children: "2026" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "2027", className: "text-xs", children: "2027" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[180px] flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedPro, onValueChange: setSelectedPro, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none border-border bg-background/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Profissional" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", className: "text-xs", children: "Todos os profissionais" }),
          pros?.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, className: "text-xs", children: p.display_name }, p.id))
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-[150px]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: selectedStatus, onValueChange: setSelectedStatus, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none border-border bg-background/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Status" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", className: "text-xs", children: "Todos os status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "pending", className: "text-xs", children: "Pendentes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "paid", className: "text-xs", children: "Pagas" })
        ] })
      ] }) })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : filteredCommissions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Coins, title: "Nenhuma comissão encontrada", description: "Nenhuma comissão foi gerada para o mês e filtros selecionados." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Profissional" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Data / Atendimento" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Valor Base" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Taxa (%)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Comissão" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-right", children: "Ação" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: filteredCommissions.map((c) => {
        const proName = c.professional?.display_name || "Profissional";
        const dateStr = c.appointment?.scheduled_start || c.created_at;
        const ratePercent = Number(c.rate) > 1 ? Number(c.rate) : Number(c.rate) * 100;
        const isPaid = c.status === "paid";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "transition-colors hover:bg-card/80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-foreground", children: proName }),
            c.appointment?.customer?.full_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
              "Cliente: ",
              c.appointment.customer.full_name
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: format(new Date(dateStr), "dd/MM/yyyy · HH:mm", {
            locale: ptBR
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs font-semibold text-foreground", children: brl(Number(c.base_amount || 0)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-[10px] font-mono border-accent/40 text-accent", children: [
            ratePercent.toFixed(0),
            "%"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-serif font-bold text-accent", children: brl(Number(c.amount || 0)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: isPaid ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase", children: "Paga" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase", children: "Pendente" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-right", children: !isPaid && canManage ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", disabled: payingId === c.id, onClick: () => handlePayCommission(c.id), className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: payingId === c.id ? "Salvando..." : "Pagar" }) : isPaid ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground/60", children: [
            "Paga em ",
            c.paid_at ? format(new Date(c.paid_at), "dd/MM") : "—"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/40", children: "—" }) })
        ] }, c.id);
      }) })
    ] }) }) })
  ] });
}
export {
  ComissoesPage as component
};
