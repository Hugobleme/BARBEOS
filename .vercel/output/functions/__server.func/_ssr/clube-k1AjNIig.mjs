import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { P as PublicLayout } from "./PublicLayout-Q9jwWw-L.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { b as brl, B as Button } from "./router-CQpyXUQj.mjs";
import "../_libs/sonner.mjs";
import { p as Crown, q as Check } from "../_libs/lucide-react.mjs";
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
function ClubePage() {
  const {
    data: pkgs,
    isLoading
  } = useQuery({
    queryKey: ["public-packages"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("packages").select("*, barbershops(name, phone)").eq("active", true).order("price", {
        ascending: true
      });
      return data ?? [];
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PublicLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative min-h-[80vh]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl px-6 py-20 md:py-28", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-medium uppercase tracking-[0.35em] text-accent", children: "Exclusivo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl flex items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "h-8 w-8 text-accent" }),
          " Clube VIP"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 max-w-xl mx-auto text-sm text-muted-foreground", children: "Garanta o seu estilo o mês todo. Assine nossos pacotes, economize e não se preocupe mais com pagamento a cada visita." })
      ] }),
      isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-16 text-center text-muted-foreground", children: "Carregando pacotes..." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3", children: pkgs?.map((pkg) => {
        const phone = pkg.barbershops?.phone?.replace(/\D/g, "") || "";
        const waLink = phone ? `https://wa.me/55${phone}?text=${encodeURIComponent(`Olá, tenho interesse em assinar o pacote *${pkg.name}*!`)}` : "#";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "flex flex-col border border-border/60 bg-card/40 backdrop-blur-sm p-8 transition-all hover:border-accent/40 hover:-translate-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-serif text-xl font-bold", children: pkg.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 flex items-baseline gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-4xl font-bold", children: brl(Number(pkg.price)) }) }),
          pkg.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-sm text-muted-foreground", children: pkg.description }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-6 space-y-3 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Direito a ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  pkg.sessions_total,
                  " sessões"
                ] })
              ] })
            ] }),
            pkg.validity_days && /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-5 w-5 place-items-center rounded-full bg-accent/20 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Válido por ",
                /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                  pkg.validity_days,
                  " dias"
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-8 w-full rounded-none uppercase tracking-[0.15em] bg-accent text-accent-foreground hover:bg-accent/90", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: waLink, target: "_blank", rel: "noopener noreferrer", children: "Quero Assinar" }) })
        ] }, pkg.id);
      }) })
    ] })
  ] }) });
}
export {
  ClubePage as component
};
