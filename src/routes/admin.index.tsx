// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { useOnboardingStatus } from "@/hooks/use-onboarding";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  Users,
  Scissors,
  Store,
  ArrowRight,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Clock
} from "lucide-react";
import { format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Agendado", className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  in_progress: { label: "Em atendimento", className: "border-amber-500/30 bg-amber-500/10 text-amber-400" },
  completed: { label: "ConcluÃ­do", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelado", className: "border-border bg-muted/40 text-muted-foreground line-through" },
  no_show: { label: "Falta", className: "border-destructive/30 bg-destructive/10 text-destructive" },
};

function AdminDashboardPage() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0];

  const now = new Date();
  const dateStr = format(now, "EEEE, d 'de' MMMM", { locale: ptBR });

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto h-[60vh]">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">NÃ£o encontramos uma barbearia vinculada Ã  sua conta.</h2>
        <p className="text-muted-foreground text-sm mb-8">Conclua o cadastro da sua unidade ou procure o suporte responsÃ¡vel.</p>
        <Button asChild>
          <Link to="/admin/onboarding">Primeiros passos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pt-4 pb-12">
      {/* 1. HEADER */}
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground tracking-tight">
          {firstName ? `OlÃ¡, ${firstName}` : "OlÃ¡!"}
        </h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-muted-foreground">
          <p>Veja o que precisa da sua atenÃ§Ã£o hoje.</p>
          <span className="hidden sm:inline text-border">â€¢</span>
          <p className="capitalize text-sm font-medium">{dateStr}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 3. TODAY'S AGENDA */}
          <AgendaCard shopId={shopId} />
        </div>
        
        <div className="space-y-6">
          {/* 2. SETUP STATUS */}
          <SetupStatusCard shopId={shopId} />
          
          {/* 4. QUICK ACTIONS */}
          <QuickActions />
        </div>
      </div>
    </div>
  );
}

function SetupStatusCard({ shopId }: { shopId: string }) {
  const { data: status, isLoading } = useOnboardingStatus(shopId);

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4 bg-card border-border/60">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-10 w-full mt-4" />
      </Card>
    );
  }

  if (!status) return null;

  const { isFullyComplete, completedCount, totalSteps, shop } = status;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <Card className="p-6 bg-card border-border/60 shadow-sm flex flex-col h-full">
      <h2 className="text-lg font-bold font-serif mb-4 flex items-center gap-2">
        <Store className="h-5 w-5 text-accent" />
        ConfiguraÃ§Ã£o da barbearia
      </h2>
      
      <div className="space-y-4 flex-1">
        <div className="flex items-center justify-between text-sm font-bold">
          <span className="text-muted-foreground">{completedCount} de {totalSteps} etapas</span>
          <span className="text-accent">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
        
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isFullyComplete 
            ? "Sua barbearia estÃ¡ pronta para revisÃ£o." 
            : `Faltam ${totalSteps - completedCount} etapa${totalSteps - completedCount > 1 ? 's' : ''} para deixar seu perfil mais completo.`}
        </p>
      </div>

      <div className="pt-6 mt-auto">
        {!isFullyComplete ? (
          <Button asChild className="w-full text-xs font-bold uppercase tracking-wider">
            <Link to="/admin/onboarding">Continuar configuraÃ§Ã£o</Link>
          </Button>
        ) : shop?.slug ? (
          <Button asChild variant="outline" className="w-full text-xs font-bold uppercase tracking-wider border-accent/40 text-accent hover:bg-accent/10">
            <Link to={`/b/${shop.slug}`} target="_blank">Revisar perfil pÃºblico</Link>
          </Button>
        ) : (
          <p className="text-xs text-center text-muted-foreground border border-dashed border-border/60 rounded-md p-3">
            Perfil concluÃ­do, mas sem link pÃºblico disponÃ­vel.
          </p>
        )}
      </div>
    </Card>
  );
}

