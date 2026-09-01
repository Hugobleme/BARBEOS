import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { brl } from "@/lib/format";
import { Calendar, Clock, LogOut, MapPin, Scissors, Star, User, Settings, ArrowRight, AlertCircle, X } from "lucide-react";
import { format, isFuture, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { barbershopService } from "@/services/barbershop.service";
import { phoneMask } from "@/lib/utils";

export const Route = createFileRoute("/minha-conta")({
  component: MinhaContaPage,
});

type Tab = "proximos" | "historico" | "perfil" | "negocio";

function MinhaContaPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("proximos");

  // Profile Edit State
  const [editName, setEditName] = useState(user?.user_metadata?.full_name || "");
  const [editPhone, setEditPhone] = useState(user?.user_metadata?.phone || "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [bsName, setBsName] = useState("");
  const [bsPhone, setBsPhone] = useState("");
  const [creatingBs, setCreatingBs] = useState(false);

  async function handleCreateBarbershop(e: React.FormEvent) {
    e.preventDefault();
    if (!bsName.trim()) return toast.error("O nome é obrigatório");
    setCreatingBs(true);
    try {
      await barbershopService.createBarbershop({
        name: bsName.trim(),
        ownerId: user!.id,
        phone: bsPhone.trim() || undefined,
        address: { street: null, number: null, neighborhood: null, city: null, state: null, zip_code: null },
        theme: { primaryColor: "#d4af37", secondaryColor: "#1a1a1a", logoUrl: null, bannerUrl: null },
        links: { instagram: null, facebook: null, website: null, google_maps: null },
      });
      toast.success("Barbearia criada com sucesso!");
      window.location.href = "/admin"; // hard redirect to reload permissions
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar barbearia");
      setCreatingBs(false);
    }
  }


  // Queries
  const { data: customerIds = [], isLoading: idsLoading } = useQuery({
    queryKey: ["my-customer-ids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id").eq("profile_id", user!.id);
      return (data || []).map(c => c.id);
    },
  });

  const { data: appointments = [], isLoading: apptsLoading } = useQuery({
    queryKey: ["my-appointments", customerIds.join(",")],
    enabled: customerIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select(`
        id, scheduled_start, scheduled_end, status, total_amount, barbershop_id,
        barbershop:barbershops(name, slug, address),
        professional:professionals(display_name),
        services:appointment_services(service:services(name)),
        satisfaction_surveys(id)
      `).in("customer_id", customerIds).order("scheduled_start", { ascending: true });
      
      return data || [];
    },
  });

  // Derived Data
  const upcoming = appointments.filter(a => isFuture(new Date(a.scheduled_start)) && !["cancelled", "no_show"].includes(a.status || ""));
  const history = appointments.filter(a => isPast(new Date(a.scheduled_start)) || ["cancelled", "no_show"].includes(a.status || "")).reverse();
  const nextAppt = upcoming[0];

  // Actions
  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado com sucesso.");
      qc.invalidateQueries({ queryKey: ["my-appointments"] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cancelar agendamento.")
  });

  const handleCancel = (a: any) => {
    if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
      cancelMut.mutate(a.id);
    }
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: editName, phone: editPhone }
      });
      if (error) throw error;
      
      // Update linked customer records
      if (customerIds.length > 0) {
        await supabase.from("customers").update({ full_name: editName, phone: editPhone }).in("id", customerIds);
      }
      
      toast.success("Perfil atualizado!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar perfil.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  if (loading) return <PublicLayout><div className="flex justify-center p-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"/></div></PublicLayout>;
  
  if (!user) {
    navigate({ to: "/login", search: { redirect: "/minha-conta" } });
    return null;
  }

  const isLoading = idsLoading || apptsLoading;

  return (
    <PublicLayout>
      <div className="bg-muted/30 border-b border-border/40 py-6 md:py-10">
        <div className="mx-auto max-w-4xl px-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl md:text-4xl font-bold">Olá, {user.user_metadata?.full_name?.split(" ")[0] || "Cliente"}</h1>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Bem-vindo à sua área exclusiva BarberOS.</p>
          </div>
          <Button variant="outline" onClick={handleLogout} className="h-10 text-xs w-fit">
            <LogOut className="mr-2 h-3.5 w-3.5" /> Sair da conta
          </Button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 pb-32">
        {nextAppt && (
          <div className="mb-8">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Próximo Agendamento
            </h2>
            <Card className="bg-accent text-accent-foreground p-5 md:p-6 border-transparent shadow-lg relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-background/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl md:text-2xl font-bold mb-1">{nextAppt.barbershop?.name}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-sm md:text-base font-medium opacity-90">
                    <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(nextAppt.scheduled_start), "EEEE, dd/MM", { locale: ptBR })}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> {format(new Date(nextAppt.scheduled_start), "HH:mm")}</span>
                  </div>
                  <p className="mt-3 text-sm opacity-80 line-clamp-1">
                    {nextAppt.services?.map((s:any) => s.service?.name).join(" + ")} com {nextAppt.professional?.display_name || "Profissional"}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                  <Button asChild variant="secondary" className="h-11 bg-background text-foreground hover:bg-background/90 w-full md:w-auto font-bold">
                    <Link to="/b/$slug" params={{ slug: nextAppt.barbershop?.slug || "" }}>Ver barbearia</Link>
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Tabs Mobile First */}
        <div className="flex overflow-x-auto no-scrollbar gap-2 mb-6 border-b border-border/40 pb-2">
          <button 
            onClick={() => setTab("proximos")} 
            className={`h-11 px-4 text-sm font-bold whitespace-nowrap rounded-lg transition-colors ${tab === "proximos" ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            Próximos
          </button>
          <button 
            onClick={() => setTab("historico")} 
            className={`h-11 px-4 text-sm font-bold whitespace-nowrap rounded-lg transition-colors ${tab === "historico" ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            Histórico
          </button>
          <button 
            onClick={() => setTab("perfil")} 
            className={`h-11 px-4 text-sm font-bold whitespace-nowrap rounded-lg transition-colors ${tab === "perfil" ? "bg-card border border-border shadow-sm text-foreground" : "text-muted-foreground hover:bg-muted"}`}
          >
            Editar Perfil
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-32 bg-muted/50 rounded-xl animate-pulse" />)}
            </div>
          ) : tab === "proximos" ? (
            upcoming.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/60 rounded-xl bg-card/20">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-bold text-lg">Você não tem agendamentos</h3>
                <p className="text-muted-foreground mt-1 mb-6">Que tal marcar um horário para dar um tapa no visual?</p>
                <Button asChild className="h-11 px-6 bg-accent text-accent-foreground font-bold">
                  <Link to="/barbearias">Encontrar uma barbearia</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {upcoming.map(a => (
                  <AppointmentCard key={a.id} appt={a} onCancel={() => handleCancel(a)} cancelable />
                ))}
              </div>
            )
          ) : tab === "historico" ? (
            history.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center border border-border/40 rounded-xl bg-card/20"><p className="text-muted-foreground mb-4">Você ainda não possui agendamentos no histórico.</p><Button asChild variant="outline" className="uppercase tracking-wider text-xs font-bold"><Link to="/barbearias">Explorar barbearias</Link></Button></div>
            ) : (
              <div className="grid gap-4">
                {history.map(a => (
                  <AppointmentCard key={a.id} appt={a} />
                ))}
              </div>
            )
          ) : (
            <Card className="p-5 md:p-8 max-w-xl border-border/60">
              <h2 className="font-bold text-lg mb-6">Meus Dados</h2>
              <form onSubmit={saveProfile} className="space-y-5">
                <div className="space-y-2">
                  <Label>Nome completo</Label>
                  <Input value={editName} onChange={e=>setEditName(e.target.value)} className="h-11 bg-background" />
                </div>
                <div className="space-y-2">
                  <Label>Telefone / WhatsApp</Label>
                  <Input value={editPhone} onChange={e=>setEditPhone(e.target.value)} className="h-11 bg-background" placeholder="(11) 90000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={user.email} disabled className="h-11 opacity-60" />
                  <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado no momento.</p>
                </div>
                <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto h-11 bg-foreground text-background font-bold mt-4">
                  {savingProfile ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function AppointmentCard({ appt, cancelable, onCancel }: any) {
  const isPastAppt = isPast(new Date(appt.scheduled_start));
  const isCanceled = ["cancelled", "no_show"].includes(appt.status);
  const canReview = isPastAppt && !isCanceled && (!appt.satisfaction_surveys || appt.satisfaction_surveys.length === 0);

  return (
    <Card className={`p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-border/60 transition-colors ${isCanceled ? "opacity-70 bg-muted/20" : "bg-card hover:border-accent/40"}`}>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-lg">{appt.barbershop?.name}</h3>
          {isCanceled ? (
            <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Cancelado</Badge>
          ) : isPastAppt ? (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">Concluído</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-500">Confirmado</Badge>
          )}
        </div>
        
        <p className="text-sm font-medium mb-1 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" /> 
          {format(new Date(appt.scheduled_start), "dd/MM/yyyy 'às' HH:mm")}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {appt.services?.map((s:any) => s.service?.name).join(" + ")} com {appt.professional?.display_name}
        </p>
        
        <p className="text-sm font-bold mt-2">{brl(Number(appt.total_amount))}</p>
      </div>

      <div className="flex flex-col gap-2 min-w-[140px] pt-4 md:pt-0 border-t md:border-0 border-border/40">
        {!isCanceled && appt.barbershop?.slug && (
          <Button asChild variant="outline" className="h-10 text-xs w-full">
            <Link to="/b/$slug" params={{ slug: appt.barbershop.slug }}>Ver barbearia</Link>
          </Button>
        )}
        {cancelable && !isCanceled && !isPastAppt && (
          <Button variant="ghost" className="h-10 text-xs text-destructive hover:bg-destructive/10 w-full" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        {canReview && (
          <Button asChild className="h-10 text-xs bg-accent text-accent-foreground font-bold w-full">
            <Link to="/avaliar/$appointmentId" params={{ appointmentId: appt.id }}>
              <Star className="h-3.5 w-3.5 mr-1.5" /> Avaliar
            </Link>
          </Button>
        )}
        {!canReview && isPastAppt && !isCanceled && appt.satisfaction_surveys?.length > 0 && (
          <Badge variant="secondary" className="justify-center h-10 rounded-md bg-muted/50 text-muted-foreground">Avaliado ✓</Badge>
        )}
      </div>
    </Card>
  );
}
