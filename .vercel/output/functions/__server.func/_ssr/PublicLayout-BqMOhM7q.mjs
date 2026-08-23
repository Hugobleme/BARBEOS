import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { f as useLocation, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, B as Button, v as useTheme } from "./router-CU6k9yR1.mjs";
import { S as Sheet, a as SheetTrigger, b as SheetContent, c as SheetHeader, d as SheetTitle } from "./sheet-CYhR-3Ru.mjs";
import { _ as Menu, S as Scissors, $ as Sun, a0 as Moon } from "../_libs/lucide-react.mjs";
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Button,
    {
      variant: "ghost",
      size: "icon",
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
      className: "rounded-full w-9 h-9 border border-border/50 bg-background/50 backdrop-blur-md",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Alternar tema" })
      ]
    }
  );
}
const NAV_LINKS = [
  { to: "/barbearias", label: "Barbearias" },
  { to: "/servicos", label: "Serviços" },
  { to: "/profissionais", label: "Equipe" },
  { to: "/clube", label: "Clube VIP" },
  { to: "/minha-conta", label: "Conta" }
];
function PublicHeader() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = reactExports.useState(false);
  const loc = useLocation();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { open, onOpenChange: setOpen, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", className: "md:hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "left", className: "w-[280px] p-0 border-r border-border/40 bg-background/95 backdrop-blur-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { className: "p-6 border-b border-border/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetTitle, { className: "flex items-center gap-2.5 font-serif text-xl tracking-tight", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-8 w-8 place-items-center border border-accent/40 bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-4 w-4" }) }),
            "BarberOS"
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "flex flex-col p-4", children: [
            NAV_LINKS.map((link) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              Link,
              {
                to: link.to,
                onClick: () => setOpen(false),
                className: `rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] transition-all active:scale-95 ${loc.pathname === link.to ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`,
                children: link.label
              },
              link.to
            )),
            !isAuthenticated && /* @__PURE__ */ jsxRuntimeExports.jsx(
              Link,
              {
                to: "/login",
                onClick: () => setOpen(false),
                className: "mt-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                children: "Entrar"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center border border-accent/40 bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-xl tracking-tight hidden xs:inline", children: "BarberOS" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "hidden items-center gap-8 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground md:flex", children: NAV_LINKS.map((link) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: link.to, className: "transition-colors hover:text-accent", children: link.label }, link.to)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeToggle, {}),
      isAuthenticated ? /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "hidden text-xs uppercase tracking-widest sm:flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/minha-conta", children: "Minha conta" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, variant: "ghost", size: "sm", className: "hidden text-xs uppercase tracking-widest sm:flex", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", children: "Entrar" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          asChild: true,
          size: "sm",
          className: "rounded-none bg-accent text-accent-foreground text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] px-4 sm:px-6 hover:bg-foreground hover:text-background",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/agendar", children: "Agendar" })
        }
      )
    ] })
  ] }) });
}
function PublicFooter() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "border-t border-border/60 bg-card/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-4 py-16 md:px-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center border border-accent/40 bg-accent/10 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-xl tracking-tight text-foreground", children: "BarberOS" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground", children: "Atendimento exclusivo, agendamento sem atritos. A tradição da barbearia elevada ao padrão contemporâneo." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "Endereço" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-sm leading-relaxed text-muted-foreground", children: [
          "Rua Augusta, 1500",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "São Paulo · SP"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-muted-foreground", children: "(11) 99999-0000" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-[0.3em] text-accent", children: "Horário" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-sm leading-relaxed text-muted-foreground", children: [
          "Seg – Sex · 09h – 19h",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "Sábado · 09h – 17h"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-muted-foreground/70", children: "Cancelamento gratuito até 2h antes." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-14 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-[11px] uppercase tracking-[0.25em] text-muted-foreground md:flex-row", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "© ",
        (/* @__PURE__ */ new Date()).getFullYear(),
        " BarberOS"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Crafted with precision in São Paulo" })
    ] })
  ] }) });
}
function PublicLayout({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "dark", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground selection:bg-accent/30", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PublicHeader, {}),
    children,
    /* @__PURE__ */ jsxRuntimeExports.jsx(PublicFooter, {})
  ] }) });
}
export {
  PublicLayout as P
};
