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
      <Card className="group relative overflow-hidden border-none bg-card/50 shadow-xl shadow-black/5 backdrop-blur-md transition-all hover:bg-card/80">
        <div className={`absolute left-0 top-0 h-full w-1.5 ${st.className.split(' ')[1].replace('text-', 'bg-')}`} />
        
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex flex-1 items-start gap-3 sm:gap-5">
            <div className="flex flex-col items-center justify-center rounded-xl bg-accent/10 px-3 py-2 text-center min-w-[65px] sm:min-w-[70px]">
              <span className="font-mono text-lg font-bold tracking-tight text-accent sm:text-xl">
                {format(new Date(appointment.scheduled_start), "HH:mm")}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-accent/60">
                {format(new Date(appointment.scheduled_end), "HH:mm")}
              </span>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="truncate font-display text-base font-bold tracking-tight text-foreground sm:text-lg">
                  {appointment.customer?.full_name}
                </h3>
                <Badge variant="outline" className={`h-5 px-2 py-0 text-[9px] font-black uppercase tracking-tight border-transparent ${st.className}`}>
                  {st.label}
                </Badge>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-accent/60" />
                  <span className="font-bold text-foreground/70">{appointment.professional?.display_name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-accent">
                  {brl(Number(appointment.total_amount))}
                </div>
              </div>

              {appointment.customer?.phone && (
                <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/40">
                  <Phone className="h-2.5 w-2.5" />
                  {appointment.customer.phone}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/20 pt-3 sm:border-none sm:pt-0">
            {appointment.status === "scheduled" && (
              <Button 
                size="sm" 
                className="h-9 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 sm:h-10 sm:px-4" 
                onClick={() => onSetStatus(appointment.id, "in_progress")}
              >
                <Clock className="mr-2 h-4 w-4" />
                Iniciar
              </Button>
            )}
            
            {appointment.status === "in_progress" && (
              <Button 
                size="sm" 
                variant="premium"
                className="h-9 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 sm:h-10 sm:px-4" 
                onClick={() => onPay(appointment)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Concluir
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground/40 hover:bg-muted/50 hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-2xl border-border/40 bg-background/95 backdrop-blur-xl">
                {(appointment.status === "scheduled" || appointment.status === "in_progress") && (
                  <DropdownMenuItem 
                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                    onClick={() => onSetStatus(appointment.id, "no_show")}
                  >
                    <XCircle className="h-4 w-4" />
                    Registrar Falta
                  </DropdownMenuItem>
                )}
                {appointment.status !== "cancelled" && appointment.status !== "completed" && (
                  <DropdownMenuItem 
                    className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium"
                    onClick={() => onSetStatus(appointment.id, "cancelled")}
                  >
                    <XCircle className="h-4 w-4 text-muted-foreground" />
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
