import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { P as PublicLayout } from "./PublicLayout-Q9jwWw-L.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { x as Route, a as Badge, e as cn, B as Button, C as Card, m as minutes, b as brl } from "./router-CQpyXUQj.mjs";
import { A as Avatar, b as AvatarImage, a as AvatarFallback } from "./avatar-idweZ-yQ.mjs";
import "../_libs/sonner.mjs";
import { aB as ArrowLeft, a3 as Sparkles, t as Star, S as Scissors, aC as Quote } from "../_libs/lucide-react.mjs";
import "./sheet-LLlFl3wi.mjs";
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
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
function ProPage() {
  const {
    shop,
    pro
  } = Route.useLoaderData();
  const {
    data: services = []
  } = useQuery({
    queryKey: ["pro-services", pro.id],
    queryFn: async () => {
      const {
        data: links
      } = await supabase.from("service_professionals").select("service_id").eq("professional_id", pro.id);
      const ids = (links ?? []).map((l) => l.service_id);
      if (!ids.length) return [];
      const {
        data
      } = await supabase.from("services").select("*").in("id", ids).eq("active", true).order("sort");
      return data ?? [];
    }
  });
  const {
    data: portfolio = []
  } = useQuery({
    queryKey: ["pro-portfolio", pro.id],
    queryFn: async () => (await supabase.from("portfolio_items").select("id, image_url, caption").eq("professional_id", pro.id).order("created_at", {
      ascending: false
    }).limit(12)).data ?? []
  });
  const {
    data: reviews = []
  } = useQuery({
    queryKey: ["pro-reviews", pro.id],
    queryFn: async () => (await supabase.from("satisfaction_surveys").select("id, professional_rating, comment, answered_at").eq("professional_id", pro.id).eq("is_public", true).not("comment", "is", null).order("answered_at", {
      ascending: false
    }).limit(9)).data ?? []
  });
  const ratingAvg = (() => {
    const vals = reviews.map((r) => r.professional_rating).filter((v) => v != null);
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  })();
  const initials = pro.display_name.split(" ").map((n) => n[0]).slice(0, 2).join("");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PublicLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,oklch(0.74_0.09_85/0.18),transparent_70%)]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/b/$slug", params: {
          slug: shop.slug
        }, className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
          " ",
          shop.name
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-8 md:grid-cols-[auto,1fr] md:items-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Avatar, { className: "h-32 w-32 md:h-40 md:w-40", children: [
            pro.avatar_url && /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarImage, { src: pro.avatar_url, alt: pro.display_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-primary text-2xl font-display text-primary-foreground md:text-4xl", children: initials })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-accent" }),
              " Profissional"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-4xl font-bold leading-tight md:text-5xl", children: pro.display_name }),
            pro.specialties && pro.specialties.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 flex flex-wrap gap-1.5", children: pro.specialties.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "font-normal", children: s }, s)) }),
            pro.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-xl text-base text-muted-foreground", children: pro.bio }),
            ratingAvg != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: cn("h-4 w-4", i <= Math.round(ratingAvg) ? "fill-accent text-accent" : "text-muted-foreground/30") }, i)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: ratingAvg.toFixed(1) }),
                " · ",
                reviews.length,
                " avaliações"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "h-12 px-6 text-base", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/agendar", search: {
              shop: shop.slug,
              pro: pro.id
            }, children: [
              "Agendar com ",
              pro.display_name.split(" ")[0]
            ] }) }) })
          ] })
        ] })
      ] })
    ] }),
    services.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-5xl px-4 py-14 md:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-3xl font-bold md:text-4xl", children: "Serviços oferecidos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Selecione um serviço para agendar diretamente." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: services.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-5 w-5" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: minutes(s.duration_min) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-lg font-semibold", children: s.name }),
          s.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: s.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-semibold", children: brl(Number(s.price)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", search: {
            shop: shop.slug,
            service: s.id,
            pro: pro.id
          }, children: "Agendar" }) })
        ] })
      ] }, s.id)) })
    ] }),
    portfolio.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "bg-card/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-4 py-14 md:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-3xl font-bold md:text-4xl", children: "Portfólio" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-muted-foreground", children: [
        "Trabalhos recentes de ",
        pro.display_name.split(" ")[0],
        "."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4", children: portfolio.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("figure", { className: "group relative overflow-hidden rounded-2xl border border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: p.image_url, alt: p.caption ?? "Trabalho realizado", loading: "lazy", className: "aspect-square w-full object-cover transition duration-500 group-hover:scale-105" }),
        p.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("figcaption", { className: "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white opacity-0 transition group-hover:opacity-100", children: p.caption })
      ] }, p.id)) })
    ] }) }),
    reviews.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-5xl px-4 py-14 md:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-3xl font-bold md:text-4xl", children: "Avaliações" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: reviews.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex h-full flex-col gap-3 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Quote, { className: "h-6 w-6 text-accent/60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "flex-1 text-sm leading-relaxed text-foreground/90", children: r.comment }),
        r.professional_rating != null && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex border-t border-border pt-3", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: cn("h-4 w-4", i <= r.professional_rating ? "fill-accent text-accent" : "text-muted-foreground/30") }, i)) })
      ] }, r.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-5xl px-4 pb-20 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col items-center gap-4 p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-2xl font-bold md:text-3xl", children: "Pronto para agendar?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "max-w-md text-muted-foreground", children: [
        "Escolha um horário com ",
        pro.display_name.split(" ")[0],
        " em poucos cliques."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "h-12 px-6 text-base", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", search: {
        shop: shop.slug,
        pro: pro.id
      }, children: "Agendar agora" }) })
    ] }) })
  ] });
}
export {
  ProPage as component
};
