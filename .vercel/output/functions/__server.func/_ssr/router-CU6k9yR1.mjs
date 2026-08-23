import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, b as useRouterState, O as Outlet, H as HeadContent, S as Scripts, d as createFileRoute, l as lazyRouteComponent, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { J as notFound } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { T as Toaster$1, t as toast } from "../_libs/sonner.mjs";
import { S as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { c as cva } from "../_libs/class-variance-authority.mjs";
import { c as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { s as supabase } from "./client-BKVQGVvU.mjs";
import { R as Root } from "../_libs/radix-ui__react-label.mjs";
import { c as createClient } from "../_libs/supabase__supabase-js.mjs";
import { D as Download, L as Lock, U as Users, a as UserCheck, S as Scissors, P as Package, b as Search, c as ShoppingCart, M as Minus, d as Plus, T as Trash2, e as TicketPercent, X, B as Banknote, Q as QrCode, C as CreditCard, A as ArrowLeftRight, W as Wallet, f as ShieldAlert, g as Building2, h as MapPin, i as Clock, j as Save, k as TriangleAlert, l as PowerOff } from "../_libs/lucide-react.mjs";
import { o as objectType, c as coerce, s as stringType } from "../_libs/zod.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const appCss = "/assets/styles-MHsqjXAf.css";
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function slugify(v) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 hover:shadow-lg",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        premium: "bg-accent text-accent-foreground shadow-md hover:bg-accent/90 hover:shadow-lg font-bold tracking-tight"
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-8 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = reactExports.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;
function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}
function InstallAppButton({ className }) {
  const [deferred, setDeferred] = reactExports.useState(null);
  const [visible, setVisible] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInIframe()) return;
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 864e5) return;
    const onPrompt = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  if (!visible || !deferred) return null;
  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "dismissed") localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
    setVisible(false);
  }
  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: cn(
        "fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur-xl md:inset-x-auto md:right-4",
        className
      ),
      role: "dialog",
      "aria-label": "Instalar aplicativo",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium leading-tight", children: "Instalar BarberOS" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Acesso rápido na tela inicial" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: handleDismiss, children: "Agora não" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", onClick: handleInstall, className: "bg-accent text-accent-foreground hover:bg-accent/90", children: "Instalar" })
        ] })
      ]
    }
  );
}
const initialState = {
  theme: "system",
  setTheme: () => null
};
const ThemeProviderContext = reactExports.createContext(initialState);
function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "barberos-ui-theme",
  ...props
}) {
  const [theme, setTheme] = reactExports.useState(
    () => {
      if (typeof window !== "undefined") {
        return localStorage.getItem(storageKey) || defaultTheme;
      }
      return defaultTheme;
    }
  );
  reactExports.useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
  }, [theme]);
  const value = {
    theme,
    setTheme: (theme2) => {
      localStorage.setItem(storageKey, theme2);
      setTheme(theme2);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeProviderContext.Provider, { ...props, value, children });
}
const useTheme = () => {
  const context = reactExports.useContext(ThemeProviderContext);
  if (context === void 0)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
};
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-serif font-bold text-accent", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-serif text-2xl font-semibold text-foreground", children: "Página não encontrada" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "A página que você está procurando não existe ou foi movida." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-none bg-accent px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-foreground hover:text-background",
        children: "Voltar ao Início"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center border border-border bg-card/60 p-8 backdrop-blur-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-serif text-2xl font-bold text-foreground", children: "Ops! Ocorreu um problema ao carregar" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Não se preocupe, tente recarregar ou voltar para a página inicial." }),
    error?.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-[11px] font-mono text-destructive/80 bg-destructive/10 p-2 text-left line-clamp-3", children: error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-none bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-foreground hover:text-background",
          children: "Tentar novamente"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-none border border-border bg-card px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
          children: "Início"
        }
      )
    ] })
  ] }) });
}
const Route$E = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BarberOS — Gestão e agendamento para barbearias" },
      { name: "description", content: "Sistema completo para barbearias modernas: agenda online 24/7, gestão de clientes, equipe e financeiro." },
      { name: "author", content: "BarberOS" },
      { property: "og:title", content: "BarberOS — Gestão e agendamento para barbearias" },
      { property: "og:description", content: "Sistema completo para barbearias modernas: agenda online 24/7, gestão de clientes, equipe e financeiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@BarberOS" },
      { name: "theme-color", content: "#050505" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "BarberOS" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", as: "style", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/icon-512.png" }
    ],
    scripts: [
      {
        children: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW registration failed: ', err));
            });
          }
        `
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$E.useRouteContext();
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ThemeProvider, { defaultTheme: "system", storageKey: "barberos-theme", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-x-0 top-0 z-[100] h-1 origin-left animate-in fade-in fill-mode-both", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-accent shadow-[0_0_8px_hsl(var(--accent))] transition-all duration-500", style: { width: "100%", animation: "progress 2s ease-in-out infinite" } }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `
              @keyframes progress {
                0% { transform: scaleX(0); transform-origin: left; }
                50% { transform: scaleX(0.5); transform-origin: left; }
                100% { transform: scaleX(1); transform-origin: right; }
              }
            ` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { richColors: true, position: "top-right" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(InstallAppButton, {})
  ] }) });
}
const BASE_URL = "";
const Route$D = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const entries = [
          { path: "/", lastmod: now, changefreq: "daily", priority: "1.0" },
          { path: "/barbearias", lastmod: now, changefreq: "daily", priority: "0.9" },
          { path: "/servicos", lastmod: now, changefreq: "weekly", priority: "0.8" },
          { path: "/agendar", lastmod: now, changefreq: "weekly", priority: "0.9" },
          { path: "/login", lastmod: now, changefreq: "monthly", priority: "0.5" },
          { path: "/cadastro", lastmod: now, changefreq: "monthly", priority: "0.5" }
        ];
        try {
          const { data: shops } = await supabase.from("barbershops").select("slug, updated_at, created_at").eq("active", true).not("slug", "is", null);
          for (const shop of shops ?? []) {
            if (!shop.slug) continue;
            const lastmodDate = shop.updated_at || shop.created_at || now;
            entries.push({
              path: `/b/${shop.slug}`,
              lastmod: new Date(lastmodDate).toISOString(),
              changefreq: "weekly",
              priority: "0.8"
            });
          }
        } catch (err) {
          console.error("[sitemap] failed to load dynamic barbershops", err);
        }
        const urls = entries.map(
          (e) => [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`
          ].filter(Boolean).join("\n")
        );
        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`
        ].join("\n");
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400"
          }
        });
      }
    }
  }
});
const $$splitComponentImporter$x = () => import("./servicos-Crhy6PJy.mjs");
const Route$C = createFileRoute("/servicos")({
  head: () => ({
    meta: [{
      title: "Serviços e Cuidados — BarberOS"
    }, {
      name: "description",
      content: "Catálogo completo de cortes, barba e cuidados estéticos masculinos nas barbearias parceiras BarberOS."
    }, {
      property: "og:title",
      content: "Serviços — BarberOS"
    }, {
      property: "og:description",
      content: "Cortes, barba e cuidados premium."
    }, {
      property: "og:url",
      content: "/servicos"
    }],
    links: [{
      rel: "canonical",
      href: "/servicos"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$x, "component")
});
const $$splitComponentImporter$w = () => import("./recuperar-senha-Ld6dd0ku.mjs");
const Route$B = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [{
      title: "Recuperar senha — BarberOS"
    }, {
      name: "description",
      content: "Receba um link seguro para redefinir sua senha BarberOS."
    }, {
      name: "robots",
      content: "noindex,follow"
    }],
    links: [{
      rel: "canonical",
      href: "/recuperar-senha"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$w, "component")
});
const $$splitComponentImporter$v = () => import("./profissionais-dyYpjhfi.mjs");
const Route$A = createFileRoute("/profissionais")({
  head: () => ({
    meta: [{
      title: "Equipe — BarberOS"
    }, {
      name: "description",
      content: "Conheça os artesãos por trás de cada corte na BarberOS."
    }, {
      property: "og:title",
      content: "Equipe — BarberOS"
    }, {
      property: "og:description",
      content: "Os artesãos da BarberOS."
    }, {
      property: "og:url",
      content: "/profissionais"
    }],
    links: [{
      rel: "canonical",
      href: "/profissionais"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$v, "component")
});
const $$splitComponentImporter$u = () => import("./minha-conta-CNAsTn8q.mjs");
const Route$z = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [{
      title: "Minha conta — BarberOS"
    }, {
      name: "description",
      content: "Gerencie seus agendamentos, histórico e avaliações."
    }, {
      name: "robots",
      content: "noindex,follow"
    }],
    links: [{
      rel: "canonical",
      href: "/minha-conta"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$u, "component")
});
const $$splitComponentImporter$t = () => import("./login-FDooxyIV.mjs");
const Route$y = createFileRoute("/login")({
  head: () => ({
    meta: [{
      title: "Entrar — BarberOS"
    }, {
      name: "description",
      content: "Acesse sua conta BarberOS para gerenciar agendamentos e preferências."
    }, {
      property: "og:title",
      content: "Entrar — BarberOS"
    }, {
      property: "og:description",
      content: "Acesso seguro à sua conta BarberOS."
    }, {
      property: "og:url",
      content: "/login"
    }, {
      name: "robots",
      content: "noindex,follow"
    }],
    links: [{
      rel: "canonical",
      href: "/login"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./clube-BhorKNKL.mjs");
const Route$x = createFileRoute("/clube")({
  head: () => ({
    meta: [{
      title: "Clube VIP — BarberOS"
    }, {
      name: "description",
      content: "Assine nossos pacotes e garanta um visual impecável o mês inteiro com descontos exclusivos."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./cadastro-Bh8M6Kwd.mjs");
const Route$w = createFileRoute("/cadastro")({
  head: () => ({
    meta: [{
      title: "Criar conta — BarberOS"
    }, {
      name: "description",
      content: "Crie sua conta BarberOS e agende em segundos, com histórico e lembretes."
    }, {
      property: "og:title",
      content: "Criar conta — BarberOS"
    }, {
      property: "og:description",
      content: "Cadastro gratuito para agendar online 24/7."
    }, {
      property: "og:url",
      content: "/cadastro"
    }, {
      name: "robots",
      content: "noindex,follow"
    }],
    links: [{
      rel: "canonical",
      href: "/cadastro"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./bio-1EePgMy8.mjs");
const Route$v = createFileRoute("/bio")({
  head: () => ({
    meta: [{
      title: "Links — BarberOS"
    }, {
      name: "description",
      content: "Agende seu horário e conheça nossos serviços."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitComponentImporter$p = () => import("./barbearias-DiBJrIza.mjs");
const searchSchema$2 = objectType({
  city: stringType().optional(),
  neighborhood: stringType().optional(),
  minRating: coerce.number().optional(),
  sort: stringType().optional(),
  page: coerce.number().optional()
});
const Route$u = createFileRoute("/barbearias")({
  validateSearch: (search) => searchSchema$2.parse(search),
  head: () => ({
    meta: [{
      title: "Barbearias Parceiras — Encontre a sua no BarberOS"
    }, {
      name: "description",
      content: "Diretório completo de barbearias parceiras. Filtre por cidade, bairro e avaliação e agende online em segundos."
    }, {
      property: "og:title",
      content: "Barbearias Parceiras — BarberOS"
    }, {
      property: "og:description",
      content: "Diretório de barbearias com agendamento online 24/7."
    }, {
      property: "og:url",
      content: "/barbearias"
    }],
    links: [{
      rel: "canonical",
      href: "/barbearias"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$p, "component")
});
const $$splitComponentImporter$o = () => import("./agendar-DEyrWPoQ.mjs");
const searchSchema$1 = objectType({
  shop: stringType().optional()
});
const Route$t = createFileRoute("/agendar")({
  head: () => ({
    meta: [{
      title: "Agendar — BarberOS"
    }, {
      name: "description",
      content: "Reserve seu horário em segundos. Disponibilidade em tempo real, 24/7."
    }, {
      property: "og:title",
      content: "Agendar — BarberOS"
    }, {
      property: "og:description",
      content: "Reserve seu horário em segundos."
    }, {
      property: "og:url",
      content: "/agendar"
    }],
    links: [{
      rel: "canonical",
      href: "/agendar"
    }]
  }),
  validateSearch: (search) => searchSchema$1.parse(search),
  component: lazyRouteComponent($$splitComponentImporter$o, "component")
});
const $$splitComponentImporter$n = () => import("./admin--Kx1NZ8w.mjs");
const Route$s = createFileRoute("/admin")({
  head: () => ({
    meta: [{
      title: "Admin — BarberOS"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  loader: async ({
    context: {
      queryClient
    }
  }) => {
  },
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const $$splitComponentImporter$m = () => import("./index-B0W1H2xD.mjs");
const searchSchema = objectType({
  city: stringType().optional()
});
const Route$r = createFileRoute("/")({
  validateSearch: (search) => searchSchema.parse(search),
  head: () => ({
    meta: [{
      title: "BarberOS — Encontre e Agende nas Melhores Barbearias"
    }, {
      name: "description",
      content: "Atendimento exclusivo nas melhores barbearias do Brasil. Agende online em 30 segundos, disponível 24/7."
    }, {
      property: "og:title",
      content: "BarberOS — Barbearias Premium"
    }, {
      property: "og:description",
      content: "Reserve sua experiência em 30 segundos, 24/7."
    }, {
      property: "og:url",
      content: "/"
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary_large_image"
    }],
    links: [{
      rel: "canonical",
      href: "/"
    }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HealthAndBeautyBusiness",
        name: "BarberOS",
        description: "Rede de barbearias premium com agendamento online 24/7.",
        areaServed: "Brasil"
      })
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$m, "component")
});
const $$splitComponentImporter$l = () => import("./admin.index-BeOD0PB7.mjs");
const Route$q = createFileRoute("/admin/")({
  component: lazyRouteComponent($$splitComponentImporter$l, "component")
});
const $$splitComponentImporter$k = () => import("./convite._token-B3KCUNfo.mjs");
const Route$p = createFileRoute("/convite/$token")({
  head: () => ({
    meta: [{
      title: "Convite — BarberOS"
    }, {
      name: "description",
      content: "Aceite seu convite para integrar a equipe BarberOS."
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const barbershopService = {
  async getMemberships(userId) {
    const { data: ms, error } = await supabase.from("barbershop_members").select("barbershop_id, role, barbershops(id, name, settings)").eq("profile_id", userId).eq("active", true);
    if (error) throw error;
    return (ms ?? []).map((m) => ({
      id: m.barbershop_id,
      role: m.role,
      name: m.barbershops?.name ?? "Barbearia",
      settings: m.barbershops?.settings ?? {}
    }));
  },
  async getSettings(shopId) {
    const { data, error } = await supabase.from("barbershops").select("settings").eq("id", shopId).maybeSingle();
    if (error) throw error;
    return data?.settings;
  },
  async claimDemo(userId, demoId) {
    const { error } = await supabase.from("barbershop_members").insert({
      barbershop_id: demoId,
      profile_id: userId,
      role: "owner"
    });
    if (error) throw error;
  },
  async create(name, slug, userId) {
    const { data, error } = await supabase.from("barbershops").insert({ name, slug }).select("id").single();
    if (error || !data) throw error || new Error("Falha ao criar barbearia");
    const { error: mErr } = await supabase.from("barbershop_members").insert({
      barbershop_id: data.id,
      profile_id: userId,
      role: "owner"
    });
    if (mErr) throw mErr;
    return data;
  },
  async createBarbershop(data) {
    const owner = data.ownerId || data.userId;
    const generatedSlug = data.slug || data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.floor(Math.random() * 1e3);
    const contacts = data.contacts || (data.phone ? { phone: data.phone, whatsapp: data.phone } : null);
    const { data: shop, error } = await supabase.from("barbershops").insert({
      name: data.name,
      slug: generatedSlug,
      description: data.description || null,
      logo_url: data.logo_url || null,
      banner_url: data.banner_url || null,
      contacts,
      address: data.address || null,
      social: data.social || null,
      settings: data.settings || null,
      active: true
    }).select().single();
    if (error || !shop) throw error || new Error("Erro ao criar barbearia");
    if (owner) {
      await this.addMember(shop.id, owner, "owner");
    }
    return shop;
  },
  async getBarbershopsByOwner(userId) {
    const { data, error } = await supabase.from("barbershop_members").select("barbershop:barbershops(*)").eq("profile_id", userId).eq("role", "owner").eq("active", true);
    if (error) throw error;
    return (data ?? []).map((d) => d.barbershop).filter(Boolean);
  },
  /**
   * Lista barbearias com filtros de busca, localização, avaliação e paginação
   */
  async getBarbershops(filters) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    let query = supabase.from("barbershops").select("*, satisfaction_surveys(shop_rating), appointments(id)", { count: "exact" }).eq("active", true);
    if (filters?.q) {
      const term = `%${filters.q.trim()}%`;
      query = query.or(`name.ilike.${term},slug.ilike.${term},description.ilike.${term}`);
    }
    const { data, count, error } = await query;
    if (error) throw error;
    let shops = (data ?? []).map((shop) => {
      const surveys = shop.satisfaction_surveys ?? [];
      const validRatings = surveys.map((s) => Number(s.shop_rating)).filter((r) => !isNaN(r) && r > 0);
      const review_count = validRatings.length;
      const rating = review_count > 0 ? Number((validRatings.reduce((a, b) => a + b, 0) / review_count).toFixed(1)) : 5;
      const address = shop.address ?? {};
      const city = address?.city ?? "";
      const neighborhood = address?.neighborhood ?? address?.district ?? "";
      return {
        ...shop,
        rating,
        review_count,
        _city: city.toLowerCase(),
        _neighborhood: neighborhood.toLowerCase(),
        _appointments_count: shop.appointments?.length ?? 0
      };
    });
    if (filters?.city) {
      const c = filters.city.trim().toLowerCase();
      shops = shops.filter((s) => s._city.includes(c) || JSON.stringify(s.address ?? {}).toLowerCase().includes(c));
    }
    if (filters?.neighborhood) {
      const n = filters.neighborhood.trim().toLowerCase();
      shops = shops.filter((s) => s._neighborhood.includes(n) || JSON.stringify(s.address ?? {}).toLowerCase().includes(n));
    }
    if (filters?.minRating) {
      shops = shops.filter((s) => (s.rating ?? 0) >= filters.minRating);
    }
    const sort = filters?.sort || "rating";
    if (sort === "rating") {
      shops.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (sort === "recent") {
      shops.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sort === "popular") {
      shops.sort((a, b) => (b._appointments_count ?? 0) - (a._appointments_count ?? 0));
    }
    const paginatedData = shops.slice(offset, offset + limit);
    return {
      data: paginatedData,
      count: shops.length || (count ?? 0)
    };
  },
  /**
   * Obtém os detalhes completos de uma barbearia pelo slug para a página pública
   */
  async getBarbershopBySlug(slug) {
    const { data: shop, error: sErr } = await supabase.from("barbershops").select("*").eq("slug", slug).eq("active", true).maybeSingle();
    if (sErr || !shop) throw sErr || new Error("Barbearia não encontrada.");
    const [servicesRes, prosRes, portfolioRes, reviewsRes] = await Promise.all([
      supabase.from("services").select("*").eq("barbershop_id", shop.id).eq("active", true).order("sort"),
      supabase.from("professionals").select("*").eq("barbershop_id", shop.id).eq("active", true),
      supabase.from("portfolio_items").select("*").eq("barbershop_id", shop.id).order("sort"),
      supabase.from("satisfaction_surveys").select(`
          id,
          shop_rating,
          comment,
          answered_at,
          appointment:appointments(
            customer:customers(full_name)
          )
        `).eq("barbershop_id", shop.id).eq("is_public", true).order("answered_at", { ascending: false }).limit(5)
    ]);
    const reviews = (reviewsRes.data ?? []).map((r) => ({
      id: r.id,
      rating: r.shop_rating ?? 5,
      comment: r.comment,
      answered_at: r.answered_at,
      customer_name: r.appointment?.customer?.full_name ?? "Cliente BarberOS"
    }));
    const validRatings = reviews.map((r) => Number(r.rating)).filter((n) => !isNaN(n) && n > 0);
    const avgRating = validRatings.length > 0 ? Number((validRatings.reduce((a, b) => a + b, 0) / validRatings.length).toFixed(1)) : 5;
    return {
      shop: {
        ...shop,
        rating: avgRating,
        review_count: validRatings.length
      },
      services: servicesRes.data ?? [],
      professionals: prosRes.data ?? [],
      portfolio: portfolioRes.data ?? [],
      reviews
    };
  },
  /**
   * Métodos CRUD para Serviços (Services)
   */
  async getServices(barbershopId) {
    const { data, error } = await supabase.from("services").select("*").eq("barbershop_id", barbershopId).order("sort").order("name");
    if (error) throw error;
    return data ?? [];
  },
  async createService(data) {
    const finalPrice = data.price ?? (data.price_cents ? data.price_cents / 100 : 0);
    const { data: service, error } = await supabase.from("services").insert({
      barbershop_id: data.barbershop_id,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      duration_min: data.duration_min,
      price: finalPrice,
      active: data.active ?? true
    }).select().single();
    if (error) throw error;
    return service;
  },
  async updateService(id, data) {
    const updatePayload = { ...data };
    if (data.price_cents !== void 0) {
      updatePayload.price = data.price_cents / 100;
      delete updatePayload.price_cents;
    }
    const { data: updated, error } = await supabase.from("services").update(updatePayload).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  async deleteService(id) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throw error;
  },
  /**
   * Métodos CRUD para Barbeiros / Profissionais (Barbers)
   */
  async getBarbers(barbershopId) {
    const { data, error } = await supabase.from("professionals").select("*").eq("barbershop_id", barbershopId).order("display_name");
    if (error) throw error;
    return data ?? [];
  },
  async createBarber(data) {
    const slug = data.display_name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || crypto.randomUUID().slice(0, 8);
    const commission_rule = {
      percentage: data.commission_percent ?? 40
    };
    const { data: pro, error } = await supabase.from("professionals").insert({
      barbershop_id: data.barbershop_id,
      display_name: data.display_name.trim(),
      bio: data.bio?.trim() || null,
      specialties: data.specialties ?? ["Corte", "Barba"],
      commission_rule,
      slug,
      active: data.active ?? true
    }).select().single();
    if (error) throw error;
    return pro;
  },
  async updateBarber(id, data) {
    const updatePayload = { ...data };
    if (data.commission_percent !== void 0) {
      updatePayload.commission_rule = {
        ...typeof updatePayload.commission_rule === "object" ? updatePayload.commission_rule : {},
        percentage: data.commission_percent
      };
      delete updatePayload.commission_percent;
    }
    const { data: updated, error } = await supabase.from("professionals").update(updatePayload).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  async deleteBarber(id) {
    const { error } = await supabase.from("professionals").delete().eq("id", id);
    if (error) throw error;
  },
  /**
   * Atualização de dados da barbearia
   */
  async updateBarbershop(id, data) {
    const { data: updated, error } = await supabase.from("barbershops").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  /**
   * Exclusão ou desativação suave (soft delete) da barbearia
   */
  async deleteBarbershop(id) {
    const { error } = await supabase.from("barbershops").update({ active: false }).eq("id", id);
    if (error) throw error;
  },
  /**
   * Lista membros da equipe da barbearia
   */
  async getMembers(barbershopId) {
    const { data, error } = await supabase.from("barbershop_members").select("*, profile:profiles(id, full_name, phone, avatar_url)").eq("barbershop_id", barbershopId).eq("active", true);
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Adiciona um novo membro à equipe da barbearia
   */
  async addMember(barbershopId, userId, role = "professional") {
    const { data, error } = await supabase.from("barbershop_members").insert({
      barbershop_id: barbershopId,
      profile_id: userId,
      role,
      active: true
    }).select().single();
    if (error) throw error;
    return data;
  },
  /**
   * Remove ou desativa um membro da equipe da barbearia
   */
  async removeMember(barbershopId, userId) {
    const { error } = await supabase.from("barbershop_members").update({ active: false }).eq("barbershop_id", barbershopId).eq("profile_id", userId);
    if (error) throw error;
  }
};
const $$splitComponentImporter$j = () => import("./b._slug-h7lbvAzA.mjs");
const $$splitNotFoundComponentImporter$1 = () => import("./b._slug-Cl95PUIU.mjs");
const Route$o = createFileRoute("/b/$slug")({
  loader: async ({
    params
  }) => {
    try {
      const data = await barbershopService.getBarbershopBySlug(params.slug);
      if (!data || !data.shop) throw notFound();
      return data;
    } catch {
      throw notFound();
    }
  },
  head: ({
    loaderData,
    params
  }) => {
    const shop = loaderData?.shop;
    if (!shop) return {
      meta: [{
        title: "Barbearia — BarberOS"
      }]
    };
    const desc = shop.description ?? `Agende online na ${shop.name}. Cortes, barba e cuidados exclusivos.`;
    const addr = shop.address ?? {};
    const contacts = shop.contacts ?? {};
    const phone = contacts?.phone ?? contacts?.whatsapp;
    const ld = {
      "@context": "https://schema.org",
      "@type": "HairSalon",
      name: shop.name,
      description: desc,
      url: `/b/${shop.slug}`,
      ...shop.logo_url ? {
        image: shop.logo_url
      } : {},
      ...phone ? {
        telephone: phone
      } : {},
      ...addr.street || addr.city ? {
        address: {
          "@type": "PostalAddress",
          streetAddress: addr.street ?? void 0,
          addressLocality: addr.city ?? void 0,
          addressRegion: addr.state ?? void 0,
          postalCode: addr.zip ?? void 0,
          addressCountry: addr.country ?? "BR"
        }
      } : {}
    };
    return {
      meta: [{
        title: `${shop.name} — Agende Online | BarberOS`
      }, {
        name: "description",
        content: desc.slice(0, 155)
      }, {
        property: "og:title",
        content: `${shop.name} — BarberOS`
      }, {
        property: "og:description",
        content: desc.slice(0, 155)
      }, {
        property: "og:type",
        content: "website"
      }, {
        property: "og:url",
        content: `/b/${params.slug}`
      }, ...shop.banner_url ? [{
        property: "og:image",
        content: shop.banner_url
      }] : []],
      links: [{
        rel: "canonical",
        href: `/b/${shop.slug}`
      }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify(ld)
      }]
    };
  },
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$1, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$j, "component")
});
const $$splitComponentImporter$i = () => import("./avaliar._appointmentId-B7og-Tra.mjs");
const Route$n = createFileRoute("/avaliar/$appointmentId")({
  head: () => ({
    meta: [{
      title: "Avaliar atendimento — BarberOS"
    }, {
      name: "description",
      content: "Compartilhe sua experiência e ajude a elevar o padrão de atendimento."
    }, {
      name: "robots",
      content: "noindex,follow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$i, "component")
});
const $$splitComponentImporter$h = () => import("./admin.servicos-B1f8CsdT.mjs");
const Route$m = createFileRoute("/admin/servicos")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component")
});
const $$splitComponentImporter$g = () => import("./admin.relatorios-TN2Sl1sT.mjs");
const Route$l = createFileRoute("/admin/relatorios")({
  head: () => ({
    meta: [{
      title: "Relatórios & Métricas — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitComponentImporter$f = () => import("./admin.profissionais-BHgQ0HAo.mjs");
const Route$k = createFileRoute("/admin/profissionais")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component")
});
const $$splitComponentImporter$e = () => import("./admin.portfolio-c63_KnJg.mjs");
const Route$j = createFileRoute("/admin/portfolio")({
  head: () => ({
    meta: [{
      title: "Portfólio & Galeria de Cortes — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const ShopCtx = reactExports.createContext(null);
const STORAGE_KEY = "barberos.currentShopId";
function ShopProvider({ shops, refresh, children }) {
  const [shopId, setShopIdState] = reactExports.useState(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  reactExports.useEffect(() => {
    if (!shops.length) return;
    if (!shopId || !shops.find((s) => s.id === shopId)) {
      const next = shops[0].id;
      setShopIdState(next);
      localStorage.setItem(STORAGE_KEY, next);
    }
  }, [shops, shopId]);
  const setShopId = (id) => {
    setShopIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  };
  const shop = shops.find((s) => s.id === shopId) ?? null;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(ShopCtx.Provider, { value: { shopId, shop, shops, setShopId, refresh }, children });
}
function useCurrentShop() {
  const ctx = reactExports.useContext(ShopCtx);
  if (!ctx) throw new Error("useCurrentShop must be used within ShopProvider");
  return ctx;
}
function useAuth() {
  const [session, setSession] = reactExports.useState(null);
  const [user, setUser] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    let mounted = true;
    const initSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      if (mounted) {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);
  return { session, user, loading, isAuthenticated: !!user };
}
const cashService = {
  /**
   * Valida se o usuário pertence à equipe da barbearia
   */
  async validateUserMembership(barbershopId, userId) {
    const { data, error } = await supabase.from("barbershop_members").select("id").eq("barbershop_id", barbershopId).eq("profile_id", userId).eq("active", true).maybeSingle();
    if (error || !data) {
      throw new Error("Acesso negado: você não possui permissão para movimentar o caixa desta barbearia.");
    }
    return true;
  },
  async getOpenSession(shopId) {
    const { data, error } = await supabase.from("cash_sessions").select("*").eq("barbershop_id", shopId).eq("status", "open").order("opened_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  },
  async openSession(shopId, userId, amount = 0) {
    await this.validateUserMembership(shopId, userId);
    const { data, error } = await supabase.from("cash_sessions").insert({ barbershop_id: shopId, opened_by: userId, opening_amount: amount }).select("id").single();
    if (error) throw error;
    return data;
  },
  async closeSession(sessionId, userId, amount) {
    const { error } = await supabase.from("cash_sessions").update({
      status: "closed",
      closed_at: (/* @__PURE__ */ new Date()).toISOString(),
      closed_by: userId,
      closing_amount: amount
    }).eq("id", sessionId);
    if (error) throw error;
  },
  async getTransactionsByDate(shopId, date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const { data, error } = await supabase.from("cash_transactions").select("*, professional:professionals(display_name), customer:customers(full_name)").eq("barbershop_id", shopId).gte("created_at", startOfDay.toISOString()).lte("created_at", endOfDay.toISOString()).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Busca lançamentos do caixa em um intervalo de datas
   */
  async getCashEntries(barbershopId, startDate, endDate) {
    const { data, error } = await supabase.from("cash_transactions").select("*, professional:professionals(display_name), customer:customers(full_name)").eq("barbershop_id", barbershopId).gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()).order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  async createTransaction(params) {
    if (params.created_by) {
      await this.validateUserMembership(params.barbershop_id, params.created_by);
    }
    const { data, error } = await supabase.from("cash_transactions").insert(params).select().single();
    if (error) throw error;
    return data;
  },
  /**
   * Registra um lançamento avulso no caixa (entrada ou saída)
   */
  async createCashEntry(params) {
    const finalAmount = params.amount ?? (params.amount_cents ? params.amount_cents / 100 : 0);
    const kind = params.kind ?? (params.type === "saída" || params.type === "out" || params.type === "withdraw" ? "withdraw" : "in");
    const method = params.method ?? (params.payment_method === "PIX" ? "pix" : params.payment_method === "Cartão" ? "credit" : params.payment_method === "Dinheiro" ? "cash" : params.payment_method || "cash");
    let sessionId = params.session_id;
    if (!sessionId) {
      const openSession = await this.getOpenSession(params.barbershop_id);
      sessionId = openSession?.id;
      if (!sessionId && params.created_by) {
        const newSession = await this.openSession(params.barbershop_id, params.created_by, 0);
        sessionId = newSession.id;
      }
    }
    if (!sessionId) {
      throw new Error("Não foi possível encontrar ou abrir uma sessão de caixa ativa.");
    }
    return this.createTransaction({
      barbershop_id: params.barbershop_id,
      session_id: sessionId,
      kind,
      method,
      amount: finalAmount,
      description: params.description.trim(),
      created_by: params.created_by || ""
    });
  },
  /**
   * Obtém resumo da carteira/saldo acumulado da barbearia
   */
  async getWalletSummary(barbershopId) {
    const { data: transactions, error: txErr } = await supabase.from("cash_transactions").select("amount, kind, method, created_at").eq("barbershop_id", barbershopId);
    if (txErr) throw txErr;
    let balance = 0;
    (transactions ?? []).forEach((t) => {
      if (t.kind === "sale" || t.kind === "in" || t.kind === "deposit") {
        balance += Number(t.amount || 0);
      } else if (t.kind === "withdraw" || t.kind === "fee" || t.kind === "out") {
        balance -= Number(t.amount || 0);
      }
    });
    const { data: pendingAppts, error: apptErr } = await supabase.from("appointments").select("total_amount").eq("barbershop_id", barbershopId).in("status", ["scheduled", "in_progress"]);
    if (apptErr) throw apptErr;
    const pendingReceivables = (pendingAppts ?? []).reduce(
      (sum, a) => sum + Number(a.total_amount || 0),
      0
    );
    return {
      balance,
      pendingReceivables,
      transactionsCount: transactions?.length ?? 0
    };
  },
  /**
   * Atualiza um lançamento do caixa
   */
  async updateCashEntry(id, data) {
    const { data: updated, error } = await supabase.from("cash_transactions").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  /**
   * Exclui um lançamento do caixa
   */
  async deleteCashEntry(id) {
    const { error } = await supabase.from("cash_transactions").delete().eq("id", id);
    if (error) throw error;
  }
};
const productService = {
  /**
   * Lista todos os produtos ativos de uma barbearia
   */
  async getProducts(barbershopId) {
    const { data, error } = await supabase.from("products").select("*").eq("barbershop_id", barbershopId).eq("active", true).order("name");
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Cadastra um novo produto (aceita preço em centavos ou reais)
   */
  async createProduct(data) {
    const finalPrice = data.price ?? (data.price_cents ? data.price_cents / 100 : 0);
    const { data: product, error } = await supabase.from("products").insert({
      barbershop_id: data.barbershop_id,
      name: data.name,
      price: finalPrice,
      cost: data.cost ?? 0,
      stock_qty: data.stock_qty ?? 0,
      min_stock: data.min_stock ?? 0,
      description: data.description || null,
      sku: data.sku || null,
      unit: data.unit || "un",
      active: data.active ?? true
    }).select().single();
    if (error) throw error;
    return product;
  },
  /**
   * Atualiza dados de um produto existente
   */
  async updateProduct(id, data) {
    const updatePayload = { ...data };
    if (data.price_cents !== void 0) {
      updatePayload.price = data.price_cents / 100;
      delete updatePayload.price_cents;
    }
    const { data: updated, error } = await supabase.from("products").update(updatePayload).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  },
  /**
   * Exclusão suave (desativação) de produto
   */
  async deleteProduct(id) {
    const { error } = await supabase.from("products").update({ active: false }).eq("id", id);
    if (error) throw error;
  },
  /**
   * Movimenta o estoque de um produto e registra em stock_movements
   */
  async updateStock(productId, quantityDelta, reason = "Ajuste manual", userId) {
    const { data: prod, error: pErr } = await supabase.from("products").select("stock_qty, barbershop_id").eq("id", productId).single();
    if (pErr || !prod) throw pErr || new Error("Produto não encontrado.");
    const newStock = Number(prod.stock_qty || 0) + quantityDelta;
    if (newStock < 0) {
      throw new Error(`Estoque insuficiente. Saldo atual: ${prod.stock_qty}`);
    }
    const { data: updated, error: uErr } = await supabase.from("products").update({ stock_qty: newStock }).eq("id", productId).select().single();
    if (uErr) throw uErr;
    const kind = quantityDelta >= 0 ? "in" : "out";
    await supabase.from("stock_movements").insert({
      barbershop_id: prod.barbershop_id,
      product_id: productId,
      quantity: Math.abs(quantityDelta),
      kind,
      notes: reason,
      created_by: userId || null
    });
    return updated;
  }
};
const customerService = {
  async getById(id) {
    const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  },
  async incrementNoShow(id) {
    const cur = await this.getById(id);
    const next = Number(cur?.no_show_count ?? 0) + 1;
    const { error } = await supabase.from("customers").update({ no_show_count: next }).eq("id", id);
    if (error) throw error;
    return next;
  },
  async blockCustomer(id) {
    const { error } = await supabase.from("customers").update({ blocked: true }).eq("id", id);
    if (error) throw error;
  },
  async unblockCustomer(id) {
    const { error } = await supabase.from("customers").update({ blocked: false, no_show_count: 0 }).eq("id", id);
    if (error) throw error;
  },
  /**
   * Obtém lista de clientes de uma barbearia
   */
  async getCustomers(barbershopId, params) {
    const page = params?.page ?? 0;
    const limit = params?.limit ?? 20;
    const from = page * limit;
    const to = from + limit - 1;
    let query = supabase.from("customers").select("*", { count: "exact" }).eq("barbershop_id", barbershopId).range(from, to);
    if (params?.q) {
      const q = params.q.trim();
      query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
    }
    if (params?.blocked !== void 0) {
      query = query.eq("blocked", params.blocked);
    }
    const { data, count, error } = await query.order("created_at", { ascending: false });
    if (error) throw error;
    return {
      data: data ?? [],
      totalCount: count ?? 0,
      nextPage: (data?.length ?? 0) === limit ? page + 1 : void 0
    };
  },
  /**
   * Obtém o histórico completo de agendamentos e serviços de um cliente
   */
  async getCustomerHistory(customerId) {
    const { data, error } = await supabase.from("appointments").select(`
        id,
        scheduled_start,
        scheduled_end,
        total_amount,
        status,
        notes,
        created_at,
        professional:professionals(id, display_name),
        services:appointment_services(
          id,
          price_snapshot,
          duration_snapshot,
          service:services(id, name, description)
        )
      `).eq("customer_id", customerId).order("scheduled_start", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  /**
   * Calcula estatísticas resumidas de um cliente (gastos, visitas, última visita)
   */
  async getCustomerStats(customerId) {
    const { data, error } = await supabase.from("appointments").select("scheduled_start, total_amount, status").eq("customer_id", customerId).order("scheduled_start", { ascending: false });
    if (error) throw error;
    const completed = (data ?? []).filter((a) => a.status === "completed");
    const totalSpent = completed.reduce((sum, a) => sum + Number(a.total_amount || 0), 0);
    const lastVisit = completed.length > 0 ? completed[0].scheduled_start : null;
    return {
      totalSpent,
      totalAppointments: data?.length ?? 0,
      lastVisit
    };
  },
  /**
   * Atualiza os dados de cadastro de um cliente
   */
  async updateCustomer(id, data) {
    const { data: updated, error } = await supabase.from("customers").update(data).eq("id", id).select().single();
    if (error) throw error;
    return updated;
  }
};
const Card = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: cn(
        "rounded-2xl border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md",
        className
      ),
      ...props
    }
  )
);
Card.displayName = "Card";
const CardHeader = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: cn("font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
const CardDescription = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
const Input = reactExports.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const brl = (n) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n ?? 0);
const minutes = (n) => {
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const m = n % 60;
  return m ? `${h}h${m}` : `${h}h`;
};
const phoneMask = (v) => {
  const d = (v ?? "").replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4}).*/, (_, a, b, c) => [a && `(${a}`, a?.length === 2 ? ") " : "", b, c && `-${c}`].filter(Boolean).join(""));
  return d.replace(/(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3");
};
const DEMO_BARBERSHOP_ID = "11111111-1111-1111-1111-111111111111";
const Route$i = createFileRoute("/admin/pdv")({
  head: () => ({ meta: [{ title: "PDV / Vendas — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PDV
});
const METHODS = [
  { id: "cash", label: "Dinheiro", icon: Banknote },
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "debit", label: "Débito", icon: CreditCard },
  { id: "credit", label: "Crédito", icon: CreditCard },
  { id: "transfer", label: "Transf.", icon: ArrowLeftRight },
  { id: "other", label: "Outro", icon: Wallet }
];
function PDV() {
  const { shopId } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedCustomerId, setSelectedCustomerId] = reactExports.useState(null);
  const [customerSearch, setCustomerSearch] = reactExports.useState("");
  const [proId, setProId] = reactExports.useState(null);
  const [method, setMethod] = reactExports.useState("cash");
  const [cart, setCart] = reactExports.useState([]);
  const [customAmount, setCustomAmount] = reactExports.useState("");
  const [filter, setFilter] = reactExports.useState("");
  const [tab, setTab] = reactExports.useState("services");
  const [busy, setBusy] = reactExports.useState(false);
  const [couponInput, setCouponInput] = reactExports.useState("");
  const [coupon, setCoupon] = reactExports.useState(null);
  const [couponBusy, setCouponBusy] = reactExports.useState(false);
  const { data: session } = useQuery({
    queryKey: ["pdv-session", shopId],
    enabled: !!shopId,
    queryFn: () => cashService.getOpenSession(shopId)
  });
  const { data: pros } = useQuery({
    queryKey: ["pdv-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId)
  });
  const { data: services } = useQuery({
    queryKey: ["pdv-services", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getServices(shopId)
  });
  const { data: products, refetch: refetchProducts } = useQuery({
    queryKey: ["pdv-products", shopId],
    enabled: !!shopId,
    queryFn: () => productService.getProducts(shopId)
  });
  const { data: customersData } = useQuery({
    queryKey: ["pdv-customers", shopId, customerSearch],
    enabled: !!shopId && customerSearch.length > 1,
    queryFn: () => customerService.getCustomers(shopId, { q: customerSearch, limit: 10 })
  });
  const filteredServices = reactExports.useMemo(() => {
    const list = services ?? [];
    if (!filter.trim()) return list;
    const f = filter.toLowerCase();
    return list.filter((s) => s.name.toLowerCase().includes(f));
  }, [services, filter]);
  const filteredProducts = reactExports.useMemo(() => {
    const list = products ?? [];
    if (!filter.trim()) return list;
    const f = filter.toLowerCase();
    return list.filter((p) => p.name.toLowerCase().includes(f));
  }, [products, filter]);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = reactExports.useMemo(() => {
    if (!coupon) return 0;
    if (Number(coupon.min_amount ?? 0) > 0 && subtotal < Number(coupon.min_amount)) return 0;
    if (coupon.kind === "percent" || coupon.kind === "first_visit") {
      return +(subtotal * Number(coupon.value) / 100).toFixed(2);
    }
    return Math.min(subtotal, Number(coupon.value));
  }, [coupon, subtotal]);
  const total = Math.max(0, +(subtotal - discount).toFixed(2));
  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponBusy(true);
    const { data, error } = await supabase.from("coupons").select("*").eq("barbershop_id", shopId).eq("code", code).maybeSingle();
    setCouponBusy(false);
    if (!data || !("active" in data)) return toast.error("Cupom inválido ou não encontrado.");
    const c = data;
    if (!c.active) return toast.error("Cupom inativo.");
    const now = Date.now();
    if (c.valid_from && now < new Date(c.valid_from).getTime()) return toast.error("Cupom ainda não está ativo.");
    if (c.valid_until && now > new Date(c.valid_until).getTime()) return toast.error("Este cupom expirou.");
    if (c.usage_limit != null && Number(c.used_count) >= Number(c.usage_limit)) return toast.error("Limite de uso atingido.");
    if (Number(c.min_amount ?? 0) > 0 && subtotal < Number(c.min_amount)) {
      return toast.error(`Valor mínimo de ${brl(Number(c.min_amount))}`);
    }
    setCoupon(c);
    toast.success(`Cupom ${c.code} aplicado com sucesso!`);
  }
  function clearCoupon() {
    setCoupon(null);
    setCouponInput("");
  }
  function addService(s) {
    setCart((c) => [...c, { id: `srv-${s.id}-${Date.now()}`, serviceId: s.id, name: s.name, price: Number(s.price), qty: 1 }]);
    toast.success(`${s.name} adicionado`);
  }
  function addProduct(p) {
    const stock = Number(p.stock_qty ?? 0);
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) {
        if (existing.qty + 1 > stock) {
          toast.error(`Estoque insuficiente (Saldo: ${stock})`);
          return c;
        }
        return c.map((i) => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      if (stock < 1) {
        toast.error("Produto sem estoque.");
        return c;
      }
      return [
        ...c,
        { id: `prod-${p.id}-${Date.now()}`, productId: p.id, name: p.name, price: Number(p.price), qty: 1, stockLeft: stock }
      ];
    });
    toast.success(`${p.name} adicionado`);
  }
  function changeQty(id, delta) {
    setCart(
      (c) => c.flatMap((i) => {
        if (i.id !== id) return [i];
        const next = i.qty + delta;
        if (next <= 0) return [];
        if (i.productId && i.stockLeft != null && next > i.stockLeft) {
          toast.error(`Estoque insuficiente (${i.stockLeft})`);
          return [i];
        }
        return [{ ...i, qty: next }];
      })
    );
  }
  function addCustom() {
    const v = Number(customAmount.replace(",", "."));
    if (!v || v <= 0) return;
    setCart((c) => [...c, { id: `custom-${Date.now()}`, name: "Item Avulso", price: v, qty: 1 }]);
    setCustomAmount("");
  }
  function removeItem(id) {
    setCart((c) => c.filter((i) => i.id !== id));
  }
  async function handleFinalize() {
    if (!session) return toast.error("É necessário abrir o caixa antes de registrar vendas.");
    if (cart.length === 0) return toast.error("Adicione ao menos um item ao carrinho.");
    setBusy(true);
    try {
      const pro = (pros ?? []).find((p) => p.id === proId);
      const description = cart.map((i) => i.qty > 1 ? `${i.qty}× ${i.name}` : i.name).join(", ");
      const tx = await cashService.createTransaction({
        barbershop_id: shopId,
        session_id: session.id,
        kind: "sale",
        method,
        amount: total,
        description,
        created_by: user?.id ?? "",
        customer_id: selectedCustomerId || void 0,
        professional_id: proId || void 0
      });
      const productItems = cart.filter((i) => i.productId);
      for (const item of productItems) {
        await productService.updateStock(item.productId, -item.qty, `Venda PDV — Tx ${tx.id.slice(0, 8)}`, user?.id);
      }
      if (pro && proId) {
        const rule = pro.commission_rule ?? {};
        const rate = Number(rule.percentage ?? rule.percent ?? rule.rate ?? 0);
        if (rate > 0) {
          const commAmount = +(total * rate / 100).toFixed(2);
          await supabase.from("commissions").insert({
            barbershop_id: shopId,
            professional_id: proId,
            transaction_id: tx.id,
            base_amount: total,
            rate,
            amount: commAmount,
            status: "pending"
          });
        }
      }
      if (coupon && discount > 0) {
        await supabase.from("coupons").update({ used_count: Number(coupon.used_count || 0) + 1 }).eq("id", coupon.id);
      }
      toast.success(`Venda de ${brl(total)} finalizada com sucesso!`);
      setCart([]);
      setCustomAmount("");
      clearCoupon();
      setSelectedCustomerId(null);
      setCustomerSearch("");
      if (productItems.length) refetchProducts();
      qc.invalidateQueries({ queryKey: ["cash-transactions", shopId] });
    } catch (err) {
      toast.error(err.message || "Erro ao finalizar venda.");
    } finally {
      setBusy(false);
    }
  }
  if (!session) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid place-items-center py-20 text-center px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "max-w-sm p-8 border border-border bg-card/60 shadow-xl backdrop-blur-md rounded-none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto h-16 w-16 grid place-items-center bg-muted/20 text-muted-foreground/40 mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Lock, { className: "h-8 w-8" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-serif text-2xl font-bold", children: "Caixa fechado" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Abra o caixa diário para realizar cobranças e vendas pelo PDV." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-6 w-full rounded-none bg-accent text-accent-foreground h-12 font-bold uppercase tracking-wider", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/admin/caixa", children: "Ir para o Caixa" }) })
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-6 lg:grid-cols-[1fr_380px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-4xl font-bold tracking-tight", children: "PDV / Balcão" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Registre vendas rápidas de serviços e produtos no caixa." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border/80 bg-card/40 p-4 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3.5 w-3.5 text-accent" }),
              " Cliente"
            ] }),
            selectedCustomerId && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
              setSelectedCustomerId(null);
              setCustomerSearch("");
            }, className: "text-accent hover:underline", children: "Trocar" })
          ] }),
          selectedCustomerId ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-bold text-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(UserCheck, { className: "h-4 w-4 text-emerald-500" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Cliente selecionado" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: customerSearch,
                onChange: (e) => setCustomerSearch(e.target.value),
                placeholder: "Buscar cliente ou deixar avulso...",
                className: "h-10 rounded-none text-xs"
              }
            ),
            customersData?.data && customersData.data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-28 divide-y divide-border/20 overflow-y-auto border border-border/40 bg-background text-xs", children: customersData.data.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => {
                  setSelectedCustomerId(c.id);
                  setCustomerSearch(c.full_name);
                },
                className: "w-full p-2 text-left hover:bg-muted/40 font-medium",
                children: [
                  c.full_name,
                  " ",
                  c.phone ? `(${c.phone})` : ""
                ]
              },
              c.id
            )) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border/80 bg-card/40 p-4 backdrop-blur-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Profissional (opcional)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
            (pros ?? []).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setProId(p.id === proId ? null : p.id),
                className: `rounded-none border px-3 py-1 text-xs font-bold transition-all ${proId === p.id ? "border-accent bg-accent/15 text-accent shadow-sm" : "border-border/60 bg-background/40 hover:bg-muted/40 text-muted-foreground"}`,
                children: p.display_name
              },
              p.id
            )),
            (pros ?? []).length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Nenhum profissional cadastrado." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border/80 bg-card/40 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border/40", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex rounded-none border border-border/60 bg-background/60 p-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setTab("services"),
                className: `inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${tab === "services" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Scissors, { className: "h-3.5 w-3.5" }),
                  " Serviços"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => setTab("products"),
                className: `inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${tab === "products" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Package, { className: "h-3.5 w-3.5" }),
                  " Produtos"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: filter,
                onChange: (e) => setFilter(e.target.value),
                placeholder: "Buscar itens do catálogo…",
                className: "h-10 w-full pl-9 rounded-none text-xs sm:w-[240px]"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[480px] overflow-y-auto p-5", children: tab === "services" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: [
          filteredServices.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => addService(s),
              className: "group flex flex-col justify-between rounded-none border border-border bg-background/60 p-4 text-left transition-all hover:border-accent hover:bg-card",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-2 text-sm font-bold", children: s.name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-3 font-serif font-bold text-accent", children: brl(Number(s.price)) })
              ]
            },
            s.id
          )),
          filteredServices.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "col-span-full py-8 text-center text-xs text-muted-foreground", children: "Nenhum serviço encontrado." })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 sm:grid-cols-3", children: [
          filteredProducts.map((p) => {
            const stock = Number(p.stock_qty ?? 0);
            const out = stock < 1;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                onClick: () => !out && addProduct(p),
                disabled: out,
                className: `group flex flex-col justify-between rounded-none border p-4 text-left transition-all ${out ? "cursor-not-allowed border-border/30 opacity-40 bg-background/20" : "border-border bg-background/60 hover:border-accent hover:bg-card"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-2 text-sm font-bold", children: p.name }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex w-full items-center justify-between", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif font-bold text-accent", children: brl(Number(p.price)) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-[10px] font-bold ${out ? "text-destructive" : "text-muted-foreground"}`, children: [
                      "Estoque: ",
                      stock
                    ] })
                  ] })
                ]
              },
              p.id
            );
          }),
          filteredProducts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "col-span-full py-8 text-center text-xs text-muted-foreground", children: "Nenhum produto encontrado." })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border/80 bg-card/40 p-5 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Lançamento de Valor Avulso" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              inputMode: "decimal",
              value: customAmount,
              onChange: (e) => setCustomAmount(e.target.value),
              placeholder: "R$ 0,00",
              className: "h-11 rounded-none text-base font-bold"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", onClick: addCustom, className: "h-11 rounded-none px-6 font-bold uppercase text-xs", children: "Adicionar" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "lg:sticky lg:top-24 lg:self-start", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "flex flex-col rounded-none border border-border bg-card/60 shadow-2xl backdrop-blur-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border/40 p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-serif text-lg font-bold", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "h-4 w-4 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Itens da Venda" })
        ] }),
        cart.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-accent border-accent/40 text-[10px]", children: [
          cart.length,
          " itens"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[35vh] divide-y divide-border/20 overflow-y-auto lg:max-h-[calc(100vh-480px)]", children: cart.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 text-center text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShoppingCart, { className: "mb-2 h-10 w-10 opacity-20" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs", children: "Carrinho vazio" })
      ] }) : cart.map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 p-4 hover:bg-card/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate font-bold text-xs text-foreground", children: i.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
            brl(i.price),
            " ",
            i.qty > 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-accent", children: [
              "× ",
              i.qty
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center border border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => changeQty(i.id, -1), className: "p-1 hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "h-3 w-3" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-6 text-center font-mono text-xs", children: i.qty }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => changeQty(i.id, 1), className: "p-1 hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3 w-3" }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => removeItem(i.id), className: "p-1 text-muted-foreground hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-3.5 w-3.5" }) })
        ] })
      ] }, i.id)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border/40 bg-background/40 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 space-y-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: coupon ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 items-center justify-between border border-accent/40 bg-accent/10 px-3 py-2 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-accent uppercase", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(TicketPercent, { className: "inline mr-1 h-3.5 w-3.5" }),
              " ",
              coupon.code
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: clearCoupon, className: "text-accent hover:opacity-80", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3.5 w-3.5" }) })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                value: couponInput,
                onChange: (e) => setCouponInput(e.target.value.toUpperCase()),
                placeholder: "CUPOM",
                className: "h-9 rounded-none text-xs uppercase font-bold"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", size: "sm", onClick: applyCoupon, disabled: couponBusy || !couponInput, className: "rounded-none text-xs", children: "Aplicar" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 border-y border-border/20 py-3 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-muted-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Subtotal" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: brl(subtotal) })
            ] }),
            discount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-accent font-bold", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Desconto" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "-",
                brl(discount)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between pt-1 text-base font-bold text-foreground", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-serif text-accent", children: brl(total) })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-1.5", children: METHODS.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => setMethod(m.id),
              className: `flex flex-col items-center justify-center gap-1 border p-2 text-center transition-all ${method === m.id ? "border-accent bg-accent/15 text-accent font-bold" : "border-border/60 bg-card text-muted-foreground hover:text-foreground"}`,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(m.icon, { className: "h-4 w-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] uppercase tracking-wider", children: m.label })
              ]
            },
            m.id
          )) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            onClick: handleFinalize,
            disabled: busy || cart.length === 0,
            className: "h-12 w-full rounded-none bg-accent text-xs font-bold uppercase tracking-[0.2em] text-accent-foreground hover:bg-foreground hover:text-background",
            children: busy ? "Registrando venda..." : "Finalizar Cobrança"
          }
        )
      ] })
    ] }) })
  ] });
}
const $$splitComponentImporter$d = () => import("./admin.pacotes-DFNQE65g.mjs");
const Route$h = createFileRoute("/admin/pacotes")({
  head: () => ({
    meta: [{
      title: "Pacotes & Planos — BarberOS"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./admin.franquia-Dli3xhG1.mjs");
const Route$g = createFileRoute("/admin/franquia")({
  head: () => ({
    meta: [{
      title: "Franquia & Múltiplas Unidades — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./admin.folgas-C_5NqowF.mjs");
const Route$f = createFileRoute("/admin/folgas")({
  head: () => ({
    meta: [{
      title: "Gestão de Folgas & Bloqueios — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./admin.fidelidade-Bhz_vALI.mjs");
const Route$e = createFileRoute("/admin/fidelidade")({
  head: () => ({
    meta: [{
      title: "Fidelidade — Admin BarberOS"
    }, {
      name: "robots",
      content: "noindex"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./admin.estoque-v-ciy5Um.mjs");
const Route$d = createFileRoute("/admin/estoque")({
  head: () => ({
    meta: [{
      title: "Controle de Estoque — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./admin.equipe-CnYe3slY.mjs");
const Route$c = createFileRoute("/admin/equipe")({
  head: () => ({
    meta: [{
      title: "Equipe & Membros — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./admin.cupons-Bd6yKXJq.mjs");
const Route$b = createFileRoute("/admin/cupons")({
  head: () => ({
    meta: [{
      title: "Cupons — BarberOS"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);
const Label = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(Root, { ref, className: cn(labelVariants(), className), ...props }));
Label.displayName = Root.displayName;
const Textarea = reactExports.forwardRef(
  ({ className, ...props }, ref) => {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        className: cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Textarea.displayName = "Textarea";
function Skeleton({ className, ...props }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("animate-pulse rounded-md bg-primary/10", className), ...props });
}
function PageHeaderSkeleton() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-8 w-56" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-72" })
  ] });
}
function CardGridSkeleton({ count = 6 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({ length: count }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "space-y-3 p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-10 w-10 rounded-xl" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-3/4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-2/3" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-9 w-full" })
  ] }, i)) });
}
function TableSkeleton({ rows = 6 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "overflow-hidden p-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-px", children: Array.from({ length: rows }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 px-4 py-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-1/4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-1/4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-1/4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "ml-auto h-4 w-20" })
  ] }, i)) }) });
}
function EmptyState({
  icon: Icon,
  title,
  description,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "grid place-items-center gap-3 p-12 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-6 w-6" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg font-semibold", children: title }),
      description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: description })
    ] }),
    action
  ] });
}
const Route$a = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações da Barbearia — BarberOS" }] }),
  component: ConfiguracoesPage
});
function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { shopId, shop } = useCurrentShop();
  const isOwner = shop?.role === "owner";
  const canManage = isOwner || shop?.role === "admin";
  const { data: barbershop, isLoading, refetch } = useQuery({
    queryKey: ["shop-settings-detail", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase.from("barbershops").select("*").eq("id", shopId).single();
      if (error) throw error;
      return data;
    }
  });
  const [form, setForm] = reactExports.useState({
    name: "",
    description: "",
    logo_url: "",
    email: "",
    phone: "",
    whatsapp: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    hours_weekdays: "09:00 - 20:00",
    hours_saturday: "08:00 - 19:00",
    hours_sunday: "Fechado"
  });
  const [policy, setPolicy] = reactExports.useState({
    min_lead_hours: "1",
    cancel_lead_hours: "2",
    max_no_shows: "3",
    no_show_fee: "0"
  });
  const [saving, setSaving] = reactExports.useState(false);
  const [dangerBusy, setDangerBusy] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (!barbershop) return;
    const addr = barbershop.address || {};
    const contacts = barbershop.contacts || {};
    const settings = barbershop.settings || {};
    const pol = settings.policy || {};
    const hours = settings.opening_hours || {};
    setForm({
      name: barbershop.name || "",
      description: barbershop.description || "",
      logo_url: barbershop.logo_url || "",
      email: contacts.email || "",
      phone: contacts.phone || "",
      whatsapp: contacts.whatsapp || "",
      street: addr.street || "",
      number: addr.number || "",
      neighborhood: addr.neighborhood || addr.district || "",
      city: addr.city || "",
      state: addr.state || "",
      zip_code: addr.zip_code || addr.postal_code || "",
      hours_weekdays: hours.weekdays || "09:00 - 20:00",
      hours_saturday: hours.saturday || "08:00 - 19:00",
      hours_sunday: hours.sunday || "Fechado"
    });
    setPolicy({
      min_lead_hours: pol.min_lead_hours != null ? String(pol.min_lead_hours) : "1",
      cancel_lead_hours: pol.cancel_lead_hours != null ? String(pol.cancel_lead_hours) : "2",
      max_no_shows: pol.max_no_shows != null ? String(pol.max_no_shows) : "3",
      no_show_fee: pol.no_show_fee != null ? String(pol.no_show_fee) : "0"
    });
  }, [barbershop]);
  async function handleSaveSettings(e) {
    e.preventDefault();
    if (!canManage) return toast.error("Permissão insuficiente para alterar configurações.");
    if (!form.name.trim()) return toast.error("O nome da barbearia é obrigatório.");
    setSaving(true);
    try {
      const mergedSettings = {
        ...barbershop?.settings || {},
        opening_hours: {
          weekdays: form.hours_weekdays,
          saturday: form.hours_saturday,
          sunday: form.hours_sunday
        },
        policy: {
          min_lead_hours: Number(policy.min_lead_hours) || 0,
          cancel_lead_hours: Number(policy.cancel_lead_hours) || 0,
          max_no_shows: Number(policy.max_no_shows) || 0,
          no_show_fee: Number(policy.no_show_fee) || 0
        }
      };
      await barbershopService.updateBarbershop(shopId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        logo_url: form.logo_url.trim() || null,
        contacts: {
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null
        },
        address: {
          street: form.street.trim() || null,
          number: form.number.trim() || null,
          neighborhood: form.neighborhood.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim().toUpperCase() || null,
          zip_code: form.zip_code.trim() || null
        },
        settings: mergedSettings
      });
      toast.success("Configurações da barbearia salvas com sucesso!");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }
  async function handleDeactivateBarbershop() {
    if (!isOwner) return toast.error("Apenas o proprietário (dono) pode desativar a barbearia.");
    if (!confirm("Tem certeza que deseja desativar esta barbearia? Clientes não poderão agendar horários.")) return;
    setDangerBusy(true);
    try {
      await barbershopService.deleteBarbershop(shopId);
      toast.success("Barbearia desativada.");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao desativar barbearia.");
    } finally {
      setDangerBusy(false);
    }
  }
  async function handleDeleteBarbershop() {
    if (!isOwner) return toast.error("Apenas o proprietário pode excluir permanentemente a barbearia.");
    const confirmName = prompt(`Digite "${barbershop?.name}" para confirmar a exclusão PERMANENTE:`);
    if (confirmName !== barbershop?.name) {
      return toast.error("Confirmação incorreta. Operação cancelada.");
    }
    setDangerBusy(true);
    try {
      const { error } = await supabase.from("barbershops").delete().eq("id", shopId);
      if (error) throw error;
      toast.success("Barbearia excluída permanentemente.");
      navigate({ to: "/" });
    } catch (err) {
      toast.error(err.message || "Erro ao excluir barbearia.");
    } finally {
      setDangerBusy(false);
    }
  }
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(PageHeaderSkeleton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(CardGridSkeleton, { count: 3 })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 pb-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Configurações da Barbearia" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Altere os dados comerciais, localização, horários de funcionamento e regras de agendamento." })
      ] }),
      !canManage && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "mr-1.5 h-3.5 w-3.5" }),
        " Modo Somente Leitura"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSaveSettings, className: "space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2 border-b border-border/40 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Building2, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-xl font-bold", children: "Identidade & Dados Comerciais" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "shop_name", children: "Nome da Barbearia *" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "shop_name",
                value: form.name,
                onChange: (e) => setForm({ ...form, name: e.target.value }),
                placeholder: "Ex.: Barbearia Dom Corleone",
                className: "rounded-none",
                disabled: !canManage,
                required: true
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "shop_desc", children: "Descrição / Apresentação" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Textarea,
              {
                id: "shop_desc",
                value: form.description,
                onChange: (e) => setForm({ ...form, description: e.target.value }),
                placeholder: "Apresente sua barbearia para seus clientes...",
                className: "rounded-none resize-none",
                rows: 3,
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "shop_logo", children: "URL do Logotipo / Imagem de Capa" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "shop_logo",
                value: form.logo_url,
                onChange: (e) => setForm({ ...form, logo_url: e.target.value }),
                placeholder: "https://exemplo.com/foto-barbearia.jpg",
                className: "rounded-none",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3 pt-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "shop_phone", children: "Telefone Fixo" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "shop_phone",
                  value: form.phone,
                  onChange: (e) => setForm({ ...form, phone: e.target.value }),
                  placeholder: "(11) 3333-0000",
                  className: "rounded-none",
                  disabled: !canManage
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "shop_wpp", children: "WhatsApp" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "shop_wpp",
                  value: form.whatsapp,
                  onChange: (e) => setForm({ ...form, whatsapp: e.target.value }),
                  placeholder: "(11) 99999-0000",
                  className: "rounded-none",
                  disabled: !canManage
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "shop_email", children: "E-mail Comercial" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Input,
                {
                  id: "shop_email",
                  type: "email",
                  value: form.email,
                  onChange: (e) => setForm({ ...form, email: e.target.value }),
                  placeholder: "contato@barbearia.com",
                  className: "rounded-none",
                  disabled: !canManage
                }
              )
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2 border-b border-border/40 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-xl font-bold", children: "Endereço & Localização" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 text-xs sm:grid-cols-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "addr_street", children: "Rua / Logradouro" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "addr_street",
                value: form.street,
                onChange: (e) => setForm({ ...form, street: e.target.value }),
                placeholder: "Ex.: Rua Oscar Freire",
                className: "rounded-none",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "addr_num", children: "Número" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "addr_num",
                value: form.number,
                onChange: (e) => setForm({ ...form, number: e.target.value }),
                placeholder: "1000",
                className: "rounded-none",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "addr_neigh", children: "Bairro" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "addr_neigh",
                value: form.neighborhood,
                onChange: (e) => setForm({ ...form, neighborhood: e.target.value }),
                placeholder: "Jardins",
                className: "rounded-none",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "addr_city", children: "Cidade" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "addr_city",
                value: form.city,
                onChange: (e) => setForm({ ...form, city: e.target.value }),
                placeholder: "São Paulo",
                className: "rounded-none",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "addr_state", children: "Estado (UF)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "addr_state",
                maxLength: 2,
                value: form.state,
                onChange: (e) => setForm({ ...form, state: e.target.value.toUpperCase() }),
                placeholder: "SP",
                className: "rounded-none uppercase font-mono",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5 sm:col-span-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "addr_zip", children: "CEP" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "addr_zip",
                value: form.zip_code,
                onChange: (e) => setForm({ ...form, zip_code: e.target.value }),
                placeholder: "01426-001",
                className: "rounded-none font-mono",
                disabled: !canManage
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2 border-b border-border/40 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-xl font-bold", children: "Horário de Atendimento" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 text-xs sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "h_weekdays", children: "Segunda a Sexta" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "h_weekdays",
                value: form.hours_weekdays,
                onChange: (e) => setForm({ ...form, hours_weekdays: e.target.value }),
                placeholder: "09:00 - 20:00",
                className: "rounded-none font-mono",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "h_sat", children: "Sábado" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "h_sat",
                value: form.hours_saturday,
                onChange: (e) => setForm({ ...form, hours_saturday: e.target.value }),
                placeholder: "08:00 - 19:00",
                className: "rounded-none font-mono",
                disabled: !canManage
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "h_sun", children: "Domingo" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "h_sun",
                value: form.hours_sunday,
                onChange: (e) => setForm({ ...form, hours_sunday: e.target.value }),
                placeholder: "Fechado",
                className: "rounded-none font-mono",
                disabled: !canManage
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-border bg-card/40 p-6 backdrop-blur-md", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center gap-2 border-b border-border/40 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-5 w-5 text-accent" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-xl font-bold", children: "Políticas de Agendamento & Cancelamento" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 text-xs sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pol_min_lead", children: "Antecedência Mínima para Agendamento (horas)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pol_min_lead",
                type: "number",
                min: "0",
                value: policy.min_lead_hours,
                onChange: (e) => setPolicy({ ...policy, min_lead_hours: e.target.value }),
                placeholder: "1",
                className: "rounded-none",
                disabled: !canManage
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Evita agendamentos de última hora sem preparação." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pol_cancel_lead", children: "Antecedência Mínima para Cancelamento (horas)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Input,
              {
                id: "pol_cancel_lead",
                type: "number",
                min: "0",
                value: policy.cancel_lead_hours,
                onChange: (e) => setPolicy({ ...policy, cancel_lead_hours: e.target.value }),
                placeholder: "2",
                className: "rounded-none",
                disabled: !canManage
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground", children: "Tempo limite para o cliente cancelar sem penalidade." })
          ] })
        ] })
      ] }),
      canManage && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          type: "submit",
          disabled: saving,
          className: "rounded-none bg-accent px-8 text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1.5 h-3.5 w-3.5" }),
            " ",
            saving ? "Salvando..." : "Salvar Todas as Configurações"
          ]
        }
      ) })
    ] }),
    isOwner && /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "rounded-none border border-destructive/40 bg-destructive/5 p-6 backdrop-blur-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex items-center gap-2 border-b border-destructive/20 pb-3 text-destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-5 w-5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-serif text-xl font-bold", children: "Zona de Perigo (Ações Críticas)" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mb-6", children: "Estas ações afetam a visibilidade pública da barbearia e seus registros. Apenas o proprietário pode realizá-las." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "outline",
            disabled: dangerBusy,
            onClick: handleDeactivateBarbershop,
            className: "rounded-none border-destructive/60 text-destructive text-xs uppercase font-bold hover:bg-destructive hover:text-destructive-foreground",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(PowerOff, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Desativar Barbearia"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            type: "button",
            variant: "destructive",
            disabled: dangerBusy,
            onClick: handleDeleteBarbershop,
            className: "rounded-none text-xs uppercase font-bold",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "mr-1.5 h-3.5 w-3.5" }),
              " Excluir Permanentemente"
            ]
          }
        )
      ] })
    ] })
  ] });
}
const $$splitComponentImporter$6 = () => import("./admin.comissoes-D3ZhnkXR.mjs");
const Route$9 = createFileRoute("/admin/comissoes")({
  head: () => ({
    meta: [{
      title: "Comissões — BarberOS"
    }, {
      name: "robots",
      content: "noindex,nofollow"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./admin.clientes-Cj1pqZ96.mjs");
const Route$8 = createFileRoute("/admin/clientes")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./admin.carteira-CK25uAnf.mjs");
const Route$7 = createFileRoute("/admin/carteira")({
  head: () => ({
    meta: [{
      title: "Carteira & Saldo — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./admin.caixa-BsycTgDe.mjs");
const Route$6 = createFileRoute("/admin/caixa")({
  head: () => ({
    meta: [{
      title: "Fluxo de Caixa — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./admin.avaliacoes-1ERcYNCg.mjs");
const Route$5 = createFileRoute("/admin/avaliacoes")({
  head: () => ({
    meta: [{
      title: "Gestão de Avaliações — BarberOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./admin.agenda-dXdVMPlT.mjs");
const Route$4 = createFileRoute("/admin/agenda")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
function createSupabaseAdminClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    const missing = [
      ...!SUPABASE_URL ? ["SUPABASE_URL"] : [],
      ...!SUPABASE_SERVICE_ROLE_KEY ? ["SUPABASE_SERVICE_ROLE_KEY"] : []
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}. Connect Supabase in Lovable Cloud.`;
    console.error(`[Supabase] ${message}`);
    throw new Error(message);
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: void 0,
      persistSession: false,
      autoRefreshToken: false
    }
  });
}
let _supabaseAdmin;
const supabaseAdmin = new Proxy({}, {
  get(_, prop, receiver) {
    if (!_supabaseAdmin) _supabaseAdmin = createSupabaseAdminClient();
    return Reflect.get(_supabaseAdmin, prop, receiver);
  }
});
const Route$3 = createFileRoute("/api/voice/session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        if (!body.barbershop_id) {
          return Response.json({ error: "barbershop_id required" }, { status: 400 });
        }
        const { data: shop, error: sErr } = await supabaseAdmin.from("barbershops").select("id,active").eq("id", body.barbershop_id).single();
        if (sErr || !shop || !shop.active) {
          return Response.json({ error: "barbershop not found" }, { status: 404 });
        }
        const { data, error } = await supabaseAdmin.from("voice_sessions").insert({
          barbershop_id: body.barbershop_id,
          profile_id: body.profile_id ?? null,
          customer_id: body.customer_id ?? null,
          user_agent: body.user_agent ?? null,
          status: "active"
        }).select("id").single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ session_id: data.id });
      }
    }
  }
});
const Route$2 = createFileRoute("/api/voice/end-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json();
        if (!body.session_id) return Response.json({ error: "session_id required" }, { status: 400 });
        await supabaseAdmin.from("voice_sessions").update({
          status: "ended",
          ended_at: (/* @__PURE__ */ new Date()).toISOString(),
          outcome: body.outcome ?? "ended"
        }).eq("id", body.session_id);
        return Response.json({ ok: true });
      }
    }
  }
});
const auroraTools = [
  {
    name: "listar_servicos",
    description: "Lista os serviços ativos da barbearia (nome, duração, preço).",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "listar_profissionais",
    description: "Lista os profissionais ativos. Opcionalmente filtra por serviço.",
    parameters: {
      type: "object",
      properties: { service_id: { type: "string", description: "UUID do serviço (opcional)" } }
    }
  },
  {
    name: "buscar_horarios_disponiveis",
    description: "Retorna horários livres num intervalo de datas para um serviço, opcionalmente filtrando por profissional.",
    parameters: {
      type: "object",
      properties: {
        service_id: { type: "string" },
        professional_id: { type: "string", description: "Opcional" },
        date_from: { type: "string", description: "Data ISO YYYY-MM-DD" },
        date_to: { type: "string", description: "Data ISO YYYY-MM-DD" }
      },
      required: ["service_id", "date_from", "date_to"]
    }
  },
  {
    name: "identificar_cliente",
    description: "Identifica um cliente pelo telefone. Retorna dados básicos ou nulo.",
    parameters: {
      type: "object",
      properties: { phone: { type: "string" } },
      required: ["phone"]
    }
  },
  {
    name: "criar_agendamento",
    description: "Cria o agendamento. Se o cliente não existir, cria pelo nome+telefone. Só chame após confirmação clara.",
    parameters: {
      type: "object",
      properties: {
        service_id: { type: "string" },
        professional_id: { type: "string" },
        scheduled_start: { type: "string", description: "Datetime ISO com timezone" },
        customer_name: { type: "string" },
        customer_phone: { type: "string" }
      },
      required: ["service_id", "professional_id", "scheduled_start", "customer_name", "customer_phone"]
    }
  },
  {
    name: "cancelar_agendamento",
    description: "Cancela um agendamento existente pelo id.",
    parameters: {
      type: "object",
      properties: { appointment_id: { type: "string" } },
      required: ["appointment_id"]
    }
  },
  {
    name: "informacoes_barbearia",
    description: "Retorna nome, endereço, contatos e descrição da barbearia.",
    parameters: { type: "object", properties: {} }
  }
];
function normalizePhone(p) {
  return p.replace(/\D+/g, "");
}
async function runTool(name, args, barbershopId) {
  const db = supabaseAdmin;
  switch (name) {
    case "listar_servicos": {
      const { data, error } = await db.from("services").select("id,name,duration_min,price,description").eq("barbershop_id", barbershopId).eq("active", true).order("sort", { ascending: true });
      if (error) throw error;
      return { services: data ?? [] };
    }
    case "listar_profissionais": {
      const serviceId = args.service_id;
      if (serviceId) {
        const { data: data2, error: error2 } = await db.from("service_professionals").select("professional:professionals(id,display_name,bio,specialties,active,barbershop_id)").eq("service_id", serviceId);
        if (error2) throw error2;
        const pros = (data2 ?? []).map((r) => r.professional).filter((p) => !!p && p.active && p.barbershop_id === barbershopId);
        return { professionals: pros };
      }
      const { data, error } = await db.from("professionals").select("id,display_name,bio,specialties").eq("barbershop_id", barbershopId).eq("active", true);
      if (error) throw error;
      return { professionals: data ?? [] };
    }
    case "buscar_horarios_disponiveis": {
      const serviceId = args.service_id;
      const proIdFilter = args.professional_id;
      const dateFrom = args.date_from;
      const dateTo = args.date_to;
      const { data: svc, error: svcErr } = await db.from("services").select("duration_min,barbershop_id").eq("id", serviceId).single();
      if (svcErr || !svc || svc.barbershop_id !== barbershopId) throw new Error("Serviço inválido");
      const durMin = svc.duration_min;
      let proIds = [];
      if (proIdFilter) {
        proIds = [proIdFilter];
      } else {
        const { data: sp } = await db.from("service_professionals").select("professional_id").eq("service_id", serviceId);
        proIds = (sp ?? []).map((r) => r.professional_id);
      }
      if (proIds.length === 0) return { slots: [] };
      const { data: wh } = await db.from("working_hours").select("professional_id,weekday,start_time,end_time,break_start,break_end").in("professional_id", proIds);
      const fromTs = (/* @__PURE__ */ new Date(`${dateFrom}T00:00:00-03:00`)).toISOString();
      const toTs = (/* @__PURE__ */ new Date(`${dateTo}T23:59:59-03:00`)).toISOString();
      const { data: appts } = await db.from("appointments").select("professional_id,scheduled_start,scheduled_end,status").in("professional_id", proIds).gte("scheduled_start", fromTs).lte("scheduled_start", toTs).neq("status", "cancelled");
      const slots = [];
      const start = /* @__PURE__ */ new Date(dateFrom + "T00:00:00-03:00");
      const end = /* @__PURE__ */ new Date(dateTo + "T00:00:00-03:00");
      for (let d = new Date(start); d <= end && slots.length < 30; d.setDate(d.getDate() + 1)) {
        const weekday = d.getDay();
        const dateStr = d.toISOString().slice(0, 10);
        for (const proId of proIds) {
          const hours = (wh ?? []).filter((h) => h.professional_id === proId && h.weekday === weekday);
          for (const h of hours) {
            const dayStart = /* @__PURE__ */ new Date(`${dateStr}T${h.start_time}-03:00`);
            const dayEnd = /* @__PURE__ */ new Date(`${dateStr}T${h.end_time}-03:00`);
            const breakStart = h.break_start ? /* @__PURE__ */ new Date(`${dateStr}T${h.break_start}-03:00`) : null;
            const breakEnd = h.break_end ? /* @__PURE__ */ new Date(`${dateStr}T${h.break_end}-03:00`) : null;
            for (let t = new Date(dayStart); t.getTime() + durMin * 6e4 <= dayEnd.getTime(); t = new Date(t.getTime() + 30 * 6e4)) {
              const slotEnd = new Date(t.getTime() + durMin * 6e4);
              if (t < /* @__PURE__ */ new Date()) continue;
              if (breakStart && breakEnd && t < breakEnd && slotEnd > breakStart) continue;
              const conflict = (appts ?? []).some(
                (a) => a.professional_id === proId && new Date(a.scheduled_start) < slotEnd && new Date(a.scheduled_end) > t
              );
              if (conflict) continue;
              slots.push({ professional_id: proId, start: t.toISOString(), end: slotEnd.toISOString() });
              if (slots.length >= 30) break;
            }
            if (slots.length >= 30) break;
          }
        }
      }
      return { slots };
    }
    case "identificar_cliente": {
      const phone = normalizePhone(args.phone);
      if (!phone) return { customer: null };
      const { data } = await db.from("customers").select("id,full_name,phone,no_show_count,blocked").eq("barbershop_id", barbershopId).ilike("phone", `%${phone.slice(-8)}%`).limit(1);
      return { customer: data?.[0] ?? null };
    }
    case "criar_agendamento": {
      const phone = normalizePhone(args.customer_phone);
      const name2 = args.customer_name.trim();
      const serviceId = args.service_id;
      const proId = args.professional_id;
      const startIso = args.scheduled_start;
      let customerId = null;
      if (phone) {
        const { data: existing } = await db.from("customers").select("id,blocked").eq("barbershop_id", barbershopId).ilike("phone", `%${phone.slice(-8)}%`).limit(1);
        if (existing?.[0]) {
          if (existing[0].blocked) return { error: "Cliente bloqueado por excesso de faltas." };
          customerId = existing[0].id;
        }
      }
      if (!customerId) {
        const { data: created, error: cErr } = await db.from("customers").insert({ barbershop_id: barbershopId, full_name: name2, phone }).select("id").single();
        if (cErr) throw cErr;
        customerId = created.id;
      }
      const { data: svc } = await db.from("services").select("duration_min,price,barbershop_id").eq("id", serviceId).single();
      if (!svc || svc.barbershop_id !== barbershopId) return { error: "Serviço inválido." };
      const start = new Date(startIso);
      const end = new Date(start.getTime() + svc.duration_min * 6e4);
      const { data: conflicts } = await db.from("appointments").select("id").eq("professional_id", proId).neq("status", "cancelled").lt("scheduled_start", end.toISOString()).gt("scheduled_end", start.toISOString());
      if (conflicts && conflicts.length > 0) return { error: "Horário não disponível." };
      const { data: appt, error: aErr } = await db.from("appointments").insert({
        barbershop_id: barbershopId,
        customer_id: customerId,
        professional_id: proId,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        total_amount: svc.price,
        source: "aurora",
        status: "scheduled"
      }).select("id").single();
      if (aErr) throw aErr;
      await db.from("appointment_services").insert({
        appointment_id: appt.id,
        service_id: serviceId,
        price_snapshot: svc.price,
        duration_snapshot: svc.duration_min
      });
      return { appointment_id: appt.id, scheduled_start: start.toISOString(), scheduled_end: end.toISOString() };
    }
    case "cancelar_agendamento": {
      const id = args.appointment_id;
      const { data: appt } = await db.from("appointments").select("barbershop_id").eq("id", id).single();
      if (!appt || appt.barbershop_id !== barbershopId) return { error: "Agendamento não encontrado." };
      const { error } = await db.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
      return { ok: true };
    }
    case "informacoes_barbearia": {
      const { data } = await db.from("barbershops").select("name,description,address,contacts,social").eq("id", barbershopId).single();
      return { barbershop: data };
    }
    default:
      return { error: `Tool desconhecida: ${name}` };
  }
}
function buildSystemPrompt(ctx) {
  return `Você é Aurora, recepcionista virtual da ${ctx.barbershopName}. Conversa por voz em português do Brasil. Data/hora agora: ${ctx.nowIso} (America/Sao_Paulo).

ESTILO (obrigatório, fale como ao telefone):
- Frases curtas, 1 ou no máximo 2 por turno. Até ~20 palavras.
- NUNCA repita o que o cliente disse. NUNCA narre o que vai fazer.
- Faça UMA pergunta por vez, sempre a essencial. Se tem info, AJA chamando a tool.
- Sem emojis, sem markdown, sem floreios ("ótimo!", "perfeito!", "vou verificar").

FLUXO DE AGENDAMENTO (direto, sem enrolar):
1. Identifique o que falta: serviço, dia, hora, profissional (opcional).
2. Chame buscar_horarios_disponiveis quando tiver serviço + dia. Ofereça no máximo 3 opções.
3. Quando cliente escolher, peça nome e telefone numa só frase (se não tiver).
4. Chame criar_agendamento direto. Sem confirmação extra se já está claro.
5. Após criar: "Agendado: [serviço] com [profissional] [dia] às [hora]. Te esperamos."

REGRAS:
- SEMPRE use tools para serviços, profissionais e horários. NUNCA invente nada.
- Converta "hoje/amanhã/sexta/semana que vem" para data ISO (YYYY-MM-DD) usando a data atual.
- Se cliente fugir do assunto, traga educadamente para agendar em 1 frase.
- Nunca peça CPF, cartão, ou dados sensíveis.
- Limite: agendar, remarcar, cancelar, informar serviços/horários/preços/endereço.

${ctx.isFirstTurn ? `PRIMEIRO TURNO: Apresente-se em 1 frase curta: "Oi! Sou a Aurora da ${ctx.barbershopName}. Quer agendar?"` : ""}
${ctx.welcomeMessage ? `Boas-vindas customizada: "${ctx.welcomeMessage}"` : ""}
${ctx.extraPersona ? `Notas da barbearia: ${ctx.extraPersona}` : ""}`;
}
const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const REASONING_MODEL = "gemini-2.0-flash";
const TTS_MODEL = "gemini-2.5-flash-preview-tts";
async function geminiGenerate(opts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");
  const body = {
    system_instruction: { parts: [{ text: opts.systemInstruction }] },
    contents: opts.contents,
    tools: opts.functionDeclarations ? [{ functionDeclarations: opts.functionDeclarations }] : void 0,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 800,
      responseModalities: ["TEXT"]
    }
  };
  const res = await fetch(
    `${API_BASE}/models/${REASONING_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  const json = await res.json();
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Gemini ${res.status}`);
  }
  return json;
}
async function geminiTts(text, voiceName = "Aoede") {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !text.trim()) return null;
  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
      }
    }
  };
  const res = await fetch(
    `${API_BASE}/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const part = json.candidates?.[0]?.content?.parts?.find(
    (p) => "inlineData" in p && !!p.inlineData?.data
  );
  if (!part) return null;
  return {
    audioBase64: part.inlineData.data,
    mimeType: part.inlineData.mimeType || "audio/L16;codec=pcm;rate=24000"
  };
}
function maskPII(s) {
  return s.replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]").replace(/\b(?:\d[ -]?){13,19}\b/g, "[CARTAO]");
}
const MAX_TOOL_HOPS = 6;
const Route$1 = createFileRoute("/api/voice/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          if (!body.session_id) {
            return Response.json({ error: "session_id required" }, { status: 400 });
          }
          if (!body.user_text && !body.audio_base64) {
            return Response.json({ error: "user_text or audio_base64 required" }, { status: 400 });
          }
          const { data: session, error: sErr } = await supabaseAdmin.from("voice_sessions").select("id,barbershop_id,status,total_turns").eq("id", body.session_id).single();
          if (sErr || !session) return Response.json({ error: "session not found" }, { status: 404 });
          if (session.status !== "active") {
            return Response.json({ error: "session ended" }, { status: 410 });
          }
          const { data: shop } = await supabaseAdmin.from("barbershops").select("name,settings").eq("id", session.barbershop_id).single();
          const settings = shop?.settings ?? {};
          const aurora = settings.aurora ?? {};
          const maxTurns = aurora.max_turns ?? 15;
          if (session.total_turns >= maxTurns) {
            return Response.json({ error: "max turns reached" }, { status: 429 });
          }
          const { data: history } = await supabaseAdmin.from("voice_messages").select("role,content,tool_name,tool_payload,tool_result").eq("session_id", session.id).order("created_at", { ascending: true });
          const isFirstTurn = (history?.length ?? 0) === 0;
          const systemPrompt = buildSystemPrompt({
            barbershopName: shop?.name ?? "barbearia",
            welcomeMessage: aurora.welcome,
            extraPersona: aurora.persona,
            nowIso: (/* @__PURE__ */ new Date()).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            isFirstTurn
          });
          const contents = [];
          for (const m of history ?? []) {
            const row = m;
            if (row.role === "user") {
              contents.push({ role: "user", parts: [{ text: row.content ?? "" }] });
            } else if (row.role === "assistant") {
              contents.push({ role: "model", parts: [{ text: row.content ?? "" }] });
            } else if (row.role === "tool" && row.tool_name) {
              contents.push({
                role: "model",
                parts: [{
                  functionCall: {
                    name: row.tool_name,
                    args: row.tool_payload ?? {}
                  }
                }]
              });
              contents.push({
                role: "function",
                parts: [{
                  functionResponse: {
                    name: row.tool_name,
                    response: row.tool_result ?? {}
                  }
                }]
              });
            }
          }
          let assistantText = "";
          let userTranscript = body.user_text ?? "";
          let totalIn = 0;
          let totalOut = 0;
          let toolUsed = false;
          if (body.audio_base64) {
            const rawMime = (body.audio_mime || "audio/webm").toLowerCase();
            let sttMime = rawMime.split(";")[0].trim();
            if (sttMime === "audio/webm") sttMime = "audio/ogg";
            let sttErr = null;
            try {
              const stt = await geminiGenerate({
                systemInstruction: "Você é um transcritor especializado em áudios de barbearia. Transcreva fielmente o áudio em português do Brasil. Ignore ruídos de fundo (secadores, tesouras). Se o áudio estiver vazio ou incompreensível, responda APENAS com [incompreensível]. Responda APENAS com a transcrição literal, sem comentários, sem aspas, sem prefixos.",
                contents: [{
                  role: "user",
                  parts: [
                    { text: "Transcreva o áudio a seguir:" },
                    { inlineData: { mimeType: sttMime, data: body.audio_base64 } }
                  ]
                }]
              });
              const t = stt.candidates?.[0]?.content?.parts?.find(
                (p) => "text" in p && typeof p.text === "string"
              )?.text?.trim();
              userTranscript = t || "";
              if (userTranscript.includes("[incompreensível]")) userTranscript = "";
            } catch (err) {
              sttErr = err instanceof Error ? err.message : String(err);
              console.error("[voice/chat] STT error:", sttErr, "mime:", sttMime);
              userTranscript = "";
            }
            if (!userTranscript) {
              return Response.json(
                { error: sttErr ? `STT: ${sttErr}` : "Não entendi o áudio, pode repetir?" },
                { status: 422 }
              );
            }
            contents.push({ role: "user", parts: [{ text: userTranscript }] });
          } else {
            contents.push({ role: "user", parts: [{ text: body.user_text }] });
          }
          for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
            const resp = await geminiGenerate({
              systemInstruction: systemPrompt,
              contents,
              functionDeclarations: auroraTools
            });
            totalIn += resp.usageMetadata?.promptTokenCount ?? 0;
            totalOut += resp.usageMetadata?.candidatesTokenCount ?? 0;
            const parts = resp.candidates?.[0]?.content?.parts ?? [];
            const fnCalls = parts.filter(
              (p) => "functionCall" in p && !!p.functionCall
            );
            if (fnCalls.length > 0) {
              toolUsed = true;
              contents.push({ role: "model", parts: fnCalls.map((p) => ({ functionCall: p.functionCall })) });
              const responseParts = [];
              for (const call of fnCalls) {
                let result;
                try {
                  result = await runTool(call.functionCall.name, call.functionCall.args, session.barbershop_id);
                } catch (err) {
                  result = { error: err instanceof Error ? err.message : "tool failed" };
                }
                await supabaseAdmin.from("voice_messages").insert({
                  session_id: session.id,
                  role: "tool",
                  content: null,
                  tool_name: call.functionCall.name,
                  tool_payload: call.functionCall.args,
                  tool_result: result
                });
                responseParts.push({
                  functionResponse: {
                    name: call.functionCall.name,
                    response: result ?? {}
                  }
                });
                if (call.functionCall.name === "criar_agendamento" && result && typeof result === "object" && "appointment_id" in result) {
                  await supabaseAdmin.from("voice_sessions").update({
                    appointment_id: result.appointment_id,
                    outcome: "booked"
                  }).eq("id", session.id);
                }
              }
              contents.push({ role: "function", parts: responseParts });
              continue;
            }
            const textPart = parts.find((p) => "text" in p && typeof p.text === "string");
            assistantText = textPart?.text?.trim() ?? "";
            break;
          }
          if (!assistantText) {
            assistantText = "Desculpa, não entendi. Pode repetir?";
          }
          await supabaseAdmin.from("voice_messages").insert({
            session_id: session.id,
            role: "user",
            content: maskPII(userTranscript)
          });
          let audioOut = null;
          if (!body.mute) {
            try {
              audioOut = await geminiTts(assistantText, aurora.voice || "Aoede");
            } catch {
              audioOut = null;
            }
          }
          await supabaseAdmin.from("voice_messages").insert({
            session_id: session.id,
            role: "assistant",
            content: assistantText,
            tokens_in: totalIn,
            tokens_out: totalOut
          });
          await supabaseAdmin.from("voice_sessions").update({ total_turns: session.total_turns + 1 }).eq("id", session.id);
          return Response.json({
            text: assistantText,
            user_text: userTranscript,
            audio_base64: audioOut?.audioBase64 ?? null,
            audio_mime: audioOut?.mimeType ?? null,
            tool_used: toolUsed,
            tokens_in: totalIn,
            tokens_out: totalOut
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          console.error("[voice/chat]", msg);
          return Response.json({ error: msg }, { status: 500 });
        }
      }
    }
  }
});
const $$splitComponentImporter = () => import("./b._slug.p._proSlug-CByeIEI-.mjs");
const $$splitErrorComponentImporter = () => import("./b._slug.p._proSlug-DW06W5QK.mjs");
const $$splitNotFoundComponentImporter = () => import("./b._slug.p._proSlug-c9eTPEwK.mjs");
const Route = createFileRoute("/b/$slug/p/$proSlug")({
  loader: async ({
    params
  }) => {
    const {
      data: shop
    } = await supabase.from("barbershops").select("id,name,slug,active").eq("slug", params.slug).eq("active", true).maybeSingle();
    if (!shop) throw notFound();
    const {
      data: pro
    } = await supabase.from("professionals").select("id,slug,display_name,bio,avatar_url,specialties,barbershop_id,active").eq("barbershop_id", shop.id).eq("slug", params.proSlug).eq("active", true).maybeSingle();
    if (!pro) throw notFound();
    return {
      shop,
      pro
    };
  },
  head: ({
    loaderData,
    params
  }) => {
    const pro = loaderData?.pro;
    const shop = loaderData?.shop;
    if (!pro || !shop) return {
      meta: [{
        title: "Profissional — BarberOS"
      }]
    };
    const desc = pro.bio ?? `Agende com ${pro.display_name} na ${shop.name}.`;
    return {
      meta: [{
        title: `${pro.display_name} — ${shop.name}`
      }, {
        name: "description",
        content: desc.slice(0, 155)
      }, {
        property: "og:title",
        content: `${pro.display_name} — ${shop.name}`
      }, {
        property: "og:description",
        content: desc.slice(0, 155)
      }, {
        property: "og:type",
        content: "profile"
      }, ...pro.avatar_url ? [{
        property: "og:image",
        content: pro.avatar_url
      }] : []],
      links: [{
        rel: "canonical",
        href: `/b/${params.slug}/p/${params.proSlug}`
      }]
    };
  },
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SitemapDotxmlRoute = Route$D.update({
  id: "/sitemap.xml",
  path: "/sitemap.xml",
  getParentRoute: () => Route$E
});
const ServicosRoute = Route$C.update({
  id: "/servicos",
  path: "/servicos",
  getParentRoute: () => Route$E
});
const RecuperarSenhaRoute = Route$B.update({
  id: "/recuperar-senha",
  path: "/recuperar-senha",
  getParentRoute: () => Route$E
});
const ProfissionaisRoute = Route$A.update({
  id: "/profissionais",
  path: "/profissionais",
  getParentRoute: () => Route$E
});
const MinhaContaRoute = Route$z.update({
  id: "/minha-conta",
  path: "/minha-conta",
  getParentRoute: () => Route$E
});
const LoginRoute = Route$y.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$E
});
const ClubeRoute = Route$x.update({
  id: "/clube",
  path: "/clube",
  getParentRoute: () => Route$E
});
const CadastroRoute = Route$w.update({
  id: "/cadastro",
  path: "/cadastro",
  getParentRoute: () => Route$E
});
const BioRoute = Route$v.update({
  id: "/bio",
  path: "/bio",
  getParentRoute: () => Route$E
});
const BarbeariasRoute = Route$u.update({
  id: "/barbearias",
  path: "/barbearias",
  getParentRoute: () => Route$E
});
const AgendarRoute = Route$t.update({
  id: "/agendar",
  path: "/agendar",
  getParentRoute: () => Route$E
});
const AdminRoute = Route$s.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$E
});
const IndexRoute = Route$r.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$E
});
const AdminIndexRoute = Route$q.update({
  id: "/",
  path: "/",
  getParentRoute: () => AdminRoute
});
const ConviteTokenRoute = Route$p.update({
  id: "/convite/$token",
  path: "/convite/$token",
  getParentRoute: () => Route$E
});
const BSlugRoute = Route$o.update({
  id: "/b/$slug",
  path: "/b/$slug",
  getParentRoute: () => Route$E
});
const AvaliarAppointmentIdRoute = Route$n.update({
  id: "/avaliar/$appointmentId",
  path: "/avaliar/$appointmentId",
  getParentRoute: () => Route$E
});
const AdminServicosRoute = Route$m.update({
  id: "/servicos",
  path: "/servicos",
  getParentRoute: () => AdminRoute
});
const AdminRelatoriosRoute = Route$l.update({
  id: "/relatorios",
  path: "/relatorios",
  getParentRoute: () => AdminRoute
});
const AdminProfissionaisRoute = Route$k.update({
  id: "/profissionais",
  path: "/profissionais",
  getParentRoute: () => AdminRoute
});
const AdminPortfolioRoute = Route$j.update({
  id: "/portfolio",
  path: "/portfolio",
  getParentRoute: () => AdminRoute
});
const AdminPdvRoute = Route$i.update({
  id: "/pdv",
  path: "/pdv",
  getParentRoute: () => AdminRoute
});
const AdminPacotesRoute = Route$h.update({
  id: "/pacotes",
  path: "/pacotes",
  getParentRoute: () => AdminRoute
});
const AdminFranquiaRoute = Route$g.update({
  id: "/franquia",
  path: "/franquia",
  getParentRoute: () => AdminRoute
});
const AdminFolgasRoute = Route$f.update({
  id: "/folgas",
  path: "/folgas",
  getParentRoute: () => AdminRoute
});
const AdminFidelidadeRoute = Route$e.update({
  id: "/fidelidade",
  path: "/fidelidade",
  getParentRoute: () => AdminRoute
});
const AdminEstoqueRoute = Route$d.update({
  id: "/estoque",
  path: "/estoque",
  getParentRoute: () => AdminRoute
});
const AdminEquipeRoute = Route$c.update({
  id: "/equipe",
  path: "/equipe",
  getParentRoute: () => AdminRoute
});
const AdminCuponsRoute = Route$b.update({
  id: "/cupons",
  path: "/cupons",
  getParentRoute: () => AdminRoute
});
const AdminConfiguracoesRoute = Route$a.update({
  id: "/configuracoes",
  path: "/configuracoes",
  getParentRoute: () => AdminRoute
});
const AdminComissoesRoute = Route$9.update({
  id: "/comissoes",
  path: "/comissoes",
  getParentRoute: () => AdminRoute
});
const AdminClientesRoute = Route$8.update({
  id: "/clientes",
  path: "/clientes",
  getParentRoute: () => AdminRoute
});
const AdminCarteiraRoute = Route$7.update({
  id: "/carteira",
  path: "/carteira",
  getParentRoute: () => AdminRoute
});
const AdminCaixaRoute = Route$6.update({
  id: "/caixa",
  path: "/caixa",
  getParentRoute: () => AdminRoute
});
const AdminAvaliacoesRoute = Route$5.update({
  id: "/avaliacoes",
  path: "/avaliacoes",
  getParentRoute: () => AdminRoute
});
const AdminAgendaRoute = Route$4.update({
  id: "/agenda",
  path: "/agenda",
  getParentRoute: () => AdminRoute
});
const ApiVoiceSessionRoute = Route$3.update({
  id: "/api/voice/session",
  path: "/api/voice/session",
  getParentRoute: () => Route$E
});
const ApiVoiceEndSessionRoute = Route$2.update({
  id: "/api/voice/end-session",
  path: "/api/voice/end-session",
  getParentRoute: () => Route$E
});
const ApiVoiceChatRoute = Route$1.update({
  id: "/api/voice/chat",
  path: "/api/voice/chat",
  getParentRoute: () => Route$E
});
const BSlugPProSlugRoute = Route.update({
  id: "/p/$proSlug",
  path: "/p/$proSlug",
  getParentRoute: () => BSlugRoute
});
const AdminRouteChildren = {
  AdminAgendaRoute,
  AdminAvaliacoesRoute,
  AdminCaixaRoute,
  AdminCarteiraRoute,
  AdminClientesRoute,
  AdminComissoesRoute,
  AdminConfiguracoesRoute,
  AdminCuponsRoute,
  AdminEquipeRoute,
  AdminEstoqueRoute,
  AdminFidelidadeRoute,
  AdminFolgasRoute,
  AdminFranquiaRoute,
  AdminPacotesRoute,
  AdminPdvRoute,
  AdminPortfolioRoute,
  AdminProfissionaisRoute,
  AdminRelatoriosRoute,
  AdminServicosRoute,
  AdminIndexRoute
};
const AdminRouteWithChildren = AdminRoute._addFileChildren(AdminRouteChildren);
const BSlugRouteChildren = {
  BSlugPProSlugRoute
};
const BSlugRouteWithChildren = BSlugRoute._addFileChildren(BSlugRouteChildren);
const rootRouteChildren = {
  IndexRoute,
  AdminRoute: AdminRouteWithChildren,
  AgendarRoute,
  BarbeariasRoute,
  BioRoute,
  CadastroRoute,
  ClubeRoute,
  LoginRoute,
  MinhaContaRoute,
  ProfissionaisRoute,
  RecuperarSenhaRoute,
  ServicosRoute,
  SitemapDotxmlRoute,
  AvaliarAppointmentIdRoute,
  BSlugRoute: BSlugRouteWithChildren,
  ConviteTokenRoute,
  ApiVoiceChatRoute,
  ApiVoiceEndSessionRoute,
  ApiVoiceSessionRoute
};
const routeTree = Route$E._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1e3 * 60 * 5,
        // 5 minutes default stale time
        gcTime: 1e3 * 60 * 30,
        // 30 minutes garbage collection
        retry: 1,
        refetchOnWindowFocus: false
        // Avoid refetching when user switches tabs
      }
    }
  });
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    // Preload when user hovers or touches a link
    defaultPreloadStaleTime: 1e3 * 60 * 2
    // 2 minutes stale time for preloaded data
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Button as B,
  Card as C,
  DEMO_BARBERSHOP_ID as D,
  EmptyState as E,
  Input as I,
  Label as L,
  Route$z as R,
  ShopProvider as S,
  Textarea as T,
  Badge as a,
  brl as b,
  Route$u as c,
  barbershopService as d,
  cn as e,
  buttonVariants as f,
  Route$t as g,
  useCurrentShop as h,
  Skeleton as i,
  Route$r as j,
  Route$p as k,
  Route$o as l,
  minutes as m,
  Route$n as n,
  CardGridSkeleton as o,
  phoneMask as p,
  TableSkeleton as q,
  customerService as r,
  slugify as s,
  productService as t,
  useAuth as u,
  useTheme as v,
  cashService as w,
  Route as x,
  router as y
};
