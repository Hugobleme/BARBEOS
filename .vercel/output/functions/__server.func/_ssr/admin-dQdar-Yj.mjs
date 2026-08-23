import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link, f as useLocation, O as Outlet } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useAuth, d as barbershopService, C as Card, B as Button, S as ShopProvider, D as DEMO_BARBERSHOP_ID, L as Label, I as Input, h as useCurrentShop, s as slugify, e as cn } from "./router-CQpyXUQj.mjs";
import { S as Sheet, a as SheetTrigger, b as SheetContent, c as SheetHeader, d as SheetTitle } from "./sheet-LLlFl3wi.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { D as Dialog, a as DialogTrigger, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { _ as _e } from "../_libs/cmdk.mjs";
import { R as Root2, T as Trigger, P as Portal, C as Content2 } from "../_libs/radix-ui__react-popover.mjs";
import { R as Root, V as Viewport, C as Corner, S as ScrollAreaScrollbar, a as ScrollAreaThumb } from "../_libs/radix-ui__react-scroll-area.mjs";
import { S as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { S as Scissors, y as LayoutDashboard, o as Calendar, z as DollarSign, c as ShoppingCart, E as Coins, P as Package, e as TicketPercent, G as Gift, W as Wallet, H as Boxes, I as ChartColumn, g as Building2, U as Users, J as UserCog, K as Image, N as UsersRound, O as CalendarOff, V as MessageSquare, Y as Settings, Z as Ellipsis, X, b as Search, w as ChevronRight, n as LogOut, _ as Menu, d as Plus, $ as Sun, a0 as Moon, u as User, a1 as Bell, i as Clock, a2 as Info, k as TriangleAlert, q as Check } from "../_libs/lucide-react.mjs";
import { m as motion, A as AnimatePresence } from "../_libs/framer-motion.mjs";
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
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
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
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/motion-dom.mjs";
import "../_libs/motion-utils.mjs";
const KEY = "barberos.theme";
function applyTheme(t) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", t === "dark");
}
function useTheme() {
  const [theme, setThemeState] = reactExports.useState(() => {
    if (typeof window === "undefined") return "light";
    return localStorage.getItem(KEY) || "light";
  });
  reactExports.useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  const setTheme = (t) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
    }
  };
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");
  return { theme, setTheme, toggle };
}
function AdminSidebar({ navItems, open, setOpen }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = reactExports.useState("");
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };
  const navGroups = reactExports.useMemo(() => {
    const map = {
      "Operação & Vendas": [
        "/admin",
        "/admin/agenda",
        "/admin/pdv",
        "/admin/caixa",
        "/admin/carteira"
      ],
      "Catálogo & Equipe": [
        "/admin/servicos",
        "/admin/profissionais",
        "/admin/equipe",
        "/admin/folgas",
        "/admin/portfolio"
      ],
      "Clientes & Marketing": [
        "/admin/clientes",
        "/admin/fidelidade",
        "/admin/pacotes",
        "/admin/cupons",
        "/admin/avaliacoes"
      ],
      "Gestão & Negócios": [
        "/admin/estoque",
        "/admin/comissoes",
        "/admin/relatorios",
        "/admin/franquia",
        "/admin/configuracoes"
      ]
    };
    const itemsByPath = new Map(navItems.map((item) => [item.to, item]));
    return Object.entries(map).map(([title, paths]) => ({
      title,
      items: paths.map((p) => itemsByPath.get(p)).filter(Boolean)
    }));
  }, [navItems]);
  const filteredGroups = reactExports.useMemo(() => {
    if (!searchTerm.trim()) return navGroups;
    const term = searchTerm.toLowerCase();
    return navGroups.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(term))
    })).filter((g) => g.items.length > 0);
  }, [navGroups, searchTerm]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { children: open && /* @__PURE__ */ jsxRuntimeExports.jsx(
      motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        onClick: () => setOpen(false),
        className: "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden",
        "aria-hidden": "true"
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "aside",
      {
        className: `fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border/50 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`,
        "aria-label": "Navegação Administrativa",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/40 px-6", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              Link,
              {
                to: "/admin",
                className: "flex items-center gap-3 font-serif text-xl tracking-tight transition-transform active:scale-95",
                "aria-label": "BarberOS Painel Principal",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-5 w-5" }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: "BarberOS" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "rounded-lg p-2 hover:bg-sidebar-accent md:hidden text-muted-foreground",
                onClick: () => setOpen(false),
                "aria-label": "Fechar menu lateral",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 border-b border-sidebar-border/40 shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                type: "search",
                placeholder: "Buscar menu (ex: PDV, Caixa)...",
                value: searchTerm,
                onChange: (e) => setSearchTerm(e.target.value),
                className: "h-8 rounded-lg border-sidebar-border/60 bg-sidebar-accent/30 pl-8 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-accent"
              }
            )
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "flex-1 overflow-y-auto min-h-0 space-y-4 p-3 scrollbar-thin scrollbar-thumb-sidebar-border/60", children: filteredGroups.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-8 text-center text-xs text-muted-foreground", children: [
            'Nenhuma tela encontrada para "',
            searchTerm,
            '".'
          ] }) : filteredGroups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60", children: group.title }),
            group.items.map((n) => {
              const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Link,
                {
                  to: n.to,
                  onClick: () => setOpen(false),
                  preload: "intent",
                  className: `group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${active ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"}`,
                  children: [
                    active && /* @__PURE__ */ jsxRuntimeExports.jsx(
                      motion.span,
                      {
                        layoutId: "active-pill",
                        className: "absolute left-0 h-5 w-1 rounded-r-full bg-accent",
                        transition: {
                          type: "spring",
                          stiffness: 300,
                          damping: 30
                        }
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      n.icon,
                      {
                        className: `h-4 w-4 shrink-0 transition-colors ${active ? "text-accent" : "text-muted-foreground group-hover:text-accent"}`
                      }
                    ),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate flex-1", children: n.label }),
                    active && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "h-3 w-3 text-accent shrink-0" })
                  ]
                },
                n.to
              );
            })
          ] }, group.title)) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "shrink-0 border-t border-sidebar-border/40 p-3 bg-sidebar", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: handleSignOut,
              className: "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95",
              "aria-label": "Sair da conta e encerrar sessão",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "h-4 w-4 shrink-0" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Sair do Sistema" })
              ]
            }
          ) })
        ]
      }
    )
  ] });
}
function NewShopDialog({ onCreated, trigger }) {
  const { user } = useAuth();
  const [open, setOpen] = reactExports.useState(false);
  const [name, setName] = reactExports.useState("");
  const [busy, setBusy] = reactExports.useState(false);
  async function create() {
    if (!name.trim()) return toast.error("Informe o nome da barbearia");
    if (!user) return;
    setBusy(true);
    try {
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
      await barbershopService.create(name.trim(), slug, user.id);
      toast.success("Barbearia criada!");
      setOpen(false);
      setName("");
      onCreated();
    } catch (error) {
      toast.error(error.message || "Erro ao criar barbearia");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Dialog, { open, onOpenChange: setOpen, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTrigger, { asChild: true, children: trigger }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: "Nova barbearia" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Nome" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { value: name, onChange: (e) => setName(e.target.value), placeholder: "Ex: BarberOS Centro" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", onClick: () => setOpen(false), children: "Cancelar" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: create, disabled: busy, children: busy ? "Criando…" : "Criar" })
      ] })
    ] })
  ] });
}
const Command = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e,
  {
    ref,
    className: cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    ),
    ...props
  }
));
Command.displayName = _e.displayName;
const CommandDialog = ({ children, ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { ...props, children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogContent, { className: "overflow-hidden p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Command, { className: "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5", children }) }) });
};
const CommandInput = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center border-b px-3", "cmdk-input-wrapper": "", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "mr-2 h-4 w-4 shrink-0 opacity-50" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    _e.Input,
    {
      ref,
      className: cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      ),
      ...props
    }
  )
] }));
CommandInput.displayName = _e.Input.displayName;
const CommandList = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.List,
  {
    ref,
    className: cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className),
    ...props
  }
));
CommandList.displayName = _e.List.displayName;
const CommandEmpty = reactExports.forwardRef((props, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(_e.Empty, { ref, className: "py-6 text-center text-sm", ...props }));
CommandEmpty.displayName = _e.Empty.displayName;
const CommandGroup = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.Group,
  {
    ref,
    className: cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    ),
    ...props
  }
));
CommandGroup.displayName = _e.Group.displayName;
const CommandSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.Separator,
  {
    ref,
    className: cn("-mx-1 h-px bg-border", className),
    ...props
  }
));
CommandSeparator.displayName = _e.Separator.displayName;
const CommandItem = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  _e.Item,
  {
    ref,
    className: cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    ),
    ...props
  }
));
CommandItem.displayName = _e.Item.displayName;
function CommandMenu({ navItems }) {
  const [open, setOpen] = reactExports.useState(false);
  const navigate = useNavigate();
  reactExports.useEffect(() => {
    const down = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open2) => !open2);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  const runCommand = reactExports.useCallback((command) => {
    setOpen(false);
    command();
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setOpen(true),
        className: "flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-muted/20 text-muted-foreground transition-all hover:bg-accent/10 hover:text-accent md:h-10 md:w-40 md:justify-start md:px-3 md:gap-2",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "h-4 w-4 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden text-xs font-medium md:inline-block", children: "Buscar..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("kbd", { className: "pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:ml-auto md:flex", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs", children: "⌘" }),
            "K"
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CommandDialog, { open, onOpenChange: setOpen, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CommandInput, { placeholder: "Digite um comando ou busque..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(CommandList, { className: "max-h-[300px] overflow-y-auto", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CommandEmpty, { children: "Nenhum resultado encontrado." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CommandGroup, { heading: "Navegação", children: navItems.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          CommandItem,
          {
            onSelect: () => runCommand(() => navigate({ to: item.to })),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(item.icon, { className: "mr-2 h-4 w-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: item.label })
            ]
          },
          item.to
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(CommandSeparator, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(CommandGroup, { heading: "Ações Rápidas", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CommandItem, { onSelect: () => runCommand(() => navigate({ to: "/admin/agenda" })), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Novo Agendamento" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CommandItem, { onSelect: () => runCommand(() => navigate({ to: "/admin/pdv" })), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Abrir PDV" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(CommandItem, { onSelect: () => runCommand(() => navigate({ to: "/admin/clientes" })), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "mr-2 h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Cadastrar Cliente" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
const Popover = Root2;
const PopoverTrigger = Trigger;
const PopoverContent = reactExports.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Portal, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  Content2,
  {
    ref,
    align,
    sideOffset,
    className: cn(
      "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-popover-content-transform-origin)",
      className
    ),
    ...props
  }
) }));
PopoverContent.displayName = Content2.displayName;
const ScrollArea = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  Root,
  {
    ref,
    className: cn("relative overflow-hidden", className),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Viewport, { className: "h-full w-full rounded-[inherit]", children }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollBar, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Corner, {})
    ]
  }
));
ScrollArea.displayName = Root.displayName;
const ScrollBar = reactExports.forwardRef(({ className, orientation = "vertical", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  ScrollAreaScrollbar,
  {
    ref,
    orientation,
    className: cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" && "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" && "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollAreaThumb, { className: "relative flex-1 rounded-full bg-border" })
  }
));
ScrollBar.displayName = ScrollAreaScrollbar.displayName;
const DEMO_NOTIFICATIONS = [
  {
    id: "1",
    title: "Novo Agendamento",
    description: "Carlos Silva agendou Corte de Cabelo para às 14:00.",
    type: "success",
    time: "5 min atrás",
    read: false
  },
  {
    id: "2",
    title: "Estoque Baixo",
    description: "Pomada Modeladora Matte está com apenas 2 unidades.",
    type: "warning",
    time: "1 hora atrás",
    read: false
  },
  {
    id: "3",
    title: "Relatório Mensal",
    description: "Seu relatório de faturamento de Maio está pronto.",
    type: "info",
    time: "2 horas atrás",
    read: true
  }
];
function NotificationCenter() {
  const [notifications, setNotifications] = reactExports.useState(DEMO_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAsRead = (id) => {
    setNotifications(
      (prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n)
    );
  };
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };
  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };
  const getTypeIcon = (type) => {
    switch (type) {
      case "success":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4 text-green-500" });
      case "warning":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-amber-500" });
      case "error":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4 text-red-500" });
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { className: "h-4 w-4 text-blue-500" });
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Popover, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      Button,
      {
        size: "icon",
        variant: "ghost",
        className: "relative rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "h-[18px] w-[18px]" }),
          unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-background" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(PopoverContent, { className: "w-80 p-0 rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl", align: "end", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border/40 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-display font-bold tracking-tight", children: "Notificações" }),
        unreadCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: markAllAsRead,
            className: "text-[10px] font-bold uppercase tracking-widest text-accent hover:underline",
            children: "Ler todas"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScrollArea, { className: "h-[300px]", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatePresence, { initial: false, children: notifications.length > 0 ? notifications.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        motion.div,
        {
          initial: { opacity: 0, x: -20 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 20 },
          className: cn(
            "group relative flex gap-3 border-b border-border/20 p-4 transition-colors hover:bg-muted/30",
            !n.read && "bg-accent/5"
          ),
          onClick: () => markAsRead(n.id),
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background border border-border/40", children: getTypeIcon(n.type) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold tracking-tight leading-none", children: n.title }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground whitespace-nowrap", children: n.time })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: n.description })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: (e) => {
                  e.stopPropagation();
                  removeNotification(n.id);
                },
                className: "absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3 text-muted-foreground hover:text-foreground" })
              }
            )
          ]
        },
        n.id
      )) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-8 w-8 text-muted-foreground/30" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Nenhuma notificação por enquanto." })
      ] }) }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border/40 p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", className: "w-full text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground", children: "Ver todas as atividades" }) })
    ] })
  ] });
}
const Breadcrumb = reactExports.forwardRef(({ ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { ref, "aria-label": "breadcrumb", ...props }));
Breadcrumb.displayName = "Breadcrumb";
const BreadcrumbList = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "ol",
    {
      ref,
      className: cn(
        "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
        className
      ),
      ...props
    }
  )
);
BreadcrumbList.displayName = "BreadcrumbList";
const BreadcrumbItem = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { ref, className: cn("inline-flex items-center gap-1.5", className), ...props })
);
BreadcrumbItem.displayName = "BreadcrumbItem";
const BreadcrumbLink = reactExports.forwardRef(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Comp,
    {
      ref,
      className: cn("transition-colors hover:text-foreground", className),
      ...props
    }
  );
});
BreadcrumbLink.displayName = "BreadcrumbLink";
const BreadcrumbPage = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      ref,
      role: "link",
      "aria-disabled": "true",
      "aria-current": "page",
      className: cn("font-normal text-foreground", className),
      ...props
    }
  )
);
BreadcrumbPage.displayName = "BreadcrumbPage";
const BreadcrumbSeparator = ({ children, className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "li",
  {
    role: "presentation",
    "aria-hidden": "true",
    className: cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className),
    ...props,
    children: children ?? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, {})
  }
);
BreadcrumbSeparator.displayName = "BreadcrumbSeparator";
function AdminHeader({
  shopId,
  shops,
  setShopId,
  refresh,
  setOpenSidebar,
  theme,
  toggleTheme,
  userEmail,
  navItems
}) {
  const loc = useLocation();
  const pathSegments = loc.pathname.split("/").filter(Boolean);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "sticky top-0 z-30 flex h-20 md:h-16 flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:px-8 py-2 md:py-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between md:justify-start gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          className: "rounded-lg p-2 transition-colors hover:bg-accent/10 active:scale-90 md:hidden",
          onClick: () => setOpenSidebar(true),
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Menu, { className: "h-5 w-5" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border/60 bg-muted/30 px-2 sm:px-3 py-1.5 transition-all hover:bg-muted/50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-4 w-4 text-accent shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: shopId ?? void 0, onValueChange: setShopId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "h-7 w-[120px] sm:w-[180px] border-none bg-transparent p-0 text-sm font-semibold focus:ring-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Selecionar" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-xl border-border/40", children: shops.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: s.id, className: "rounded-lg", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate max-w-[120px]", children: s.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 shrink-0", children: s.role })
          ] }) }, s.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4 w-[1px] bg-border/60 mx-1 shrink-0" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(NewShopDialog, { onCreated: refresh, trigger: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7 rounded-lg hover:bg-accent/20 hover:text-accent shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "hidden lg:block", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Breadcrumb, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(BreadcrumbList, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BreadcrumbItem, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(BreadcrumbLink, { href: "/admin", children: "Admin" }) }),
        pathSegments.slice(1).map((seg, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(reactExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BreadcrumbSeparator, {}),
          /* @__PURE__ */ jsxRuntimeExports.jsx(BreadcrumbItem, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(BreadcrumbPage, { className: "capitalize font-bold text-accent", children: seg.replace(/-/g, " ") }) })
        ] }, seg))
      ] }) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between md:justify-end gap-2 md:gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CommandMenu, { navItems }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 md:gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationCenter, {}),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          motion.div,
          {
            whileHover: { scale: 1.05 },
            whileTap: { scale: 0.95 },
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                size: "icon",
                variant: "ghost",
                onClick: toggleTheme,
                "aria-label": "Alternar tema",
                className: "rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent",
                children: theme === "dark" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Sun, { className: "h-[18px] w-[18px]" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Moon, { className: "h-[18px] w-[18px]" })
              }
            )
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "hidden h-9 items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 md:flex", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-6 w-6 items-center justify-center rounded-full bg-accent/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(User, { className: "h-3.5 w-3.5 text-accent" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-muted-foreground", children: userEmail })
      ] })
    ] })
  ] });
}
const NAV = [{
  to: "/admin",
  label: "Dashboard",
  icon: LayoutDashboard,
  exact: true
}, {
  to: "/admin/agenda",
  label: "Agenda",
  icon: Calendar,
  exact: false
}, {
  to: "/admin/caixa",
  label: "Caixa",
  icon: DollarSign,
  exact: false
}, {
  to: "/admin/pdv",
  label: "PDV",
  icon: ShoppingCart,
  exact: false
}, {
  to: "/admin/comissoes",
  label: "Comissões",
  icon: Coins,
  exact: false
}, {
  to: "/admin/pacotes",
  label: "Pacotes",
  icon: Package,
  exact: false
}, {
  to: "/admin/cupons",
  label: "Cupons",
  icon: TicketPercent,
  exact: false
}, {
  to: "/admin/fidelidade",
  label: "Fidelidade",
  icon: Gift,
  exact: false
}, {
  to: "/admin/carteira",
  label: "Carteira",
  icon: Wallet,
  exact: false
}, {
  to: "/admin/estoque",
  label: "Estoque",
  icon: Boxes,
  exact: false
}, {
  to: "/admin/relatorios",
  label: "Relatórios",
  icon: ChartColumn,
  exact: false
}, {
  to: "/admin/franquia",
  label: "Franquia",
  icon: Building2,
  exact: false
}, {
  to: "/admin/clientes",
  label: "Clientes",
  icon: Users,
  exact: false
}, {
  to: "/admin/profissionais",
  label: "Profissionais",
  icon: UserCog,
  exact: false
}, {
  to: "/admin/servicos",
  label: "Serviços",
  icon: Scissors,
  exact: false
}, {
  to: "/admin/portfolio",
  label: "Portfólio",
  icon: Image,
  exact: false
}, {
  to: "/admin/equipe",
  label: "Equipe",
  icon: UsersRound,
  exact: false
}, {
  to: "/admin/folgas",
  label: "Folgas",
  icon: CalendarOff,
  exact: false
}, {
  to: "/admin/avaliacoes",
  label: "Avaliações",
  icon: MessageSquare,
  exact: false
}, {
  to: "/admin/configuracoes",
  label: "Configurações",
  icon: Settings,
  exact: false
}];
function AdminLayout() {
  const {
    user,
    loading
  } = useAuth();
  const nav = useNavigate();
  reactExports.useEffect(() => {
    if (!loading && !user) nav({
      to: "/login"
    });
  }, [loading, user, nav]);
  const {
    data: memberships,
    refetch,
    isLoading
  } = useQuery({
    enabled: !!user,
    queryKey: ["memberships", user?.id],
    staleTime: 1e3 * 60 * 10,
    queryFn: () => barbershopService.getMemberships(user.id)
  });
  async function claimDemo() {
    try {
      await barbershopService.claimDemo(user.id, DEMO_BARBERSHOP_ID);
      toast.success("Você agora é dono da BarberOS Demo!");
      refetch();
    } catch (error) {
      toast.error(error.message || "Erro ao assumir demo");
    }
  }
  if (loading || isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "animate-pulse text-sm font-medium text-muted-foreground", children: "Carregando painel..." })
    ] }) });
  }
  if (!user) return null;
  if (!memberships || memberships.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid min-h-screen place-items-center bg-background p-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-md p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-6 w-6" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-2xl font-bold", children: "Bem-vindo ao BarberOS" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Você ainda não faz parte de nenhuma barbearia. Assuma a barbearia demo ou crie a sua." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 grid gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: claimDemo, children: "Assumir BarberOS Demo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(NewShopDialog, { onCreated: refetch, trigger: /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", children: "Criar minha barbearia" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-3 inline-block text-xs text-muted-foreground hover:underline", children: "Voltar à home" })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ShopProvider, { shops: memberships, refresh: refetch, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AdminShell, {}) });
}
function AdminShell() {
  const loc = useLocation();
  const {
    user
  } = useAuth();
  const {
    shopId,
    shops,
    setShopId,
    refresh
  } = useCurrentShop();
  const {
    theme,
    toggle
  } = useTheme();
  const [openSidebar, setOpenSidebar] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative min-h-screen bg-background selection:bg-accent/30 selection:text-accent-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.4] dark:opacity-60", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { animate: {
        scale: [1, 1.1, 1],
        x: [0, 20, 0],
        y: [0, -20, 0]
      }, transition: {
        duration: 20,
        repeat: Infinity,
        ease: "linear"
      }, className: "absolute -left-32 top-0 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px]" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { animate: {
        scale: [1, 1.2, 1],
        x: [0, -30, 0],
        y: [0, 30, 0]
      }, transition: {
        duration: 25,
        repeat: Infinity,
        ease: "linear"
      }, className: "absolute -right-32 bottom-0 h-[500px] w-[500px] rounded-full bg-accent/5 blur-[140px]" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AdminSidebar, { navItems: NAV, open: openSidebar, setOpen: setOpenSidebar }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative z-10 flex flex-col md:pl-64", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(AdminHeader, { shopId, shops, setShopId, refresh, setOpenSidebar, theme, toggleTheme: toggle, userEmail: user?.email, navItems: NAV }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 p-3 pb-28 md:p-8 md:pb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { initial: {
        opacity: 0,
        y: 10
      }, animate: {
        opacity: 1,
        y: 0
      }, transition: {
        duration: 0.4,
        ease: "easeOut"
      }, className: "mx-auto max-w-7xl", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }, loc.pathname) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("nav", { className: "fixed inset-x-4 bottom-4 z-40 flex h-16 items-center justify-around rounded-2xl border border-border/40 bg-background/80 px-1 shadow-2xl backdrop-blur-xl md:hidden", children: [
        NAV.slice(0, 4).map((n) => {
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: n.to, className: `group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all active:scale-90 ${active ? "text-accent" : "text-muted-foreground hover:text-foreground"}`, children: [
            active && /* @__PURE__ */ jsxRuntimeExports.jsx(motion.div, { layoutId: "mobile-nav-pill", className: "absolute inset-x-1 inset-y-1 z-[-1] rounded-xl bg-accent/10", transition: {
              type: "spring",
              stiffness: 300,
              damping: 30
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { className: `h-5 w-5 transition-transform ${active ? "scale-110" : "group-hover:scale-110"}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold tracking-tight", children: n.label })
          ] }, n.to);
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Sheet, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTrigger, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: `flex flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-all active:scale-90 ${NAV.slice(4).some((n) => loc.pathname.startsWith(n.to)) ? "text-accent" : ""}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Ellipsis, { className: "h-5 w-5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold tracking-tight", children: "Mais" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "bottom", className: "rounded-t-[32px] border-border/40 bg-background/95 pb-12 backdrop-blur-xl max-h-[85vh] overflow-y-auto", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SheetHeader, { className: "mb-6 border-b border-border/40 pb-4 text-left", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "font-display text-2xl font-bold tracking-tight", children: "Todas as Opções" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3", children: NAV.slice(4).map((n) => {
              const active = loc.pathname.startsWith(n.to);
              return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: n.to, className: `flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all active:scale-95 ${active ? "border-accent bg-accent/10 text-accent shadow-sm" : "border-border/40 bg-muted/20 text-foreground hover:bg-muted/40"}`, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(n.icon, { className: "h-6 w-6" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold tracking-tight text-center uppercase", children: n.label })
              ] }, n.to);
            }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  AdminLayout as component
};
