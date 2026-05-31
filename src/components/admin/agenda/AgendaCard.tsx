import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { brl } from "@/lib/format";
import { Appointment } from "@/services/appointment.service";
import { CheckCircle2, Clock, MoreVertical, Phone, User, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS = {
  scheduled: { label: "Agendado", className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  in_progress: { label: "Em atendimento", className: "bg-warning/10 text-warning border-warning/20 animate-pulse" },
  completed: { label: "Concluído", className: "bg-success/10 text-success border-success/20" },
  cancelled: { label: "Cancelado", className: "bg-muted/50 text-muted-foreground line-through border-transparent" },
  no_show: { label: "Faltou", className: "bg-destructive/10 text-destructive border-destructive/20" },
} as const;

interface AgendaCardProps {
  appointment: Appointment;
  onSetStatus: (id: string, status: any) => void;
  onPay: (appt: Appointment) => void;
}

export function AgendaCard({ appointment, onSetStatus, onPay }: AgendaCardProps) {
  const st = STATUS[appointment.status as keyof typeof STATUS] || STATUS.scheduled;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden p-0">
        <div className={`absolute left-0 top-0 h-full w-1.5 ${st.className.split(' ')[1].replace('text-', 'bg-')}`} />
        
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-start gap-5">
            <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 px-3 py-2 text-center min-w-[70px]">
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                {format(new Date(appointment.scheduled_start), "HH:mm")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {format(new Date(appointment.scheduled_end), "HH:mm")}
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold leading-none tracking-tight">
                  {appointment.customer?.full_name}
                </h3>
                <Badge variant="outline" className={`px-2 py-0 text-[10px] font-bold uppercase ${st.className}`}>
                  {st.label}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-accent" />
                  <span className="font-medium text-foreground/80">{appointment.professional?.display_name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  {brl(Number(appointment.total_amount))}
                </div>
              </div>

              {appointment.customer?.phone && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <Phone className="h-3 w-3" />
                  {appointment.customer.phone}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {appointment.status === "scheduled" && (
              <Button 
                size="sm" 
                className="rounded-xl font-bold transition-all hover:scale-105 active:scale-95" 
                onClick={() => onSetStatus(appointment.id, "in_progress")}
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Iniciar
              </Button>
            )}
            
            {appointment.status === "in_progress" && (
              <Button 
                size="sm" 
                variant="premium"
                className="rounded-xl transition-all hover:scale-105 active:scale-95" 
                onClick={() => onPay(appointment)}
              >
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                Concluir
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-muted/50">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl border-border/40">
                {(appointment.status === "scheduled" || appointment.status === "in_progress") && (
                  <DropdownMenuItem 
                    className="flex items-center gap-2 rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => onSetStatus(appointment.id, "no_show")}
                  >
                    <XCircle className="h-4 w-4" />
                    Registrar Falta
                  </DropdownMenuItem>
                )}
                {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                  <DropdownMenuItem 
                    className="flex items-center gap-2 rounded-lg"
                    onClick={() => onSetStatus(appointment.id, "cancelled")}
                  >
                    <XCircle className="h-4 w-4" />
                    Cancelar Horário
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
