import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { h as useCurrentShop, d as barbershopService, a as Badge, B as Button, C as Card, q as TableSkeleton, E as EmptyState, L as Label, I as Input } from "./router-CU6k9yR1.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-C30H0gvg.mjs";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-whcht_wB.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { f as ShieldAlert, J as UserCog, N as UsersRound, ac as Mail, as as Copy, T as Trash2, d as Plus } from "../_libs/lucide-react.mjs";
import { f as format } from "../_libs/date-fns.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
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
const ROLE_LABELS = {
  owner: "Proprietário (Dono)",
  admin: "Administrador",
  professional: "Barbeiro / Profissional",
  barber: "Barbeiro",
  receptionist: "Recepção / Atendimento",
  customer: "Cliente"
};
function EquipePage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const {
    data: members,
    isLoading: loadingMembers,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ["admin-team-members", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getMembers(shopId)
  });
  const {
    data: invites,
    isLoading: loadingInvites,
    refetch: refetchInvites
  } = useQuery({
    queryKey: ["admin-invites", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("barbershop_invitations").select("*").eq("barbershop_id", shopId).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  async function handleRevokeInvite(id) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    try {
      const {
        error
      } = await supabase.from("barbershop_invitations").update({
        status: "revoked"
      }).eq("id", id);
      if (error) throw error;
      toast.success("Convite revogado com sucesso!");
      refetchInvites();
    } catch (err) {
      toast.error(err.message || "Erro ao revogar convite.");
    }
  }
  async function handleToggleActive(member) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (member.role === "owner") return toast.error("O proprietário principal não pode ser desativado.");
    try {
      const next = !member.active;
      const {
        error
      } = await supabase.from("barbershop_members").update({
        active: next
      }).eq("id", member.id);
      if (error) throw error;
      toast.success(next ? "Membro reativado com sucesso!" : "Membro desativado da equipe.");
      refetchMembers();
    } catch (err) {
      toast.error(err.message || "Erro ao alterar status do membro.");
    }
  }
  function handleCopyInviteLink(token) {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do convite copiado para a área de transferência!");
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Equipe & Permissões" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Gerencie os membros da equipe administrativa, recepção e profissionais da barbearia." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        canManage ? /* @__PURE__ */ jsxRuntimeExports.jsx(InviteDialog, { shopId, onCreated: refetchInvites }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
          " Somente leitura"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", size: "sm", className: "rounded-none text-xs uppercase font-bold", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/admin/profissionais", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UserCog, { className: "mr-1.5 h-3.5 w-3.5 text-accent" }),
          " Gestão de Barbeiros"
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between border-b border-border/40 pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-serif text-lg font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(UsersRound, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Membros da Barbearia" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-[10px] font-mono text-accent", children: [
          members?.length ?? 0,
          " membros"
        ] })
      ] }),
      loadingMembers ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !members || members.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: UsersRound, title: "Nenhum membro cadastrado", description: "Convide membros para auxiliar no gerenciamento da barbearia." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Nome / Usuário" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Função / Papel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Telefone" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: members.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-card/60 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-foreground", children: m.profile?.full_name || "Membro sem nome" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none text-[10px] font-bold uppercase border-border/60", children: ROLE_LABELS[m.role] || m.role }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs text-muted-foreground", children: m.profile?.phone || "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: m.active ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase", children: "Ativo" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase", children: "Inativo" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right", children: canManage && m.role !== "owner" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleToggleActive(m), className: "rounded-none text-xs hover:text-accent", children: m.active ? "Desativar" : "Reativar" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/40", children: "—" }) })
        ] }, m.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center justify-between border-b border-border/40 pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-serif text-lg font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Convites Enviados" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-[10px] font-mono text-muted-foreground", children: [
          invites?.length ?? 0,
          " convites"
        ] })
      ] }),
      loadingInvites ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !invites || invites.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "py-8 text-center text-xs text-muted-foreground", children: 'Nenhum convite pendente. Clique em "Convidar Membro" para enviar links de acesso.' }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "E-mail" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Papel Pretendido" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Data de Envio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-3 text-right", children: "Ações" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: invites.map((inv) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-card/60 transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 font-mono text-xs font-bold text-foreground", children: inv.email }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none text-[10px] uppercase", children: ROLE_LABELS[inv.role] || inv.role }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-xs text-muted-foreground", children: format(new Date(inv.created_at), "dd/MM/yyyy · HH:mm") }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3", children: inv.status === "pending" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase", children: "Pendente" }) : inv.status === "accepted" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 text-emerald-500 text-[10px] font-bold uppercase", children: "Aceito" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-destructive/30 text-destructive text-[10px] uppercase", children: "Revogado" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-3 text-right", children: inv.status === "pending" && canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => handleCopyInviteLink(inv.token), className: "rounded-none text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Copiar Link"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleRevokeInvite(inv.id), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] }) })
        ] }, inv.id)) })
      ] }) })
    ] })
  ] });
}
function InviteDialog({
  shopId,
  onCreated
}) {
  const [open, setOpen] = reactExports.useState(false);
  const [email, setEmail] = reactExports.useState("");
  const [role, setRole] = reactExports.useState("professional");
  const [busy, setBusy] = reactExports.useState(false);
  async function submit(e) {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Informe um e-mail válido.");
    setBusy(true);
    try {
      const {
        data: u
      } = await supabase.auth.getUser();
      const {
        data,
        error
      } = await supabase.from("barbershop_invitations").insert({
        barbershop_id: shopId,
        email: email.toLowerCase().trim(),
        role,
        invited_by: u.user?.id
      }).select("token").single();
      if (error || !data) throw error || new Error("Falha ao gerar convite.");
      const url = `${window.location.origin}/convite/${data.token}`;
      navigator.clipboard.writeText(url);
      toast.success("Convite criado! O link de acesso foi copiado para a área de transferência.");
      setOpen(false);
      setEmail("");
      onCreated();
    } catch (err) {
      toast.error(err.message || "Erro ao criar convite.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
      " Convidar Membro"
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Convidar Membro da Equipe" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "inv_email", children: "E-mail do Membro *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "inv_email", type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "colaborador@barbearia.com", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Função / Permissão no Sistema" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: role, onValueChange: (v) => setRole(v), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "professional", children: "Barbeiro / Profissional" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "receptionist", children: "Recepção / Atendente" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "owner", children: "Sócio / Proprietário" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground border-t border-border/40 pt-3", children: "Ao gerar o convite, um link exclusivo será criado para o novo membro aceitar e definir sua senha." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpen(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Gerando..." : "Gerar e Copiar Link" })
      ] })
    ] }) })
  ] });
}
export {
  EquipePage as component
};
