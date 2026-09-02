import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { appointmentService } from "@/services/appointment.service";
import { barbershopService } from "@/services/barbershop.service";
import { customerService } from "@/services/customer.service";
import { CompletePaymentDialog } from "@/components/admin/agenda/CompletePaymentDialog";
import { brl } from "@/lib/format";
import {
  Calendar as Cal,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  XCircle,
  CheckCircle2,
  CalendarClock,
  Smartphone,
  RefreshCcw,
  Search,
  UserPlus,
  Info,
  CalendarOff,
} from "lucide-react";
import { format, addDays, subDays, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/agenda")({
  component: Agenda,
});

const STATUS_MAP = {
  scheduled: { label: "Agendado", className: "border-blue-500/30 bg-blue-500/10 text-blue-400" },
  in_progress: {
    label: "Confirmado",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  },
  completed: {
    label: "Concluído",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  },
  cancelled: {
    label: "Cancelado",
    className: "border-border bg-muted/40 text-muted-foreground line-through",
  },
  no_show: {
    label: "Falta",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
} as const;

function Agenda() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date());
  const [proFilter, setProFilter] = useState("all");
  const [selectedAppt, setSelectedAppt] = useState<any>(null);
  const [payAppt, setPayAppt] = useState<any>(null);
  const [newApptOpen, setNewApptOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  // Queries
  const { data: professionals = [] } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: Boolean(shopId),
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  const { data: services = [] } = useQuery({
    queryKey: ["admin-services", shopId],
    enabled: Boolean(shopId),
    queryFn: () => barbershopService.getServices(shopId!),
  });

  const { data: customersList = [] } = useQuery({
    queryKey: ["admin-customers", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const res = await customerService.getCustomers(shopId!, { limit: 1000 });
      return res.data || [];
    },
  });

  const {
    data: appointments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-agenda", shopId, date.toISOString()],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          *,
          customer:customers(full_name, phone),
          professional:professionals(id, display_name),
          services:appointment_services(service:services(name, price))
        `,
        )
        .eq("barbershop_id", shopId!)
        .gte("scheduled_start", start)
        .lte("scheduled_start", end)
        .order("scheduled_start", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  const { data: timeOffs = [] } = useQuery({
    queryKey: ["admin-timeoffs", shopId, date.toISOString()],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const start = startOfDay(date).toISOString();
      const end = endOfDay(date).toISOString();
      // To get time-offs we need professional ids of this shop
      const proIds = professionals.map((p) => p.id);
      if (proIds.length === 0) return [];

      const { data, error } = await supabase
        .from("time_off")
        .select("*, professional:professionals(display_name)")
        .in("professional_id", proIds)
        .gte("end_at", start)
        .lte("start_at", end);

      if (error) throw error;
      return data || [];
    },
  });

  // Filtered timeline items
  const timelineItems = useMemo(() => {
    let items: any[] = [...appointments];
    if (proFilter !== "all") {
      items = items.filter((a) => a.professional_id === proFilter);
    }

    // Add time-offs as fake items to show in the list
    const filteredTimeOffs = timeOffs.filter(
      (t) => proFilter === "all" || t.professional_id === proFilter,
    );

    const combined = [
      ...items.map((i) => ({
        type: "appointment",
        data: i,
        time: new Date(i.scheduled_start).getTime(),
      })),
      ...filteredTimeOffs.map((t) => ({
        type: "timeoff",
        data: t,
        time: new Date(t.start_at).getTime(),
      })),
    ];

    return combined.sort((a, b) => a.time - b.time);
  }, [appointments, timeOffs, proFilter]);

  // Mutations
  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await appointmentService.updateStatus(id, status as any);
    },
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
      setSelectedAppt(null);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar status."),
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      await appointmentService.updateStatus(id, "cancelled");
    },
    onSuccess: () => {
      toast.success("Agendamento cancelado!");
      refetch();
      setSelectedAppt(null);
    },
    onError: (err: any) => toast.error(err.message || "Erro ao cancelar."),
  });

  if (!shopId)
    return <div className="p-8 text-center text-muted-foreground">Selecione uma barbearia.</div>;

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-[60vh]">
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">
          Não encontramos uma barbearia vinculada à sua conta.
        </h2>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* 1. SCHEDULE HEADER */}
      <div className="flex flex-col gap-4 border-b border-border/40 p-4 shrink-0 bg-card/40 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDate(subDays(date, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col items-center min-w-[120px]">
              <span className="font-semibold text-foreground capitalize">
                {format(date, "EEEE", { locale: ptBR })}
              </span>
              <span className="text-sm text-muted-foreground">
                {format(date, "dd 'de' MMM", { locale: ptBR })}
              </span>
            </div>
            <Button variant="outline" size="icon" onClick={() => setDate(addDays(date, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {!isSameDay(date, new Date()) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDate(new Date())}
                className="hidden sm:flex"
              >
                Hoje
              </Button>
            )}
            <Button
              onClick={() => setNewApptOpen(true)}
              size="sm"
              className="bg-accent text-accent-foreground font-bold"
            >
              <CalendarClock className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Novo Agendamento</span>
              <span className="sm:hidden">Novo</span>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={proFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setProFilter("all")}
            className="rounded-full shrink-0"
          >
            Todos
          </Button>
          {professionals.map((p) => (
            <Button
              key={p.id}
              variant={proFilter === p.id ? "default" : "outline"}
              size="sm"
              onClick={() => setProFilter(p.id)}
              className="rounded-full shrink-0"
            >
              {p.display_name}
            </Button>
          ))}
        </div>
      </div>

      {/* 2. DAY VIEW */}
      <ScrollArea className="flex-1 bg-background/50">
        <div className="max-w-4xl mx-auto p-4 space-y-3 pb-24">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-20 animate-pulse bg-muted/30" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-10 text-center gap-4">
              <span className="text-muted-foreground">Erro ao carregar a agenda.</span>
              <Button onClick={() => refetch()} variant="outline">
                <RefreshCcw className="h-4 w-4 mr-2" /> Tentar novamente
              </Button>
            </div>
          ) : timelineItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center text-muted-foreground border border-dashed rounded-xl border-border/50">
              <Cal className="h-10 w-10 mb-3 opacity-20" />
              <p className="font-semibold text-foreground">Nenhum agendamento neste período.</p>
              <p className="text-sm">Aproveite para criar novos agendamentos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timelineItems.map((item, i) => {
                if (item.type === "timeoff") {
                  const t = item.data;
                  return (
                    <div
                      key={`timeoff-${t.id}`}
                      className="flex items-center gap-4 p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-destructive/80 opacity-70"
                    >
                      <CalendarOff className="h-5 w-5 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">
                          {format(new Date(t.start_at), "HH:mm")} -{" "}
                          {format(new Date(t.end_at), "HH:mm")}
                        </span>
                        <span className="text-xs">
                          {t.professional?.display_name} • Profissional indisponível
                        </span>
                        {t.reason && <span className="text-xs italic">Motivo: {t.reason}</span>}
                      </div>
                    </div>
                  );
                }

                const a = item.data;
                const st = STATUS_MAP[a.status as keyof typeof STATUS_MAP] || STATUS_MAP.scheduled;
                const serviceNames = Array.isArray(a.services)
                  ? a.services
                      .map((s: any) => s.service?.name)
                      .filter(Boolean)
                      .join(", ")
                  : "Serviço";
                const isPast = new Date(a.scheduled_end) < new Date() && a.status === "scheduled";

                return (
                  <Card
                    key={a.id}
                    onClick={() => setSelectedAppt(a)}
                    className={`flex items-stretch overflow-hidden cursor-pointer transition-all hover:border-accent group ${isPast ? "opacity-70 grayscale" : ""}`}
                  >
                    {/* Time Column */}
                    <div className="w-[70px] shrink-0 bg-muted/40 border-r border-border/40 flex flex-col items-center justify-center py-3">
                      <span className="font-bold text-foreground">
                        {format(new Date(a.scheduled_start), "HH:mm")}
                      </span>
                    </div>

                    {/* Details Column */}
                    <div className="flex-1 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden">
                      <div className="flex flex-col truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground truncate">
                            {a.customer?.full_name || "Cliente Avulso"}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] uppercase font-bold shrink-0 ${st.className}`}
                          >
                            {st.label}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-1">
                          <Scissors className="h-3 w-3" /> {serviceNames}
                        </span>
                        <span className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <User className="h-3 w-3" />{" "}
                          {a.professional?.display_name || "Qualquer barbeiro"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end sm:flex-col sm:items-end shrink-0 gap-2">
                        <span className="font-mono font-bold text-accent text-sm">
                          {brl(Number(a.total_amount || 0))}
                        </span>
                        {a.status === "scheduled" && !isPast && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMut.mutate({ id: a.id, status: "in_progress" });
                            }}
                            className="h-7 text-xs bg-accent text-accent-foreground"
                          >
                            Confirmar
                          </Button>
                        )}
                        {a.status === "in_progress" && (
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPayAppt(a);
                            }}
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 3. APPOINTMENT DETAILS DRAWER */}
      <Drawer
        open={!!selectedAppt && !rescheduleOpen}
        onOpenChange={(o) => !o && setSelectedAppt(null)}
      >
        <DrawerContent className="max-h-[85vh]">
          {selectedAppt && (
            <div className="max-w-md mx-auto w-full flex flex-col">
              <DrawerHeader className="text-left">
                <DrawerTitle className="text-xl">
                  {selectedAppt.customer?.full_name || "Cliente Avulso"}
                </DrawerTitle>
                <DrawerDescription className="flex flex-col gap-1 mt-1">
                  {selectedAppt.customer?.phone && (
                    <span className="flex items-center gap-1 text-sm">
                      <Smartphone className="h-3 w-3" /> {selectedAppt.customer.phone}
                    </span>
                  )}
                </DrawerDescription>
              </DrawerHeader>

              <div className="p-4 space-y-4 overflow-y-auto">
                <div className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl border border-border/40">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Data/Hora</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(selectedAppt.scheduled_start), "dd/MM/yyyy HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Profissional</span>
                    <span className="font-semibold text-foreground">
                      {selectedAppt.professional?.display_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Status atual</span>
                    <Badge
                      variant="outline"
                      className={
                        (
                          STATUS_MAP[selectedAppt.status as keyof typeof STATUS_MAP] ||
                          STATUS_MAP.scheduled
                        ).className
                      }
                    >
                      {
                        (
                          STATUS_MAP[selectedAppt.status as keyof typeof STATUS_MAP] ||
                          STATUS_MAP.scheduled
                        ).label
                      }
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Serviços
                  </h4>
                  {Array.isArray(selectedAppt.services) &&
                    selectedAppt.services.map((s: any, i: number) => (
                      <div
                        key={i}
                        className="flex justify-between items-center text-sm p-2 bg-card rounded-lg border border-border/40"
                      >
                        <span>{s.service?.name}</span>
                        <span className="font-mono">
                          {brl(Number(s.price || s.service?.price || 0))}
                        </span>
                      </div>
                    ))}
                  <div className="flex justify-between items-center p-2 font-bold text-accent text-lg border-t border-border mt-2">
                    <span>Total</span>
                    <span>{brl(Number(selectedAppt.total_amount || 0))}</span>
                  </div>
                </div>

                {selectedAppt.notes && (
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                      Observações
                    </h4>
                    <p className="text-sm bg-accent/5 p-3 rounded-xl border border-accent/20 text-accent-foreground/80 italic">
                      "{selectedAppt.notes}"
                    </p>
                  </div>
                )}
              </div>

              <DrawerFooter className="flex-row flex-wrap gap-2 pt-2 border-t border-border/40">
                {selectedAppt.status === "scheduled" && (
                  <Button
                    className="flex-1 bg-accent text-accent-foreground"
                    onClick={() =>
                      updateStatusMut.mutate({ id: selectedAppt.id, status: "in_progress" })
                    }
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Confirmar
                  </Button>
                )}

                {selectedAppt.status === "in_progress" && (
                  <Button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={() => {
                      setPayAppt(selectedAppt);
                      setSelectedAppt(null);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Concluir
                  </Button>
                )}

                {(selectedAppt.status === "scheduled" || selectedAppt.status === "in_progress") && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setRescheduleOpen(true)}
                  >
                    <Clock className="h-4 w-4 mr-2" /> Remarcar
                  </Button>
                )}

                {selectedAppt.status !== "completed" && selectedAppt.status !== "cancelled" && (
                  <Button
                    variant="outline"
                    className="flex-none text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                    onClick={() => {
                      if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
                        cancelMut.mutate(selectedAppt.id);
                      }
                    }}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                )}
              </DrawerFooter>
            </div>
          )}
        </DrawerContent>
      </Drawer>

      {/* 4. NEW APPOINTMENT FORM */}
      <NewAppointmentDrawer
        open={newApptOpen}
        onClose={() => setNewApptOpen(false)}
        shopId={shopId}
        services={services}
        professionals={professionals}
        customers={customersList}
        onSuccess={() => {
          refetch();
          toast.success("Agendamento criado com sucesso!");
        }}
      />

      {/* 5. RESCHEDULE DIALOG */}
      <RescheduleDialog
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        appt={selectedAppt}
        shopId={shopId}
        onSuccess={() => {
          refetch();
          toast.success("Agendamento remarcado com sucesso!");
          setSelectedAppt(null);
        }}
      />

      {/* PAYMENT/COMPLETE DIALOG */}
      <CompletePaymentDialog
        appt={payAppt}
        onClose={() => setPayAppt(null)}
        userId={user?.id}
        onDone={() => {
          refetch();
          setPayAppt(null);
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// INTERNAL COMPONENTS
// -----------------------------------------------------------------------------

function NewAppointmentDrawer({
  open,
  onClose,
  shopId,
  services,
  professionals,
  customers,
  onSuccess,
}: any) {
  const { user } = useAuth();

  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [timeStr, setTimeStr] = useState("");
  const [proId, setProId] = useState("");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  // Customer selection
  const [custId, setCustId] = useState<string>("new");
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  const totalDuration = selectedServices.reduce((acc, sid) => {
    const s = services.find((x: any) => x.id === sid);
    return acc + Number(s?.duration_min ?? 30);
  }, 0);

  const totalPrice = selectedServices.reduce((acc, sid) => {
    const s = services.find((x: any) => x.id === sid);
    return acc + Number(s?.price ?? 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!timeStr || selectedServices.length === 0 || !proId) {
      return toast.error("Preencha todos os campos obrigatórios.");
    }
    if (custId === "new" && !custName) {
      return toast.error("Nome do cliente é obrigatório.");
    }

    setLoading(true);
    try {
      const startsAt = new Date(`${dateStr}T${timeStr}:00`);

      await appointmentService.createAppointment({
        barbershopId: shopId,
        professionalId: proId,
        startsAt,
        services: services.filter((s: any) => selectedServices.includes(s.id)),
        customerId: custId === "new" ? undefined : custId,
        customerData: {
          name: custName,
          phone: custPhone,
        },
        userId: user?.id,
        notes,
        source: "admin",
      });

      onSuccess();
      onClose();

      // Reset form
      setCustId("new");
      setCustName("");
      setCustPhone("");
      setTimeStr("");
      setSelectedServices([]);
      setNotes("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <div className="max-w-lg mx-auto w-full flex flex-col h-full overflow-hidden">
          <DrawerHeader className="text-left border-b border-border/40 shrink-0">
            <DrawerTitle>Novo Agendamento</DrawerTitle>
            <DrawerDescription>Preencha os dados abaixo para agendar.</DrawerDescription>
          </DrawerHeader>

          <ScrollArea className="flex-1 p-4">
            <form id="new-appt-form" onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-3 p-3 bg-muted/20 border border-border/40 rounded-xl">
                <Label className="text-accent font-semibold">Cliente</Label>
                <Select value={custId} onValueChange={setCustId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new" className="font-bold text-accent">
                      + Novo Cliente Avulso
                    </SelectItem>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.full_name} {c.phone ? `(${c.phone})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {custId === "new" && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Input
                      placeholder="Nome completo"
                      value={custName}
                      onChange={(e) => setCustName(e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Telefone"
                      value={custPhone}
                      onChange={(e) => setCustPhone(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label>Serviços</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center space-x-2 border border-border/40 p-3 rounded-xl bg-card"
                    >
                      <Checkbox
                        id={`s-${s.id}`}
                        checked={selectedServices.includes(s.id)}
                        onCheckedChange={(c) => {
                          if (c) setSelectedServices((prev) => [...prev, s.id]);
                          else setSelectedServices((prev) => prev.filter((id) => id !== s.id));
                        }}
                      />
                      <label
                        htmlFor={`s-${s.id}`}
                        className="text-sm flex-1 cursor-pointer select-none font-medium"
                      >
                        {s.name}{" "}
                        <span className="text-muted-foreground block text-xs">
                          {brl(Number(s.price))} • {s.duration_min} min
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Profissional</Label>
                <Select value={proId} onValueChange={setProId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {professionals.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observação (Opcional)</Label>
                <Textarea
                  placeholder="Detalhes do agendamento..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </form>
          </ScrollArea>

          <DrawerFooter className="border-t border-border/40 shrink-0 bg-background pt-3 flex-row items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Total</span>
              <span className="font-bold font-mono text-lg text-accent">{brl(totalPrice)}</span>
              <span className="text-[10px] text-muted-foreground">{totalDuration} minutos</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                type="submit"
                form="new-appt-form"
                disabled={loading}
                className="bg-accent text-accent-foreground font-bold"
              >
                {loading ? "Salvando..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// -----------------------------------------------------------------------------

function RescheduleDialog({ open, onClose, appt, shopId, onSuccess }: any) {
  const [dateStr, setDateStr] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appt && open) {
      const d = new Date(appt.scheduled_start);
      setDateStr(format(d, "yyyy-MM-dd"));
      setTimeStr(format(d, "HH:mm"));
    }
  }, [appt, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!appt) return;

    setLoading(true);
    try {
      const startsAt = new Date(`${dateStr}T${timeStr}:00`);

      // Calculate duration
      const totalDuration = Array.isArray(appt.services)
        ? appt.services.reduce((acc: number, s: any) => acc + Number(s.duration_snapshot ?? 30), 0)
        : 30;

      const endsAt = new Date(startsAt.getTime() + totalDuration * 60000);

      // Check availability
      const isAvailable = await appointmentService.checkSlotAvailable({
        barbershopId: shopId,
        professionalId: appt.professional_id,
        start: startsAt,
        end: endsAt,
        excludeAppointmentId: appt.id,
      });

      if (!isAvailable) {
        throw new Error(
          "O horário selecionado já está reservado ou o profissional está indisponível.",
        );
      }

      // Update
      const { error } = await supabase
        .from("appointments")
        .update({
          scheduled_start: startsAt.toISOString(),
          scheduled_end: endsAt.toISOString(),
        })
        .eq("id", appt.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remarcar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remarcar Agendamento</DialogTitle>
          <DialogDescription>
            Escolha a nova data e horário para o atendimento de {appt?.customer?.full_name}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Horário</Label>
              <Input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-accent text-accent-foreground">
              {loading ? "Verificando..." : "Salvar Alteração"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
