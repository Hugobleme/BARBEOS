import { Outlet, useRouterState } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { PageTransition, PageTransitionVariant } from "./page-transition";

export function AnimatedOutlet() {
  const matches = useRouterState({ select: (s) => s.matches });
  const loc = useRouterState({ select: (s) => s.location });
  
  // Obter o match mais profundo (a rota atual renderizada)
  const currentMatch = matches[matches.length - 1];
  
  // Checar se a rota definiu uma transição específica em sua configuração estática
  // (ex: staticData: { transition: "zoom" })
  const routeTransition = currentMatch?.staticData?.transition as PageTransitionVariant | undefined;
  
  // Fallback baseado no path para configurações automáticas
  let variant: PageTransitionVariant = routeTransition || "fade";
  
  if (!routeTransition) {
    if (loc.pathname === "/") variant = "fade";
    else if (loc.pathname.startsWith("/admin")) variant = "slide-right";
    else if (loc.pathname.startsWith("/agendar")) variant = "slide-up";
    else if (loc.pathname.startsWith("/b/")) variant = "parallax";
  }
  
  return (
    <AnimatePresence mode="wait">
      <PageTransition key={loc.pathname} variant={variant} className="flex-1 flex flex-col min-h-screen w-full">
        <Outlet />
      </PageTransition>
    </AnimatePresence>
  );
}
