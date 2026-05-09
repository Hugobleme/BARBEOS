import { createFileRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ShopProvider, useCurrentShop } from "@/hooks/use-current-shop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEMO_BARBERSHOP_ID } from "@/lib/format";
import { Building2, Calendar, Coins, DollarSign, LayoutDashboard, LogOut, Menu, Plus, Scissors, Settings, Users, UserCog, UsersRound, X } from "lucide-react";
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
  { to: "/admin/equipe", label: "Equipe", icon: UsersRound },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
];

function slugify(v: string) {
  return v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function AdminLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const { data: memberships, refetch, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["memberships", user?.id],
    queryFn: async () => {
      const { data: ms } = await supabase
        .from("barbershop_members")
        .select("barbershop_id, role, barbershops(id,name)")
        .eq("profile_id", user!.id)
        .eq("active", true);
      return (ms ?? []).map((m: any) => ({
        id: m.barbershop_id, role: m.role, name: m.barbershops?.name ?? "Barbearia",
      }));
    },
  });

  async function claimDemo() {
    const { error } = await supabase.from("barbershop_members").insert({
      barbershop_id: DEMO_BARBERSHOP_ID, profile_id: user!.id, role: "owner",
    });
    if (error) return toast.error(error.message);
    toast.success("Você agora é dono da BarberOS Demo!");
    refetch();
  }

  if (loading || !user || isLoading) return null;

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
  const nav = useNavigate();
  const loc = useLocation();
  const { user } = useAuth();
  const { shopId, shops, setShopId, refresh } = useCurrentShop();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
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

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur md:px-8">
          <button className="md:hidden" onClick={()=>setOpen(true)}><Menu className="h-5 w-5"/></button>
          <div className="flex flex-1 items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground"/>
            <Select value={shopId ?? undefined} onValueChange={setShopId}>
              <SelectTrigger className="h-9 w-[220px]"><SelectValue placeholder="Selecionar barbearia"/></SelectTrigger>
              <SelectContent>
                {shops.map(s => <SelectItem key={s.id} value={s.id}>{s.name} <span className="ml-2 text-xs text-muted-foreground">({s.role})</span></SelectItem>)}
              </SelectContent>
            </Select>
            <NewShopDialog onCreated={refresh} trigger={<Button size="sm" variant="ghost"><Plus className="h-4 w-4"/></Button>} />
          </div>
          <div className="hidden text-sm text-muted-foreground md:block">{user?.email}</div>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

function NewShopDialog({ onCreated, trigger }: { onCreated: () => void; trigger: React.ReactNode }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return toast.error("Informe o nome da barbearia");
    setBusy(true);
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data, error } = await supabase.from("barbershops").insert({ name: name.trim(), slug }).select("id").single();
    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Erro"); }
    const { error: mErr } = await supabase.from("barbershop_members").insert({
      barbershop_id: data.id, profile_id: user!.id, role: "owner",
    });
    setBusy(false);
    if (mErr) return toast.error(mErr.message);
    toast.success("Barbearia criada!");
    setOpen(false); setName("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Nova barbearia</DialogTitle></DialogHeader>
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input value={name} onChange={(e)=>setName(e.target.value)} placeholder="Ex: BarberOS Centro"/>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={create} disabled={busy}>{busy?"Criando…":"Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
