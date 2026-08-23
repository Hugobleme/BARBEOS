import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { u as useAuth, L as Label, I as Input, B as Button } from "./router-CU6k9yR1.mjs";
import { t as toast } from "../_libs/sonner.mjs";
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
import "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/zod.mjs";
function LoginPage() {
  const nav = useNavigate();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  const redirectingRef = reactExports.useRef(false);
  async function redirectBasedOnMembership(userId) {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    try {
      const {
        data: membership
      } = await supabase.from("barbershop_members").select("barbershop_id, role").eq("profile_id", userId).eq("active", true).limit(1).maybeSingle();
      if (membership && ["owner", "admin", "barber", "manager", "receptionist"].includes(membership.role)) {
        nav({
          to: "/admin"
        });
      } else {
        nav({
          to: "/minha-conta"
        });
      }
    } catch {
      nav({
        to: "/minha-conta"
      });
    }
  }
  reactExports.useEffect(() => {
    if (!authLoading && user) {
      redirectBasedOnMembership(user.id);
    }
  }, [user, authLoading]);
  reactExports.useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        redirectBasedOnMembership(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }
  async function submit(e) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return toast.error("Por favor, informe um e-mail válido.");
    }
    if (!password || password.length < 6) {
      return toast.error("A senha deve ter no mínimo 6 caracteres.");
    }
    setLoading(true);
    const {
      data,
      error
    } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_grant")) {
        return toast.error("E-mail ou senha incorretos.");
      }
      if (error.message.includes("Email not confirmed")) {
        return toast.error("Por favor, confirme seu e-mail antes de acessar.");
      }
      return toast.error(error.message || "Erro ao efetuar login.");
    }
    toast.success("Bem-vindo de volta!");
    if (data.user) {
      await redirectBasedOnMembership(data.user.id);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PublicLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-6 py-20 md:py-28", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-medium uppercase tracking-[0.35em] text-accent", children: "Acesso" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl", children: "Entrar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Continue de onde parou." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 border border-border/60 bg-card/40 p-8 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "E-mail" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", required: true, autoComplete: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "seu@email.com", className: "rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Senha" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", required: true, autoComplete: "current-password", minLength: 6, value: password, onChange: (e) => setPassword(e.target.value), placeholder: "••••••••", className: "rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-2 w-full rounded-none uppercase tracking-[0.2em]", disabled: loading, children: loading ? "Entrando..." : "Entrar" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" }),
          "ou",
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", className: "w-full rounded-none uppercase tracking-[0.2em]", onClick: async () => {
          const {
            error
          } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/minha-conta`
            }
          });
          if (error) toast.error(error.message ?? "Falha no login com Google");
        }, children: "Continuar com Google" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center justify-between text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/recuperar-senha", className: "text-muted-foreground transition hover:text-accent", children: "Esqueci minha senha" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/cadastro", className: "font-medium text-accent hover:underline", children: "Criar conta" })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  LoginPage as component
};
