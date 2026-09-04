import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ShopProvider, useCurrentShop } from "@/hooks/use-current-shop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_BARBERSHOP_ID } from "@/lib/format";
import {
  BarChart3,
  Boxes,
  Building2,
  Calendar,
  CalendarOff,
  Clock,
  Coins,
  DollarSign,
  Gift,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Package,
  Scissors,
  Settings,
  ShoppingCart,
  TicketPercent,
  Users,
  UserCog,
  UsersRound,
  Wallet,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { barbershopService } from "@/services/barbershop.service";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { NewShopDialog } from "@/components/admin/layout/NewShopDialog";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin — BarberOS" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  loader: async ({ context: { queryClient } }) => {
    // Prefetching memberships is useful as they are needed immediately
    // Note: We need the user ID which is currently managed in useAuth
  },
  component: AdminLayout,
});

import { useOnboardingStatus } from "@/hooks/use-onboarding";
import { CheckCircle2 as CheckCircle2Icon } from "lucide-react";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/onboarding", label: "Primeiros passos", icon: CheckCircle2Icon, exact: true },
  { to: "/admin/agenda", label: "Agenda", icon: Calendar, exact: false },
  { to: "/admin/caixa", label: "Caixa", icon: DollarSign, exact: false },
  { to: "/admin/pdv", label: "PDV", icon: ShoppingCart, exact: false },
  { to: "/admin/comissoes", label: "Comissões", icon: Coins, exact: false },
  { to: "/admin/pacotes", label: "Pacotes", icon: Package, exact: false },
  { to: "/admin/cupons", label: "Cupons", icon: TicketPercent, exact: false },
  { to: "/admin/fidelidade", label: "Fidelidade", icon: Gift, exact: false },
  { to: "/admin/carteira", label: "Carteira", icon: Wallet, exact: false },
  { to: "/admin/estoque", label: "Estoque", icon: Boxes, exact: false },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3, exact: false },
  { to: "/admin/franquia", label: "Franquia", icon: Building2, exact: false },
  { to: "/admin/clientes", label: "Clientes", icon: Users, exact: false },
  { to: "/admin/profissionais", label: "Profissionais", icon: UserCog, exact: false },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors, exact: false },
  { to: "/admin/horarios", label: "Horários", icon: Clock, exact: false },
  { to: "/admin/portfolio", label: "Portfólio", icon: ImageIcon, exact: false },
  { to: "/admin/equipe", label: "Equipe", icon: UsersRound, exact: false },
  { to: "/admin/folgas", label: "Folgas", icon: CalendarOff, exact: false },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: MessageSquare, exact: false },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const nav = useNavigate();
  const { user, loading } = useAuth();

  const { data: memberships, isLoading: loadingMemberships } = useQuery({
    enabled: !!user,
    queryKey: ["memberships", user?.id],
    staleTime: 1000 * 60 * 10,
    queryFn: () => barbershopService.getMemberships(user!.id),
  });

  useEffect(() => {
    if (!loading && !user) {
      nav({ to: "/login" });
    }
  }, [loading, user, nav]);

  useEffect(() => {
    if (!loading && user && !loadingMemberships && memberships && memberships.length === 0) {
      nav({ to: "/minha-conta" });
    }
  }, [loading, user, loadingMemberships, memberships, nav]);

  if (loading || (user && loadingMemberships)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="animate-pulse text-sm font-medium text-muted-foreground">
            Carregando painel...
          </p>
        </div>
      </div>
    );
  }

  if (!user || !memberships || memberships.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <ShopProvider shops={memberships} refresh={() => {}}>
      <AdminShell />
    </ShopProvider>
  );
}

