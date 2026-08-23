import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { l as Route$o, a as Badge, B as Button, m as minutes, b as brl } from "./router-CU6k9yR1.mjs";
import { A as Avatar, a as AvatarFallback } from "./avatar-DmXEgll-.mjs";
import { A as AuroraFab } from "./AuroraFab-D7igDDUf.mjs";
import "../_libs/sonner.mjs";
import { t as Star, h as MapPin, a4 as Phone, ad as ExternalLink, S as Scissors } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tailwind-merge.mjs";
import "./client-BKVQGVvU.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
const DEFAULT_GALLERY = ["https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80"];
function ShopPage() {
  const loaderData = Route$o.useLoaderData();
  const {
    shop,
    services,
    professionals,
    portfolio,
    reviews
  } = loaderData;
  const addr = shop.address ?? {};
  const contacts = shop.contacts ?? {};
  const fullAddress = [addr.street, addr.number, addr.neighborhood || addr.district, addr.city, addr.state].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name}, ${fullAddress}`)}`;
  const galleryImages = portfolio && portfolio.length > 0 ? portfolio.map((p) => p.image_url) : DEFAULT_GALLERY;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PublicLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "relative border-b border-border/60 bg-card/30", children: [
      shop.banner_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 -z-10 opacity-20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: shop.banner_url, alt: "", className: "h-full w-full object-cover blur-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-background/80" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-8 md:flex-row md:items-start md:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 max-w-2xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-accent/40 bg-accent/10 text-accent", children: "Barbearia Parceira" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-sm text-accent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 fill-current" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: shop.rating?.toFixed(1) ?? "5.0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                "(",
                shop.review_count || 12,
                " avaliações)"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-serif text-5xl font-bold tracking-tight md:text-6xl", children: shop.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-base text-muted-foreground leading-relaxed", children: shop.description || "Experiência de barbearia tradicional e cuidados masculinos em ambiente de luxo." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-6 pt-2 text-xs text-muted-foreground", children: [
            fullAddress && /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: mapsUrl, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1.5 transition-colors hover:text-accent", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-accent" }),
              fullAddress
            ] }),
            contacts.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-4 w-4 text-accent" }),
              contacts.phone
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden md:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "h-auto rounded-none bg-accent px-10 py-5 text-xs font-bold uppercase tracking-[0.25em] text-accent-foreground hover:bg-foreground hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", search: {
          shop: shop.slug
        }, children: "Agendar horário" }) }) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-b border-border/60 bg-background py-14", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 md:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-2xl font-bold", children: "Galeria de fotos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground uppercase tracking-wider", children: [
          galleryImages.length,
          " fotos"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-4", children: galleryImages.slice(0, 4).map((imgUrl, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "group relative aspect-[4/3] overflow-hidden border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: imgUrl, alt: `Ambiente da barbearia ${idx + 1}`, className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" }) }, idx)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 max-w-2xl space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Cardápio de serviços" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-4xl font-bold", children: "Serviços e Preços" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Escolha os serviços desejados para o seu atendimento." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3", children: services.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between bg-background p-7 transition-colors hover:bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold", children: s.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: minutes(s.duration_min) })
          ] }),
          s.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs leading-relaxed text-muted-foreground", children: s.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-between border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-xl font-bold text-accent", children: brl(Number(s.price)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "rounded-none text-xs uppercase tracking-wider", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", search: {
            shop: shop.slug
          }, children: "Agendar" }) })
        ] })
      ] }, s.id)) })
    ] }),
    professionals && professionals.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-y border-border/60 bg-card/20 py-16 md:py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 md:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 max-w-2xl space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Equipe de mestres" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-4xl font-bold", children: "Profissionais" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Especialistas prontos para cuidar do seu estilo." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: professionals.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 border border-border bg-background p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-12 w-12 rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "rounded-none bg-accent/15 font-serif text-accent", children: p.display_name.split(" ").map((n) => n[0]).slice(0, 2).join("") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold truncate", children: p.display_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground truncate", children: p.specialties?.slice(0, 2).join(" · ") || "Especialista em Cortes" })
        ] })
      ] }, p.id)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-10 max-w-2xl space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Experiência comprovada" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-4xl font-bold", children: "Avaliações dos Clientes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "O que nossos clientes dizem sobre o atendimento." })
      ] }),
      reviews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-border p-10 text-center text-sm text-muted-foreground", children: "Seja o primeiro a avaliar após o seu atendimento!" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 sm:grid-cols-3", children: reviews.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between border border-border bg-card/30 p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-0.5 text-accent", children: Array.from({
            length: r.rating
          }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 fill-current" }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs italic leading-relaxed text-foreground/90", children: [
            '"',
            r.comment || "Excelente atendimento, pontualidade e acabamento impecável.",
            '"'
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 border-t border-border/40 pt-3 text-right text-[10px] uppercase tracking-wider text-muted-foreground", children: [
          "— ",
          r.customer_name
        ] })
      ] }, r.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-t border-border/60 bg-card/30 py-16 md:py-24", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-7xl px-4 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-2 items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Como chegar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-4xl font-bold", children: "Localização & Contato" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 text-accent shrink-0 mt-0.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: fullAddress || "São Paulo, SP" })
          ] }),
          contacts.phone && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-4 w-4 text-accent shrink-0" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: contacts.phone })
          ] })
        ] }),
        fullAddress && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "rounded-none text-xs uppercase tracking-wider", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: mapsUrl, target: "_blank", rel: "noopener noreferrer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "mr-2 h-4 w-4" }),
          " Abrir no Google Maps"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-accent/40 bg-accent/5 p-8 text-center md:p-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "mx-auto h-10 w-10 text-accent mb-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-2xl font-bold", children: "Pronto para seu atendimento?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
          "Garanta seu horário com os melhores barbeiros da ",
          shop.name,
          "."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "mt-6 rounded-none bg-accent px-10 text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", search: {
          shop: shop.slug
        }, children: "Agendar agora" }) })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur-xl md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-sm truncate max-w-[180px]", children: shop.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-[10px] text-accent", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3 w-3 fill-current" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: shop.rating?.toFixed(1) ?? "5.0" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "flex-1 rounded-none bg-accent text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", search: {
        shop: shop.slug
      }, children: "Agendar horário" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuroraFab, { barbershopId: shop.id, barbershopName: shop.name })
  ] });
}
export {
  ShopPage as component
};
