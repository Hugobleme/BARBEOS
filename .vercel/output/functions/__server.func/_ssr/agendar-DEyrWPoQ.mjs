import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { P as PublicLayout } from "./PublicLayout-BqMOhM7q.mjs";
import { u as useAuth, g as Route$t, D as DEMO_BARBERSHOP_ID, C as Card, b as brl, B as Button, m as minutes, L as Label, I as Input, p as phoneMask, e as cn, f as buttonVariants } from "./router-CU6k9yR1.mjs";
import { C as Checkbox } from "./checkbox-CV5czZEZ.mjs";
import { A as Avatar, a as AvatarFallback } from "./avatar-DmXEgll-.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { a as appointmentService } from "./appointment.service-DT5apoOF.mjs";
import { C as startOfDay, a as addDays, I as parse, J as addMinutes, t as isBefore, f as format, H as ptBR } from "../_libs/date-fns.mjs";
import { q as Check, o as Calendar$1, S as Scissors, u as User, i as Clock, v as ChevronLeft, w as ChevronRight, x as ChevronDown } from "../_libs/lucide-react.mjs";
import { g as getDefaultClassNames, D as DayPicker } from "../_libs/react-day-picker.mjs";
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
import "../_libs/radix-ui__react-checkbox.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-avatar.mjs";
import "../_libs/@radix-ui/react-use-is-hydrated+[...].mjs";
import "../_libs/use-sync-external-store.mjs";
import "../_libs/date-fns__tz.mjs";
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    DayPicker,
    {
      showOutsideDays,
      className: cn(
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      ),
      captionLayout,
      formatters: {
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters
      },
      classNames: {
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) select-none p-0 aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-1.5 text-sm font-medium",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("bg-popover absolute inset-0 opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label" ? "text-sm" : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn("w-(--cell-size) select-none", defaultClassNames.week_number_header),
        week_number: cn(
          "text-muted-foreground select-none text-[0.8rem]",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn("bg-accent rounded-l-md", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),
        today: cn(
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames
      },
      components: {
        Root: ({ className: className2, rootRef, ...props2 }) => {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-slot": "calendar", ref: rootRef, className: cn(className2), ...props2 });
        },
        Chevron: ({ className: className2, orientation, ...props2 }) => {
          if (orientation === "left") {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: cn("size-4", className2), ...props2 });
          }
          if (orientation === "right") {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: cn("size-4", className2), ...props2 });
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("size-4", className2), ...props2 });
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props2 }) => {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("td", { ...props2, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex size-(--cell-size) items-center justify-center text-center", children }) });
        },
        ...components
      },
      ...props
    }
  );
}
function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}) {
  const defaultClassNames = getDefaultClassNames();
  const ref = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Button,
    {
      ref,
      variant: "ghost",
      size: "icon",
      "data-day": day.date.toLocaleDateString(),
      "data-selected-single": modifiers.selected && !modifiers.range_start && !modifiers.range_end && !modifiers.range_middle,
      "data-range-start": modifiers.range_start,
      "data-range-end": modifiers.range_end,
      "data-range-middle": modifiers.range_middle,
      className: cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-(--cell-size) flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      ),
      ...props
    }
  );
}
const STEPS = ["Serviços", "Profissional", "Data", "Horário", "Dados", "Confirmação"];
function Stepper({
  step
}) {
  const pct = Math.round((step + 1) / STEPS.length * 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-baseline justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground", children: [
          "Passo ",
          step + 1,
          "/",
          STEPS.length
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display text-sm font-semibold text-accent", children: STEPS[step] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 w-full overflow-hidden rounded-full bg-border/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-accent transition-all duration-300", style: {
        width: `${pct}%`
      } }) }),
      step < STEPS.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs text-muted-foreground", children: [
        "Próximo: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-foreground", children: STEPS[step + 1] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "hidden flex-wrap items-center gap-2 text-sm md:flex", children: STEPS.map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `grid h-7 w-7 place-items-center rounded-full border ${i < step ? "bg-accent border-accent text-accent-foreground" : i === step ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`, children: i < step ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }) : i + 1 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: i === step ? "font-medium" : "text-muted-foreground", children: s }),
      i < STEPS.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
    ] }, s)) })
  ] });
}
function Booking() {
  useNavigate();
  const {
    user
  } = useAuth();
  const {
    shop: shopSlug
  } = Route$t.useSearch();
  const [step, setStep] = reactExports.useState(0);
  const [pickedServices, setPicked] = reactExports.useState([]);
  const [proId, setProId] = reactExports.useState("any");
  const [date, setDate] = reactExports.useState(void 0);
  const [time, setTime] = reactExports.useState(null);
  const [form, setForm] = reactExports.useState({
    name: "",
    phone: "",
    email: "",
    createAccount: false,
    password: ""
  });
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [doneId, setDoneId] = reactExports.useState(null);
  const {
    data: shopId = DEMO_BARBERSHOP_ID
  } = useQuery({
    queryKey: ["resolve-shop", shopSlug],
    queryFn: async () => {
      if (!shopSlug) return DEMO_BARBERSHOP_ID;
      const {
        data
      } = await supabase.from("barbershops").select("id").eq("slug", shopSlug).eq("active", true).maybeSingle();
      return data?.id ?? DEMO_BARBERSHOP_ID;
    }
  });
  reactExports.useEffect(() => {
    if (user) {
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({
        data
      }) => {
        setForm((f) => ({
          ...f,
          name: data?.full_name ?? "",
          phone: data?.phone ?? "",
          email: user.email ?? ""
        }));
      });
    }
  }, [user]);
  const {
    data: services = []
  } = useQuery({
    queryKey: ["svc", shopId],
    staleTime: 1e3 * 60 * 30,
    // 30 minutes
    queryFn: async () => (await supabase.from("services").select("id, name, duration_min, price, description").eq("barbershop_id", shopId).eq("active", true).order("sort")).data ?? []
  });
  const {
    data: pros = []
  } = useQuery({
    queryKey: ["pros-all", shopId],
    staleTime: 1e3 * 60 * 30,
    // 30 minutes
    queryFn: async () => (await supabase.from("professionals").select("id, display_name, specialties").eq("barbershop_id", shopId).eq("active", true)).data ?? []
  });
  const {
    data: workingHours = []
  } = useQuery({
    queryKey: ["wh", shopId, pros.map((p) => p.id).join(",")],
    enabled: !!shopId && pros.length > 0,
    staleTime: 1e3 * 60 * 30,
    // 30 minutes
    queryFn: async () => {
      const {
        data
      } = await supabase.from("working_hours").select("professional_id, weekday, start_time, end_time, break_start, break_end").in("professional_id", pros.map((p) => p.id));
      return data ?? [];
    }
  });
  const totalDuration = pickedServices.reduce((a, s) => a + s.duration_min, 0);
  const totalPrice = pickedServices.reduce((a, s) => a + Number(s.price), 0);
  const candidatePros = reactExports.useMemo(() => proId === "any" ? pros : pros.filter((p) => p.id === proId), [proId, pros]);
  const {
    data: dayAppts = []
  } = useQuery({
    enabled: !!date && candidatePros.length > 0,
    queryKey: ["appts", date?.toISOString().slice(0, 10), candidatePros.map((p) => p.id).join(",")],
    queryFn: async () => {
      if (!date) return [];
      const start = startOfDay(date).toISOString();
      const end = addDays(startOfDay(date), 1).toISOString();
      const {
        data
      } = await supabase.from("appointments").select("professional_id, scheduled_start, scheduled_end, status").in("professional_id", candidatePros.map((p) => p.id)).gte("scheduled_start", start).lt("scheduled_start", end).neq("status", "cancelled");
      return data ?? [];
    }
  });
  const {
    data: dayTimeOff = []
  } = useQuery({
    enabled: !!date && candidatePros.length > 0,
    queryKey: ["timeoff", date?.toISOString().slice(0, 10), candidatePros.map((p) => p.id).join(",")],
    queryFn: async () => {
      if (!date) return [];
      const start = startOfDay(date).toISOString();
      const end = addDays(startOfDay(date), 1).toISOString();
      const {
        data
      } = await supabase.from("time_off").select("professional_id, start_at, end_at").in("professional_id", candidatePros.map((p) => p.id)).lt("start_at", end).gt("end_at", start);
      return data ?? [];
    }
  });
  const slots = reactExports.useMemo(() => {
    if (!date || totalDuration === 0 || candidatePros.length === 0) return [];
    const wd = date.getDay();
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const pro of candidatePros) {
      const wh = workingHours.find((w) => w.professional_id === pro.id && w.weekday === wd);
      if (!wh) continue;
      const dayStart = parse(wh.start_time, "HH:mm:ss", date);
      const dayEnd = parse(wh.end_time, "HH:mm:ss", date);
      const breakS = wh.break_start ? parse(wh.break_start, "HH:mm:ss", date) : null;
      const breakE = wh.break_end ? parse(wh.break_end, "HH:mm:ss", date) : null;
      const proAppts = dayAppts.filter((a) => a.professional_id === pro.id).map((a) => ({
        s: new Date(a.scheduled_start),
        e: new Date(a.scheduled_end)
      }));
      const proOff = dayTimeOff.filter((t) => t.professional_id === pro.id).map((t) => ({
        s: new Date(t.start_at),
        e: new Date(t.end_at)
      }));
      let cur = dayStart;
      const now = /* @__PURE__ */ new Date();
      while (addMinutes(cur, totalDuration) <= dayEnd) {
        const slotStart = cur;
        const slotEnd = addMinutes(cur, totalDuration);
        const inBreak = breakS && breakE && slotStart < breakE && slotEnd > breakS;
        const overlaps = proAppts.some((a) => slotStart < a.e && slotEnd > a.s);
        const blocked = proOff.some((t) => slotStart < t.e && slotEnd > t.s);
        const inPast = isBefore(slotStart, addMinutes(now, 30));
        if (!inBreak && !overlaps && !blocked && !inPast) {
          const key = format(slotStart, "HH:mm");
          if (!seen.has(key)) {
            seen.add(key);
            out.push({
              time: key,
              proId: pro.id
            });
          }
        }
        cur = addMinutes(cur, 15);
      }
    }
    return out.sort((a, b) => a.time.localeCompare(b.time));
  }, [date, totalDuration, candidatePros, workingHours, dayAppts, dayTimeOff]);
  const toggleService = (s) => setPicked((prev) => prev.find((p) => p.id === s.id) ? prev.filter((p) => p.id !== s.id) : [...prev, s]);
  const canNext = [pickedServices.length > 0, true, !!date, !!time, form.name.trim() && form.phone.replace(/\D/g, "").length >= 10 && (!form.createAccount || form.password.length >= 6), true][step];
  async function submit() {
    if (!date || !time) return;
    setSubmitting(true);
    try {
      const slot = slots.find((s) => s.time === time);
      if (!slot) throw new Error("Horário indisponível");
      const start = parse(time, "HH:mm", date);
      const {
        data: shopCfg
      } = await supabase.from("barbershops").select("settings").eq("id", shopId).maybeSingle();
      const policy = shopCfg?.settings?.policy ?? {};
      const minLead = Number(policy.min_lead_hours ?? 0);
      if (minLead > 0) {
        const diffHours = (start.getTime() - Date.now()) / 36e5;
        if (diffHours < minLead) throw new Error(`Esta barbearia exige no mínimo ${minLead}h de antecedência.`);
      }
      let userId = user?.id ?? null;
      if (!user && form.createAccount) {
        const redirectUrl = `${window.location.origin}/minha-conta`;
        const {
          data: signUp,
          error
        } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: form.name,
              phone: form.phone
            }
          }
        });
        if (error) throw error;
        userId = signUp.user?.id ?? null;
      }
      const appt = await appointmentService.createAppointment({
        barbershopId: shopId,
        professionalId: slot.proId,
        services: pickedServices,
        scheduledStart: start,
        customerData: {
          name: form.name,
          phone: form.phone,
          email: form.email || void 0
        },
        userId,
        source: "web"
      });
      setDoneId(appt.id);
      toast.success("Agendamento confirmado!");
    } catch (e) {
      toast.error(e.message ?? "Não foi possível concluir.");
    } finally {
      setSubmitting(false);
    }
  }
  if (doneId) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(PublicLayout, { children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-2xl px-4 py-16 md:px-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border-border bg-card p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-8 w-8" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-5 font-serif text-3xl font-bold md:text-4xl", children: "Agendamento confirmado" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-xs uppercase tracking-[0.25em] text-muted-foreground", children: [
        "Protocolo · ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono normal-case tracking-normal text-accent", children: doneId.slice(0, 8).toUpperCase() })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-7 border border-border/60 bg-background/40 p-5 text-left text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar$1, { className: "h-4 w-4 text-accent" }),
          date && format(date, "EEEE, d 'de' MMMM", {
            locale: ptBR
          }),
          " • ",
          time
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-4 w-4 text-accent" }),
          pickedServices.map((s) => s.name).join(" + ")
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 font-serif text-lg", children: brl(totalPrice) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-7 flex flex-wrap justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "rounded-none bg-accent text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/minha-conta", children: "Meus agendamentos" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "outline", className: "rounded-none border-border bg-transparent text-[11px] font-bold uppercase tracking-[0.2em] hover:border-accent hover:bg-transparent hover:text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", children: "Voltar à home" }) })
      ] })
    ] }) }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(PublicLayout, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 py-12 pb-32 md:px-6 md:py-16 md:pb-16", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "— Reserva" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl", children: [
        "Agendar ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic font-normal", children: "horário" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "Escolha serviços, profissional, data e horário." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stepper, { step }),
        step === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 font-display text-lg font-semibold", children: "Quais serviços?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2", children: services.map((s) => {
            const sel = pickedServices.find((p) => p.id === s.id);
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => toggleService(s), className: `flex items-center justify-between rounded-xl border p-4 text-left transition ${sel ? "border-accent bg-accent/5" : "hover:bg-muted/40"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: s.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  minutes(s.duration_min),
                  " · ",
                  brl(Number(s.price))
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `grid h-6 w-6 place-items-center rounded-full border ${sel ? "border-accent bg-accent text-accent-foreground" : "border-border"}`, children: sel && /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3.5 w-3.5" }) })
            ] }, s.id);
          }) }),
          pickedServices.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              pickedServices.length,
              " serviço(s) · ",
              minutes(totalDuration)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: brl(totalPrice) })
          ] })
        ] }),
        step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 font-display text-lg font-semibold", children: "Com quem?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setProId("any"), className: `flex items-center gap-3 rounded-xl border p-4 text-left ${proId === "any" ? "border-accent bg-accent/5" : ""}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-5 w-5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: "Qualquer profissional" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Mais rápido" })
              ] })
            ] }),
            pros.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setProId(p.id), className: `flex items-center gap-3 rounded-xl border p-4 text-left ${proId === p.id ? "border-accent bg-accent/5" : ""}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Avatar, { className: "h-10 w-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AvatarFallback, { className: "bg-primary text-primary-foreground", children: p.display_name.split(" ").map((n) => n[0]).slice(0, 2).join("") }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: p.display_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-xs text-muted-foreground", children: p.specialties?.slice(0, 2).join(" · ") })
              ] })
            ] }, p.id))
          ] })
        ] }),
        step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 font-display text-lg font-semibold", children: "Qual dia?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { mode: "single", selected: date, onSelect: setDate, locale: ptBR, disabled: (d) => d < startOfDay(/* @__PURE__ */ new Date()) || d > addDays(/* @__PURE__ */ new Date(), 60), className: "rounded-md border" })
        ] }),
        step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 font-display text-lg font-semibold", children: "Que horas?" }),
          slots.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground", children: "Nenhum horário disponível neste dia. Escolha outra data." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6", children: slots.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTime(s.time), className: `flex items-center justify-center gap-1 rounded-lg border py-2 text-sm transition ${time === s.time ? "border-accent bg-accent text-accent-foreground" : "hover:bg-muted"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-3.5 w-3.5 opacity-60" }),
            s.time
          ] }, s.time + s.proId)) })
        ] }),
        step === 4 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "space-y-4 p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "Seus dados" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome completo *" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.name, onChange: (e) => setForm((f) => ({
                ...f,
                name: e.target.value
              })) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Telefone *" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: form.phone, onChange: (e) => setForm((f) => ({
                  ...f,
                  phone: phoneMask(e.target.value)
                })), placeholder: "(11) 99999-0000" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "E-mail" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "email", value: form.email, onChange: (e) => setForm((f) => ({
                  ...f,
                  email: e.target.value
                })) })
              ] })
            ] }),
            !user && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { checked: form.createAccount, onCheckedChange: (v) => setForm((f) => ({
                  ...f,
                  createAccount: !!v
                })) }),
                "Criar conta para acompanhar meus agendamentos"
              ] }),
              form.createAccount && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Senha (mín. 6)" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { type: "password", value: form.password, onChange: (e) => setForm((f) => ({
                  ...f,
                  password: e.target.value
                })) })
              ] })
            ] })
          ] })
        ] }),
        step === 5 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "space-y-4 p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "Confirmação" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Serviços", children: pickedServices.map((s) => s.name).join(" + ") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Duração", children: minutes(totalDuration) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Profissional", children: proId === "any" ? "Qualquer profissional" : pros.find((p) => p.id === proId)?.display_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Data", children: date && format(date, "EEEE, d 'de' MMMM", {
              locale: ptBR
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Horário", children: time }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { label: "Cliente", children: form.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between border-t pt-3 text-base", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xl font-semibold", children: brl(totalPrice) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "pt-3 text-xs text-muted-foreground", children: "Pagamento na barbearia. Cancelamento gratuito até 2h antes." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 hidden items-center justify-between md:flex", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "ghost", disabled: step === 0, onClick: () => setStep((s) => s - 1), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "mr-1 h-4 w-4" }),
            "Voltar"
          ] }),
          step < 5 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: !canNext, onClick: () => setStep((s) => s + 1), children: [
            "Continuar",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: submitting, onClick: submit, children: submitting ? "Confirmando..." : "Confirmar agendamento" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-xl md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-3xl items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: step === 0, onClick: () => setStep((s) => s - 1), className: "grid h-11 w-11 shrink-0 place-items-center rounded-md border border-border text-muted-foreground transition disabled:opacity-30 enabled:hover:border-accent enabled:hover:text-accent", "aria-label": "Voltar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronLeft, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-w-0 flex-1", children: pickedServices.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-[11px] uppercase tracking-[0.18em] text-muted-foreground", children: [
          pickedServices.length,
          " ",
          pickedServices.length === 1 ? "item" : "itens",
          " · ",
          minutes(totalDuration)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif text-lg font-semibold leading-tight", children: brl(totalPrice) })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Selecione os serviços para começar" }) }),
      step < 5 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { disabled: !canNext, onClick: () => setStep((s) => s + 1), className: "h-11 rounded-none bg-accent px-5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background", children: [
        "Continuar",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "ml-1 h-4 w-4" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { disabled: submitting, onClick: submit, className: "h-11 rounded-none bg-accent px-5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background", children: submitting ? "..." : "Confirmar" })
    ] }) })
  ] });
}
function Row({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-right font-medium", children })
  ] });
}
export {
  Booking as component
};
