import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { h as useCurrentShop, u as useAuth, r as customerService, B as Button, a as Badge, o as CardGridSkeleton, E as EmptyState, C as Card, b as brl, q as TableSkeleton, L as Label, I as Input, T as Textarea } from "./router-CU6k9yR1.mjs";
import { S as Switch } from "./switch-DV87h8C5.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-whcht_wB.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-BfBZegWa.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { d as Plus, f as ShieldAlert, P as Package, a5 as ShoppingBag, c as ShoppingCart, af as Pencil, T as Trash2, a8 as CircleCheck } from "../_libs/lucide-react.mjs";
import { f as format, a as addDays, H as ptBR } from "../_libs/date-fns.mjs";
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
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-id.mjs";
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
import "../_libs/radix-ui__react-tabs.mjs";
import "../_libs/radix-ui__react-roving-focus.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
const packageService = {
  /**
   * Lista todos os pacotes/planos ativos de uma barbearia
   */
  async getPackages(barbershopId) {
    const { data, error } = await supabase.from("packages").select("*").eq("barbershop_id", barbershopId).eq("active", true).order("price");
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Cria um novo pacote de serviços
   */
  async createPackage(data) {
    const finalPrice = data.price ?? (data.price_cents ? data.price_cents / 100 : 0);
    const { data: pkg, error } = await supabase.from("packages").insert({
      barbershop_id: data.barbershop_id,
      name: data.name,
      price: finalPrice,
      sessions_total: data.sessions_total,
      description: data.description || null,
      validity_days: data.validity_days || null,
      active: data.active ?? true
    }).select().single();
    if (error) throw error;
    return pkg;
  },
  /**
   * Atualiza dados de um pacote
   */
  async updatePackage(id, data) {
    const updatePayload = { ...data };
    if (data.price_cents !== void 0) {
      updatePayload.price = data.price_cents / 100;
      delete updatePayload.price_cents;
    }
    const { data: updated, error } = await supabase.from("packages").update(updatePayload).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  /**
   * Exclusão suave (desativação) de um pacote
   */
  async deletePackage(id) {
    const { error } = await supabase.from("packages").update({ active: false }).eq("id", id);
    if (error) throw error;
  },
  /**
   * Registra a compra de um pacote por um cliente
   */
  async purchasePackage(params) {
    const { customerId, packageId, barbershopId, transactionId, notes } = params;
    const { data: pkg, error: pErr } = await supabase.from("packages").select("*").eq("id", packageId).single();
    if (pErr || !pkg) throw pErr || new Error("Pacote não encontrado.");
    const validityDays = pkg.validity_days || 30;
    const expiresAt = addDays(/* @__PURE__ */ new Date(), validityDays).toISOString();
    const { data: sub, error: sErr } = await supabase.from("customer_subscriptions").insert({
      barbershop_id: barbershopId,
      customer_id: customerId,
      package_id: packageId,
      sessions_remaining: pkg.sessions_total,
      status: "active",
      purchased_at: (/* @__PURE__ */ new Date()).toISOString(),
      expires_at: expiresAt,
      transaction_id: transactionId || null,
      notes: notes || null
    }).select("*, package:packages(*)").single();
    if (sErr) throw sErr;
    return sub;
  }
};
function PacotesPage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  useAuth();
  useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const [openDialog, setOpenDialog] = reactExports.useState(false);
  const [editingPkg, setEditingPkg] = reactExports.useState(null);
  const [pkgForm, setPkgForm] = reactExports.useState({
    name: "",
    description: "",
    price: 100,
    sessions_total: 4,
    validity_days: 30,
    active: true
  });
  const [busy, setBusy] = reactExports.useState(false);
  const [sellModalOpen, setSellModalOpen] = reactExports.useState(false);
  const [sellingPkg, setSellingPkg] = reactExports.useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = reactExports.useState("");
  const [customerSearch, setCustomerSearch] = reactExports.useState("");
  const [sellBusy, setSellBusy] = reactExports.useState(false);
  const {
    data: packages,
    isLoading: loadingPackages,
    refetch: refetchPackages
  } = useQuery({
    queryKey: ["admin-packages", shopId],
    enabled: !!shopId,
    queryFn: () => packageService.getPackages(shopId)
  });
  const {
    data: subscriptions,
    isLoading: loadingSubs,
    refetch: refetchSubs
  } = useQuery({
    queryKey: ["admin-subscriptions", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("customer_subscriptions").select("*, package:packages(name, price), customer:customers(id, full_name, phone)").eq("barbershop_id", shopId).order("purchased_at", {
        ascending: false
      }).limit(100);
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: customersData
  } = useQuery({
    queryKey: ["sell-customers", shopId, customerSearch],
    enabled: !!shopId && customerSearch.length > 1,
    queryFn: () => customerService.getCustomers(shopId, {
      q: customerSearch,
      limit: 10
    })
  });
  function openNew() {
    if (!canManage) return toast.error("Permissão insuficiente.");
    setEditingPkg(null);
    setPkgForm({
      name: "",
      description: "",
      price: 100,
      sessions_total: 4,
      validity_days: 30,
      active: true
    });
    setOpenDialog(true);
  }
  function openEdit(p) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    setEditingPkg(p);
    setPkgForm({
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      sessions_total: p.sessions_total,
      validity_days: p.validity_days || 30,
      active: p.active
    });
    setOpenDialog(true);
  }
  async function handleSavePackage(e) {
    e.preventDefault();
    if (!pkgForm.name.trim()) return toast.error("Nome do pacote é obrigatório.");
    if (pkgForm.price <= 0) return toast.error("O preço deve ser maior que 0.");
    if (pkgForm.sessions_total <= 0) return toast.error("A quantidade de sessões deve ser no mínimo 1.");
    setBusy(true);
    try {
      if (editingPkg) {
        await packageService.updatePackage(editingPkg.id, {
          name: pkgForm.name.trim(),
          description: pkgForm.description.trim() || null,
          price: pkgForm.price,
          sessions_total: pkgForm.sessions_total,
          validity_days: pkgForm.validity_days,
          active: pkgForm.active
        });
        toast.success("Pacote atualizado com sucesso!");
      } else {
        await packageService.createPackage({
          barbershop_id: shopId,
          name: pkgForm.name.trim(),
          description: pkgForm.description.trim() || null,
          price: pkgForm.price,
          sessions_total: pkgForm.sessions_total,
          validity_days: pkgForm.validity_days,
          active: pkgForm.active
        });
        toast.success("Pacote criado com sucesso!");
      }
      setOpenDialog(false);
      refetchPackages();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar pacote.");
    } finally {
      setBusy(false);
    }
  }
  async function handleDeletePackage(p) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm(`Tem certeza que deseja desativar o pacote "${p.name}"?`)) return;
    try {
      await packageService.deletePackage(p.id);
      toast.success("Pacote desativado com sucesso!");
      refetchPackages();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir pacote.");
    }
  }
  function startSell(p) {
    setSellingPkg(p);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setSellModalOpen(true);
  }
  async function handleConfirmSell(e) {
    e.preventDefault();
    if (!sellingPkg || !selectedCustomerId) return toast.error("Selecione o cliente.");
    setSellBusy(true);
    try {
      await packageService.purchasePackage({
        barbershopId: shopId,
        packageId: sellingPkg.id,
        customerId: selectedCustomerId
      });
      toast.success(`Pacote "${sellingPkg.name}" vendido com sucesso!`);
      setSellModalOpen(false);
      refetchSubs();
    } catch (err) {
      toast.error(err.message || "Erro ao vender pacote.");
    } finally {
      setSellBusy(false);
    }
  }
  async function handleConsumeSession(subId, currentRemaining) {
    if (currentRemaining <= 0) return toast.error("Este pacote já teve todas as sessões utilizadas.");
    if (!confirm("Confirmar uso de 1 sessão deste pacote?")) return;
    try {
      const next = currentRemaining - 1;
      const status = next === 0 ? "exhausted" : "active";
      await supabase.from("customer_subscriptions").update({
        sessions_remaining: next,
        status
      }).eq("id", subId);
      toast.success(`Sessão debitada. Restam ${next} sessões.`);
      refetchSubs();
    } catch (err) {
      toast.error(err.message || "Erro ao debitar sessão.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Pacotes & Planos Pré-Pagos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Venda combos de sessões (ex: 4 cortes no mês) e fidelize a receita da barbearia." })
      ] }),
      canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        " Novo pacote"
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
        " Modo somente leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "packages", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "rounded-none border border-border/60 bg-card/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "packages", className: "rounded-none text-xs uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Catálogo de Pacotes (",
          packages?.length ?? 0,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "subscriptions", className: "rounded-none text-xs uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingBag, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Pacotes Vendidos (",
          subscriptions?.length ?? 0,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "packages", className: "mt-4", children: loadingPackages ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardGridSkeleton, { count: 3 }) : !packages || packages.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Package, title: "Nenhum pacote cadastrado", description: "Crie pacotes promocionais com múltiplas sessões para alavancar suas vendas recorrentes.", action: canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNew, className: "rounded-none bg-accent text-accent-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
        " Novo pacote"
      ] }) : void 0 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: packages.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group flex flex-col justify-between border border-border bg-card/50 p-6 rounded-none backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-[10px] font-mono text-accent border-accent/40", children: [
              p.sessions_total,
              " SESSÕES"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold text-foreground", children: p.name }),
            p.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: p.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between border-t border-border/30 pt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
              "Validade: ",
              p.validity_days ? `${p.validity_days} dias` : "Sem expiração"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-2xl font-bold text-accent", children: brl(Number(p.price)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-col gap-2 border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => startSell(p), className: "w-full rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "mr-1.5 h-3.5 w-3.5" }),
            " Vender Pacote"
          ] }),
          canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => openEdit(p), className: "flex-1 rounded-none text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Editar"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDeletePackage(p), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] })
        ] })
      ] }, p.id)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(TabsContent, { value: "subscriptions", className: "mt-4", children: loadingSubs ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : !subscriptions || subscriptions.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: ShoppingBag, title: "Nenhum pacote vendido", description: "Quando você realizar a venda de um pacote a um cliente, ele aparecerá aqui com o saldo restante." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Cliente" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Pacote Adquirido" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Sessões Restantes" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Data Compra" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Validade" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-right", children: "Ação" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: subscriptions.map((sub) => {
          const isExpired = sub.expires_at && new Date(sub.expires_at) < /* @__PURE__ */ new Date();
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "transition-colors hover:bg-card/80", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-foreground", children: sub.customer?.full_name || "Cliente" }),
              sub.customer?.phone && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: sub.customer.phone })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 font-bold text-foreground", children: sub.package?.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold text-accent text-base", children: sub.sessions_remaining }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: " restantes" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: format(new Date(sub.purchased_at), "dd/MM/yyyy", {
              locale: ptBR
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: sub.expires_at ? format(new Date(sub.expires_at), "dd/MM/yyyy", {
              locale: ptBR
            }) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: sub.status === "active" && !isExpired ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase", children: "Ativo" }) : sub.status === "exhausted" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-muted text-muted-foreground text-[10px] uppercase", children: "Esgotado" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-destructive/30 text-destructive text-[10px] uppercase", children: "Expirado" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-right", children: sub.sessions_remaining > 0 && sub.status === "active" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => handleConsumeSession(sub.id, sub.sessions_remaining), className: "rounded-none text-xs hover:border-accent hover:text-accent", children: "Usar 1 Sessão" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground/40", children: "—" }) })
          ] }, sub.id);
        }) })
      ] }) }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: openDialog, onOpenChange: setOpenDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSavePackage, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: editingPkg ? "Editar pacote" : "Novo pacote de serviços" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_name", children: "Nome do Pacote *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_name", value: pkgForm.name, onChange: (e) => setPkgForm({
            ...pkgForm,
            name: e.target.value
          }), placeholder: "Ex: Plano Mensal (4 Cortes + 2 Barbas)", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_price", children: "Preço Total (R$) *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_price", type: "number", step: "0.01", min: 1, value: pkgForm.price, onChange: (e) => setPkgForm({
              ...pkgForm,
              price: Number(e.target.value)
            }), className: "rounded-none font-bold", required: true })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_sessions", children: "Total de Sessões *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_sessions", type: "number", min: 1, value: pkgForm.sessions_total, onChange: (e) => setPkgForm({
              ...pkgForm,
              sessions_total: Number(e.target.value)
            }), className: "rounded-none font-mono font-bold", required: true })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_validity", children: "Validade em dias" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pkg_validity", type: "number", min: 1, value: pkgForm.validity_days, onChange: (e) => setPkgForm({
            ...pkgForm,
            validity_days: Number(e.target.value)
          }), className: "rounded-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Ex: 30 dias para utilizar todas as sessões." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_desc", children: "Descrição (opcional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "pkg_desc", rows: 2, value: pkgForm.description, onChange: (e) => setPkgForm({
            ...pkgForm,
            description: e.target.value
          }), placeholder: "Instruções ou regras de agendamento...", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pkg_active", className: "cursor-pointer", children: "Disponível para venda" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "pkg_active", checked: pkgForm.active, onCheckedChange: (v) => setPkgForm({
            ...pkgForm,
            active: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpenDialog(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Salvando..." : "Salvar pacote" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: sellModalOpen, onOpenChange: setSellModalOpen, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: sellingPkg && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleConfirmSell, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Vender Pacote" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/60 bg-card/40 p-4 space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Pacote Selecionado" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground text-sm", children: sellingPkg.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between font-mono pt-1 text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              sellingPkg.sessions_total,
              " sessões"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif font-bold text-accent text-base", children: brl(Number(sellingPkg.price)) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Buscar e Selecionar Cliente *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: customerSearch, onChange: (e) => {
            setCustomerSearch(e.target.value);
            setSelectedCustomerId("");
          }, placeholder: "Digite o nome ou telefone do cliente...", className: "h-10 rounded-none", required: !selectedCustomerId }),
          customersData?.data && customersData.data.length > 0 && !selectedCustomerId && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-36 divide-y divide-border/20 overflow-y-auto border border-border/40 bg-background text-xs", children: customersData.data.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
            setSelectedCustomerId(c.id);
            setCustomerSearch(c.full_name);
          }, className: "w-full p-2.5 text-left hover:bg-muted/40 font-medium flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: c.full_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-[10px]", children: c.phone })
          ] }, c.id)) }),
          selectedCustomerId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-emerald-500 font-bold mt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
            " Cliente vinculado para o pacote"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setSellModalOpen(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: sellBusy || !selectedCustomerId, className: "rounded-none bg-accent text-accent-foreground", children: sellBusy ? "Confirmando..." : "Confirmar Venda" })
      ] })
    ] }) }) })
  ] });
}
export {
  PacotesPage as component
};
