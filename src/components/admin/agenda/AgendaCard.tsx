import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { brl } from "@/lib/format";
import { Appointment } from "@/services/appointment.service";

const STATUS = {
  scheduled: { label: "Agendado", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  in_progress: { label: "Em atendimento", className: "bg-warning/15 text-warning" },
  completed: { label: "Concluído", className: "bg-success/15 text-success" },
  cancelled: { label: "Cancelado", className: "bg-muted text-muted-foreground line-through" },
  no_show: { label: "Faltou", className: "bg-destructive/15 text-destructive" },
} as const;

interface AgendaCardProps {
  appointment: Appointment;
  onSetStatus: (id: string, status: any) => void;
  onPay: (appt: Appointment) => void;
}

export function AgendaCard({ appointment, onSetStatus, onPay }: AgendaCardProps) {
  const st = STATUS[appointment.status as keyof typeof STATUS] || STATUS.scheduled;

  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="font-display text-2xl font-bold">{format(new Date(appointment.scheduled_start), "HH:mm")}</div>
          <div className="text-xs text-muted-foreground">{format(new Date(appointment.scheduled_end), "HH:mm")}</div>
        </div>
        <div>
          <div className="font-medium">{appointment.customer?.full_name}</div>
          <div className="text-sm text-muted-foreground">
            com {appointment.professional?.display_name} · {brl(Number(appointment.total_amount))}
          </div>
          {appointment.customer?.phone && <div className="text-xs text-muted-foreground">{appointment.customer.phone}</div>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={st.className} variant="outline">
          {st.label}
        </Badge>
        {appointment.status === "scheduled" && (
          <Button size="sm" variant="outline" onClick={() => onSetStatus(appointment.id, "in_progress")}>
            Iniciar
          </Button>
        )}
        {appointment.status === "in_progress" && (
          <Button size="sm" onClick={() => onPay(appointment)}>
            Concluir e cobrar
          </Button>
        )}
        {(appointment.status === "scheduled" || appointment.status === "in_progress") && (
          <Button size="sm" variant="ghost" onClick={() => onSetStatus(appointment.id, "no_show")}>
            Faltou
          </Button>
        )}
        {appointment.status !== "cancelled" && appointment.status !== "completed" && (
          <Button size="sm" variant="ghost" onClick={() => onSetStatus(appointment.id, "cancelled")}>
            Cancelar
          </Button>
        )}
      </div>
    </Card>
  );
}
