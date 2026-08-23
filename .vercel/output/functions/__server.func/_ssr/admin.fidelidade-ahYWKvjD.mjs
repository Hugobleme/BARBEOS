import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { h as useCurrentShop, u as useAuth, a as Badge, C as Card, L as Label, I as Input, B as Button, o as CardGridSkeleton, E as EmptyState, q as TableSkeleton, T as Textarea } from "./router-CQpyXUQj.mjs";
import { S as Switch } from "./switch-COLZ1v4m.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { T as Tabs, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-DCky3x8Q.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { f as ShieldAlert, a3 as Sparkles, G as Gift, U as Users, d as Plus, an as Award, af as Pencil, T as Trash2, b as Search } from "../_libs/lucide-react.mjs";
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
const loyaltyService = {
  /**
   * Obtém o saldo de pontos de fidelidade de um cliente
   */
  async getPoints(customerId, barbershopId) {
    let query = supabase.from("loyalty_balances").select("*, barbershop:barbershops(id, name)").eq("customer_id", customerId);
    if (barbershopId) {
      query = query.eq("barbershop_id", barbershopId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Lista todos os clientes com saldo de pontos na barbearia
   */
  async getCustomersWithPoints(barbershopId) {
    const { data, error } = await supabase.from("loyalty_balances").select("*, customer:customers(id, full_name, phone)").eq("barbershop_id", barbershopId).gt("points", 0).order("points", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Adiciona pontos ao saldo do cliente e registra a transação
   */
  async addPoints(params) {
    const { customerId, points, reason, barbershopId, appointmentId, createdBy } = params;
    const { data: balance } = await supabase.from("loyalty_balances").select("id, points, lifetime_points").eq("customer_id", customerId).eq("barbershop_id", barbershopId).maybeSingle();
    const currentPoints = Number(balance?.points || 0);
    const currentLifetime = Number(balance?.lifetime_points || 0);
    const nextPoints = currentPoints + points;
    const nextLifetime = currentLifetime + points;
    if (balance) {
      await supabase.from("loyalty_balances").update({
        points: nextPoints,
        lifetime_points: nextLifetime,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", balance.id);
    } else {
      await supabase.from("loyalty_balances").insert({
        customer_id: customerId,
        barbershop_id: barbershopId,
        points: nextPoints,
        lifetime_points: nextLifetime
      });
    }
    const { data: tx, error: txErr } = await supabase.from("loyalty_transactions").insert({
      customer_id: customerId,
      barbershop_id: barbershopId,
      points,
      kind: "earn",
      description: reason,
      appointment_id: appointmentId || null,
      created_by: createdBy || null
    }).select().single();
    if (txErr) throw txErr;
    return tx;
  },
  /**
   * Resgata pontos do saldo do cliente
   */
  async redeemPoints(params) {
    const { customerId, points, reason = "Resgate de pontos", barbershopId, createdBy } = params;
    const { data: balance, error: bErr } = await supabase.from("loyalty_balances").select("id, points").eq("customer_id", customerId).eq("barbershop_id", barbershopId).single();
    if (bErr || !balance) {
      throw new Error("Saldo de fidelidade não encontrado para este cliente.");
    }
    if (Number(balance.points || 0) < points) {
      throw new Error(`Saldo insuficiente. O cliente possui ${balance.points} pontos.`);
    }
    const nextPoints = Number(balance.points) - points;
    await supabase.from("loyalty_balances").update({
      points: nextPoints,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", balance.id);
    const { data: tx, error: txErr } = await supabase.from("loyalty_transactions").insert({
      customer_id: customerId,
      barbershop_id: barbershopId,
      points: -points,
      kind: "redeem",
      description: reason,
      created_by: createdBy || null
    }).select().single();
    if (txErr) throw txErr;
    return tx;
  },
  /**
   * Obtém recompensas/benefícios disponíveis na barbearia
   */
  async getRewards(barbershopId) {
    const { data, error } = await supabase.from("packages").select("*").eq("barbershop_id", barbershopId).order("price");
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Cria uma nova recompensa de fidelidade
   */
  async createReward(data) {
    const { data: reward, error } = await supabase.from("packages").insert({
      barbershop_id: data.barbershop_id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: 0,
      sessions_total: data.points_required,
      active: data.active ?? true
    }).select().single();
    if (error) throw error;
    return reward;
  },
  /**
   * Atualiza uma recompensa
   */
  async updateReward(id, data) {
    const { data: updated, error } = await supabase.from("packages").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  /**
   * Exclui uma recompensa
   */
  async deleteReward(id) {
    const { error } = await supabase.from("packages").delete().eq("id", id);
    if (error) throw error;
  }
};
function Page() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const {
    user
  } = useAuth();
  useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const [q, setQ] = reactExports.useState("");
  const [openRewardDialog, setOpenRewardDialog] = reactExports.useState(false);
  const [editingReward, setEditingReward] = reactExports.useState(null);
  const [rewardForm, setRewardForm] = reactExports.useState({
    name: "",
    description: "",
    points_required: 100,
    active: true
  });
  const [busyReward, setBusyReward] = reactExports.useState(false);
  const [redeemCustomer, setRedeemCustomer] = reactExports.useState(null);
  const [redeemPointsAmount, setRedeemPointsAmount] = reactExports.useState(50);
  const [redeemReason, setRedeemReason] = reactExports.useState("");
  const [busyRedeem, setBusyRedeem] = reactExports.useState(false);
  const {
    data: settings,
    refetch: refetchSettings
  } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-settings", shopId],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("barbershops").select("settings").eq("id", shopId).single();
      const l = data?.settings?.loyalty ?? {};
      return {
        enabled: !!l.enabled,
        points_per_real: Number(l.points_per_real ?? 1),
        redeem_rate: Number(l.redeem_rate ?? 100)
      };
    }
  });
  const {
    data: rewards,
    isLoading: loadingRewards,
    refetch: refetchRewards
  } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-rewards", shopId],
    queryFn: () => loyaltyService.getRewards(shopId)
  });
  const {
    data: balances,
    isLoading: loadingBalances,
    refetch: refetchBalances
  } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-balances", shopId],
    queryFn: () => loyaltyService.getCustomersWithPoints(shopId)
  });
  const filteredBalances = reactExports.useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return balances ?? [];
    return (balances ?? []).filter((b) => (b.customer?.full_name ?? "").toLowerCase().includes(term) || (b.customer?.phone ?? "").toLowerCase().includes(term));
  }, [balances, q]);
  async function saveSettings(next) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    const {
      data: cur
    } = await supabase.from("barbershops").select("settings").eq("id", shopId).single();
    const merged = {
      ...cur?.settings ?? {},
      loyalty: next
    };
    const {
      error
    } = await supabase.from("barbershops").update({
      settings: merged
    }).eq("id", shopId);
    if (error) return toast.error(error.message);
    toast.success("Configurações do programa de fidelidade atualizadas!");
    refetchSettings();
  }
  function openNewReward() {
    if (!canManage) return toast.error("Permissão insuficiente para criar recompensas.");
    setEditingReward(null);
    setRewardForm({
      name: "",
      description: "",
      points_required: 100,
      active: true
    });
    setOpenRewardDialog(true);
  }
  function openEditReward(r) {
    if (!canManage) return toast.error("Permissão insuficiente para editar recompensas.");
    setEditingReward(r);
    setRewardForm({
      name: r.name,
      description: r.description ?? "",
      points_required: r.sessions_total || 100,
      active: r.active
    });
    setOpenRewardDialog(true);
  }
  async function handleSaveReward(e) {
    e.preventDefault();
    if (!rewardForm.name.trim()) return toast.error("Nome da recompensa é obrigatório.");
    if (!rewardForm.points_required || rewardForm.points_required <= 0) {
      return toast.error("A quantidade de pontos deve ser maior que 0.");
    }
    setBusyReward(true);
    try {
      if (editingReward) {
        await loyaltyService.updateReward(editingReward.id, {
          name: rewardForm.name.trim(),
          description: rewardForm.description.trim() || null,
          sessions_total: rewardForm.points_required,
          active: rewardForm.active
        });
        toast.success("Recompensa atualizada com sucesso!");
      } else {
        await loyaltyService.createReward({
          barbershop_id: shopId,
          name: rewardForm.name.trim(),
          description: rewardForm.description.trim() || null,
          points_required: rewardForm.points_required,
          active: rewardForm.active
        });
        toast.success("Recompensa criada com sucesso!");
      }
      setOpenRewardDialog(false);
      refetchRewards();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar recompensa.");
    } finally {
      setBusyReward(false);
    }
  }
  async function handleDeleteReward(r) {
    if (!canManage) return toast.error("Permissão insuficiente para excluir.");
    if (!confirm(`Tem certeza que deseja excluir a recompensa "${r.name}"?`)) return;
    try {
      await loyaltyService.deleteReward(r.id);
      toast.success("Recompensa excluída com sucesso!");
      refetchRewards();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir recompensa.");
    }
  }
  async function handleRedeemSubmit(e) {
    e.preventDefault();
    if (!redeemCustomer) return;
    if (redeemPointsAmount <= 0) return toast.error("Quantidade de pontos inválida.");
    if (redeemPointsAmount > Number(redeemCustomer.points)) {
      return toast.error(`Saldo insuficiente (o cliente possui ${redeemCustomer.points} pts).`);
    }
    setBusyRedeem(true);
    try {
      await loyaltyService.redeemPoints({
        customerId: redeemCustomer.customer_id,
        barbershopId: shopId,
        points: redeemPointsAmount,
        reason: redeemReason.trim() || "Resgate manual de fidelidade",
        createdBy: user?.id
      });
      toast.success(`Resgate de ${redeemPointsAmount} pontos realizado com sucesso!`);
      setRedeemCustomer(null);
      refetchBalances();
    } catch (err) {
      toast.error(err.message || "Erro ao resgatar pontos.");
    } finally {
      setBusyRedeem(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Programa de Fidelidade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Recompense seus clientes fiéis com pontos acumulados a cada serviço realizado." })
      ] }),
      !canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "flex items-center gap-1.5 rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-3.5 w-3.5" }),
        " Modo somente leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/50 p-6 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-none bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground", children: "Acúmulo Automático de Pontos" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Ao finalizar agendamentos e vendas, o cliente recebe pontos no saldo." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "loyalty_switch", className: "text-xs font-bold uppercase tracking-wider text-muted-foreground", children: settings?.enabled ? "Ativo" : "Inativo" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "loyalty_switch", checked: !!settings?.enabled, disabled: !canManage, onCheckedChange: (v) => saveSettings({
            points_per_real: settings?.points_per_real ?? 1,
            redeem_rate: settings?.redeem_rate ?? 100,
            enabled: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-4 border-t border-border/40 pt-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Pontos por R$ 1,00 gasto" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "0", step: "0.1", disabled: !canManage, defaultValue: settings?.points_per_real ?? 1, onBlur: (e) => saveSettings({
            enabled: !!settings?.enabled,
            redeem_rate: settings?.redeem_rate ?? 100,
            points_per_real: Number(e.target.value) || 1
          }), className: "rounded-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Ex: R$ 50 gastos geram 50 pontos." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs", children: "Valor do ponto no resgate (Pontos por R$ 1)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "number", min: "1", disabled: !canManage, defaultValue: settings?.redeem_rate ?? 100, onBlur: (e) => saveSettings({
            enabled: !!settings?.enabled,
            points_per_real: settings?.points_per_real ?? 1,
            redeem_rate: Number(e.target.value) || 100
          }), className: "rounded-none" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Ex: 100 pontos equivalem a R$ 1,00 de desconto." })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { defaultValue: "rewards", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsList, { className: "rounded-none border border-border/60 bg-card/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "rewards", className: "rounded-none text-xs uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Catálogo de Recompensas"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsTrigger, { value: "customers", className: "rounded-none text-xs uppercase tracking-wider", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "mr-1.5 h-3.5 w-3.5" }),
          " Clientes com Pontos (",
          balances?.length ?? 0,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "rewards", className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNewReward, className: "rounded-none bg-accent text-accent-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
          " Nova recompensa"
        ] }) }),
        loadingRewards ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardGridSkeleton, { count: 3 }) : !rewards || rewards.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Gift, title: "Nenhuma recompensa cadastrada", description: "Cadastre itens como 'Corte Grátis' ou 'Pomada' para os clientes resgatarem com pontos.", action: canManage ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: openNewReward, className: "rounded-none bg-accent text-accent-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-1.5 h-4 w-4" }),
          " Nova recompensa"
        ] }) : void 0 }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: rewards.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group flex flex-col justify-between border border-border bg-card/50 p-6 rounded-none backdrop-blur-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none font-mono text-xs font-bold text-accent border-accent/40", children: [
                r.sessions_total,
                " PONTOS"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold text-foreground", children: r.name }),
              r.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: r.description })
            ] })
          ] }),
          canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex gap-2 border-t border-border/40 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => openEditReward(r), className: "flex-1 rounded-none text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Editar"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", onClick: () => handleDeleteReward(r), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
          ] })
        ] }, r.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(TabsContent, { value: "customers", className: "mt-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative max-w-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar cliente com saldo por nome ou telefone...", value: q, onChange: (e) => setQ(e.target.value), className: "h-10 rounded-none pl-9 text-xs" })
        ] }),
        loadingBalances ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, {}) : filteredBalances.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: Users, title: "Nenhum cliente com pontos", description: "Os clientes que acumularem pontos em agendamentos aparecerão aqui." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-left text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Cliente" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Telefone" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Saldo Atual" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4", children: "Total Vitalício" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-6 py-4 text-right", children: "Ação" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border/20", children: filteredBalances.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "transition-colors hover:bg-card/80", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif font-bold text-foreground", children: b.customer?.full_name || "Cliente" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-xs text-muted-foreground", children: b.customer?.phone || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 font-mono font-bold text-accent text-base", children: [
              Number(b.points),
              " pts"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-6 py-4 text-xs text-muted-foreground font-mono", children: [
              Number(b.lifetime_points || b.points),
              " pts"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-6 py-4 text-right", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
              setRedeemCustomer(b);
              setRedeemPointsAmount(Math.min(50, Number(b.points)));
              setRedeemReason("");
            }, className: "rounded-none text-xs hover:border-accent hover:text-accent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Resgatar Pontos"
            ] }) })
          ] }, b.id)) })
        ] }) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: openRewardDialog, onOpenChange: setOpenRewardDialog, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSaveReward, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: editingReward ? "Editar recompensa" : "Nova recompensa de fidelidade" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reward_name", children: "Nome do Benefício / Recompensa *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "reward_name", value: rewardForm.name, onChange: (e) => setRewardForm({
            ...rewardForm,
            name: e.target.value
          }), placeholder: "Ex: Corte de Cabelo Grátis", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reward_points", children: "Pontos Necessários para Resgatar *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "reward_points", type: "number", min: 1, value: rewardForm.points_required, onChange: (e) => setRewardForm({
            ...rewardForm,
            points_required: Number(e.target.value)
          }), className: "rounded-none font-mono font-bold", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reward_desc", children: "Descrição (opcional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "reward_desc", rows: 2, value: rewardForm.description, onChange: (e) => setRewardForm({
            ...rewardForm,
            description: e.target.value
          }), placeholder: "Regras de utilização ou validade da recompensa...", className: "rounded-none" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "reward_active", className: "cursor-pointer", children: "Disponível para resgate" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { id: "reward_active", checked: rewardForm.active, onCheckedChange: (v) => setRewardForm({
            ...rewardForm,
            active: v
          }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setOpenRewardDialog(false), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busyReward, className: "rounded-none bg-accent text-accent-foreground", children: busyReward ? "Salvando..." : "Salvar recompensa" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!redeemCustomer, onOpenChange: (o) => !o && setRedeemCustomer(null), children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: redeemCustomer && /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleRedeemSubmit, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Resgatar Pontos" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/60 bg-card/40 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground text-sm", children: redeemCustomer.customer?.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-muted-foreground", children: [
            "Saldo disponível: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono font-bold text-accent", children: [
              redeemCustomer.points,
              " pontos"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "redeem_amount", children: "Quantidade de pontos a debitar *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "redeem_amount", type: "number", min: 1, max: Number(redeemCustomer.points), value: redeemPointsAmount, onChange: (e) => setRedeemPointsAmount(Number(e.target.value)), className: "rounded-none font-mono font-bold", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "redeem_motivo", children: "Motivo do Resgate / Prêmio" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "redeem_motivo", value: redeemReason, onChange: (e) => setRedeemReason(e.target.value), placeholder: "Ex: Troca por Pomada Modeladora", className: "rounded-none" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => setRedeemCustomer(null), className: "rounded-none", children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busyRedeem, className: "rounded-none bg-accent text-accent-foreground", children: busyRedeem ? "Processando..." : "Confirmar Resgate" })
      ] })
    ] }) }) })
  ] });
}
export {
  Page as component
};
