import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
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
  const parentRef = useRef<HTMLDivElement>(null);


  const { data: appointments, isLoading, refetch, updateStatus } = useAppointments(shopId, date);

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
              height: `${appointments.length * 110}px`, // Estimate size per card
              width: "100%",
              position: "relative",
            }}
          >
            {appointments.map((a, index) => (
              <div
                key={a.id}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100px",
                  transform: `translateY(${index * 110}px)`,
                }}
              >
                <AgendaCard appointment={a} onSetStatus={setStatus} onPay={setPayAppt} />
              </div>
            ))}
          </div>
        </div>
      )}


      <CompletePaymentDialog appt={payAppt} onClose={() => setPayAppt(null)} userId={user?.id} onDone={refetch} />
    </div>
  );
}
