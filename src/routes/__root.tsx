import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { InstallAppButton } from "@/components/site/InstallAppButton";
import { ThemeProvider } from "@/components/ThemeProvider";

function NotFoundComponent() {
  const loc = useRouterState({ select: (s) => s.location });
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-[390px] w-full text-center sm:max-w-md">
        <h1 className="text-6xl font-serif font-bold text-accent sm:text-7xl">404</h1>
        <h2 className="mt-4 font-serif text-xl font-semibold text-foreground sm:text-2xl">PÃ¡gina não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A pÃ¡gina que você estÃ¡ procurando não existe ou foi movida.
        </p>
        {import.meta.env.DEV && loc?.pathname && (
          <p className="mt-2 font-mono text-[10px] text-muted-foreground/50 truncate">
            Path: {loc.pathname}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="flex min-h-11 items-center justify-center rounded-none bg-accent px-6 text-xs font-bold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Voltar ao InÃ­cio
          </Link>
          <Link
            to="/barbearias"
            className="flex min-h-11 items-center justify-center rounded-none border border-border px-6 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Encontrar Barbearia
          </Link>
        </div>
      </div>
    </div>
  );
}

function getReadableError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Unhandled application error", error);
  const router = useRouter();
  const isDevelopment = import.meta.env.DEV;

  const safeErrorMessage =
    error instanceof Error && error.message
      ? error.message.slice(0, 180)
      : "Erro inesperado.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center border border-border bg-card/60 p-8 backdrop-blur-md">
        <h1 className="font-serif text-2xl font-bold text-foreground">
          Ops! Ocorreu um problema ao carregar
        </h1>
        <p className="mt-2 text-xs text-muted-foreground">
          Nï¿½o se preocupe, tente recarregar ou voltar para a pï¿½gina inicial.
        </p>
        
        {isDevelopment ? (
          <p className="mt-4 break-words text-xs text-muted-foreground text-left bg-muted/30 p-2 rounded">
            Diagnï¿½stico: {safeErrorMessage}
          </p>
        ) : null}
        
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-none bg-accent px-5 py-2 text-xs font-bold uppercase tracking-wider text-accent-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Tentar novamente
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-none border border-border bg-card px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            onClick={() => reset()}
          >
            Voltar ao inï¿½cio
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BarberOS — GestÃ£o e agendamento para barbearias" },
      { name: "description", content: "Sistema completo para barbearias modernas: agenda online 24/7, gestÃ£o de clientes, equipe e financeiro." },
      { name: "author", content: "BarberOS" },
      { property: "og:title", content: "BarberOS — GestÃ£o e agendamento para barbearias" },
      { property: "og:description", content: "Sistema completo para barbearias modernas: agenda online 24/7, gestÃ£o de clientes, equipe e financeiro." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@BarberOS" },
      { name: "theme-color", content: "#050505" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "BARBEOS" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "preload", as: "style", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", sizes: "512x512", href: "/icon-512.png" },
    ],
    scripts: [],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});



function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
          <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });

  return (
    <ThemeProvider defaultTheme="system" storageKey="barberos-theme">
      <QueryClientProvider client={queryClient}>
        {isLoading && (
          <div className="fixed inset-x-0 top-0 z-[100] h-1 origin-left animate-in fade-in fill-mode-both">
            <div className="h-full bg-accent shadow-[0_0_8px_hsl(var(--accent))] transition-all duration-500" style={{ width: "100%", animation: "progress 2s ease-in-out infinite" }} />
            <style>{`
              @keyframes progress {
                0% { transform: scaleX(0); transform-origin: left; }
                50% { transform: scaleX(0.5); transform-origin: left; }
                100% { transform: scaleX(1); transform-origin: right; }
              }
            `}</style>
          </div>
        )}
        <Outlet />
        <Toaster richColors position="top-right" />
        <InstallAppButton />
      </QueryClientProvider>
    </ThemeProvider>
  );
}



