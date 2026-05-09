import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { brl, DEMO_BARBERSHOP_ID } from "@/lib/format";
import { addDays, format, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as Cal } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/agenda")({ component: Agenda });

const STATUS = {
  scheduled: { label: "Agendado", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  in_progress: { label: "Em atendimento", className: "bg-warning/15 text-warning" },
  completed: { label: "Concluído", className: "bg-success/15 text-success" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground line-through" },
  no_show: { label: "Faltou", className: "bg-destructive/15 text-destructive" },
} as const;

function Agenda() {
  const [date, setDate] = useState(new Date());
  const { data, refetch } = useQuery({
    queryKey: ["agenda", date.toISOString().slice(0,10)],
    queryFn: async () => (await supabase.from("appointments")
      .select("*, professional:professionals(display_name), customer:customers(full_name, phone)")
      .eq("barbershop_id", DEMO_BARBERSHOP_ID)
      .gte("scheduled_start", startOfDay(date).toISOString())
      .lte("scheduled_start", endOfDay(date).toISOString())
      .order("scheduled_start")).data ?? [],
  });

  async function setStatus(id: string, status: string) {
    const { error } = await supabase.from("appointments").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Status atualizado");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">{format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={()=>setDate(d=>addDays(d,-1))}><ChevronLeft className="h-4 w-4"/></Button>
          <Button variant="outline" onClick={()=>setDate(new Date())}>Hoje</Button>
          <Button variant="outline" size="icon" onClick={()=>setDate(d=>addDays(d,1))}><ChevronRight className="h-4 w-4"/></Button>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <Cal className="h-10 w-10 text-muted-foreground"/>
          <p className="mt-3 text-sm text-muted-foreground">Nenhum agendamento para este dia.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {data.map((a: any) => {
            const st = STATUS[a.status as keyof typeof STATUS];
            return (
              <Card key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="font-display text-2xl font-bold">{format(new Date(a.scheduled_start),"HH:mm")}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(a.scheduled_end),"HH:mm")}</div>
                  </div>
                  <div>
                    <div className="font-medium">{a.customer?.full_name}</div>
                    <div className="text-sm text-muted-foreground">com {a.professional?.display_name} · {brl(Number(a.total_amount))}</div>
                    {a.customer?.phone && <div className="text-xs text-muted-foreground">{a.customer.phone}</div>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={st.className} variant="outline">{st.label}</Badge>
                  {a.status === "scheduled" && <Button size="sm" variant="outline" onClick={()=>setStatus(a.id,"in_progress")}>Iniciar</Button>}
                  {a.status === "in_progress" && <Button size="sm" onClick={()=>setStatus(a.id,"completed")}>Concluir</Button>}
                  {(a.status==="scheduled"||a.status==="in_progress") && <Button size="sm" variant="ghost" onClick={()=>setStatus(a.id,"no_show")}>Faltou</Button>}
                  {a.status!=="cancelled" && <Button size="sm" variant="ghost" onClick={()=>setStatus(a.id,"cancelled")}>Cancelar</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
