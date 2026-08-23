import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { h as useCurrentShop, C as Card, I as Input, a as Badge, q as TableSkeleton, E as EmptyState, B as Button, L as Label, T as Textarea } from "./router-CQpyXUQj.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { S as Switch } from "./switch-COLZ1v4m.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { t as Star, a8 as CircleCheck, V as MessageSquare, az as Reply, T as Trash2 } from "../_libs/lucide-react.mjs";
import { f as format, H as ptBR } from "../_libs/date-fns.mjs";
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
import "../_libs/radix-ui__react-switch.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-portal.mjs";
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
const reviewService = {
  /**
   * Registra uma nova avaliação de satisfação
   */
  async createReview(data) {
    const { data: review, error } = await supabase.from("satisfaction_surveys").insert({
      barbershop_id: data.barbershop_id,
      appointment_id: data.appointment_id,
      professional_id: data.professional_id || null,
      shop_rating: data.shop_rating ?? null,
      professional_rating: data.professional_rating ?? null,
      nps: data.nps ?? null,
      comment: data.comment || null,
      is_public: data.is_public ?? true,
      answered_at: (/* @__PURE__ */ new Date()).toISOString()
    }).select().single();
    if (error) throw error;
    return review;
  },
  /**
   * Obtém as avaliações de uma barbearia com dados do cliente e profissional
   */
  async getReviews(barbershopId) {
    const { data, error } = await supabase.from("satisfaction_surveys").select(`
        *,
        professional:professionals(id, display_name),
        appointment:appointments(
          id,
          scheduled_start,
          customer:customers(id, full_name)
        )
      `).eq("barbershop_id", barbershopId).order("answered_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Atualiza uma avaliação existente
   */
  async updateReview(id, data) {
    const { data: updated, error } = await supabase.from("satisfaction_surveys").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  /**
   * Exclui uma avaliação
   */
  async deleteReview(id) {
    const { error } = await supabase.from("satisfaction_surveys").delete().eq("id", id);
    if (error) throw error;
  }
};
function StarRating({
  value,
  size = "md"
}) {
  if (value == null) return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" });
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-0.5", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `${iconSize} ${i <= value ? "fill-accent text-accent" : "text-muted-foreground/30"}` }, i)) });
}
function AvaliacoesPage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";
  const [ratingFilter, setRatingFilter] = reactExports.useState("all");
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const [replyModalReview, setReplyModalReview] = reactExports.useState(null);
  const {
    data: reviews,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["admin-reviews", shopId],
    enabled: !!shopId,
    queryFn: () => reviewService.getReviews(shopId)
  });
  const filteredReviews = reactExports.useMemo(() => {
    return (reviews ?? []).filter((r) => {
      const matchRating = ratingFilter === "all" || ratingFilter === "5" && (r.shop_rating === 5 || r.professional_rating === 5) || ratingFilter === "4" && (r.shop_rating === 4 || r.professional_rating === 4) || ratingFilter === "3" && (r.shop_rating === 3 || r.professional_rating === 3) || ratingFilter === "low" && (r.shop_rating && r.shop_rating <= 2 || r.professional_rating && r.professional_rating <= 2);
      const term = searchTerm.trim().toLowerCase();
      const customerName = r.appointment?.customer?.full_name?.toLowerCase() || "";
      const comment = r.comment?.toLowerCase() || "";
      const proName = r.professional?.display_name?.toLowerCase() || "";
      const matchSearch = !term || customerName.includes(term) || comment.includes(term) || proName.includes(term);
      return matchRating && matchSearch;
    });
  }, [reviews, ratingFilter, searchTerm]);
  const stats = reactExports.useMemo(() => {
    const list = reviews ?? [];
    if (!list.length) {
      return {
        avgShop: "0.0",
        avgPro: "0.0",
        npsScore: "—",
        total: 0
      };
    }
    const shopRatings = list.map((r) => r.shop_rating).filter((v) => v != null);
    const proRatings = list.map((r) => r.professional_rating).filter((v) => v != null);
    const npsList = list.map((r) => r.nps).filter((v) => v != null);
    const avgShop = shopRatings.length ? (shopRatings.reduce((a, b) => a + b, 0) / shopRatings.length).toFixed(1) : "5.0";
    const avgPro = proRatings.length ? (proRatings.reduce((a, b) => a + b, 0) / proRatings.length).toFixed(1) : "5.0";
    let npsScore = "—";
    if (npsList.length) {
      const promoters = npsList.filter((n) => n >= 9).length;
      const detractors = npsList.filter((n) => n <= 6).length;
      npsScore = `${Math.round((promoters - detractors) / npsList.length * 100)}`;
    }
    return {
      avgShop,
      avgPro,
      npsScore,
      total: list.length
    };
  }, [reviews]);
  async function handleTogglePublic(id, isPublic) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    try {
      await reviewService.updateReview(id, {
        is_public: isPublic
      });
      toast.success(isPublic ? "Avaliação exibida publicamente." : "Avaliação ocultada do público.");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao alterar visibilidade.");
    }
  }
  async function handleDeleteReview(id) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm("Tem certeza que deseja excluir permanentemente esta avaliação?")) return;
    try {
      await reviewService.deleteReview(id);
      toast.success("Avaliação excluída com sucesso!");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao excluir avaliação.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Gestão de Avaliações" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Acompanhe o nível de satisfação dos clientes, responda comentários e modere a exibição pública." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Média da Barbearia" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 text-accent fill-accent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-accent", children: stats.avgShop }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-[10px] text-muted-foreground", children: [
          "Baseado em ",
          stats.total,
          " opiniões"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Média dos Barbeiros" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 text-foreground/60" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: stats.avgPro }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Desempenho da equipe" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "NPS (Lealdade)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-4 w-4 text-emerald-500" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-emerald-500", children: stats.npsScore }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Escala de -100 a +100" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Total de Respostas" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4 text-accent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold text-foreground", children: stats.total }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] text-muted-foreground", children: "Feedbacks recebidos" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-none border border-border bg-card/40 p-4 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-[220px] flex-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { placeholder: "Buscar por cliente, barbeiro ou comentário...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "rounded-none h-10 text-xs" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: ratingFilter, onValueChange: setRatingFilter, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[180px] rounded-none h-10 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Filtrar por estrelas" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas as notas" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "5", children: "⭐⭐⭐⭐⭐ (5 estrelas)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "4", children: "⭐⭐⭐⭐ (4 estrelas)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "3", children: "⭐⭐⭐ (3 estrelas)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "low", children: "⭐⭐ ou menos (Críticas)" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-xs font-mono text-accent", children: [
        filteredReviews.length,
        " ",
        filteredReviews.length === 1 ? "avaliação" : "avaliações"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(TableSkeleton, { rows: 4 }) : filteredReviews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: MessageSquare, title: "Nenhuma avaliação encontrada", description: "Os feedbacks enviados pelos clientes após os atendimentos aparecerão aqui." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divide-y divide-border/20", children: filteredReviews.map((r) => {
      const customerName = r.appointment?.customer?.full_name || "Cliente";
      const proName = r.professional?.display_name || "Barbeiro";
      const dateStr = r.answered_at ? format(new Date(r.answered_at), "dd 'de' MMMM yyyy · HH:mm", {
        locale: ptBR
      }) : "—";
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-6 first:pt-0 last:pb-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif font-bold text-base text-foreground", children: customerName }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "·" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: dateStr }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-[10px] text-muted-foreground border-border/60", children: [
              "Atendido por ",
              proName
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-5 text-xs text-muted-foreground pt-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Barbearia:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: r.shop_rating })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: "Profissional:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(StarRating, { value: r.professional_rating })
            ] }),
            r.nps != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 font-mono text-xs", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "NPS:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "text-accent", children: [
                r.nps,
                "/10"
              ] })
            ] })
          ] }),
          r.comment ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-sm leading-relaxed text-foreground/90 bg-card/60 border border-border/40 p-3.5", children: [
            '"',
            r.comment,
            '"'
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs italic text-muted-foreground", children: "Cliente não deixou comentário em texto." }),
          r.reply && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 border-l-2 border-accent bg-accent/5 p-3 text-xs space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-accent flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Reply, { className: "h-3.5 w-3.5" }),
              " Resposta da Barbearia:"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: r.reply })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 shrink-0 pt-2 sm:pt-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 border border-border bg-card/40 px-3 py-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold text-muted-foreground", children: r.is_public ? "Pública" : "Oculta" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Switch, { checked: r.is_public, onCheckedChange: (val) => handleTogglePublic(r.id, val), disabled: !canManage })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { size: "sm", variant: "outline", onClick: () => setReplyModalReview(r), className: "rounded-none text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Reply, { className: "mr-1.5 h-3.5 w-3.5 text-accent" }),
            r.reply ? "Editar Resposta" : "Responder"
          ] }),
          canManage && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "ghost", onClick: () => handleDeleteReview(r.id), className: "rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground", "aria-label": "Excluir avaliação", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }) }, r.id);
    }) }) }),
    replyModalReview && /* @__PURE__ */ jsxRuntimeExports.jsx(ReplyModal, { review: replyModalReview, onClose: () => setReplyModalReview(null), onSuccess: () => {
      setReplyModalReview(null);
      refetch();
    } })
  ] });
}
function ReplyModal({
  review,
  onClose,
  onSuccess
}) {
  const [replyText, setReplyText] = reactExports.useState(review.reply || "");
  const [busy, setBusy] = reactExports.useState(false);
  async function handleSendReply(e) {
    e.preventDefault();
    if (!replyText.trim()) return toast.error("Digite sua resposta.");
    setBusy(true);
    try {
      await reviewService.updateReview(review.id, {
        comment: review.comment,
        is_public: review.is_public ?? true
      });
      toast.success("Resposta enviada com sucesso!");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Erro ao responder avaliação.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: true, onOpenChange: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSendReply, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Responder Avaliação" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border bg-card/60 p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: review.appointment?.customer?.full_name || "Cliente" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-muted-foreground italic", children: [
          '"',
          review.comment || "Sem comentário",
          '"'
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "rep_text", children: "Sua Mensagem Pública *" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "rep_text", rows: 4, value: replyText, onChange: (e) => setReplyText(e.target.value), placeholder: "Agradeça o cliente ou esclareça a experiência...", className: "rounded-none resize-none", required: true })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onClose, className: "rounded-none", children: "Cancelar" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Salvando..." : "Publicar Resposta" })
    ] })
  ] }) }) });
}
export {
  AvaliacoesPage as component
};
