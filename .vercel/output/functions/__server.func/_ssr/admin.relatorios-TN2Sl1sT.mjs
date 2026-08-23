import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, B as Button, L as Label, I as Input, C as Card, i as Skeleton, b as brl, q as TableSkeleton } from "./router-CU6k9yR1.mjs";
import { r as reportService } from "./report.service-B71wEKAH.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-C30H0gvg.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { L as subDays, K as endOfDay, C as startOfDay, l as endOfMonth, E as startOfMonth, M as eachDayOfInterval, f as format, H as ptBR } from "../_libs/date-fns.mjs";
import { ag as RefreshCw, o as Calendar, z as DollarSign, a9 as TrendingUp, ah as CircleX, ai as Trophy, S as Scissors } from "../_libs/lucide-react.mjs";
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
const RevenueChart = reactExports.lazy(() => import("./ReportCharts-BhwtPlyk.mjs").then((m) => ({
  default: m.RevenueChart
})));
const ServicesChart = reactExports.lazy(() => import("./ReportCharts-BhwtPlyk.mjs").then((m) => ({
  default: m.ServicesChart
})));
function RelatoriosPage() {
  const {
    shopId
  } = useCurrentShop();
  const [preset, setPreset] = reactExports.useState("30");
  const [customStart, setCustomStart] = reactExports.useState(subDays(/* @__PURE__ */ new Date(), 29).toISOString().split("T")[0]);
  const [customEnd, setCustomEnd] = reactExports.useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const {
    startDate,
    endDate
  } = reactExports.useMemo(() => {
    const now = /* @__PURE__ */ new Date();
    if (preset === "7") {
      return {
        startDate: startOfDay(subDays(now, 6)),
        endDate: endOfDay(now)
      };
    }
    if (preset === "30") {
      return {
        startDate: startOfDay(subDays(now, 29)),
        endDate: endOfDay(now)
      };
    }
    if (preset === "month") {
      return {
        startDate: startOfMonth(now),
        endDate: endOfMonth(now)
      };
    }
    return {
      startDate: startOfDay(new Date(customStart || subDays(now, 29))),
      endDate: endOfDay(new Date(customEnd || now))
    };
  }, [preset, customStart, customEnd]);
  const {
    data: revenueData,
    isLoading: loadingRevenue,
    refetch: refetchRevenue
  } = useQuery({
    queryKey: ["report-revenue", shopId, startDate.toISOString(), endDate.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getRevenueReport(shopId, startDate, endDate)
  });
  const {
    data: apptsData,
    isLoading: loadingAppts,
    refetch: refetchAppts
  } = useQuery({
    queryKey: ["report-appts", shopId, startDate.toISOString(), endDate.toISOString()],
    enabled: !!shopId,
    queryFn: () => reportService.getAppointmentsReport(shopId, startDate, endDate)
  });
  const {
    data: topCustomers,
    isLoading: loadingCustomers
  } = useQuery({
    queryKey: ["report-top-customers", shopId],
    enabled: !!shopId,
    queryFn: () => reportService.getTopCustomers(shopId, 5)
  });
  const {
    data: topServices,
    isLoading: loadingServices
  } = useQuery({
    queryKey: ["report-top-services", shopId],
    enabled: !!shopId,
    queryFn: () => reportService.getTopServices(shopId, 5)
  });
  const isLoading = loadingRevenue || loadingAppts;
  function handleRefresh() {
    refetchRevenue();
    refetchAppts();
    toast.success("Relatórios atualizados com sucesso!");
  }
  const revenueChartData = reactExports.useMemo(() => {
    try {
      const days = eachDayOfInterval({
        start: startDate,
        end: endDate
      });
      return days.map((d) => ({
        day: format(d, "dd/MM"),
        revenue: Math.round(Number(revenueData?.totalRevenue || 0) / Math.max(1, days.length))
      }));
    } catch {
      return [];
    }
  }, [startDate, endDate, revenueData]);
  const servicesChartData = reactExports.useMemo(() => {
    return (topServices ?? []).map((s) => ({
      name: s.name,
      revenue: s.totalRevenue,
      bookings: s.bookingsCount
    }));
  }, [topServices]);
  const totalAppts = apptsData?.totalAppointments ?? 0;
  const completedAppts = apptsData?.byStatus.completed ?? 0;
  const cancelledAppts = (apptsData?.byStatus.cancelled ?? 0) + (apptsData?.byStatus.no_show ?? 0);
  const ticketMedio = completedAppts > 0 ? (revenueData?.totalRevenue ?? 0) / completedAppts : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Relatórios Financeiros & Métricas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Acompanhe o faturamento, agendamentos, clientes fiéis e serviços mais lucrativos." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: handleRefresh, className: "rounded-none text-xs uppercase font-bold tracking-wider", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "mr-1.5 h-3.5 w-3.5" }),
        " Atualizar dados"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end gap-3 border border-border/60 bg-card/40 p-4 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[180px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Período" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: preset, onValueChange: (v) => setPreset(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "mt-1 h-10 rounded-none border-border bg-background/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "7", className: "text-xs", children: "Últimos 7 dias" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "30", className: "text-xs", children: "Últimos 30 dias" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "month", className: "text-xs", children: "Este mês" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "custom", className: "text-xs", children: "Personalizado" })
          ] })
        ] })
      ] }),
      preset === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[150px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Data Inicial" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: customStart, onChange: (e) => setCustomStart(e.target.value), className: "mt-1 h-10 rounded-none text-xs" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-[150px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Data Final" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: customEnd, onChange: (e) => setCustomEnd(e.target.value), className: "mt-1 h-10 rounded-none text-xs" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground pt-2 sm:ml-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          format(startDate, "dd/MM/yyyy", {
            locale: ptBR
          }),
          " até ",
          format(endDate, "dd/MM/yyyy", {
            locale: ptBR
          })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Faturamento Total" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-accent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-accent", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-24" }) : brl(revenueData?.totalRevenue ?? 0) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Vendas PDV + Serviços Concluídos" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Agendamentos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 text-foreground/60" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-16" }) : totalAppts }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-emerald-500 font-bold", children: [
          completedAppts,
          " atendimentos concluídos"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Ticket Médio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-emerald-500" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-24" }) : brl(ticketMedio) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Média por atendimento concluído" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Cancelamentos / Faltas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "h-4 w-4 text-destructive" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-destructive", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-16" }) : cancelledAppts }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-muted-foreground", children: [
          apptsData?.byStatus.no_show ?? 0,
          " faltas (no-show) registradas"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-base font-bold text-foreground mb-4", children: "Status dos Agendamentos no Período" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/40 p-3 bg-card/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Agendados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold font-mono text-blue-400", children: apptsData?.byStatus.scheduled ?? 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/40 p-3 bg-card/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Em Atendimento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold font-mono text-amber-400", children: apptsData?.byStatus.in_progress ?? 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/40 p-3 bg-card/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Concluídos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold font-mono text-emerald-400", children: apptsData?.byStatus.completed ?? 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/40 p-3 bg-card/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Cancelados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold font-mono text-muted-foreground", children: apptsData?.byStatus.cancelled ?? 0 })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/40 p-3 bg-card/30", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "No-Show (Faltou)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold font-mono text-destructive", children: apptsData?.byStatus.no_show ?? 0 })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-foreground mb-4", children: "Evolução do Faturamento no Período" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[260px] w-full" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(RevenueChart, { data: revenueChartData }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-foreground mb-4", children: "Faturamento por Serviço Mais Popular" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(reactExports.Suspense, { fallback: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-[260px] w-full" }), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ServicesChart, { data: servicesChartData }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Trophy, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-foreground", children: "Top 5 Clientes Mais Fiéis" })
        ] }),
        loadingCustomers ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !topCustomers || topCustomers.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-xs text-muted-foreground", children: "Nenhum cliente registrado ainda." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border/20", children: topCustomers.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "grid h-6 w-6 place-items-center rounded-none bg-accent/10 font-mono text-xs font-bold text-accent", children: [
              "#",
              i + 1
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm text-foreground", children: c.customer?.full_name || "Cliente" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
                c.appointmentsCount,
                " atendimentos realizados"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-accent", children: brl(c.totalSpent) })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-foreground", children: "Top 5 Serviços Mais Agendados" })
        ] }),
        loadingServices ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !topServices || topServices.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-6 text-center text-xs text-muted-foreground", children: "Nenhum serviço agendado ainda." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border/20", children: topServices.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "grid h-6 w-6 place-items-center rounded-none bg-accent/10 font-mono text-xs font-bold text-accent", children: [
              "#",
              i + 1
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm text-foreground", children: s.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
                s.bookingsCount,
                " vezes agendado"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-foreground", children: brl(s.totalRevenue) })
        ] }, s.id)) })
      ] })
    ] })
  ] });
}
export {
  RelatoriosPage as component
};
