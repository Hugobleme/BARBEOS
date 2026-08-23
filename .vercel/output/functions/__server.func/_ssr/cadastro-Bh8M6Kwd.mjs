import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { u as useAuth, L as Label, I as Input, p as phoneMask, B as Button } from "./router-CU6k9yR1.mjs";
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
function SignupPage() {
  const nav = useNavigate();
  const {
    user,
    loading: authLoading
  } = useAuth();
  const [f, setF] = reactExports.useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });
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
    const cleanName = f.name.trim();
    const cleanEmail = f.email.trim().toLowerCase();
    if (!cleanName || cleanName.length < 3) {
      return toast.error("Por favor, informe seu nome completo.");
    }
    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return toast.error("Por favor, informe um e-mail válido.");
    }
    if (!f.phone || f.phone.replace(/\D/g, "").length < 10) {
      return toast.error("Por favor, informe um telefone válido com DDD.");
    }
    if (!f.password || f.password.length < 6) {
      return toast.error("A senha deve ter no mínimo 6 caracteres.");
    }
    setLoading(true);
    const {
      data,
      error
    } = await supabase.auth.signUp({
      email: cleanEmail,
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/minha-conta`,
        data: {
          full_name: cleanName,
          phone: f.phone
        }
      }
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("User already registered") || error.message.includes("already exists")) {
        return toast.error("Este e-mail já está cadastrado. Tente entrar.");
      }
      if (error.message.includes("Password should be at least")) {
        return toast.error("A senha deve ter no mínimo 6 caracteres.");
      }
      return toast.error(error.message || "Erro ao criar conta.");
    }
    if (data.session) {
      toast.success("Conta criada com sucesso!");
      if (data.user) {
        await redirectBasedOnMembership(data.user.id);
      }
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar seu cadastro.");
      nav({
        to: "/login"
      });
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PublicLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-6 py-20 md:py-28", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-medium uppercase tracking-[0.35em] text-accent", children: "Cadastro" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl", children: "Criar conta" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "Reserve sua experiência em segundos." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 border border-border/60 bg-card/40 p-8 backdrop-blur-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Nome completo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "text", autoComplete: "name", value: f.name, onChange: (e) => setF({
              ...f,
              name: e.target.value
            }), placeholder: "Ex: João da Silva", className: "rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "E-mail" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "email", autoComplete: "email", value: f.email, onChange: (e) => setF({
              ...f,
              email: e.target.value
            }), placeholder: "exemplo@email.com", className: "rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Telefone celular" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "tel", autoComplete: "tel", value: f.phone, onChange: (e) => setF({
              ...f,
              phone: phoneMask(e.target.value)
            }), placeholder: "(11) 99999-0000", className: "rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Senha (mínimo 6 dígitos)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { required: true, type: "password", autoComplete: "new-password", minLength: 6, value: f.password, onChange: (e) => setF({
              ...f,
              password: e.target.value
            }), placeholder: "••••••••", className: "rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-2 w-full rounded-none uppercase tracking-[0.2em]", disabled: loading, children: loading ? "Criando conta..." : "Criar conta" })
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
          if (error) toast.error(error.message ?? "Falha no cadastro com Google");
        }, children: "Continuar com Google" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-6 text-center text-xs text-muted-foreground", children: [
          "Já tem conta?",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-medium text-accent hover:underline", children: "Entrar" })
        ] })
      ] })
    ] })
  ] }) });
}
export {
  SignupPage as component
};
