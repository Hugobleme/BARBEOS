import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar as Cal, List, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAppointments } from "@/hooks/queries/useAppointments";
import { appointmentService } from "@/services/appointment.service";
import { barbershopService } from "@/services/barbershop.service";
import { cashService } from "@/services/cash.service";
import { customerService } from "@/services/customer.service";
import { AgendaCard } from "@/components/admin/agenda/AgendaCard";
import { CompletePaymentDialog } from "@/components/admin/agenda/CompletePaymentDialog";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export const Route = createFileRoute("/admin/agenda")({
  loader: async ({ context: { queryClient } }) => {
    // Prefetch agenda data if we have a shopId in context or similar
    // Since shopId is dynamic from hooks, we mainly rely on preloading when navigating
  },
  component: Agenda,
});

function Agenda() {
  const shopId = useCurrentShopId();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [payAppt, setPayAppt] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [proFilter, setProFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [search, setSearch] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const { data: professionals } = useQuery({
    queryKey: ["professionals", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data } = await supabase.from("professionals").select("id, display_name").eq("barbershop_id", shopId);
      return data ?? [];
    },
  });

  const { data: appointments, isLoading, refetch, updateStatus } = useAppointments(shopId, date, {
    status: statusFilter,
    professionalId: proFilter,
    source: sourceFilter,
    q: search,
  });

  const rowVirtualizer = useVirtualizer({
    count: appointments?.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110,
    overscan: 5,
  });


  // Realtime: updates agenda when appointments change for this barbershop
  useEffect(() => {
    if (!shopId) return;
    const channel = supabase
      .channel(`agenda:${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments", filter: `barbershop_id=eq.${shopId}` },
        () => refetch(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [shopId, refetch]);

  async function setStatus(id: string, status: any) {
    try {
      await updateStatus({ id, status });

      if (status === "no_show") {
        const appt = appointments?.find((a) => a.id === id);
        if (appt?.customer_id) {
          const nextCount = await customerService.incrementNoShow(appt.customer_id);
          
          const settings = await barbershopService.getSettings(shopId!) as any;
          const policy = settings?.policy ?? {};
          const fee = Number(policy.no_show_fee ?? 0);
          const maxNs = Number(policy.max_no_shows ?? 0);

          if (fee > 0) {
            const openS = await cashService.getOpenSession(shopId!);
            if (openS?.id) {
              await cashService.createTransaction({
                barbershop_id: shopId!,
                session_id: openS.id,
                appointment_id: id,
                customer_id: appt.customer_id,
                kind: "fee",
                method: "other",
                amount: fee,
                description: `Taxa de no-show — ${appt.customer?.full_name ?? ""}`.trim(),
                created_by: user?.id ?? "",
              });
            }
          }

          if (maxNs > 0 && nextCount >= maxNs) {
            await customerService.blockCustomer(appt.customer_id);
            toast.warning(`Cliente atingiu ${nextCount} faltas e foi bloqueado.`);
          } else {
            toast.success(`Falta registrada (${nextCount}).`);
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar status");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Agenda</h1>
          <p className="text-muted-foreground">{format(date, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Tabs defaultValue="day" className="mr-2">
            <TabsList>
              <TabsTrigger value="day"><LayoutGrid className="mr-2 h-4 w-4" />Dia</TabsTrigger>
              <TabsTrigger value="list" onClick={() => toast.info("Em breve: Visão geral de todos agendamentos")}><List className="mr-2 h-4 w-4" />Lista</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setDate(d => addDays(d, -1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={() => setDate(new Date())}>Hoje</Button>
            <Button variant="outline" size="icon" onClick={() => setDate(d => addDays(d, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-card/50 p-4 rounded-xl border border-border/40 backdrop-blur-md">
        <div className="relative flex-[2] min-w-[250px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60"/>
          <Input 
            className="pl-9 h-11 bg-background/50 border-border/40 rounded-xl" 
            placeholder="Buscar por nome ou telefone..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="scheduled">Agendados</SelectItem>
              <SelectItem value="in_progress">Em atendimento</SelectItem>
              <SelectItem value="completed">Concluídos</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
              <SelectItem value="no_show">Não compareceu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <Select value={proFilter} onValueChange={setProFilter}>
            <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl">
              <SelectValue placeholder="Profissional" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos profissionais</SelectItem>
              {professionals?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-11 bg-background/50 border-border/40 rounded-xl">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas origens</SelectItem>
              <SelectItem value="app">Aplicativo</SelectItem>
              <SelectItem value="admin">Painel Admin</SelectItem>
              <SelectItem value="link">Link Direto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map(i => <Card key={i} className="h-24 animate-pulse bg-muted/50" />)}
        </div>
      ) : !appointments || appointments.length === 0 ? (
        <Card className="grid place-items-center p-12 text-center">
          <Cal className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Nenhum agendamento para este dia.</p>
        </Card>
      ) : (
        <div 
          ref={parentRef}
          className="h-[calc(100vh-280px)] overflow-auto scrollbar-thin pr-2"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const a = appointments[virtualRow.index];
              return (
                <div
                  key={a.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="pb-3"
                >
                  <AgendaCard appointment={a} onSetStatus={setStatus} onPay={setPayAppt} />
                </div>
              );
            })}
          </div>
        </div>
      )}



      <CompletePaymentDialog appt={payAppt} onClose={() => setPayAppt(null)} userId={user?.id} onDone={refetch} />
    </div>
  );
}
