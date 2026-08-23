import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { h as useCurrentShop, u as useAuth, d as barbershopService, B as Button, I as Input, a as Badge, b as brl, m as minutes, C as Card, r as customerService, L as Label, w as cashService } from "./router-CQpyXUQj.mjs";
import { a as useQuery, u as useQueryClient, c as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { a as appointmentService } from "./appointment.service-BDTB0zrw.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, f as DialogDescription, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger } from "./tabs-DCky3x8Q.mjs";
import { F as startOfWeek, a as addDays, f as format, v as isSameDay, H as ptBR } from "../_libs/date-fns.mjs";
import { g as Building2, aA as LayoutGrid, o as Calendar, v as ChevronLeft, w as ChevronRight, b as Search, i as Clock, a4 as Phone, a8 as CircleCheck, u as User } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
function useAppointments(shopId, date, filters) {
  const queryClient = useQueryClient();
  const dateKey = date.toISOString().slice(0, 10);
  const query = useQuery({
    queryKey: ["appointments", shopId, dateKey, filters],
    enabled: !!shopId,
    queryFn: () => appointmentService.getByDate(shopId, date, filters)
  });
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => appointmentService.updateStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["appointments", shopId, dateKey, filters] });
      const previousAppointments = queryClient.getQueryData(["appointments", shopId, dateKey, filters]);
      if (previousAppointments) {
        queryClient.setQueryData(
          ["appointments", shopId, dateKey, filters],
          (old) => old.map((appt) => appt.id === id ? { ...appt, status } : appt)
        );
      }
      return { previousAppointments };
    },
    onError: (error, _variables, context) => {
      if (context?.previousAppointments) {
        queryClient.setQueryData(["appointments", shopId, dateKey, filters], context.previousAppointments);
      }
      toast.error(error.message || "Erro ao atualizar status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments", shopId, dateKey, filters] });
    },
    onSuccess: () => {
      toast.success("Status atualizado");
    }
  });
  return {
    ...query,
    updateStatus: updateStatusMutation.mutateAsync
  };
}
const METHOD_LABEL = {
  cash: "Dinheiro",
  debit: "Débito",
  credit: "Crédito",
  pix: "Pix",
  transfer: "Transferência",
  other: "Outro"
};
function CompletePaymentDialog({ appt, onClose, userId, onDone }) {
  const [method, setMethod] = reactExports.useState("cash");
  const [amount, setAmount] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  if (appt && amount === "") setAmount(String(Number(appt.total_amount)));
  async function submit() {
    if (!appt || !userId) return;
    setLoading(true);
    try {
      const openSession = await cashService.getOpenSession(appt.barbershop_id);
      let sessionId = openSession?.id;
      if (!sessionId) {
        const created = await cashService.openSession(appt.barbershop_id, userId, 0);
        sessionId = created.id;
      }
      await appointmentService.completeAndPay({
        appointmentId: appt.id,
        barbershopId: appt.barbershop_id,
        customerId: appt.customer_id,
        professionalId: appt.professional_id,
        amount: Number(amount),
        method,
        userId,
        sessionId
      });
      toast.success("Pagamento registrado e agendamento concluído!");
      onDone();
      onClose();
    } catch (error) {
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!appt, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Concluir Atendimento" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Valor Total" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", value: amount, onChange: (e) => setAmount(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Método de Pagamento" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: method, onValueChange: (v) => setMethod(v), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: Object.keys(METHOD_LABEL).map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: m, children: METHOD_LABEL[m] }, m)) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: onClose, children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: submit, disabled: loading, children: loading ? "Processando..." : "Confirmar e Receber" })
    ] })
  ] }) });
}
const STATUS_MAP = {
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
    label: "Faltou (No-Show)",
    className: "border-destructive/30 bg-destructive/10 text-destructive"
  }
};
function Agenda() {
  const {
    shopId,
    shops,
    setShopId
  } = useCurrentShop();
  const {
    user
  } = useAuth();
  const [date, setDate] = reactExports.useState(/* @__PURE__ */ new Date());
  const [viewMode, setViewMode] = reactExports.useState("day");
  const [payAppt, setPayAppt] = reactExports.useState(null);
  const [selectedAppt, setSelectedAppt] = reactExports.useState(null);
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const [proFilter, setProFilter] = reactExports.useState("all");
  const [sourceFilter, setSourceFilter] = reactExports.useState("all");
  const [search, setSearch] = reactExports.useState("");
  const {
    data: professionals
  } = useQuery({
    queryKey: ["professionals", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId)
  });
  const {
    data: appointments,
    isLoading,
    refetch,
    updateStatus
  } = useAppointments(shopId, date, {
    status: statusFilter,
    professionalId: proFilter,
    source: sourceFilter,
    q: search
  });
  reactExports.useEffect(() => {
    if (!shopId) return;
    const channel = supabase.channel(`agenda:${shopId}`).on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "appointments",
      filter: `barbershop_id=eq.${shopId}`
    }, () => refetch()).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, refetch]);
  async function handleSetStatus(id, status) {
    try {
      await updateStatus({
        id,
        status
      });
      if (status === "no_show") {
        const appt = appointments?.find((a) => a.id === id);
        if (appt?.customer_id) {
          const nextCount = await customerService.incrementNoShow(appt.customer_id);
          toast.warning(`Falta registrada para o cliente (${nextCount} faltas no total).`);
        }
      } else {
        toast.success("Status do agendamento atualizado!");
      }
      setSelectedAppt(null);
      refetch();
    } catch (error) {
      toast.error(error.message || "Erro ao atualizar status.");
    }
  }
  const weekStart = startOfWeek(date, {
    weekStartsOn: 1
  });
  const weekDays = Array.from({
    length: 7
  }).map((_, i) => addDays(weekStart, i));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "Agenda" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: format(date, "EEEE, d 'de' MMMM yyyy", {
            locale: ptBR
          }) })
        ] }),
        shops.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border border-border bg-card/60 px-3 py-1.5 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: shopId ?? void 0, onValueChange: setShopId, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 w-[160px] border-none bg-transparent p-0 text-xs font-bold focus:ring-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Barbearia" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "border-border", children: shops.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.id, className: "text-xs", children: s.name }, s.id)) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Tabs, { value: viewMode, onValueChange: (v) => setViewMode(v), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "rounded-none border border-border bg-card/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "day", className: "rounded-none text-xs uppercase tracking-wider", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutGrid, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Dia"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "week", className: "rounded-none text-xs uppercase tracking-wider", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Semana"
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "rounded-none h-9 w-9 border-border", onClick: () => setDate((d) => addDays(d, viewMode === "week" ? -7 : -1)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", className: "rounded-none h-9 text-xs uppercase font-bold", onClick: () => setDate(/* @__PURE__ */ new Date()), children: "Hoje" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "icon", className: "rounded-none h-9 w-9 border-border", onClick: () => setDate((d) => addDays(d, viewMode === "week" ? 7 : 1)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4" }) })
        ] })
      ] })
    ] }),
    viewMode === "week" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-7 gap-2 border border-border/80 bg-card/40 p-3", children: weekDays.map((d, idx) => {
      const isSelected = isSameDay(d, date);
      const isToday = isSameDay(d, /* @__PURE__ */ new Date());
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setDate(d), className: `flex flex-col items-center justify-center p-3 text-center transition-all ${isSelected ? "border border-accent bg-accent/15 text-accent font-bold" : isToday ? "border border-border bg-background text-foreground" : "hover:bg-card/80 text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-widest", children: format(d, "EEE", {
          locale: ptBR
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-lg font-bold", children: format(d, "dd") })
      ] }, idx);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 border border-border/60 bg-card/40 p-4 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-w-[240px] flex-[2]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { className: "h-10 rounded-none border-border bg-background/50 pl-9 text-xs", placeholder: "Buscar por cliente ou telefone...", value: search, onChange: (e) => setSearch(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[150px] flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none border-border bg-background/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Status" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos os status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "scheduled", children: "Agendados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "in_progress", children: "Em atendimento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "completed", children: "Concluídos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "cancelled", children: "Cancelados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "no_show", children: "Faltas (No-Show)" })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[150px] flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: proFilter, onValueChange: setProFilter, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-10 rounded-none border-border bg-background/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Profissional" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos profissionais" }),
          professionals?.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.display_name }, p.id))
        ] })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!selectedAppt, onOpenChange: (open) => !open && setSelectedAppt(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-lg p-6", children: selectedAppt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl font-bold", children: "Detalhes do Agendamento" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "mt-1 flex items-center gap-2 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5 text-accent" }),
            format(new Date(selectedAppt.scheduled_start), "HH:mm"),
            " às",
            " ",
            format(new Date(selectedAppt.scheduled_end), "HH:mm"),
            " ·",
            " ",
            format(new Date(selectedAppt.scheduled_start), "dd 'de' MMMM", {
              locale: ptBR
            })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `rounded-none text-[10px] uppercase font-bold ${STATUS_MAP[selectedAppt.status]?.className}`, children: STATUS_MAP[selectedAppt.status]?.label || selectedAppt.status })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/60 bg-card/40 p-4 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Cliente" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm text-foreground", children: selectedAppt.customer?.full_name || "Cliente não informado" }),
          selectedAppt.customer?.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3 w-3 text-accent" }),
            " ",
            selectedAppt.customer.phone
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/60 bg-card/40 p-4 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Profissional" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm text-foreground", children: selectedAppt.professional?.display_name || "Qualquer disponível" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/60 bg-card/40 p-4 space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Valor Total" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-lg font-bold text-accent", children: brl(Number(selectedAppt.total_amount || 0)) })
          ] })
        ] }),
        selectedAppt.services && selectedAppt.services.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Serviços Contratados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border/20 border border-border/60 bg-card/40", children: selectedAppt.services.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-0.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: item.service?.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: minutes(item.duration_snapshot || item.service?.duration_min || 30) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold text-accent", children: brl(Number(item.price_snapshot || item.service?.price || 0)) })
          ] }, item.id)) })
        ] }),
        selectedAppt.notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Observações" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "border border-border/40 bg-card/20 p-3 italic text-muted-foreground", children: [
            '"',
            selectedAppt.notes,
            '"'
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2 border-t border-border/40 pt-4", children: [
        selectedAppt.status === "scheduled" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "flex-1 rounded-none bg-accent text-accent-foreground", onClick: () => handleSetStatus(selectedAppt.id, "in_progress"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Iniciar Atendimento"
        ] }),
        selectedAppt.status === "in_progress" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "flex-1 rounded-none bg-emerald-600 text-white hover:bg-emerald-700", onClick: () => {
          const cur = selectedAppt;
          setSelectedAppt(null);
          setPayAppt(cur);
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Finalizar & Cobrar"
        ] }),
        selectedAppt.status !== "completed" && selectedAppt.status !== "cancelled" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "rounded-none text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs", onClick: () => handleSetStatus(selectedAppt.id, "no_show"), children: "Registrar Falta" })
      ] })
    ] }) }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: Array.from({
      length: 3
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "h-24 animate-pulse rounded-none border border-border bg-muted/30" }, i)) }) : !appointments || appointments.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "grid place-items-center rounded-none border border-border p-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-10 w-10 text-muted-foreground/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-3 font-serif text-lg font-bold", children: "Nenhum agendamento para este dia" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Novos agendamentos feitos online ou no balcão aparecerão aqui em tempo real." })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: appointments.map((a) => {
      const st = STATUS_MAP[a.status] || STATUS_MAP.scheduled;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { onClick: () => setSelectedAppt(a), className: "group relative flex cursor-pointer flex-col justify-between rounded-none border border-border bg-card/50 p-5 backdrop-blur-md transition-all hover:border-accent hover:bg-card sm:flex-row sm:items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-w-[68px] flex-col items-center justify-center border border-accent/30 bg-accent/10 px-3 py-2 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-lg font-bold text-accent", children: format(new Date(a.scheduled_start), "HH:mm") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-wider text-muted-foreground", children: format(new Date(a.scheduled_end), "HH:mm") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-foreground transition-colors group-hover:text-accent", children: a.customer?.full_name || "Cliente Avulso" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: `rounded-none text-[9px] font-bold uppercase ${st.className}`, children: st.label })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3 w-3 text-accent" }),
                " ",
                a.professional?.display_name || "Qualquer barbeiro"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-accent", children: brl(Number(a.total_amount || 0)) }),
              a.customer?.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-[10px]", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-2.5 w-2.5" }),
                " ",
                a.customer.phone
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-end gap-2 border-t border-border/20 pt-3 sm:mt-0 sm:border-none sm:pt-0", children: [
          a.status === "scheduled" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider", onClick: (e) => {
            e.stopPropagation();
            handleSetStatus(a.id, "in_progress");
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Iniciar"
          ] }),
          a.status === "in_progress" && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", className: "rounded-none bg-emerald-600 text-white hover:bg-emerald-700 text-xs uppercase font-bold tracking-wider", onClick: (e) => {
            e.stopPropagation();
            setPayAppt(a);
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Cobrar"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "rounded-none text-xs", onClick: (e) => {
            e.stopPropagation();
            setSelectedAppt(a);
          }, children: "Detalhes" })
        ] })
      ] }, a.id);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CompletePaymentDialog, { appt: payAppt, onClose: () => setPayAppt(null), userId: user?.id, onDone: refetch })
  ] });
}
export {
  Agenda as component
};
