import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as Route$u, d as barbershopService, I as Input, B as Button, a as Badge } from "./router-CU6k9yR1.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-C30H0gvg.mjs";
import "../_libs/sonner.mjs";
import { h as MapPin, R as RotateCcw, F as Funnel, S as Scissors, t as Star } from "../_libs/lucide-react.mjs";
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
import "./sheet-CYhR-3Ru.mjs";
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
function Directory() {
  const navigate = useNavigate();
  const searchParams = Route$u.useSearch();
  const [city, setCity] = reactExports.useState(searchParams.city || "");
  const [neighborhood, setNeighborhood] = reactExports.useState(searchParams.neighborhood || "");
  const [minRating, setMinRating] = reactExports.useState(searchParams.minRating ? String(searchParams.minRating) : "all");
  const [sort, setSort] = reactExports.useState(searchParams.sort || "rating");
  const [page, setPage] = reactExports.useState(searchParams.page || 1);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["barbershops-directory", city, neighborhood, minRating, sort, page],
    queryFn: () => barbershopService.getBarbershops({
      city: city || void 0,
      neighborhood: neighborhood || void 0,
      minRating: minRating !== "all" ? Number(minRating) : void 0,
      sort,
      page,
      limit: 20
    })
  });
  const shops = data?.data ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / 20) || 1;
  function applyFilters() {
    setPage(1);
    navigate({
      to: "/barbearias",
      search: {
        city: city || void 0,
        neighborhood: neighborhood || void 0,
        minRating: minRating !== "all" ? Number(minRating) : void 0,
        sort,
        page: 1
      }
    });
  }
  function resetFilters() {
    setCity("");
    setNeighborhood("");
    setMinRating("all");
    setSort("rating");
    setPage(1);
    navigate({
      to: "/barbearias",
      search: {}
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PublicLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-b border-border/60 bg-card/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Diretório oficial" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-serif text-5xl font-bold tracking-tight md:text-6xl", children: [
          "Encontre sua ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "barbearia" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Explore as unidades parceiras, compare avaliações e agende seu horário em segundos." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 rounded-none border border-border/80 bg-background/80 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Cidade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: city, onChange: (e) => setCity(e.target.value), placeholder: "Ex: São Paulo", className: "h-11 rounded-none pl-9 text-sm" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Bairro" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: neighborhood, onChange: (e) => setNeighborhood(e.target.value), placeholder: "Ex: Jardins, Pinheiros", className: "h-11 rounded-none text-sm" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Avaliação Mínima" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: minRating, onValueChange: setMinRating, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-11 rounded-none text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Todas as notas" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas as notas" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "4.5", children: "★ 4.5 ou mais" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "4.0", children: "★ 4.0 ou mais" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "3.5", children: "★ 3.5 ou mais" })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Ordenar por" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: sort, onValueChange: setSort, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-11 rounded-none text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Ordenação" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "rating", children: "Mais bem avaliadas" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "popular", children: "Mais populares" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "recent", children: "Mais recentes" })
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/40 pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            totalCount,
            " ",
            totalCount === 1 ? "barbearia encontrada" : "barbearias encontradas"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: resetFilters, className: "rounded-none text-xs uppercase tracking-wider", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Limpar"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", size: "sm", onClick: applyFilters, className: "rounded-none bg-accent text-xs font-bold uppercase tracking-wider text-accent-foreground hover:bg-foreground hover:text-background", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Funnel, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Filtrar"
            ] })
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({
      length: 6
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-80 animate-pulse border border-border bg-card/40" }, i)) }) : shops.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border p-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "mx-auto h-12 w-12 text-muted-foreground/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-serif text-2xl font-bold", children: "Nenhuma barbearia encontrada" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tente ajustar seus filtros de cidade, bairro ou avaliação." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: resetFilters, variant: "outline", className: "mt-6 rounded-none", children: "Limpar todos os filtros" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: shops.map((shop) => {
        const addr = shop.address ?? {};
        const locationText = [addr.street, addr.neighborhood || addr.district, addr.city].filter(Boolean).join(", ");
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group relative flex flex-col justify-between border border-border bg-background p-6 transition-all duration-300 hover:border-accent hover:bg-card/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            shop.banner_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 aspect-video overflow-hidden border border-border/40", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: shop.banner_url, alt: shop.name, className: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-2xl font-bold transition-colors group-hover:text-accent", children: shop.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none border-accent/40 bg-accent/5 text-accent shrink-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "mr-1 h-3 w-3 fill-current" }),
                shop.rating?.toFixed(1) ?? "5.0"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 flex items-center gap-1.5 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5 text-accent shrink-0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: locationText || "São Paulo, SP" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 line-clamp-3 text-xs leading-relaxed text-muted-foreground", children: shop.description || "Unidade especializada em cortes clássicos e modernos com atendimento de excelência." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-between border-t border-border/40 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: shop.review_count ? `${shop.review_count} avaliações` : "Nova no BarberOS" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", variant: "outline", className: "rounded-none text-[10px] font-bold uppercase tracking-wider", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/b/$slug", params: {
                slug: shop.slug
              }, children: "Ver unidade" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", className: "rounded-none bg-accent text-[10px] font-bold uppercase tracking-wider text-accent-foreground hover:bg-foreground hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", search: {
                shop: shop.slug
              }, children: "Agendar" }) })
            ] })
          ] })
        ] }, shop.id);
      }) }),
      totalPages > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-14 flex items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", disabled: page <= 1, onClick: () => {
          setPage((p) => Math.max(1, p - 1));
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }, className: "rounded-none text-xs", children: "Anterior" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "px-4 text-xs font-mono text-muted-foreground", children: [
          "Página ",
          page,
          " de ",
          totalPages
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", disabled: page >= totalPages, onClick: () => {
          setPage((p) => Math.min(totalPages, p + 1));
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
        }, className: "rounded-none text-xs", children: "Próxima" })
      ] })
    ] }) })
  ] });
}
export {
  Directory as component
};
