import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { ShopProvider, useCurrentShop } from "@/hooks/use-current-shop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_BARBERSHOP_ID } from "@/lib/format";
import { BarChart3, Boxes, Building2, Calendar, CalendarOff, Coins, DollarSign, Gift, Image as ImageIcon, LayoutDashboard, MessageSquare, MoreHorizontal, Package, Scissors, Settings, ShoppingCart, TicketPercent, Users, UserCog, UsersRound, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";
import { useTheme } from "@/hooks/use-theme";
import { barbershopService } from "@/services/barbershop.service";
import { AdminSidebar } from "@/components/admin/layout/AdminSidebar";
import { AdminHeader } from "@/components/admin/layout/AdminHeader";
import { NewShopDialog } from "@/components/admin/layout/NewShopDialog";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — BarberOS" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
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
  { to: "/admin/portfolio", label: "Portfólio", icon: ImageIcon, exact: false },
  { to: "/admin/equipe", label: "Equipe", icon: UsersRound, exact: false },
  { to: "/admin/folgas", label: "Folgas", icon: CalendarOff, exact: false },
  { to: "/admin/avaliacoes", label: "Avaliações", icon: MessageSquare, exact: false },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings, exact: false },
] as const;

function AdminLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const { data: memberships, refetch, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["memberships", user?.id],
    staleTime: 1000 * 60 * 10,
    queryFn: () => barbershopService.getMemberships(user!.id),
  });

  async function claimDemo() {
    try {
      await barbershopService.claimDemo(user!.id, DEMO_BARBERSHOP_ID);
      toast.success("Você agora é dono da BarberOS Demo!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao assumir demo");
    }
  }

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <p className="animate-pulse text-sm font-medium text-muted-foreground">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!memberships || memberships.length === 0) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent"><Scissors className="h-6 w-6"/></div>
          <h1 className="mt-4 font-display text-2xl font-bold">Bem-vindo ao BarberOS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Você ainda não faz parte de nenhuma barbearia. Assuma a barbearia demo ou crie a sua.</p>
          <div className="mt-6 grid gap-2">
            <Button onClick={claimDemo}>Assumir BarberOS Demo</Button>
            <NewShopDialog onCreated={refetch} trigger={<Button variant="outline">Criar minha barbearia</Button>} />
          </div>
          <Link to="/" className="mt-3 inline-block text-xs text-muted-foreground hover:underline">Voltar à home</Link>
        </Card>
      </div>
    );
  }

  return (
    <ShopProvider shops={memberships} refresh={refetch}>
      <AdminShell />
    </ShopProvider>
  );
}

function AdminShell() {
  const loc = useLocation();
  const { user } = useAuth();
  const { shopId, shops, setShopId, refresh } = useCurrentShop();
  const { theme, toggle } = useTheme();
  const [openSidebar, setOpenSidebar] = useState(false);

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.35] dark:opacity-60">
        <div className="absolute -left-32 top-0 h-[480px] w-[480px] rounded-full bg-accent/10 blur-[140px]" />
        <div className="absolute right-0 bottom-0 h-[420px] w-[420px] rounded-full bg-accent/5 blur-[160px]" />
      </div>

      <AdminSidebar navItems={NAV} open={openSidebar} setOpen={setOpenSidebar} />

      <div className="relative z-10 md:pl-64">
        <AdminHeader 
          shopId={shopId} 
          shops={shops} 
          setShopId={setShopId} 
          refresh={refresh} 
          setOpenSidebar={setOpenSidebar} 
          theme={theme} 
          toggleTheme={toggle} 
          userEmail={user?.email} 
        />
        <main className="p-4 pb-24 md:p-8 md:pb-8"><Outlet /></main>

        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur md:hidden">
          {NAV.slice(0, 4).map((n) => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${active ? "text-accent" : "text-muted-foreground"}`}>
                <n.icon className="h-5 w-5" />
                <span className="truncate">{n.label}</span>
              </Link>
            );
          })}
          <Sheet>
            <SheetTrigger asChild>
              <button className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] ${NAV.slice(4).some(n => loc.pathname.startsWith(n.to)) ? "text-accent" : "text-muted-foreground"}`}>
                <MoreHorizontal className="h-5 w-5" />
                <span>Mais</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl border-border bg-background pb-8">
              <SheetHeader className="text-left">
                <SheetTitle className="font-serif text-xl">Mais opções</SheetTitle>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {NAV.slice(4).map((n) => {
                  const active = loc.pathname.startsWith(n.to);
                  return (
                    <Link key={n.to} to={n.to}
                      className={`flex flex-col items-center justify-center gap-1.5 rounded-lg border p-4 text-xs transition ${active ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground hover:bg-muted/40"}`}>
                      <n.icon className="h-5 w-5" />
                      <span className="text-center">{n.label}</span>
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
