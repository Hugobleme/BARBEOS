import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { B as Button } from "./router-CU6k9yR1.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import "../_libs/sonner.mjs";
import { S as Scissors, r as CalendarCheck, p as Crown, s as MessageCircle } from "../_libs/lucide-react.mjs";
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
function BioPage() {
  const {
    data: shop
  } = useQuery({
    queryKey: ["bio-shop"],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("barbershops").select("*").limit(1).maybeSingle();
      return data;
    }
  });
  const phone = shop?.contacts?.phone?.replace(/\D/g, "") || "";
  const waLink = phone ? `https://wa.me/55${phone}` : "#";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "min-h-[100dvh] bg-background text-foreground flex flex-col items-center py-16 px-6 relative overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_15%,transparent),transparent_70%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center space-y-4 mb-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-24 w-24 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center shadow-[0_0_20px_color-mix(in_oklab,var(--accent)_40%,transparent)]", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-10 w-10 text-accent" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-serif text-2xl font-bold tracking-tight", children: shop?.name || "BarberOS" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "A melhor experiência em barbearia" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "h-14 w-full rounded-none bg-accent text-accent-foreground hover:bg-accent/90 justify-start px-6 transition-transform hover:scale-[1.02]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/agendar", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarCheck, { className: "mr-4 h-5 w-5" }),
        "Agendar Horário"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "h-14 w-full rounded-none border-border/60 bg-card/50 backdrop-blur-sm hover:border-accent hover:text-accent hover:bg-accent/10 justify-start px-6 transition-transform hover:scale-[1.02]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/clube", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "mr-4 h-5 w-5" }),
        "Clube VIP (Assinaturas)"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "h-14 w-full rounded-none border-border/60 bg-card/50 backdrop-blur-sm hover:border-accent hover:text-accent hover:bg-accent/10 justify-start px-6 transition-transform hover:scale-[1.02]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/servicos", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "mr-4 h-5 w-5" }),
        "Tabela de Preços"
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", variant: "outline", className: "h-14 w-full rounded-none border-border/60 bg-card/50 backdrop-blur-sm hover:border-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 justify-start px-6 transition-transform hover:scale-[1.02]", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: waLink, target: "_blank", rel: "noopener noreferrer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "mr-4 h-5 w-5" }),
        "Falar no WhatsApp"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-auto pt-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] uppercase tracking-[0.2em] text-muted-foreground", children: "Powered by BarberOS" }) })
  ] });
}
export {
  BioPage as component
};
