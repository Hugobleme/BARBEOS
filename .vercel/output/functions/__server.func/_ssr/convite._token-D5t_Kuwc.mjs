import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { k as Route$p, u as useAuth, C as Card, B as Button } from "./router-CQpyXUQj.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { ab as CircleAlert, a8 as CircleCheck, ac as Mail } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/zod.mjs";
function AcceptInvite() {
  const {
    token
  } = Route$p.useParams();
  const {
    user,
    loading
  } = useAuth();
  const nav = useNavigate();
  const [invite, setInvite] = reactExports.useState(null);
  const [shop, setShop] = reactExports.useState(null);
  const [state, setState] = reactExports.useState("loading");
  reactExports.useEffect(() => {
    (async () => {
      const {
        data
      } = await supabase.from("barbershop_invitations").select("*").eq("token", token).maybeSingle();
      if (!data) {
        setState("invalid");
        return;
      }
      setInvite(data);
      const {
        data: s
      } = await supabase.from("barbershops").select("name").eq("id", data.barbershop_id).single();
      setShop(s);
      if (data.status !== "pending") return setState("used");
      if (new Date(data.expires_at) < /* @__PURE__ */ new Date()) return setState("expired");
      if (loading) return;
      if (!user) return setState("ready");
      if (user.email?.toLowerCase() !== data.email.toLowerCase()) return setState("wrong-account");
      setState("ready");
    })();
  }, [token, user, loading]);
  async function accept() {
    if (!user || !invite) return;
    setState("accepting");
    const {
      error: mErr
    } = await supabase.from("barbershop_members").insert({
      barbershop_id: invite.barbershop_id,
      profile_id: user.id,
      role: invite.role
    });
    if (mErr && !mErr.message.includes("duplicate")) {
      setState("ready");
      return toast.error(mErr.message);
    }
    const {
      error: iErr
    } = await supabase.from("barbershop_invitations").update({
      status: "accepted",
      accepted_by: user.id,
      accepted_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", invite.id);
    if (iErr) {
      setState("ready");
      return toast.error(iErr.message);
    }
    setState("done");
    toast.success("Convite aceito!");
    setTimeout(() => nav({
      to: "/admin"
    }), 1200);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center bg-background p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-md p-8 text-center", children: [
    state === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Carregando convite…" }),
    state === "invalid" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto h-10 w-10 text-destructive" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-xl font-bold", children: "Convite inválido" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Este link não corresponde a nenhum convite." })
    ] }),
    state === "expired" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto h-10 w-10 text-warning" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-xl font-bold", children: "Convite expirado" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Peça à barbearia para enviar um novo convite." })
    ] }),
    state === "used" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-10 w-10 text-success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-xl font-bold", children: "Convite já utilizado" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Este convite já foi aceito ou cancelado." })
    ] }),
    state === "wrong-account" && invite && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mx-auto h-10 w-10 text-warning" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-xl font-bold", children: "Conta diferente" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
        "Este convite foi enviado para ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: invite.email }),
        ", mas você está logado como ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: user?.email }),
        "."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-4 w-full", onClick: async () => {
        await supabase.auth.signOut();
        nav({
          to: "/login"
        });
      }, children: "Entrar com outra conta" })
    ] }),
    (state === "ready" || state === "accepting") && invite && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "mx-auto h-10 w-10 text-accent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-4 font-display text-xl font-bold", children: [
        "Convite para ",
        shop?.name ?? "uma barbearia"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
        "Você foi convidado(a) como ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: invite.role }),
        "."
      ] }),
      !user ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", search: {
          next: `/convite/${token}`
        }, children: "Entrar para aceitar" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/cadastro", children: "Criar conta" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "Use o e-mail ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: invite.email }),
          "."
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-6 w-full", disabled: state === "accepting", onClick: accept, children: state === "accepting" ? "Aceitando…" : "Aceitar convite" })
    ] }),
    state === "done" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-10 w-10 text-success" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-xl font-bold", children: "Bem-vindo(a) à equipe!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Redirecionando para o painel…" })
    ] })
  ] }) });
}
export {
  AcceptInvite as component
};
