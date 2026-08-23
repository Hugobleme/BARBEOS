import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { j as Route$r, d as barbershopService, D as DEMO_BARBERSHOP_ID, I as Input, B as Button, a as Badge, m as minutes, b as brl, i as Skeleton, e as cn } from "./router-CQpyXUQj.mjs";
import { P as PublicLayout } from "./PublicLayout-Q9jwWw-L.mjs";
import { A as Avatar, a as AvatarFallback } from "./avatar-idweZ-yQ.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { A as AuroraFab } from "./AuroraFab-De-AcoAA.mjs";
import "../_libs/sonner.mjs";
import { h as MapPin, t as Star, a3 as Sparkles, m as ArrowRight, a4 as Phone, o as Calendar, S as Scissors, i as Clock } from "../_libs/lucide-react.mjs";
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
import "./sheet-LLlFl3wi.mjs";
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
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
function OptimizedImage({
  src,
  alt,
  className,
  imageClassName,
  aspectRatio = "square",
  fallback = "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
  ...props
}) {
  const [loaded, setLoaded] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(false);
  const imgRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setLoaded(true);
    }
  }, [src]);
  const aspectClasses = {
    square: "aspect-square",
    video: "aspect-video",
    portrait: "aspect-[3/4]",
    landscape: "aspect-[4/3]",
    auto: ""
  };
  const imageSrc = error && fallback ? fallback : src || fallback;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("relative overflow-hidden bg-card/40", aspectClasses[aspectRatio], className), children: [
    !loaded && !error && /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "absolute inset-0 z-10 h-full w-full animate-pulse bg-muted/40" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        ref: imgRef,
        src: imageSrc,
        alt,
        className: cn(
          "h-full w-full object-cover transition-all duration-700",
          loaded ? "opacity-100 scale-100" : "opacity-0 scale-95",
          imageClassName
        ),
        onLoad: () => setLoaded(true),
        onError: () => {
          setError(true);
          setLoaded(true);
        },
        loading: "eager",
        decoding: "async",
        ...props
      }
    )
  ] });
}
function Landing() {
  const navigate = useNavigate();
  const searchParams = Route$r.useSearch();
  const [searchCity, setSearchCity] = reactExports.useState(searchParams.city || "");
  const [sortBy, setSortBy] = reactExports.useState("rating");
  const {
    data: featuredShops,
    isLoading: loadingShops
  } = useQuery({
    queryKey: ["featured-barbershops", searchCity, sortBy],
    queryFn: async () => {
      const res = await barbershopService.getBarbershops({
        city: searchCity || void 0,
        sort: sortBy,
        limit: 6
      });
      return res.data;
    }
  });
  const {
    data: services
  } = useQuery({
    queryKey: ["services-featured"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("services").select("id, name, description, price, duration_min, sort").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true).order("sort").limit(6);
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 60
  });
  const {
    data: pros
  } = useQuery({
    queryKey: ["pros-featured"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("professionals").select("id, display_name, specialties").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true);
      return data ?? [];
    },
    staleTime: 1e3 * 60 * 60
  });
  function handleSearchSubmit(e) {
    e.preventDefault();
    navigate({
      to: "/barbearias",
      search: {
        city: searchCity ? searchCity.trim() : void 0,
        sort: sortBy
      }
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PublicLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto grid max-w-7xl items-center gap-16 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-3 rounded-full border border-border bg-card/40 px-4 py-1.5 backdrop-blur", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_8px_currentColor]" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-medium uppercase tracking-[0.3em] text-accent", children: "Atendimento Premium" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-serif text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl lg:text-8xl", children: [
            "Cortes que",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal text-accent", children: "marcam." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-lg font-light leading-relaxed text-muted-foreground md:text-xl", children: "Encontre as melhores barbearias e reserve seu horário em 30 segundos. Sem ligações, sem espera — 24 horas por dia." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSearchSubmit, className: "flex flex-col gap-3 sm:flex-row max-w-lg", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: searchCity, onChange: (e) => setSearchCity(e.target.value), placeholder: "Cidade ou bairro (ex: São Paulo, Jardins)...", className: "h-14 rounded-none border-border bg-card/60 pl-11 text-sm backdrop-blur focus-visible:ring-accent" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", size: "lg", className: "h-14 rounded-none bg-accent px-8 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background active:scale-95", children: "Buscar" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2 pt-1 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase font-bold text-muted-foreground", children: "Populares:" }),
            ["São Paulo", "Rio de Janeiro", "Curitiba", "Belo Horizonte"].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
              setSearchCity(c);
              navigate({
                to: "/barbearias",
                search: {
                  city: c,
                  sort: sortBy
                }
              });
            }, className: "rounded-full border border-border/80 bg-card/40 px-3 py-1 text-[11px] text-muted-foreground transition hover:border-accent hover:text-accent hover:bg-accent/5", children: c }, c))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-4 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "h-auto rounded-none bg-accent px-10 py-5 text-[11px] font-bold uppercase tracking-[0.25em] text-accent-foreground transition-all hover:scale-[1.02] hover:bg-foreground hover:text-background shadow-lg shadow-accent/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", children: "Agendar agora" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "h-auto rounded-none border-border bg-transparent px-10 py-5 text-[11px] font-bold uppercase tracking-[0.25em] backdrop-blur-sm hover:border-accent hover:bg-transparent hover:text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/barbearias", children: "Ver barbearias" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-10 border-t border-border/60 pt-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-0.5 text-accent", children: [0, 1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-3.5 w-3.5 fill-current" }, i)) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground", children: "4.9 em milhares de avaliações" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-10 w-px bg-border/60" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold uppercase tracking-[0.2em] text-accent", children: "Agendamento 24/7" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Confirmação instantânea" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -right-10 -top-10 h-72 w-72 rounded-full bg-accent/20 blur-[120px]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute -left-10 -bottom-10 h-64 w-64 rounded-full bg-accent/15 blur-[100px]" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "group relative aspect-[3/4] overflow-hidden rounded-none border border-accent/40 shadow-[0_0_50px_rgba(212,175,55,0.18)]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(OptimizedImage, { src: "/hero-barbershop.jpg", fallback: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1200&q=85", alt: "Interior de barbearia luxuosa BarberOS", aspectRatio: "portrait", fetchPriority: "high", loading: "eager", className: "h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 pointer-events-none" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-6 top-6 z-20", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 backdrop-blur-md", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-accent" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-white", children: "Experiência Exclusiva" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-0 left-0 right-0 z-20 p-6 md:p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border border-white/15 bg-black/70 p-5 backdrop-blur-xl", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-2 w-2 rounded-full bg-emerald-500 animate-pulse" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-lg font-bold text-white", children: "BarberOS Prestige" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-neutral-300", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3 text-accent" }),
                  " Unidades selecionadas no Brasil"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/barbearias", "aria-label": "Ver barbearias", className: "grid h-12 w-12 place-items-center rounded-full bg-accent text-accent-foreground transition-all hover:scale-105 hover:bg-white hover:text-black shadow-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-5 w-5" }) })
            ] }) })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-y border-border/60 bg-card/20 py-20 md:py-28", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 md:px-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5" }),
            " Unidades Recomendadas"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-serif text-3xl font-bold md:text-5xl", children: [
            "Barbearias em ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "Destaque" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "As unidades mais bem avaliadas para você agendar sua experiência." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs uppercase tracking-wider text-muted-foreground", children: "Ordenar:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: sortBy, onValueChange: setSortBy, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[180px] rounded-none border-border bg-background/60 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Ordenar" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "rating", children: "Mais bem avaliadas" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "popular", children: "Mais populares" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "recent", children: "Mais recentes" })
            ] })
          ] })
        ] })
      ] }),
      loadingShops ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({
        length: 3
      }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72 animate-pulse border border-border bg-card/40" }, i)) }) : !featuredShops || featuredShops.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border border-border p-12 text-center text-muted-foreground", children: "Nenhuma barbearia encontrada para esta localização." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: featuredShops.map((shop) => {
        const addr = shop.address ?? {};
        const cityState = [addr.neighborhood || addr.district, addr.city || "São Paulo", addr.state || "SP"].filter(Boolean).join(" · ");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group relative flex flex-col border border-border bg-background/60 p-6 transition-all duration-300 hover:border-accent hover:bg-card/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-2xl font-bold transition-colors group-hover:text-accent", children: shop.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "flex items-center gap-1.5 text-xs text-muted-foreground", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5 text-accent" }),
                cityState
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-accent/40 bg-accent/5 text-accent", children: "Destaque" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: shop.description || "Atendimento premium com os melhores profissionais da região." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-between border-t border-border/40 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 fill-current" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-sm font-bold", children: shop.rating?.toFixed(1) ?? "5.0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
                "(",
                shop.review_count || 12,
                " avaliações)"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", className: "rounded-none bg-accent text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/b/$slug", params: {
              slug: shop.slug
            }, children: "Ver detalhes" }) })
          ] })
        ] }, shop.id);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "rounded-none border-border px-8 text-xs uppercase tracking-[0.2em]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/barbearias", children: "Explorar todas as barbearias" }) }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Nossa curadoria" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-serif text-4xl font-bold md:text-5xl", children: [
            "Serviços ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "selecionados" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-muted-foreground", children: "Onde a tradição encontra o requinte contemporâneo." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/servicos", className: "group inline-flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.25em] text-accent transition-colors hover:text-foreground", children: [
          "Ver catálogo completo",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "h-px w-8 bg-accent transition-all group-hover:w-12" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3", children: services?.map((s, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group flex flex-col gap-8 bg-background p-8 transition-colors duration-500 hover:bg-card md:p-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent/60", children: [
            String(idx + 1).padStart(2, "0"),
            " / ",
            String(services.length).padStart(2, "0")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: minutes(s.duration_min) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-2xl font-bold", children: s.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-3 text-sm leading-relaxed text-muted-foreground", children: s.description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex items-center justify-between border-t border-border/40 pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-xl", children: brl(Number(s.price)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "icon", variant: "outline", className: "h-11 w-11 rounded-full border-border bg-transparent transition-all group-hover:border-accent group-hover:bg-accent group-hover:text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", "aria-label": `Agendar ${s.name}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" }) }) })
        ] })
      ] }, s.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-y border-border/60 bg-card/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-14 max-w-2xl space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Os artesãos" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-serif text-4xl font-bold md:text-5xl", children: [
          "Nossa ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "equipe" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Profissionais com olhar técnico e paixão pelo ofício." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3", children: pros?.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5 bg-background p-7 transition-colors hover:bg-card", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-14 w-14 rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "rounded-none bg-accent/15 font-serif text-lg text-accent", children: p.display_name.split(" ").map((n) => n[0]).slice(0, 2).join("") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-lg", children: p.display_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: p.specialties?.slice(0, 2).join(" · ") })
        ] })
      ] }, p.id)) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-14 flex flex-col gap-4 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Opinião de quem frequenta" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-serif text-4xl font-bold md:text-5xl", children: [
          "Aprovado por ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "homens exigentes" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto max-w-md text-sm text-muted-foreground", children: "Confira a experiência de clientes reais que agendam suas sessões pelo BarberOS." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: [{
        name: "Guilherme Sampaio",
        city: "São Paulo, SP",
        rating: 5,
        text: "Melhor experiência de barbearia que já tive. Agendei em menos de um minuto pelo celular, cheguei no horário e o barbeiro já estava pronto me esperando com um café espresso."
      }, {
        name: "Rodrigo Mendonça",
        city: "Rio de Janeiro, RJ",
        rating: 5,
        text: "A qualidade do corte degradê e o cuidado com a barba foram impecáveis. Sem fila, sem estresse. O lembrete no WhatsApp 24h antes ajudou demais!"
      }, {
        name: "Lucas Vasconcelos",
        city: "Belo Horizonte, MG",
        rating: 5,
        text: "Ambiente de primeiro mundo e profissionais extremamente atenciosos. Já assinei o plano de recorrência e não troco de barbearia por nada."
      }].map((t, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col justify-between border border-border/60 bg-card/40 p-8 backdrop-blur-sm transition-all hover:border-accent", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 text-accent", children: Array.from({
            length: t.rating
          }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "h-4 w-4 fill-current" }, i)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm leading-relaxed text-foreground/90 italic", children: [
            '"',
            t.text,
            '"'
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center gap-3 border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center bg-accent/20 font-serif font-bold text-accent text-sm", children: t.name.split(" ").map((n) => n[0]).join("") }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-sm text-foreground", children: t.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
              t.city,
              " · Cliente Verificado"
            ] })
          ] })
        ] })
      ] }, idx)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-12 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— A casa" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-serif text-4xl font-bold md:text-5xl", children: [
          "Sobre a ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "BarberOS" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-md text-muted-foreground", children: "Mais que uma barbearia: uma experiência. Combinamos tradição e modernidade num ambiente acolhedor para o homem que cuida da imagem." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 border-t border-border/60 pt-6 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4 shrink-0 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Rua Augusta, 1500 — São Paulo / SP" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Phone, { className: "h-4 w-4 shrink-0 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "(11) 99999-0000" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4 shrink-0 text-accent" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Seg a Sáb" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative overflow-hidden border border-border bg-card/40 p-10 md:p-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent opacity-40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto grid h-14 w-14 rotate-45 place-items-center border border-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-5 w-5 -rotate-45 text-accent" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-3xl font-bold md:text-4xl", children: "Pronto para um novo visual?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground", children: "Reserve sua experiência em poucos toques. Disponibilidade em tempo real." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "h-auto rounded-none bg-foreground px-12 py-5 text-[11px] font-black uppercase tracking-[0.4em] text-background transition-all hover:scale-105 hover:bg-accent hover:text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", children: "Agendar agora" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3 w-3" }),
            " Confirmação instantânea"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuroraFab, { barbershopId: DEMO_BARBERSHOP_ID, barbershopName: "BarberOS Demo" })
  ] });
}
export {
  Landing as component
};
