import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { A as Avatar, a as AvatarFallback } from "./avatar-DmXEgll-.mjs";
import { D as DEMO_BARBERSHOP_ID, a as Badge, B as Button } from "./router-CU6k9yR1.mjs";
import "../_libs/sonner.mjs";
import { m as ArrowRight } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/zod.mjs";
function Page() {
  const {
    data
  } = useQuery({
    queryKey: ["pros"],
    queryFn: async () => (await supabase.from("professionals").select("*").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true)).data ?? []
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PublicLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6 md:py-24", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-2xl space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Os artesãos" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "font-serif text-5xl font-bold tracking-tight md:text-6xl", children: [
        "Nossa ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "equipe" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Conheça os barbeiros que assinam cada corte." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-14 grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-2 lg:grid-cols-3", children: data?.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "flex flex-col gap-6 bg-background p-8 transition-colors hover:bg-card md:p-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-16 w-16 rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "rounded-none bg-accent/15 font-serif text-xl text-accent", children: p.display_name.split(" ").map((n) => n[0]).slice(0, 2).join("") }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-xl font-bold", children: p.display_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "line-clamp-2 text-xs leading-relaxed text-muted-foreground", children: p.bio })
        ] })
      ] }),
      p.specialties && p.specialties.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: p.specialties.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "outline", className: "rounded-none border-border bg-transparent text-[10px] font-normal uppercase tracking-[0.18em] text-muted-foreground", children: s }, s)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "mt-auto h-auto rounded-none border-border bg-transparent py-4 text-[11px] font-bold uppercase tracking-[0.2em] hover:border-accent hover:bg-transparent hover:text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/agendar", children: [
        "Agendar com ",
        p.display_name.split(" ")[0],
        /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "ml-2 h-3.5 w-3.5" })
      ] }) })
    ] }, p.id)) })
  ] }) });
}
export {
  Page as component
};
