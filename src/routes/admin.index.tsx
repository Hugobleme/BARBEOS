import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { brl } from "@/lib/format";
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react";
import { startOfDay, endOfDay, format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const shopId = useCurrentShopId();
  const today = new Date();
  const { data: stats } = useQuery({
    queryKey: ["admin-stats", shopId], enabled: !!shopId,
    queryFn: async () => {
      const start = startOfDay(today).toISOString();
      const end = endOfDay(today).toISOString();
      const { data: appts } = await supabase.from("appointments").select("*").eq("barbershop_id", shopId).gte("scheduled_start", start).lte("scheduled_start", end);
      const { count: customers } = await supabase.from("customers").select("*", { count: "exact", head: true }).eq("barbershop_id", shopId);
      const revenue = (appts ?? []).filter(a=>a.status==="completed").reduce((a,b)=>a+Number(b.total_amount),0);
      return { count: appts?.length ?? 0, completed: (appts ?? []).filter(a=>a.status==="completed").length, revenue, customers: customers ?? 0 };
    },
  });
  const { data: next } = useQuery({
    queryKey: ["admin-next", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("appointments")
      .select("*, professional:professionals(display_name), customer:customers(full_name)")
      .eq("barbershop_id", shopId)
      .gte("scheduled_start", new Date().toISOString())
      .order("scheduled_start").limit(8)).data ?? [],
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">{format(today, "EEEE, d 'de' MMMM", { locale: ptBR })}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPI icon={Calendar} label="Agendamentos hoje" value={stats?.count ?? 0} />
        <KPI icon={TrendingUp} label="Atendimentos concluídos" value={stats?.completed ?? 0} />
        <KPI icon={DollarSign} label="Faturamento do dia" value={brl(stats?.revenue ?? 0)} />
        <KPI icon={Users} label="Total de clientes" value={stats?.customers ?? 0} />
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">Próximos agendamentos</h2>
        {(!next || next.length === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum agendamento futuro.</p>
        ) : (
          <ul className="divide-y divide-border">
            {next.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-muted-foreground">{format(new Date(a.scheduled_start), "dd/MM HH:mm")}</span>
                  <span className="font-medium">{a.customer?.full_name}</span>
                  <span className="text-muted-foreground">com {a.professional?.display_name}</span>
                </div>
                <span className="text-muted-foreground">{brl(Number(a.total_amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function KPI({ icon: Icon, label, value }: any) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="mt-2 font-display text-3xl font-semibold">{value}</div>
    </Card>
  );
}
