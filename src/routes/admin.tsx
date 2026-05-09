import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DEMO_BARBERSHOP_ID } from "@/lib/format";
import { Calendar, Coins, DollarSign, LayoutDashboard, LogOut, Menu, Scissors, Settings, Users, UserCog, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — BarberOS" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/agenda", label: "Agenda", icon: Calendar },
  { to: "/admin/caixa", label: "Caixa", icon: DollarSign },
  { to: "/admin/comissoes", label: "Comissões", icon: Coins },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/profissionais", label: "Profissionais", icon: UserCog },
  { to: "/admin/servicos", label: "Serviços", icon: Scissors },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const { data: membership, refetch } = useQuery({
    enabled: !!user,
    queryKey: ["membership", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("barbershop_members").select("*").eq("profile_id", user!.id).eq("barbershop_id", DEMO_BARBERSHOP_ID).maybeSingle();
      return data;
    },
  });

  async function claim() {
    const { error } = await supabase.from("barbershop_members").insert({
      barbershop_id: DEMO_BARBERSHOP_ID, profile_id: user!.id, role: "owner",
    });
    if (error) return toast.error(error.message);
    toast.success("Você agora é dono da BarberOS Demo!");
    refetch();
  }

  if (loading || !user) return null;

  if (!membership) {
    return (
      <div className="grid min-h-screen place-items-center bg-background p-6">
        <Card className="max-w-md p-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent"><Scissors className="h-6 w-6"/></div>
          <h1 className="mt-4 font-display text-2xl font-bold">Bem-vindo ao BarberOS</h1>
          <p className="mt-2 text-sm text-muted-foreground">Para acessar o painel administrativo da barbearia demo, assuma o papel de dono.</p>
          <Button className="mt-6 w-full" onClick={claim}>Assumir BarberOS Demo</Button>
          <Link to="/" className="mt-3 inline-block text-xs text-muted-foreground hover:underline">Voltar à home</Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0 ${open?"translate-x-0":"-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <Link to="/admin" className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-foreground"><Scissors className="h-4 w-4"/></span>
            BarberOS
          </Link>
          <button className="md:hidden" onClick={()=>setOpen(false)}><X className="h-5 w-5"/></button>
        </div>
        <nav className="mt-2 px-3">
          {NAV.map(n => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} onClick={()=>setOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active?"bg-sidebar-accent text-sidebar-primary-foreground":"text-sidebar-foreground/80 hover:bg-sidebar-accent/60"}`}>
                <n.icon className="h-4 w-4"/>{n.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-3 bottom-3">
          <button onClick={()=>supabase.auth.signOut().then(()=>nav({to:"/"}))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/60">
            <LogOut className="h-4 w-4"/>Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <button className="md:hidden" onClick={()=>setOpen(true)}><Menu className="h-5 w-5"/></button>
          <div className="text-sm text-muted-foreground">BarberOS Demo</div>
          <div className="text-sm">{user.email}</div>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