function AdminShell() {
  const loc = useLocation();
  const { user } = useAuth();
  const { shopId, shops, setShopId, refresh } = useCurrentShop();

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-[60vh]">
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">
          Não encontramos uma barbearia vinculada à sua conta.
        </h2>
      </div>
    );
  }

  const { theme, toggle } = useTheme();
  const [openSidebar, setOpenSidebar] = useState(false);

  const { data: onboarding } = useOnboardingStatus(shopId);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("onboarding_banner_dismissed") === "true";
    }
    return false;
  });

  const dismissBanner = () => {
    setBannerDismissed(true);
    sessionStorage.setItem("onboarding_banner_dismissed", "true");
  };

  return (
    <div className="relative min-h-screen bg-background selection:bg-accent/30 selection:text-accent-foreground">
      {/* Dynamic background accents */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.4] dark:opacity-60">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -left-32 top-0 h-[600px] w-full max-w-[600px] rounded-full bg-accent/10 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -right-32 bottom-0 h-[500px] w-full max-w-[500px] rounded-full bg-accent/5 blur-[140px]"
        />
      </div>

      <AdminSidebar navItems={NAV} open={openSidebar} setOpen={setOpenSidebar} />

      <div className="relative z-10 flex flex-col md:pl-64">
        {onboarding && !onboarding.isFullyComplete && !bannerDismissed && (
          <div className="bg-accent text-accent-foreground px-4 py-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <CheckCircle2Icon className="h-5 w-5" />
              <p className="text-sm font-semibold">
                Complete a configuração da sua barbearia para começar a atender online.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/admin/onboarding"
                className="text-xs font-bold uppercase tracking-wider bg-background/20 hover:bg-background/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                Continuar configuração
              </Link>
              <button
                onClick={dismissBanner}
                className="p-1 hover:bg-background/20 rounded-full transition-colors"
              >
                <span className="sr-only">Fechar</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x h-4 w-4"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <AdminHeader
          shopId={shopId}
          shops={shops}
          setShopId={setShopId}
          refresh={refresh}
          setOpenSidebar={setOpenSidebar}
          theme={theme}
          toggleTheme={toggle}
          userEmail={user?.email}
          navItems={NAV}
        />

        <main className="flex-1 p-3 pb-28 md:p-8 md:pb-8 w-full min-w-0 overflow-x-hidden">
          <motion.div
            key={loc.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-auto w-full max-w-7xl"
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Mobile Navigation */}
        <nav className="fixed inset-x-4 bottom-4 z-40 flex h-16 items-center justify-around rounded-2xl border border-border/40 bg-background/80 px-1 shadow-2xl backdrop-blur-xl md:hidden">
          {NAV.slice(0, 4).map((n) => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all active:scale-90 ${active ? "text-accent" : "text-muted-foreground hover:text-foreground"}`}
              >
                {active && (
                  <motion.div
                    layoutId="mobile-nav-pill"
                    className="absolute inset-x-1 inset-y-1 z-[-1] rounded-xl bg-accent/10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <n.icon
                  className={`h-5 w-5 transition-transform ${active ? "scale-110" : "group-hover:scale-110"}`}
                />
                <span className="text-[10px] font-bold tracking-tight">{n.label}</span>
              </Link>
            );
          })}
          <Sheet>
            <SheetTrigger asChild>
              <button
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-muted-foreground transition-all active:scale-90 ${NAV.slice(4).some((n) => loc.pathname.startsWith(n.to)) ? "text-accent" : ""}`}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span className="text-[10px] font-bold tracking-tight">Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-[32px] border-border/40 bg-background/95 pb-12 backdrop-blur-xl max-h-[85vh] overflow-y-auto"
            >
              <SheetHeader className="mb-6 border-b border-border/40 pb-4 text-left">
                <SheetTitle className="font-display text-2xl font-bold tracking-tight">
                  Todas as Opções
                </SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3">
                {NAV.slice(4).map((n) => {
                  const active = loc.pathname.startsWith(n.to);
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border p-4 transition-all active:scale-95 ${active ? "border-accent bg-accent/10 text-accent shadow-sm" : "border-border/40 bg-muted/20 text-foreground hover:bg-muted/40"}`}
                    >
                      <n.icon className="h-6 w-6" />
                      <span className="text-[10px] font-bold tracking-tight text-center uppercase">
                        {n.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </nav>
      </div>
    </div>
  );
}
