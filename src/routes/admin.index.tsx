import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { brl } from "@/lib/format";
import { KPISkeleton } from "@/components/site/LoadingState";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, DollarSign, TrendingUp, Users, Clock, ChevronRight, ArrowUpRight, Plus, UserPlus, ShoppingBag, Receipt } from "lucide-react";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const shopId = useCurrentShopId();
  const today = useMemo(() => new Date(), []);
  
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats", shopId], 
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
    queryFn: async () => {
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();
      const { data: appts } = await supabase
        .from("appointments")
        .select("status, total_amount, scheduled_start")
        .eq("barbershop_id", shopId)
        .gte("scheduled_start", start)
        .lte("scheduled_start", end);
        
      const { count: customers } = await supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .eq("barbershop_id", shopId);
        
      const revenue = (appts ?? []).filter(a=>a.status==="completed").reduce((a,b)=>a+Number(b.total_amount),0);
      return { 
        count: appts?.length ?? 0, 
        completed: (appts ?? []).filter(a=>a.status==="completed").length, 
        revenue, 
        customers: customers ?? 0 
      };
    },
  });
  
  const { data: next, isLoading: nextLoading } = useQuery({
    queryKey: ["admin-next", shopId], 
    enabled: !!shopId,
    staleTime: 1000 * 60,
    queryFn: async () => {
      const { data } = await supabase.from("appointments")
        .select("id, scheduled_start, total_amount, status, professional:professionals(display_name), customer:customers(full_name)")
        .eq("barbershop_id", shopId)
        .gte("scheduled_start", new Date().toISOString())
        .order("scheduled_start")
        .limit(6);
      return data ?? [];
    },
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-4xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4 text-accent" />
          <p className="text-sm font-medium">{format(today, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}</p>
        </div>
      </div>

      {statsLoading ? <KPISkeleton /> : (
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <KPI variants={item} icon={Calendar} label="Agendamentos hoje" value={stats?.count ?? 0} trend="+12% que ontem" />
          <KPI variants={item} icon={TrendingUp} label="Atendimentos concluídos" value={stats?.completed ?? 0} />
          <KPI variants={item} icon={DollarSign} label="Faturamento do dia" value={brl(stats?.revenue ?? 0)} isCurrency />
          <KPI variants={item} icon={Users} label="Total de clientes" value={stats?.customers ?? 0} />
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-4">
        <Card className="flex flex-col gap-4 border-none bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
          <h2 className="font-display text-lg font-bold tracking-tight">Ações rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickAction icon={Plus} label="Agendar" color="bg-accent" to="/admin/agenda" />
            <QuickAction icon={UserPlus} label="Cliente" color="bg-blue-500" to="/admin/clientes" />
            <QuickAction icon={ShoppingBag} label="Venda" color="bg-green-500" to="/admin/pdv" />
            <QuickAction icon={Receipt} label="Caixa" color="bg-amber-500" to="/admin/caixa" />
          </div>
        </Card>

        <Card className="col-span-1 lg:col-span-3 overflow-hidden border-none bg-card/50 shadow-xl shadow-black/5 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-border/40 p-6">
            <h2 className="font-display text-xl font-bold tracking-tight">Próximos agendamentos</h2>
            <button className="text-xs font-bold uppercase tracking-widest text-accent transition-colors hover:text-accent/80">Ver agenda completa</button>
          </div>
          <div className="p-0">
            {nextLoading ? (
              <div className="space-y-4 p-6">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : (!next || next.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="rounded-full bg-muted/30 p-4"><Clock className="h-8 w-8 text-muted-foreground/40" /></div>
                <p className="mt-4 text-sm font-medium text-muted-foreground">Nenhum agendamento futuro para hoje.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {next.map((a: any) => (
                  <motion.div 
                    key={a.id} 
                    whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
                    className="flex items-center justify-between p-4 px-6 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-accent/10 px-2.5 py-1.5 text-center min-w-[60px]">
                        <span className="font-mono text-xs font-bold text-accent">{format(new Date(a.scheduled_start), "HH:mm")}</span>
                        <span className="text-[9px] font-bold text-accent/60 uppercase">{format(new Date(a.scheduled_start), "dd/MM")}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold tracking-tight text-foreground">{a.customer?.full_name}</span>
                        <span className="text-xs text-muted-foreground">com <span className="font-medium text-foreground/70">{a.professional?.display_name}</span></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-foreground">{brl(Number(a.total_amount))}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col justify-between border-none bg-accent p-6 text-accent-foreground shadow-xl shadow-accent/20">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <h3 className="mt-6 font-display text-2xl font-bold leading-tight">Melhore seu faturamento hoje</h3>
            <p className="mt-2 text-sm text-accent-foreground/80 leading-relaxed">Promova seus serviços e gerencie seus clientes com as ferramentas premium do BarberOS.</p>
          </div>
          <button className="mt-8 rounded-xl bg-white px-6 py-3 text-sm font-bold text-accent shadow-lg shadow-black/10 transition-transform active:scale-95">
            Explorar Recursos
          </button>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, color, to }: any) {
  const navigate = (Route as any).useNavigate();
  return (
    <button
      onClick={() => navigate({ to })}
      className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-border/40 bg-background/50 p-4 transition-all hover:border-accent/40 hover:bg-accent/5 active:scale-95"
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color} text-white shadow-lg shadow-black/10 transition-transform group-hover:scale-110`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
    </button>
  );
}

function KPI({ icon: Icon, label, value, trend, isCurrency, variants }: any) {
  return (
    <motion.div variants={variants}>
      <Card className="group relative overflow-hidden p-6 transition-all hover:shadow-xl hover:shadow-black/5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{label}</span>
            <div className={`font-display font-bold leading-none tracking-tight ${isCurrency ? "text-2xl lg:text-3xl" : "text-4xl"}`}>
              {value}
            </div>
          </div>
          <div className="rounded-xl bg-accent/10 p-2.5 transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-success">
            <ArrowUpRight className="h-3.5 w-3.5" />
            {trend}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
