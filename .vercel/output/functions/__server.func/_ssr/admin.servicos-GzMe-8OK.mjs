import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, d as barbershopService, B as Button, a as Badge, L as Label, I as Input, T as Textarea, o as CardGridSkeleton, E as EmptyState, C as Card, m as minutes, b as brl } from "./router-CQpyXUQj.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { S as Switch } from "./switch-COLZ1v4m.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { d as Plus, f as ShieldAlert, S as Scissors, af as Pencil, T as Trash2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
function Page() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const {
    data: services,
    isLoading
  } = useQuery({
    queryKey: ["admin-services", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getServices(shopId)
  });
  const [open, setOpen] = reactExports.useState(false);
  const [editService, setEditService] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    name: "",
    description: "",
    duration_min: 30,
    price: 0,
    active: true
  });
  function openNew() {
    if (!canManage) {
      toast.error("Permissão insuficiente: apenas administradores ou proprietários podem criar serviços.");
      return;
    }
    setEditService(null);
    setForm({
      name: "",
      description: "",
      duration_min: 30,
      price: 0,
      active: true
    });
    setOpen(true);
  }
  function openEdit(s) {
    if (!canManage) {
      toast.error("Permissão insuficiente: apenas administradores ou proprietários podem editar serviços.");
      return;
    }
    setEditService(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      duration_min: s.duration_min,
      price: Number(s.price),
      active: s.active
    });
    setOpen(true);
  }
  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("O nome do serviço é obrigatório.");
    if (!form.duration_min || form.duration_min <= 0) return toast.error("A duração deve ser maior que 0 minutos.");
    if (form.price === void 0 || form.price < 0) return toast.error("O preço deve ser válido.");
    setBusy(true);
    try {
      if (editService) {
        await barbershopService.updateService(editService.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_min: form.duration_min,
          price: form.price,
          active: form.active
        });
        toast.success("Serviço atualizado com sucesso!");
      } else {
        await barbershopService.createService({
          barbershop_id: shopId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_min: form.duration_min,
          price: form.price,
          active: form.active
        });
        toast.success("Serviço cadastrado com sucesso!");
      }
      setOpen(false);
      qc.invalidateQueries({
        queryKey: ["admin-services", shopId]
      });
    } catch (err) {
      toast.error(err.message || "Erro ao salvar serviço.");
    } finally {
      setBusy(false);
    }
  }
  async function handleDelete(s) {
    if (!canManage) {
      toast.error("Permissão insuficiente para excluir serviços.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o serviço "${s.name}"?`)) return;
    try {
      await barbershopService.deleteService(s.id);
      toast.success("Serviço excluído com sucesso!");
      qc.invalidateQueries({
        queryKey: ["admin-services", shopId]
      });
    } catch (err) {
      toast.error(err.message || "Erro ao excluir serviço.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Serviços" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Catálogo de serviços oferecido pela sua barbearia." })
      ] }),
      canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        " Novo serviço"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
        " Modo somente leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: editService ? "Editar serviço" : "Novo serviço" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "name", children: "Nome do serviço *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "name", value: form.name, onChange: (e) => setForm({
            ...form,
            name: e.target.value
          }), placeholder: "Ex: Corte Degrade + Barba Terapia", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "description", children: "Descrição" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "description", rows: 2, value: form.description, onChange: (e) => setForm({
            ...form,
            description: e.target.value
          }), placeholder: "Detalhes do serviço, técnicas e produtos utilizados...", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "duration", children: "Duração (minutos) *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "duration", type: "number", min: 5, step: 5, value: form.duration_min, onChange: (e) => setForm({
              ...form,
              duration_min: Number(e.target.value)
            }), className: "rounded-none", required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "price", children: "Preço (R$) *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "price", type: "number", step: "0.01", min: 0, value: form.price, onChange: (e) => setForm({
              ...form,
              price: Number(e.target.value)
            }), className: "rounded-none", required: true })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "active", className: "cursor-pointer", children: "Disponível para agendamento online" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "active", checked: form.active, onCheckedChange: (v) => setForm({
            ...form,
            active: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: busy ? "Salvando..." : "Salvar serviço" })
      ] })
    ] }) }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardGridSkeleton, { count: 6 }) : !services || services.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Scissors, title: "Nenhum serviço cadastrado", description: "Cadastre os serviços oferecidos pela barbearia para começar a receber agendamentos.", action: canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
      " Novo serviço"
    ] }) : void 0 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: services.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group relative flex flex-col justify-between border border-border bg-card/50 p-6 backdrop-blur-md transition-all hover:border-accent", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-none bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-5 w-5" }) }),
          !s.active && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "rounded-none text-[10px] font-bold uppercase", children: "Inativo" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold text-foreground", children: s.name }),
          s.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: s.description })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 border-t border-border/40 pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Duração" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-foreground", children: minutes(s.duration_min) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Preço" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-lg font-bold text-accent", children: brl(Number(s.price)) })
          ] })
        ] }),
        canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => openEdit(s), className: "flex-1 rounded-none text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Editar"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDelete(s), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] })
    ] }, s.id)) })
  ] });
}
export {
  Page as component
};
