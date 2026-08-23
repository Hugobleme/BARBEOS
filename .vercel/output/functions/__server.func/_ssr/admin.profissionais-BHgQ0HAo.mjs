import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, d as barbershopService, B as Button, a as Badge, L as Label, I as Input, T as Textarea, o as CardGridSkeleton, E as EmptyState, C as Card } from "./router-CU6k9yR1.mjs";
import { A as Avatar, a as AvatarFallback } from "./avatar-DmXEgll-.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-whcht_wB.mjs";
import { S as Switch } from "./switch-DV87h8C5.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { d as Plus, f as ShieldAlert, aj as Percent, J as UserCog, af as Pencil, T as Trash2 } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
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
    data: pros,
    isLoading
  } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId)
  });
  const [open, setOpen] = reactExports.useState(false);
  const [editPro, setEditPro] = reactExports.useState(null);
  const [busy, setBusy] = reactExports.useState(false);
  const [form, setForm] = reactExports.useState({
    display_name: "",
    bio: "",
    specialties: "Corte, Barba",
    commission_percent: 40,
    active: true
  });
  function openNew() {
    if (!canManage) {
      toast.error("Permissão insuficiente: apenas administradores ou proprietários podem adicionar profissionais.");
      return;
    }
    setEditPro(null);
    setForm({
      display_name: "",
      bio: "",
      specialties: "Corte, Barba",
      commission_percent: 40,
      active: true
    });
    setOpen(true);
  }
  function openEdit(p) {
    if (!canManage) {
      toast.error("Permissão insuficiente para editar profissionais.");
      return;
    }
    setEditPro(p);
    const rule = p.commission_rule ?? {};
    const percent = Number(rule.percentage ?? rule.percent ?? rule.rate ?? 40);
    setForm({
      display_name: p.display_name,
      bio: p.bio ?? "",
      specialties: (p.specialties ?? []).join(", "),
      commission_percent: percent,
      active: p.active
    });
    setOpen(true);
  }
  async function handleSave(e) {
    e.preventDefault();
    if (!form.display_name.trim()) return toast.error("O nome do profissional é obrigatório.");
    const specialtiesList = form.specialties.split(",").map((s) => s.trim()).filter(Boolean);
    setBusy(true);
    try {
      if (editPro) {
        await barbershopService.updateBarber(editPro.id, {
          display_name: form.display_name.trim(),
          bio: form.bio.trim() || null,
          specialties: specialtiesList,
          commission_percent: Number(form.commission_percent) || 0,
          active: form.active
        });
        toast.success("Profissional atualizado com sucesso!");
      } else {
        await barbershopService.createBarber({
          barbershop_id: shopId,
          display_name: form.display_name.trim(),
          bio: form.bio.trim() || null,
          specialties: specialtiesList,
          commission_percent: Number(form.commission_percent) || 40,
          active: form.active
        });
        toast.success("Profissional adicionado com sucesso!");
      }
      setOpen(false);
      qc.invalidateQueries({
        queryKey: ["admin-pros", shopId]
      });
    } catch (err) {
      toast.error(err.message || "Erro ao salvar profissional.");
    } finally {
      setBusy(false);
    }
  }
  async function handleDelete(p) {
    if (!canManage) {
      toast.error("Permissão insuficiente para remover profissionais.");
      return;
    }
    if (!confirm(`Tem certeza que deseja remover o profissional "${p.display_name}"?`)) return;
    try {
      await barbershopService.deleteBarber(p.id);
      toast.success("Profissional removido com sucesso!");
      qc.invalidateQueries({
        queryKey: ["admin-pros", shopId]
      });
    } catch (err) {
      toast.error(err.message || "Erro ao remover profissional.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Profissionais" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Equipe de barbeiros e especialistas da barbearia." })
      ] }),
      canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        " Novo profissional"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
        " Modo somente leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange: setOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSave, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: editPro ? "Editar profissional" : "Novo profissional" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pro_name", children: "Nome completo *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pro_name", value: form.display_name, onChange: (e) => setForm({
            ...form,
            display_name: e.target.value
          }), placeholder: "Ex: Carlos Oliveira", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pro_specialties", children: "Especialidades (separadas por vírgula)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pro_specialties", value: form.specialties, onChange: (e) => setForm({
            ...form,
            specialties: e.target.value
          }), placeholder: "Ex: Barba Clássica, Degradê, Visagismo", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pro_commission", children: "Comissão padrão (%)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Percent, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pro_commission", type: "number", min: 0, max: 100, value: form.commission_percent, onChange: (e) => setForm({
              ...form,
              commission_percent: Number(e.target.value)
            }), className: "rounded-none pl-9" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pro_bio", children: "Biografia / Descrição curta" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "pro_bio", rows: 2, value: form.bio, onChange: (e) => setForm({
            ...form,
            bio: e.target.value
          }), placeholder: "Especialista com mais de 8 anos de experiência em visagismo...", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pro_active", className: "cursor-pointer", children: "Profissional ativo para agendamentos" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "pro_active", checked: form.active, onCheckedChange: (v) => setForm({
            ...form,
            active: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: busy ? "Salvando..." : "Salvar profissional" })
      ] })
    ] }) }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardGridSkeleton, { count: 3 }) : !pros || pros.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: UserCog, title: "Nenhum profissional cadastrado", description: "Adicione os barbeiros e profissionais para que eles apareçam na agenda e agendamento online.", action: canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
      " Novo profissional"
    ] }) : void 0 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: pros.map((p) => {
      const rule = p.commission_rule ?? {};
      const percent = Number(rule.percentage ?? rule.percent ?? rule.rate ?? 40);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group relative flex flex-col justify-between border border-border bg-card/50 p-6 backdrop-blur-md transition-all hover:border-accent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-14 w-14 rounded-none border border-accent/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "rounded-none bg-accent/10 font-serif text-lg font-bold text-accent", children: p.display_name.split(" ").map((n) => n[0]).slice(0, 2).join("") }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-xl font-bold truncate", children: p.display_name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-[10px] text-accent border-accent/30", children: [
                  percent,
                  "% comissão"
                ] }),
                !p.active && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "rounded-none text-[10px] uppercase", children: "Inativo" })
              ] })
            ] })
          ] }),
          p.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: p.bio }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5 pt-1", children: p.specialties?.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none text-[10px] uppercase border-border/60", children: s }, s)) })
        ] }),
        canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex gap-2 border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => openEdit(p), className: "flex-1 rounded-none text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Editar"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDelete(p), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }, p.id);
    }) })
  ] });
}
export {
  Page as component
};
