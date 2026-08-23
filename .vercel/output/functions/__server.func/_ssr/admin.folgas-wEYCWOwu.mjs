import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { h as useCurrentShop, B as Button, C as Card, L as Label, a as Badge, q as TableSkeleton, E as EmptyState, I as Input, T as Textarea } from "./router-CQpyXUQj.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { d as Plus, O as CalendarOff, T as Trash2 } from "../_libs/lucide-react.mjs";
import { f as format, H as ptBR } from "../_libs/date-fns.mjs";
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
function FolgasPage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const [filterPro, setFilterPro] = reactExports.useState("all");
  const [createModalOpen, setCreateModalOpen] = reactExports.useState(false);
  const {
    data: pros = [],
    isLoading: loadingPros
  } = useQuery({
    enabled: !!shopId,
    queryKey: ["folgas-pros", shopId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("professionals").select("id, display_name").eq("barbershop_id", shopId).eq("active", true).order("display_name");
      if (error) throw error;
      return data ?? [];
    }
  });
  const proIds = reactExports.useMemo(() => pros.map((p) => p.id), [pros]);
  const {
    data: items = [],
    isLoading: loadingItems,
    refetch
  } = useQuery({
    enabled: proIds.length > 0,
    queryKey: ["admin-time-off-list", proIds.join(",")],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("time_off").select("*").in("professional_id", proIds).order("start_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const filteredItems = reactExports.useMemo(() => {
    if (filterPro === "all") return items;
    return items.filter((it) => it.professional_id === filterPro);
  }, [items, filterPro]);
  const nameOf = (id) => pros.find((p) => p.id === id)?.display_name ?? "Profissional";
  async function handleRemove(id) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm("Deseja realmente remover esta folga/bloqueio?")) return;
    try {
      const {
        error
      } = await supabase.from("time_off").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bloqueio removido com sucesso!");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao remover bloqueio.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Folgas & Bloqueios de Agenda" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Defina ausências, férias ou bloqueios de horários para evitar agendamentos indevidos." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setCreateModalOpen(true), className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
        " Adicionar Folga / Bloqueio"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-none border border-border bg-card/40 p-4 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Profissional:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterPro, onValueChange: setFilterPro, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[220px] rounded-none h-10 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Todos os barbeiros" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos os profissionais" }),
            pros.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.display_name }, p.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-xs font-mono text-accent", children: [
        filteredItems.length,
        " ",
        filteredItems.length === 1 ? "bloqueio registrado" : "bloqueios registrados"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 flex items-center justify-between border-b border-border/40 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-serif text-lg font-bold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarOff, { className: "h-5 w-5 text-accent" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Períodos de Indisponibilidade" })
      ] }) }),
      loadingPros || loadingItems ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, { rows: 4 }) : filteredItems.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: CalendarOff, title: "Nenhuma folga cadastrada", description: "Quando um profissional tirar folga ou houver feriado, cadastre o bloqueio aqui." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Profissional" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Início" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Término" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Motivo / Observação" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: filteredItems.map((it) => {
          const s = new Date(it.start_at);
          const e = new Date(it.end_at);
          const isUpcoming = e.getTime() >= Date.now();
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-card/60 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-serif font-bold text-foreground", children: nameOf(it.professional_id) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs font-mono text-muted-foreground", children: format(s, "dd/MM/yyyy · HH:mm", {
              locale: ptBR
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs font-mono text-muted-foreground", children: format(e, "dd/MM/yyyy · HH:mm", {
              locale: ptBR
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs text-foreground/80", children: it.reason || /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground italic", children: "Não especificado" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: isUpcoming ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase", children: "Bloqueio Ativo" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-border bg-muted/40 text-muted-foreground text-[10px] uppercase", children: "Finalizado" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right", children: canManage && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleRemove(it.id), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) }) })
          ] }, it.id);
        }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CreateBlockModal, { open: createModalOpen, onOpenChange: setCreateModalOpen, pros, onSuccess: () => {
      setCreateModalOpen(false);
      refetch();
    } })
  ] });
}
function CreateBlockModal({
  open,
  onOpenChange,
  pros,
  onSuccess
}) {
  const [proId, setProId] = reactExports.useState("");
  const [startDate, setStartDate] = reactExports.useState(() => format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = reactExports.useState("08:00");
  const [endDate, setEndDate] = reactExports.useState(() => format(/* @__PURE__ */ new Date(), "yyyy-MM-dd"));
  const [endTime, setEndTime] = reactExports.useState("20:00");
  const [allDay, setAllDay] = reactExports.useState(true);
  const [reason, setReason] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  async function handleSubmit(e) {
    e.preventDefault();
    if (!proId) return toast.error("Selecione o profissional.");
    if (!startDate) return toast.error("Informe a data de início.");
    const startISO = allDay ? (/* @__PURE__ */ new Date(`${startDate}T00:00:00`)).toISOString() : (/* @__PURE__ */ new Date(`${startDate}T${startTime}:00`)).toISOString();
    const endISO = allDay ? (/* @__PURE__ */ new Date(`${endDate || startDate}T23:59:59`)).toISOString() : (/* @__PURE__ */ new Date(`${endDate || startDate}T${endTime}:00`)).toISOString();
    if (new Date(endISO) <= new Date(startISO)) {
      return toast.error("A data de término deve ser posterior à data de início.");
    }
    setBusy(true);
    try {
      const {
        error
      } = await supabase.from("time_off").insert({
        professional_id: proId,
        start_at: startISO,
        end_at: endISO,
        reason: reason.trim() || null
      });
      if (error) throw error;
      toast.success("Bloqueio de horário registrado com sucesso!");
      setReason("");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar bloqueio.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Bloquear Horário / Registrar Folga" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Profissional / Barbeiro *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: proId, onValueChange: setProId, required: true, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecione o profissional" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-none", children: pros.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.display_name }, p.id)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { id: "all_day_check", type: "checkbox", checked: allDay, onChange: (e) => setAllDay(e.target.checked), className: "h-4 w-4 rounded-none accent-current" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "all_day_check", className: "cursor-pointer", children: "Dia inteiro (ou múltiplos dias de ausência)" })
      ] }),
      allDay ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Data de Início *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: startDate, onChange: (e) => setStartDate(e.target.value), className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Data de Retorno" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: endDate, onChange: (e) => setEndDate(e.target.value), className: "rounded-none" })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Data *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "date", value: startDate, onChange: (e) => {
            setStartDate(e.target.value);
            setEndDate(e.target.value);
          }, className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Início" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "time", value: startTime, onChange: (e) => setStartTime(e.target.value), className: "rounded-none" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Fim" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "time", value: endTime, onChange: (e) => setEndTime(e.target.value), className: "rounded-none" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "to_reason", children: "Motivo da Ausência (Opcional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "to_reason", rows: 2, value: reason, onChange: (e) => setReason(e.target.value), placeholder: "Ex.: Férias anuais, Consulta médica, Treinamento externo...", className: "rounded-none resize-none" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), className: "rounded-none", children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Salvando..." : "Confirmar Bloqueio" })
    ] })
  ] }) }) });
}
export {
  FolgasPage as component
};
