import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { addDays, format, startOfWeek, endOfWeek, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as Cal,
  List,
  LayoutGrid,
  Search,
  Building2,
  Clock,
  User,
  Phone,
  Scissors,
  CheckCircle2,
  XCircle,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/queries/useAppointments";
import { barbershopService } from "@/services/barbershop.service";
import { cashService } from "@/services/cash.service";
import { customerService } from "@/services/customer.service";
import { CompletePaymentDialog } from "@/components/admin/agenda/CompletePaymentDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl, minutes } from "@/lib/format";

export const Route = createFileRoute("/admin/agenda")({
  component: Agenda,
});

const STATUS_MAP = {
  scheduled: { label: "Agendado", className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  in_progress: { label: "Em atendimento", className: "border-amber-500/30 bg-amber-500/10 text-amber-400 animate-pulse" },
  completed: { label: "Concluído", className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelado", className: "border-border bg-muted/40 text-muted-foreground line-through" },
  no_show: { label: "Faltou (No-Show)", className: "border-destructive/30 bg-destructive/10 text-destructive" },
} as const;

function Agenda() {
  const { shopId, shops, setShopId } = useCurrentShop();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const [payAppt, setPayAppt] = useState<any>(null);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [proFilter, setProFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: professionals } = useQuery({
    queryKey: ["professionals", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  const { data: appointments, isLoading, refetch, updateStatus } = useAppointments(shopId, date, {
    status: statusFilter,
    professionalId: proFilter,
    source: sourceFilter,
    q: search,
  });

  // Realtime updates
  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`agenda:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `barbershop_id=eq.${shopId}` },
        () => refetch()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, refetch]);

  async function handleSetStatus(id: string, status: any) {
    try {
      await updateStatus({ id, status });

      if (status === "no_show") {
        const appt = appointments?.find((a) => a.id === id);
        if (appt?.customer_id) {
          const nextCount = await customerService.incrementNoShow(appt.customer_id);
          toast.warning(`Falta registrada para o cliente (${nextCount} faltas no total).`);
        }
      } else {
        toast.success("Status do agendamento atualizado!");
      }
      setSelectedAppt(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status.");
    }
  }

  // Dias da semana para visão semanal
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      {/* Topo / Título & Navegação de Datas */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Agenda</h1>
            <p className="text-sm text-muted-foreground">
              {format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
            </p>
          </div>
          {shops.length > 1 && (
            <div className="flex items-center gap-2 border border-border bg-card/60 px-3 py-1.5 backdrop-blur-md">
              <Building2 className="h-4 w-4 text-accent" />
              <Select value={shopId ?? undefined} onValueChange={setShopId}>
                <SelectTrigger className="h-7 w-[160px] border-none bg-transparent p-0 text-xs font-bold focus:ring-0">
                  <SelectValue placeholder="Barbearia" />
                </SelectTrigger>
                <SelectContent className="border-border">
                  {shops.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="rounded-none border border-border bg-card/40">
              <TabsTrigger value="day" className="rounded-none text-xs uppercase tracking-wider">
                <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Dia
              </TabsTrigger>
              <TabsTrigger value="week" className="rounded-none text-xs uppercase tracking-wider">
                <Cal className="mr-1.5 h-3.5 w-3.5" /> Semana
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="rounded-none h-9 w-9 border-border"
              onClick={() => setDate((d) => addDays(d, viewMode === "week" ? -7 : -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none h-9 text-xs uppercase font-bold"
              onClick={() => setDate(new Date())}
            >
              Hoje
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-none h-9 w-9 border-border"
              onClick={() => setDate((d) => addDays(d, viewMode === "week" ? 7 : 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Visão de Semana (Seletor rápido de dias) */}
      {viewMode === "week" && (
        <div className="grid grid-cols-7 gap-2 border border-border/80 bg-card/40 p-3">
          {weekDays.map((d, idx) => {
            const isSelected = isSameDay(d, date);
            const isToday = isSameDay(d, new Date());

            return (
              <button
                key={idx}
                onClick={() => setDate(d)}
                className={`flex flex-col items-center justify-center p-3 text-center transition-all ${
                  isSelected
                    ? "border border-accent bg-accent/15 text-accent font-bold"
                    : isToday
                    ? "border border-border bg-background text-foreground"
                    : "hover:bg-card/80 text-muted-foreground"
                }`}
              >
                <span className="text-[10px] uppercase tracking-widest">{format(d, "EEE", { locale: ptBR })}</span>
                <span className="font-serif text-lg font-bold">{format(d, "dd")}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-wrap items-center gap-3 border border-border/60 bg-card/40 p-4 backdrop-blur-md">
        <div className="relative min-w-[240px] flex-[2]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-none border-border bg-background/50 pl-9 text-xs"
            placeholder="Buscar por cliente ou telefone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="min-w-[150px] flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 rounded-none border-border bg-background/50 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="scheduled">Agendados</SelectItem>
              <SelectItem value="in_progress">Em atendimento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
              <SelectItem value="no_show">Faltas (No-Show)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[150px] flex-1">
          <Select value={proFilter} onValueChange={setProFilter}>
            <SelectTrigger className="h-10 rounded-none border-border bg-background/50 text-xs">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Todos profissionais</SelectItem>
              {professionals?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modal / Dialog de Detalhes do Agendamento */}
      <Dialog open={!!selectedAppt} onOpenChange={(open) => !open && setSelectedAppt(null)}>
        <DialogContent className="rounded-none border-border sm:max-w-lg p-6">
          {selectedAppt && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="font-serif text-2xl font-bold">
                      Detalhes do Agendamento
                    </DialogTitle>
                    <DialogDescription className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 text-accent" />
                      {format(new Date(selectedAppt.scheduled_start), "HH:mm")} às{" "}
                      {format(new Date(selectedAppt.scheduled_end), "HH:mm")} ·{" "}
                      {format(new Date(selectedAppt.scheduled_start), "dd 'de' MMMM", { locale: ptBR })}
                    </DialogDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className={`rounded-none text-[10px] uppercase font-bold ${
                      STATUS_MAP[selectedAppt.status as keyof typeof STATUS_MAP]?.className
                    }`}
                  >
                    {STATUS_MAP[selectedAppt.status as keyof typeof STATUS_MAP]?.label || selectedAppt.status}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4 text-xs">
                {/* Cliente */}
                <div className="border border-border/60 bg-card/40 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Cliente
                  </span>
                  <div className="font-bold text-sm text-foreground">
                    {selectedAppt.customer?.full_name || "Cliente não informado"}
                  </div>
                  {selectedAppt.customer?.phone && (
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Phone className="h-3 w-3 text-accent" /> {selectedAppt.customer.phone}
                    </div>
                  )}
                </div>

                {/* Profissional e Valor */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-border/60 bg-card/40 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Profissional
                    </span>
                    <div className="font-bold text-sm text-foreground">
                      {selectedAppt.professional?.display_name || "Qualquer disponível"}
                    </div>
                  </div>

                  <div className="border border-border/60 bg-card/40 p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Valor Total
                    </span>
                    <div className="font-serif text-lg font-bold text-accent">
                      {brl(Number(selectedAppt.total_amount || 0))}
                    </div>
                  </div>
                </div>

                {/* Serviços Solicitados */}
                {selectedAppt.services && selectedAppt.services.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Serviços Contratados
                    </span>
                    <div className="divide-y divide-border/20 border border-border/60 bg-card/40">
                      {selectedAppt.services.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3">
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground">{item.service?.name}</span>
                            <div className="text-[10px] text-muted-foreground">
                              {minutes(item.duration_snapshot || item.service?.duration_min || 30)}
                            </div>
                          </div>
                          <span className="font-mono font-bold text-accent">
                            {brl(Number(item.price_snapshot || item.service?.price || 0))}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAppt.notes && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Observações
                    </span>
                    <p className="border border-border/40 bg-card/20 p-3 italic text-muted-foreground">
                      "{selectedAppt.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Ações Rápidas de Mudança de Status */}
              <div className="flex flex-wrap gap-2 border-t border-border/40 pt-4">
                {selectedAppt.status === "scheduled" && (
                  <Button
                    size="sm"
                    className="flex-1 rounded-none bg-accent text-accent-foreground"
                    onClick={() => handleSetStatus(selectedAppt.id, "in_progress")}
                  >
                    <Clock className="mr-1.5 h-3.5 w-3.5" /> Iniciar Atendimento
                  </Button>
                )}

                {selectedAppt.status === "in_progress" && (
                  <Button
                    size="sm"
                    className="flex-1 rounded-none bg-emerald-600 text-white hover:bg-emerald-700"
                    onClick={() => {
                      const cur = selectedAppt;
                      setSelectedAppt(null);
                      setPayAppt(cur);
                    }}
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Finalizar & Cobrar
                  </Button>
                )}

                {selectedAppt.status !== "completed" && selectedAppt.status !== "cancelled" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none text-destructive hover:bg-destructive hover:text-destructive-foreground text-xs"
                    onClick={() => handleSetStatus(selectedAppt.id, "no_show")}
                  >
                    Registrar Falta
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Lista de Agendamentos do Dia */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-24 animate-pulse rounded-none border border-border bg-muted/30" />
          ))}
        </div>
      ) : !appointments || appointments.length === 0 ? (
        <Card className="grid place-items-center rounded-none border border-border p-16 text-center">
          <Cal className="h-10 w-10 text-muted-foreground/40" />
          <h3 className="mt-3 font-serif text-lg font-bold">Nenhum agendamento para este dia</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Novos agendamentos feitos online ou no balcão aparecerão aqui em tempo real.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const st = STATUS_MAP[a.status as keyof typeof STATUS_MAP] || STATUS_MAP.scheduled;

            return (
              <Card
                key={a.id}
                onClick={() => setSelectedAppt(a)}
                className="group relative flex cursor-pointer flex-col justify-between rounded-none border border-border bg-card/50 p-5 backdrop-blur-md transition-all hover:border-accent hover:bg-card sm:flex-row sm:items-center"
              >
                <div className="flex items-start gap-4">
                  {/* Horário */}
                  <div className="flex min-w-[68px] flex-col items-center justify-center border border-accent/30 bg-accent/10 px-3 py-2 text-center">
                    <span className="font-mono text-lg font-bold text-accent">
                      {format(new Date(a.scheduled_start), "HH:mm")}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      {format(new Date(a.scheduled_end), "HH:mm")}
                    </span>
                  </div>

                  {/* Informações do Cliente e Profissional */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg font-bold text-foreground transition-colors group-hover:text-accent">
                        {a.customer?.full_name || "Cliente Avulso"}
                      </h3>
                      <Badge variant="outline" className={`rounded-none text-[9px] font-bold uppercase ${st.className}`}>
                        {st.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-accent" /> {a.professional?.display_name || "Qualquer barbeiro"}
                      </span>
                      <span className="font-bold text-accent">{brl(Number(a.total_amount || 0))}</span>
                      {a.customer?.phone && (
                        <span className="flex items-center gap-1 text-[10px]">
                          <Phone className="h-2.5 w-2.5" /> {a.customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões de Ação Rápida */}
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border/20 pt-3 sm:mt-0 sm:border-none sm:pt-0">
                  {a.status === "scheduled" && (
                    <Button
                      size="sm"
                      className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSetStatus(a.id, "in_progress");
                      }}
                    >
                      <Clock className="mr-1.5 h-3.5 w-3.5" /> Iniciar
                    </Button>
                  )}

                  {a.status === "in_progress" && (
                    <Button
                      size="sm"
                      className="rounded-none bg-emerald-600 text-white hover:bg-emerald-700 text-xs uppercase font-bold tracking-wider"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPayAppt(a);
                      }}
                    >
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Cobrar
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-none text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedAppt(a);
                    }}
                  >
                    Detalhes
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal de Finalização de Pagamento */}
      <CompletePaymentDialog
        appt={payAppt}
        onClose={() => setPayAppt(null)}
        userId={user?.id}
        onDone={refetch}
      />
    </div>
  );
}