function AgendaCard({ shopId }: { shopId: string }) {
  const now = new Date();
  const start = startOfDay(now);
  const end = endOfDay(now);

  const { data: appointments, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-today-agenda", shopId, start.toISOString(), end.toISOString()],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          id, scheduled_start, status,
          customer:customers(full_name),
          services:appointment_services(service:services(name))
        `)
        .eq("barbershop_id", shopId)
        .gte("scheduled_start", start.toISOString())
        .lte("scheduled_start", end.toISOString())
        .order("scheduled_start", { ascending: true });

      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-6 bg-card border-border/60">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="p-8 text-center bg-card border-destructive/20 space-y-4">
        <AlertTriangle className="h-10 w-10 text-destructive/40 mx-auto" />
        <h3 className="text-lg font-bold">NÃ£o foi possÃ­vel carregar a agenda de hoje.</h3>
        <p className="text-muted-foreground text-sm">Verifique sua conexÃ£o ou tente novamente.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
          <RefreshCcw className="h-4 w-4 mr-2" /> Tentar novamente
        </Button>
      </Card>
    );
  }

  const total = appointments?.length || 0;
  
  // Breakdown
  const statusCounts = appointments?.reduce((acc, appt) => {
    acc[appt.status] = (acc[appt.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Upcoming: status is scheduled or in_progress, ordered by time.
  const upcoming = appointments
    ?.filter(a => a.status === "scheduled" || a.status === "in_progress")
    ?.slice(0, 3) || [];

  return (
    <Card className="p-6 bg-card border-border/60 shadow-sm flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-lg font-bold font-serif flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          Agenda de hoje
        </h2>
        <Button asChild variant="outline" size="sm" className="text-xs font-bold uppercase tracking-wider shrink-0">
          <Link to="/admin/agenda">Abrir agenda <ArrowRight className="ml-2 h-3 w-3" /></Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold text-accent">{total}</span>
          <span className="text-xs font-bold uppercase tracking-wider text-accent/80 mt-1">Total</span>
        </div>
        
        {["scheduled", "in_progress", "completed"].map(status => {
          const count = statusCounts[status] || 0;
          const info = STATUS_LABELS[status];
          if (!info) return null;
          return (
            <div key={status} className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center opacity-80 ${info.className}`}>
              <span className="text-xl font-bold">{count}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">{info.label}</span>
            </div>
          );
        })}
      </div>

      <div className="space-y-3 flex-1">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          PrÃ³ximos atendimentos
        </h3>
        
        {upcoming.length > 0 ? (
          upcoming.map((appt) => {
            const time = format(new Date(appt.scheduled_start), "HH:mm");
            // Supabase joins can return arrays or single objects depending on relationship.
            const customerName = Array.isArray(appt.customer) ? appt.customer[0]?.full_name : appt.customer?.full_name;
            const servicesArray = Array.isArray(appt.services) ? appt.services : (appt.services ? [appt.services] : []);
            
            // Extract service names handling the nested relationship
            const serviceNames = servicesArray
              .map((s: any) => {
                const innerService = Array.isArray(s.service) ? s.service[0] : s.service;
                return innerService?.name;
              })
              .filter(Boolean)
              .join(" + ");

            return (
              <div key={appt.id} className="flex items-center gap-4 p-4 rounded-xl bg-muted/20 border border-border/40 hover:bg-muted/40 transition-colors">
                <div className="font-mono font-bold text-accent shrink-0">{time}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{customerName || "Cliente"}</p>
                  <p className="text-xs text-muted-foreground truncate">{serviceNames || "Atendimento agendado"}</p>
                </div>
                <div className={`shrink-0 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${STATUS_LABELS[appt.status]?.className || "bg-muted"}`}>
                  {STATUS_LABELS[appt.status]?.label || appt.status}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border/40 bg-muted/10">
            <p className="text-sm font-bold mb-1">Nenhum atendimento programado para hoje.</p>
            <p className="text-xs text-muted-foreground">Use a agenda para acompanhar os prÃ³ximos horÃ¡rios.</p>
          </div>
        )}
      </div>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card className="p-6 bg-card border-border/60 shadow-sm flex flex-col h-full">
      <h2 className="text-lg font-bold font-serif mb-4">
        AÃ§Ãµes rÃ¡pidas
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
        <Button asChild variant="outline" className="h-12 justify-start font-medium bg-muted/20 hover:bg-muted/50 border-border/40 hover:border-border transition-all">
          <Link to="/admin/agenda">
            <Calendar className="h-4 w-4 mr-3 text-muted-foreground" />
            Ver agenda
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-start font-medium bg-muted/20 hover:bg-muted/50 border-border/40 hover:border-border transition-all">
          <Link to="/admin/servicos">
            <Scissors className="h-4 w-4 mr-3 text-muted-foreground" />
            Cadastrar serviÃ§o
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-start font-medium bg-muted/20 hover:bg-muted/50 border-border/40 hover:border-border transition-all">
          <Link to="/admin/profissionais">
            <Users className="h-4 w-4 mr-3 text-muted-foreground" />
            Adicionar profissional
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 justify-start font-medium bg-muted/20 hover:bg-muted/50 border-border/40 hover:border-border transition-all">
          <Link to="/admin/configuracoes">
            <Store className="h-4 w-4 mr-3 text-muted-foreground" />
            Configurar perfil
          </Link>
        </Button>
      </div>
    </Card>
  );
}



