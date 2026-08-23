import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { u as useAuth, h as useCurrentShop, d as barbershopService, B as Button, C as Card, b as brl, a as Badge, o as CardGridSkeleton, L as Label, I as Input } from "./router-CU6k9yR1.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-whcht_wB.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { E as startOfMonth, l as endOfMonth } from "../_libs/date-fns.mjs";
import { d as Plus, z as DollarSign, a9 as TrendingUp, U as Users, g as Building2, h as MapPin, a4 as Phone, m as ArrowRight } from "../_libs/lucide-react.mjs";
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
function FranquiaPage() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    shopId: currentShopId,
    setShopId
  } = useCurrentShop();
  const [createModalOpen, setCreateModalOpen] = reactExports.useState(false);
  const {
    data: ownedShops,
    isLoading: loadingShops,
    refetch: refetchOwned
  } = useQuery({
    queryKey: ["admin-owned-barbershops", user?.id],
    enabled: !!user?.id,
    queryFn: () => barbershopService.getBarbershopsByOwner(user.id)
  });
  const shopIds = reactExports.useMemo(() => (ownedShops ?? []).map((s) => s.id), [ownedShops]);
  const {
    data: stats,
    isLoading: loadingStats
  } = useQuery({
    queryKey: ["franquia-shop-stats", shopIds.join(",")],
    enabled: shopIds.length > 0,
    queryFn: async () => {
      const now = /* @__PURE__ */ new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();
      return Promise.all((ownedShops ?? []).map(async (s) => {
        const [apptsRes, customersRes] = await Promise.all([supabase.from("appointments").select("total_amount, status").eq("barbershop_id", s.id).gte("scheduled_start", monthStart).lte("scheduled_start", monthEnd), supabase.from("customers").select("id", {
          count: "exact",
          head: true
        }).eq("barbershop_id", s.id)]);
        const completed = (apptsRes.data ?? []).filter((a) => a.status === "completed");
        const monthRevenue = completed.reduce((acc, a) => acc + Number(a.total_amount || 0), 0);
        const monthCount = completed.length;
        const avgTicket = monthCount > 0 ? monthRevenue / monthCount : 0;
        const contacts = s.contacts || {};
        return {
          id: s.id,
          name: s.name,
          slug: s.slug,
          role: "owner",
          active: s.active,
          address: s.address,
          phone: contacts.phone || contacts.whatsapp || "",
          monthRevenue,
          monthCount,
          avgTicket,
          customers: customersRes.count ?? 0
        };
      }));
    }
  });
  const totals = reactExports.useMemo(() => {
    return (stats ?? []).reduce((acc, s) => ({
      revenue: acc.revenue + s.monthRevenue,
      count: acc.count + s.monthCount,
      customers: acc.customers + s.customers
    }), {
      revenue: 0,
      count: 0,
      customers: 0
    });
  }, [stats]);
  const bestUnit = reactExports.useMemo(() => {
    if (!stats || !stats.length) return null;
    return [...stats].sort((a, b) => b.monthRevenue - a.monthRevenue)[0];
  }, [stats]);
  function handleSelectShop(id) {
    setShopId(id);
    toast.success("Unidade ativa alterada!");
    navigate({
      to: "/admin"
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 pb-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Painel da Franquia" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Gerencie todas as suas filiais e barbearias em um único lugar com visão consolidada." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setCreateModalOpen(true), className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-3.5 w-3.5" }),
        " Nova Unidade"
      ] })
    ] }),
    (ownedShops?.length ?? 0) > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Faturamento da Rede (Mês)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(DollarSign, { className: "h-4 w-4 text-accent" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-accent", children: brl(totals.revenue) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-muted-foreground", children: [
            ownedShops?.length,
            " unidades ativas"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Atendimentos Concluídos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "h-4 w-4 text-emerald-500" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: totals.count }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Volume total no mês corrente" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Base Total de Clientes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4 text-blue-400" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: totals.customers }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Cadastros somados de todas as lojas" })
        ] })
      ] }),
      bestUnit && bestUnit.monthRevenue > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col gap-3 rounded-none border border-accent/40 bg-accent/5 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center bg-accent text-accent-foreground font-serif font-bold text-lg", children: "🏆" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-widest text-accent font-bold", children: "Unidade Destaque do Mês" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-xl font-bold text-foreground", children: bestUnit.name })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-2xl font-bold text-accent", children: brl(bestUnit.monthRevenue) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
            bestUnit.monthCount,
            " atendimentos realizados"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border/40 pb-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-2xl font-bold", children: "Suas Unidades Cadastradas" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-xs font-mono text-accent", children: [
          ownedShops?.length ?? 0,
          " ",
          ownedShops?.length === 1 ? "unidade" : "unidades"
        ] })
      ] }),
      loadingShops || loadingStats ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardGridSkeleton, { count: 3 }) : !stats || stats.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-12 text-center rounded-none border border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "mx-auto h-12 w-12 text-muted-foreground/40 mb-3" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold", children: "Nenhuma unidade cadastrada" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-1 max-w-sm mx-auto", children: 'Clique em "Nova Unidade" para cadastrar sua barbearia ou adicionar uma nova filial à sua rede.' })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: stats.map((s) => {
        const isCurrent = s.id === currentShopId;
        const addr = s.address || {};
        const cityState = [addr.neighborhood || addr.district, addr.city, addr.state].filter(Boolean).join(" · ");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: `flex flex-col justify-between rounded-none border p-6 backdrop-blur-md transition-all ${isCurrent ? "border-accent bg-card shadow-lg shadow-accent/5" : "border-border bg-card/40 hover:border-border/80"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold text-foreground", children: s.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground mt-1", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5 text-accent shrink-0" }),
                  cityState || "Endereço não configurado"
                ] }),
                s.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }),
                  s.phone
                ] })
              ] }),
              isCurrent ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { className: "rounded-none bg-accent text-accent-foreground text-[10px] font-bold uppercase", children: "Ativa" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none text-[10px] uppercase border-border/60", children: "Filial" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 border-y border-border/40 py-3 text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-muted-foreground", children: "Faturamento (Mês)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-lg font-bold text-accent", children: brl(s.monthRevenue) })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase text-muted-foreground", children: "Atendimentos" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-lg font-bold text-foreground", children: s.monthCount })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 flex items-center justify-between gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", onClick: () => handleSelectShop(s.id), className: `w-full rounded-none text-xs uppercase font-bold tracking-wider ${isCurrent ? "bg-accent text-accent-foreground hover:bg-foreground hover:text-background" : "bg-card border border-border hover:bg-accent hover:text-accent-foreground"}`, children: [
            isCurrent ? "Painel Aberto" : "Gerenciar Unidade",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-1.5 h-3.5 w-3.5" })
          ] }) })
        ] }, s.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CreateShopModal, { open: createModalOpen, onOpenChange: setCreateModalOpen, ownerId: user?.id || "", onSuccess: () => {
      setCreateModalOpen(false);
      refetchOwned();
    } })
  ] });
}
function CreateShopModal({
  open,
  onOpenChange,
  ownerId,
  onSuccess
}) {
  const [name, setName] = reactExports.useState("");
  const [phone, setPhone] = reactExports.useState("");
  const [street, setStreet] = reactExports.useState("");
  const [neighborhood, setNeighborhood] = reactExports.useState("");
  const [city, setCity] = reactExports.useState("");
  const [state, setState] = reactExports.useState("SP");
  const [busy, setBusy] = reactExports.useState(false);
  async function handleCreate(e) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome da unidade.");
    setBusy(true);
    try {
      await barbershopService.createBarbershop({
        name: name.trim(),
        ownerId,
        phone: phone.trim() || void 0,
        address: {
          street: street.trim() || null,
          neighborhood: neighborhood.trim() || null,
          city: city.trim() || null,
          state: state.trim().toUpperCase() || "SP"
        }
      });
      toast.success("Nova unidade criada com sucesso!");
      setName("");
      setPhone("");
      setStreet("");
      setNeighborhood("");
      setCity("");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Erro ao criar nova unidade.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleCreate, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Cadastrar Nova Unidade" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sh_name", children: "Nome da Unidade / Filial *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sh_name", value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex.: BarberOS — Unidade Jardins", className: "rounded-none", required: true })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sh_phone", children: "Telefone / WhatsApp" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sh_phone", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "(11) 99999-0000", className: "rounded-none" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sh_street", children: "Rua / Endereço" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sh_street", value: street, onChange: (e) => setStreet(e.target.value), placeholder: "Rua Oscar Freire", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sh_neigh", children: "Bairro" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sh_neigh", value: neighborhood, onChange: (e) => setNeighborhood(e.target.value), placeholder: "Jardins", className: "rounded-none" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sh_city", children: "Cidade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sh_city", value: city, onChange: (e) => setCity(e.target.value), placeholder: "São Paulo", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "sh_uf", children: "UF" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "sh_uf", maxLength: 2, value: state, onChange: (e) => setState(e.target.value.toUpperCase()), placeholder: "SP", className: "rounded-none uppercase font-mono" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), className: "rounded-none", children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Criando..." : "Criar Unidade" })
    ] })
  ] }) }) });
}
export {
  FranquiaPage as component
};
