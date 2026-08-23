import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { I as Input, B as Button, a as Badge, m as minutes, b as brl } from "./router-CU6k9yR1.mjs";
import "../_libs/sonner.mjs";
import { b as Search, S as Scissors, h as MapPin, m as ArrowRight } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-slot.mjs";
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
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/zod.mjs";
function ServicesDirectoryPage() {
  const [search, setSearch] = reactExports.useState("");
  const {
    data: servicesWithShop,
    isLoading
  } = useQuery({
    queryKey: ["all-services-by-shop"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("services").select(`
          id,
          name,
          description,
          price,
          duration_min,
          barbershop:barbershops!inner(
            id,
            name,
            slug,
            address,
            active
          )
        `).eq("active", true).eq("barbershops.active", true).order("name");
      if (error) throw error;
      return data ?? [];
    }
  });
  const groupedByShop = reactExports.useMemo(() => {
    if (!servicesWithShop) return [];
    const query = search.trim().toLowerCase();
    const map = {};
    servicesWithShop.forEach((item) => {
      const matchService = !query || item.name.toLowerCase().includes(query) || item.description && item.description.toLowerCase().includes(query);
      const matchShop = !query || item.barbershop?.name.toLowerCase().includes(query) || JSON.stringify(item.barbershop?.address ?? {}).toLowerCase().includes(query);
      if (matchService || matchShop) {
        const shopId = item.barbershop.id;
        if (!map[shopId]) {
          map[shopId] = {
            shop: item.barbershop,
            services: []
          };
        }
        map[shopId].services.push(item);
      }
    });
    return Object.values(map);
  }, [servicesWithShop, search]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PublicLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "border-b border-border/60 bg-card/30", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Catálogo Completo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-serif text-5xl font-bold tracking-tight md:text-6xl", children: [
          "Serviços ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "por barbearia" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Encontre o serviço ideal e agende diretamente na unidade de sua preferência." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mt-8 max-w-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "Buscar serviço (ex: Degradê, Barba, Hidratação, Barba Terapia)...", className: "h-14 rounded-none border-border bg-background/80 pl-12 text-sm backdrop-blur" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-20", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-12", children: Array.from({
      length: 2
    }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-64 animate-pulse border border-border bg-card/40" }, i)) }) : groupedByShop.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border p-16 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "mx-auto h-12 w-12 text-muted-foreground/40" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-serif text-2xl font-bold", children: "Nenhum serviço encontrado" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Tente buscar por outro termo ou explore o diretório de barbearias." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "mt-6 rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/barbearias", children: "Ver barbearias parceiras" }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-16", children: groupedByShop.map(({
      shop,
      services
    }) => {
      const addr = shop.address ?? {};
      const locationStr = [addr.neighborhood || addr.district, addr.city, addr.state].filter(Boolean).join(" · ");
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border/80 bg-background p-6 md:p-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex flex-col gap-4 border-b border-border/60 pb-6 sm:flex-row sm:items-center sm:justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-3xl font-bold", children: shop.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-accent/40 bg-accent/5 text-accent text-[10px]", children: "Unidade Parceira" })
            ] }),
            locationStr && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 flex items-center gap-1.5 text-xs text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3.5 w-3.5 text-accent" }),
              locationStr
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", size: "sm", className: "rounded-none border-border text-xs uppercase tracking-wider hover:border-accent hover:text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/b/$slug", params: {
            slug: shop.slug
          }, children: "Ver perfil da barbearia" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3", children: services.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "group flex flex-col justify-between bg-card/40 p-6 transition-colors hover:bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold", children: s.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: minutes(s.duration_min) })
            ] }),
            s.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: s.description })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-between border-t border-border/40 pt-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-xl font-bold text-accent", children: brl(Number(s.price)) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "sm", className: "rounded-none bg-accent text-[10px] font-bold uppercase tracking-wider text-accent-foreground hover:bg-foreground hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/agendar", search: {
              shop: shop.slug
            }, children: [
              "Agendar ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-1 h-3 w-3" })
            ] }) })
          ] })
        ] }, s.id)) })
      ] }, shop.id);
    }) }) })
  ] });
}
export {
  ServicesDirectoryPage as component
};
