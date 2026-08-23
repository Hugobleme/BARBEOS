import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { n as Route$n, u as useAuth, B as Button, L as Label, T as Textarea } from "./router-CU6k9yR1.mjs";
import { C as Checkbox } from "./checkbox-CV5czZEZ.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a8 as CircleCheck, t as Star } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__react-checkbox.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
function Stars({
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: [1, 2, 3, 4, 5].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onChange(i), className: "transition hover:scale-110", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: `h-9 w-9 transition ${i <= value ? "fill-accent text-accent drop-shadow-[0_0_8px_color-mix(in_oklab,var(--accent)_40%,transparent)]" : "text-muted-foreground/40"}` }) }, i)) });
}
function Page() {
  const {
    appointmentId
  } = Route$n.useParams();
  const {
    user,
    loading
  } = useAuth();
  const nav = useNavigate();
  const [shop, setShop] = reactExports.useState(0);
  const [proR, setProR] = reactExports.useState(0);
  const [nps, setNps] = reactExports.useState(null);
  const [comment, setComment] = reactExports.useState("");
  const [pub, setPub] = reactExports.useState(false);
  const [done, setDone] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!loading && !user) nav({
      to: "/login"
    });
  }, [loading, user, nav]);
  const {
    data: appt
  } = useQuery({
    enabled: !!user,
    queryKey: ["appt-survey", appointmentId],
    queryFn: async () => (await supabase.from("appointments").select("*, professional:professionals(display_name, id), customer:customers(profile_id)").eq("id", appointmentId).maybeSingle()).data
  });
  const {
    data: existing
  } = useQuery({
    enabled: !!appt,
    queryKey: ["survey-existing", appointmentId],
    queryFn: async () => (await supabase.from("satisfaction_surveys").select("*").eq("appointment_id", appointmentId).maybeSingle()).data
  });
  reactExports.useEffect(() => {
    if (existing) setDone(true);
  }, [existing]);
  async function submit() {
    if (shop === 0 || proR === 0) return toast.error("Dê uma nota para a loja e o profissional");
    const {
      error
    } = await supabase.from("satisfaction_surveys").insert({
      barbershop_id: appt.barbershop_id,
      appointment_id: appointmentId,
      professional_id: appt.professional?.id ?? null,
      shop_rating: shop,
      professional_rating: proR,
      nps,
      comment: comment || null,
      is_public: pub
    });
    if (error) return toast.error(error.message);
    toast.success("Obrigado pelo feedback!");
    setDone(true);
  }
  if (loading || !user) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(PublicLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-xl px-6 py-20 md:py-24", children: done ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid place-items-center border border-border/60 bg-card/40 p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-14 w-14 text-accent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 font-serif text-3xl font-bold", children: shop === 5 ? "Uau, ficamos muito felizes! 🎉" : "Avaliação registrada" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: shop === 5 ? "Sua nota 5 é muito importante para nós! Se possível, avalie a barbearia também no Google para nos ajudar a crescer." : "Sua opinião nos ajuda a melhorar nosso padrão de qualidade." }),
      shop === 5 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex flex-col gap-3 w-full sm:w-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, size: "lg", className: "rounded-none uppercase tracking-[0.15em] bg-[#4285F4] text-white hover:bg-[#4285F4]/90 w-full", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "https://maps.google.com/", target: "_blank", rel: "noopener noreferrer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "mr-2 h-5 w-5 fill-white" }),
          "Avaliar no Google"
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "rounded-none uppercase tracking-[0.2em]", onClick: () => nav({
          to: "/minha-conta"
        }), children: "Voltar para conta" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "mt-8 rounded-none uppercase tracking-[0.2em]", onClick: () => nav({
        to: "/minha-conta"
      }), children: "Voltar" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] font-medium uppercase tracking-[0.35em] text-accent", children: "Avaliação" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl", children: [
          "Como foi seu ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "atendimento" }),
          "?"
        ] }),
        appt?.professional?.display_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 text-sm text-muted-foreground", children: [
          "com ",
          appt.professional.display_name
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 space-y-7 border border-border/60 bg-card/40 p-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Barbearia" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stars, { value: shop, onChange: setShop })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Profissional" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stars, { value: proR, onChange: setProR })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Qual a chance de nos recomendar? (0–10)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: Array.from({
            length: 11
          }, (_, i) => i).map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setNps(n), className: `h-10 w-10 border text-sm transition ${nps === n ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent/60"}`, children: n }, n)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground", children: "Comentário (opcional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { value: comment, onChange: (e) => setComment(e.target.value), rows: 3, className: "rounded-none border-border bg-transparent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: pub, onCheckedChange: (v) => setPub(!!v) }),
          "Permitir exibir meu comentário publicamente"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { className: "w-full rounded-none uppercase tracking-[0.2em]", size: "lg", onClick: submit, children: "Enviar avaliação" })
      ] })
    ] }) })
  ] }) });
}
export {
  Page as component
};
