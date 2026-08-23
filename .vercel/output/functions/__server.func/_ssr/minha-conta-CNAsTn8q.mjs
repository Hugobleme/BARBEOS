import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { u as useAuth, R as Route$z, B as Button, b as brl, a as Badge } from "./router-CU6k9yR1.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { n as LogOut, G as Gift, W as Wallet, o as Calendar, i as Clock, p as Crown } from "../_libs/lucide-react.mjs";
import { f as format, H as ptBR } from "../_libs/date-fns.mjs";
import "./sheet-CYhR-3Ru.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/zod.mjs";
function Page() {
  const {
    user,
    loading
  } = useAuth();
  const nav = useNavigate();
  reactExports.useEffect(() => {
    if (!loading && !user) nav({
      to: "/login"
    });
  }, [loading, user, nav]);
  const {
    data: appts
  } = useQuery({
    enabled: !!user,
    queryKey: ["my-appts", user?.id],
    staleTime: 1e3 * 60 * 5,
    // 5 minutes
    queryFn: async () => {
      const {
        data: customers
      } = await supabase.from("customers").select("id").eq("profile_id", user.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const {
        data
      } = await supabase.from("appointments").select("id, status, scheduled_start, scheduled_end, total_amount, professional:professionals(display_name), services:appointment_services(service:services(name))").in("customer_id", ids).order("scheduled_start", {
        ascending: false
      });
      return data ?? [];
    }
  });
  const {
    data: loyalty
  } = useQuery({
    enabled: !!user,
    queryKey: ["my-loyalty", user?.id],
    staleTime: 1e3 * 60 * 5,
    // 5 minutes
    queryFn: async () => {
      const {
        data: customers
      } = await supabase.from("customers").select("id").eq("profile_id", user.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return {
        balances: [],
        txs: []
      };
      const [{
        data: balances
      }, {
        data: txs
      }] = await Promise.all([supabase.from("loyalty_balances").select("points, lifetime_points, barbershop:barbershops(id, name)").in("customer_id", ids), supabase.from("loyalty_transactions").select("id, kind, points, description, created_at, barbershop:barbershops(name)").in("customer_id", ids).order("created_at", {
        ascending: false
      }).limit(20)]);
      return {
        balances: balances ?? [],
        txs: txs ?? []
      };
    }
  });
  const {
    data: wallet
  } = useQuery({
    enabled: !!user,
    queryKey: ["my-wallet", user?.id],
    staleTime: 1e3 * 60 * 5,
    // 5 minutes
    queryFn: async () => {
      const {
        data: customers
      } = await supabase.from("customers").select("id").eq("profile_id", user.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return {
        balances: [],
        txs: []
      };
      const [{
        data: balances
      }, {
        data: txs
      }] = await Promise.all([supabase.from("wallet_balances").select("balance, lifetime_credited, barbershop:barbershops(id, name)").in("customer_id", ids), supabase.from("wallet_transactions").select("id, kind, amount, description, created_at, barbershop:barbershops(name)").in("customer_id", ids).order("created_at", {
        ascending: false
      }).limit(20)]);
      return {
        balances: balances ?? [],
        txs: txs ?? []
      };
    }
  });
  const {
    data: subs
  } = useQuery({
    enabled: !!user,
    queryKey: ["my-subs", user?.id],
    staleTime: 1e3 * 60 * 5,
    queryFn: async () => {
      const {
        data: customers
      } = await supabase.from("customers").select("id").eq("profile_id", user.id);
      const ids = (customers ?? []).map((c) => c.id);
      if (ids.length === 0) return [];
      const {
        data
      } = await supabase.from("customer_subscriptions").select("*, package:packages(name, sessions_total)").in("customer_id", ids).eq("status", "active").order("purchased_at", {
        ascending: false
      });
      return data ?? [];
    }
  });
  if (loading || !user) return null;
  const upcoming = (appts ?? []).filter((a) => new Date(a.scheduled_start) >= /* @__PURE__ */ new Date() && a.status !== "cancelled");
  const past = (appts ?? []).filter((a) => new Date(a.scheduled_start) < /* @__PURE__ */ new Date() || a.status === "cancelled");
  const {
    queryClient
  } = Route$z.useRouteContext();
  async function cancel(id) {
    const {
      error
    } = await supabase.from("appointments").update({
      status: "cancelled"
    }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agendamento cancelado");
    queryClient.invalidateQueries({
      queryKey: ["my-appts"]
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PublicLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[360px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_70%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-6 py-16 md:py-20", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-medium uppercase tracking-[0.35em] text-accent", children: "Minha conta" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl", children: "Olá" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: user.email })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", size: "sm", className: "uppercase tracking-[0.2em]", onClick: () => supabase.auth.signOut().then(() => nav({
          to: "/"
        })), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "mr-2 h-4 w-4" }),
          "Sair"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(VIPStatus, { lifetimePoints: loyalty?.balances?.reduce((acc, b) => acc + Number(b.lifetime_points || 0), 0) || 0 }),
      (loyalty?.balances?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { eyebrow: "★", title: "Seus pontos de fidelidade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: loyalty.balances.map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("article", { className: "flex items-center justify-between border border-accent/30 bg-accent/5 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-4 w-4" }),
            " ",
            b.barbershop?.name
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 font-serif text-3xl font-bold", children: [
            b.points,
            " pts"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: [
            "Acumulou ",
            b.lifetime_points,
            " no total"
          ] })
        ] }) }, i)) }),
        loyalty.txs.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "mt-3 border border-border/50 p-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Ver extrato (últimos 20)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 divide-y divide-border/40", children: loyalty.txs.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-3 py-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              format(new Date(t.created_at), "d MMM yyyy", {
                locale: ptBR
              }),
              " · ",
              t.barbershop?.name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 truncate px-2", children: t.description ?? (t.kind === "earn" ? "Ganho" : t.kind === "redeem" ? "Resgate" : t.kind) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `font-mono ${t.points > 0 ? "text-accent" : "text-muted-foreground"}`, children: [
              t.points > 0 ? "+" : "",
              t.points
            ] })
          ] }, t.id)) })
        ] })
      ] }),
      (wallet?.balances?.some((b) => Number(b.balance) > 0) || (wallet?.txs?.length ?? 0) > 0) && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { eyebrow: "$", title: "Sua carteira" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: (wallet?.balances ?? []).filter((b) => Number(b.balance) > 0 || Number(b.lifetime_credited) > 0).map((b, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("article", { className: "flex items-center justify-between border border-accent/30 bg-accent/5 p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Wallet, { className: "h-4 w-4" }),
            " ",
            b.barbershop?.name
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 font-serif text-3xl font-bold", children: brl(Number(b.balance)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: [
            "Recebeu ",
            brl(Number(b.lifetime_credited)),
            " de cashback"
          ] })
        ] }) }, i)) }),
        (wallet?.txs?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "mt-3 border border-border/50 p-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { className: "cursor-pointer text-xs uppercase tracking-[0.2em] text-muted-foreground", children: "Ver extrato (últimos 20)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 divide-y divide-border/40", children: wallet.txs.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center justify-between gap-3 py-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              format(new Date(t.created_at), "d MMM yyyy", {
                locale: ptBR
              }),
              " · ",
              t.barbershop?.name
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 truncate px-2", children: t.description ?? t.kind }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `font-mono ${Number(t.amount) > 0 ? "text-accent" : "text-muted-foreground"}`, children: [
              Number(t.amount) > 0 ? "+" : "",
              brl(Number(t.amount))
            ] })
          ] }, t.id)) })
        ] })
      ] }),
      (subs?.length ?? 0) > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { eyebrow: "VIP", title: "Seus pacotes ativos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2", children: subs.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "flex flex-col gap-2 border border-accent/30 bg-accent/5 p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-accent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Gift, { className: "h-4 w-4" }),
            " ",
            s.package?.name
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 font-serif text-3xl font-bold", children: [
            s.sessions_remaining,
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-sans font-normal text-muted-foreground", children: [
              "/ ",
              s.package?.sessions_total,
              " sessões"
            ] })
          ] }),
          s.expires_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground", children: [
            "Expira em: ",
            format(new Date(s.expires_at), "dd/MM/yyyy", {
              locale: ptBR
            })
          ] })
        ] }, s.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { eyebrow: "01", title: "Próximos atendimentos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3", children: [
        upcoming.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/60 p-8 text-center text-sm text-muted-foreground", children: [
          "Nada agendado.",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", className: "font-medium text-accent hover:underline", children: "Reservar agora →" })
        ] }),
        upcoming.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "flex flex-col gap-4 border border-border/60 bg-card/40 p-5 transition hover:border-accent/40 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-12 w-12 place-items-center border border-accent/40 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-5 w-5" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-lg", children: format(new Date(a.scheduled_start), "EEEE, d 'de' MMM • HH:mm", {
                locale: ptBR
              }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs uppercase tracking-[0.15em] text-muted-foreground", children: [
                a.services?.map((s) => s.service.name).join(" + "),
                " · com ",
                a.professional?.display_name
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-accent/50 text-accent", children: brl(Number(a.total_amount)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "outline", className: "rounded-none uppercase tracking-[0.18em]", onClick: () => cancel(a.id), children: "Cancelar" })
          ] })
        ] }, a.id))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { eyebrow: "02", title: "Histórico" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
        past.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Nada por aqui ainda." }),
        past.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "flex flex-col gap-2 border border-border/40 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-4 w-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif", children: format(new Date(a.scheduled_start), "d 'de' MMM yyyy • HH:mm", {
              locale: ptBR
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs uppercase tracking-[0.15em] text-muted-foreground", children: [
              "· ",
              a.services?.map((s) => s.service.name).join(", ")
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: a.status === "cancelled" ? "destructive" : "secondary", className: "rounded-none uppercase tracking-[0.15em]", children: a.status === "cancelled" ? "Cancelado" : a.status === "completed" ? "Concluído" : a.status }),
            a.status === "completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "rounded-none uppercase tracking-[0.18em]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/avaliar/$appointmentId", params: {
              appointmentId: a.id
            }, children: "Avaliar" }) })
          ] })
        ] }, a.id))
      ] })
    ] })
  ] }) });
}
function SectionTitle({
  eyebrow,
  title
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-14 mb-5 flex items-baseline gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-sm italic text-accent", children: eyebrow }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border/70" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-xl font-semibold", children: title })
  ] });
}
function VIPStatus({
  lifetimePoints
}) {
  const tiers = [{
    name: "Bronze",
    min: 0,
    max: 499,
    color: "text-[#cd7f32]",
    bg: "bg-[#cd7f32]/20",
    fill: "bg-[#cd7f32]"
  }, {
    name: "Prata",
    min: 500,
    max: 1499,
    color: "text-slate-300",
    bg: "bg-slate-300/20",
    fill: "bg-slate-300"
  }, {
    name: "Ouro",
    min: 1500,
    max: 2999,
    color: "text-yellow-500",
    bg: "bg-yellow-500/20",
    fill: "bg-yellow-500"
  }, {
    name: "Diamante",
    min: 3e3,
    max: Infinity,
    color: "text-cyan-400",
    bg: "bg-cyan-400/20",
    fill: "bg-cyan-400"
  }];
  const currentTierIndex = tiers.findIndex((t) => lifetimePoints >= t.min && lifetimePoints <= t.max);
  const currentTier = tiers[currentTierIndex] || tiers[0];
  const nextTier = tiers[currentTierIndex + 1];
  const progress = nextTier ? (lifetimePoints - currentTier.min) / (nextTier.min - currentTier.min) * 100 : 100;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 border border-border/60 bg-card/40 p-6 md:p-8 relative overflow-hidden group", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0 right-0 w-48 h-48 blur-[80px] opacity-20 transition-opacity duration-1000 group-hover:opacity-40 ${currentTier.bg}` }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex flex-wrap items-center justify-between gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Status de Fidelidade" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: `h-6 w-6 ${currentTier.color} drop-shadow-[0_0_8px_currentColor]` }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: `font-serif text-3xl font-bold tracking-tight ${currentTier.color}`, children: [
            "Membro ",
            currentTier.name
          ] })
        ] })
      ] }),
      nextTier && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left md:text-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Próximo Nível" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm font-medium mt-1", children: [
          nextTier.name,
          " (",
          nextTier.min,
          " pts)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-2 w-full bg-border/50 rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute left-0 top-0 h-full ${currentTier.fill} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`, style: {
      width: `${progress}%`
    } }) }),
    nextTier ? /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-4 text-center", children: [
      "Faltam ",
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-foreground font-bold", children: [
        nextTier.min - lifetimePoints,
        " pontos"
      ] }),
      " para você alcançar o prestigiado nível ",
      nextTier.name,
      "."
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.1em] text-muted-foreground mt-4 text-center", children: "Você atingiu o nível máximo de fidelidade. Você é uma lenda! 👑" })
  ] });
}
export {
  Page as component
};
