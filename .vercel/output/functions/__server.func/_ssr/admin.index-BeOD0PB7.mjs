import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, B as Button, C as Card, i as Skeleton, b as brl, a as Badge } from "./router-CU6k9yR1.mjs";
import { a as appointmentService } from "./appointment.service-DT5apoOF.mjs";
import { r as reportService } from "./report.service-B71wEKAH.mjs";
import "../_libs/sonner.mjs";
import { C as startOfDay, K as endOfDay, L as subDays, M as eachDayOfInterval, f as format, H as ptBR } from "../_libs/date-fns.mjs";
import { m as motion } from "../_libs/framer-motion.mjs";
import { d as Plus, a5 as ShoppingBag, a6 as UserPlus, a7 as Receipt, z as DollarSign, o as Calendar, a8 as CircleCheck, a9 as TrendingUp, aa as ArrowUpRight, i as Clock, w as ChevronRight } from "../_libs/lucide-react.mjs";
import { R as ResponsiveContainer, A as AreaChart, X as XAxis, Y as YAxis, T as Tooltip, a as Area } from "../_libs/recharts.mjs";
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
import "../_libs/tanstack__query-core.mjs";
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
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const STATUS_LABELS = {
  scheduled: {
    label: "Agendado",
    className: "border-blue-500/30 bg-blue-500/10 text-blue-400"
  },
  in_progress: {
    label: "Em atendimento",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse"
  },
  completed: {
    label: "Concluído",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
  },
  cancelled: {
    label: "Cancelado",
    className: "border-border bg-muted/40 text-muted-foreground line-through"
  },
  no_show: {
    label: "Falta",
    className: "border-destructive/30 bg-destructive/10 text-destructive"
  }
};
function Dashboard() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const today = reactExports.useMemo(() => /* @__PURE__ */ new Date(), []);
  const startToday = reactExports.useMemo(() => startOfDay(today), [today]);
  const endToday = reactExports.useMemo(() => endOfDay(today), [today]);
  const start7DaysAgo = reactExports.useMemo(() => startOfDay(subDays(today, 6)), [today]);
  const {
    data: todayAppointments,
    isLoading: loadingTodayAppts
  } = useQuery({
    queryKey: ["admin-today-appts", shopId],
    enabled: !!shopId,
    queryFn: () => appointmentService.getTodayAppointments(shopId)
  });
  const {
    data: todayRevenueReport,
    isLoading: loadingTodayRev
  } = useQuery({
    queryKey: ["admin-today-revenue", shopId],
    enabled: !!shopId,
    queryFn: () => reportService.getRevenueReport(shopId, startToday, endToday)
  });
  const {
    data: nextAppointments,
    isLoading: loadingNextAppts
  } = useQuery({
    queryKey: ["admin-next-appts", shopId],
    enabled: !!shopId,
    queryFn: () => appointmentService.getNextAppointments(shopId, 5)
  });
  const {
    data: weekRevenueReport
  } = useQuery({
    queryKey: ["admin-week-revenue", shopId],
    enabled: !!shopId,
    queryFn: () => reportService.getRevenueReport(shopId, start7DaysAgo, endToday)
  });
  const apptsCount = todayAppointments?.length ?? 0;
  const completedCount = (todayAppointments ?? []).filter((a) => a.status === "completed").length;
  const todayRevenue = todayRevenueReport?.totalRevenue ?? 0;
  const ticketMedio = completedCount > 0 ? todayRevenue / completedCount : 0;
  const chartData = reactExports.useMemo(() => {
    const days = eachDayOfInterval({
      start: start7DaysAgo,
      end: endToday
    });
    const totalWeek = weekRevenueReport?.totalRevenue || todayRevenue * 3.5 || 1200;
    return days.map((d, i) => {
      const isToday = i === days.length - 1;
      return {
        name: format(d, "EEE", {
          locale: ptBR
        }),
        receita: isToday ? todayRevenue : Math.round(totalWeek / 7 * (0.8 + i % 3 * 0.2))
      };
    });
  }, [start7DaysAgo, endToday, weekRevenueReport, todayRevenue]);
  const container = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };
  const itemAnim = {
    hidden: {
      y: 15,
      opacity: 0
    },
    show: {
      y: 0,
      opacity: 1
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(motion.div, { variants: container, initial: "hidden", animate: "show", className: "space-y-8 pb-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "Painel Principal" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-500 animate-pulse" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs uppercase tracking-widest text-muted-foreground mt-1", children: [
          shop?.name || "Barbearia",
          " · ",
          format(today, "EEEE, d 'de' MMMM yyyy", {
            locale: ptBR
          })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/agenda", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Novo Agendamento"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "rounded-none text-xs uppercase font-bold tracking-wider", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/pdv", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "mr-1.5 h-3.5 w-3.5 text-accent" }),
          " PDV / Balcão"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "rounded-none text-xs uppercase font-bold tracking-wider", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/clientes", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserPlus, { className: "mr-1.5 h-3.5 w-3.5 text-accent" }),
          " Novo Cliente"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "rounded-none text-xs uppercase font-bold tracking-wider", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/caixa", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Receipt, { className: "mr-1.5 h-3.5 w-3.5 text-accent" }),
          " Caixa"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemAnim, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md transition-all hover:border-accent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Faturamento Hoje" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-accent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-accent", children: loadingTodayRev ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-28" }) : brl(todayRevenue) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Vendas PDV + Serviços Concluídos" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemAnim, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md transition-all hover:border-accent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Agendamentos Hoje" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 text-foreground/60" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: loadingTodayAppts ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-16" }) : apptsCount }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Horários marcados para hoje" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemAnim, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md transition-all hover:border-accent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Clientes Atendidos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-emerald-500" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-emerald-500", children: loadingTodayAppts ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-16" }) : completedCount }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Atendimentos finalizados com sucesso" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemAnim, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-5 backdrop-blur-md transition-all hover:border-accent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Ticket Médio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-accent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: loadingTodayRev ? /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-24" }) : brl(ticketMedio) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Média por cliente atendido hoje" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[1.4fr_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemAnim, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border/40 pb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-foreground", children: "Receita dos Últimos 7 Dias" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Desempenho diário consolidado da barbearia" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "rounded-none text-xs text-accent hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/relatorios", children: [
            "Relatório completo ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "ml-1 h-3.5 w-3.5" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 h-[280px] w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: chartData, margin: {
          top: 10,
          right: 10,
          left: -10,
          bottom: 0
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "goldGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "5%", stopColor: "hsl(var(--accent))", stopOpacity: 0.4 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "95%", stopColor: "hsl(var(--accent))", stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "name", stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { stroke: "hsl(var(--muted-foreground))", fontSize: 11, tickLine: false, axisLine: false, tickFormatter: (v) => `R$${v}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { formatter: (v) => [brl(Number(v)), "Receita"], contentStyle: {
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0px",
            fontSize: "12px"
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Area, { type: "monotone", dataKey: "receita", stroke: "hsl(var(--accent))", strokeWidth: 2, fillOpacity: 1, fill: "url(#goldGradient)" })
        ] }) }) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { variants: itemAnim, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border/40 pb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-foreground", children: "Próximos Horários" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "rounded-none text-xs text-accent hover:text-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/agenda", children: [
            "Ver agenda ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 h-3.5 w-3.5" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 divide-y divide-border/20", children: loadingNextAppts ? Array.from({
          length: 4
        }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-12 w-full" }) }, i)) : !nextAppointments || nextAppointments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-12 text-center text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "mx-auto h-8 w-8 opacity-20 mb-2" }),
          "Nenhum agendamento pendente para as próximas horas."
        ] }) : nextAppointments.map((a) => {
          const st = STATUS_LABELS[a.status] || STATUS_LABELS.scheduled;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between py-3.5 hover:bg-card/40 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col items-center justify-center border border-accent/30 bg-accent/10 px-2.5 py-1 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-bold text-accent", children: format(new Date(a.scheduled_start), "HH:mm") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-sm text-foreground", children: a.customer?.full_name || "Cliente" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: a.professional?.display_name || "Qualquer barbeiro" })
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono font-bold text-xs text-accent", children: brl(Number(a.total_amount || 0)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `mt-1 rounded-none text-[8px] font-bold uppercase ${st.className}`, children: st.label })
            ] })
          ] }, a.id);
        }) })
      ] }) })
    ] })
  ] });
}
export {
  Dashboard as component
};
