import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { brl } from "@/lib/format";
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

type Method = "cash" | "debit" | "credit" | "pix" | "transfer" | "other";
const METHOD_LABEL: Record<Method, string> = {
  cash: "Dinheiro", debit: "Débito", credit: "Crédito", pix: "Pix", transfer: "Transferência", other: "Outro"
};

function Agenda() {
  const shopId = useCurrentShopId();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date());
  const [payAppt, setPayAppt] = useState<any>(null);

  const { data, refetch } = useQuery({
    queryKey: ["agenda", date.toISOString().slice(0,10), shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("appointments")
      .select("*, professional:professionals(id, display_name, commission_rule), customer:customers(full_name, phone)")
      .eq("barbershop_id", shopId)
      .gte("scheduled_start", startOfDay(date).toISOString())
      .lte("scheduled_start", endOfDay(date).toISOString())
      .order("scheduled_start")).data ?? [],
  });

  async function setStatus(id: string, status: "scheduled"|"in_progress"|"cancelled"|"no_show") {
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
                  {a.status === "in_progress" && <Button size="sm" onClick={()=>setPayAppt(a)}>Concluir e cobrar</Button>}
                  {(a.status==="scheduled"||a.status==="in_progress") && <Button size="sm" variant="ghost" onClick={()=>setStatus(a.id,"no_show")}>Faltou</Button>}
                  {a.status!=="cancelled" && a.status!=="completed" && <Button size="sm" variant="ghost" onClick={()=>setStatus(a.id,"cancelled")}>Cancelar</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <CompletePaymentDialog appt={payAppt} onClose={()=>setPayAppt(null)} userId={user?.id} onDone={refetch} />
    </div>
  );
}

function CompletePaymentDialog({ appt, onClose, userId, onDone }: any) {
  const [method, setMethod] = useState<Method>("cash");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (appt && amount === "") setAmount(String(Number(appt.total_amount)));

  async function submit() {
    if (!appt) return;
    setLoading(true);
    try {
      // 1. abre caixa se não houver
      const { data: openSession } = await supabase.from("cash_sessions")
        .select("id").eq("barbershop_id", appt.barbershop_id).eq("status", "open")
        .order("opened_at", { ascending: false }).limit(1).maybeSingle();

      let sessionId = openSession?.id;
      if (!sessionId) {
        const { data: created, error: e1 } = await supabase.from("cash_sessions")
          .insert({ barbershop_id: appt.barbershop_id, opened_by: userId, opening_amount: 0 })
          .select("id").single();
        if (e1) throw e1;
        sessionId = created.id;
      }

      // 2. concluir agendamento
      const { error: e2 } = await supabase.from("appointments").update({ status: "completed" }).eq("id", appt.id);
      if (e2) throw e2;

      // 3. lançar venda no caixa
      const value = Number(amount);
      const { data: tx, error: e3 } = await supabase.from("cash_transactions").insert({
        barbershop_id: appt.barbershop_id, session_id: sessionId, appointment_id: appt.id,
        professional_id: appt.professional?.id, customer_id: appt.customer_id,
        kind: "sale", method, amount: value, description: `Atendimento ${appt.customer?.full_name ?? ""}`.trim(),
        created_by: userId,
      }).select("id").single();
      if (e3) throw e3;

      // 4. comissão automática
      const rate = Number(appt.professional?.commission_rule?.rate ?? 0.5);
      if (appt.professional?.id && rate > 0) {
        const { error: e4 } = await supabase.from("commissions").insert({
          barbershop_id: appt.barbershop_id, professional_id: appt.professional.id,
          appointment_id: appt.id, transaction_id: tx.id,
          base_amount: value, rate, amount: +(value * rate).toFixed(2),
        });
        if (e4) throw e4;
      }

      toast.success("Atendimento concluído e cobrado");
      setAmount(""); onClose(); onDone();
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao concluir");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={!!appt} onOpenChange={(o)=>!o&&(setAmount(""),onClose())}>
      <DialogContent>
        <DialogHeader><DialogTitle>Concluir atendimento</DialogTitle></DialogHeader>
        {appt && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border p-3 text-sm">
              <div className="font-medium">{appt.customer?.full_name}</div>
              <div className="text-muted-foreground">com {appt.professional?.display_name}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Valor (R$)</Label><Input type="number" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
              <div><Label>Método</Label>
                <Select value={method} onValueChange={(v:any)=>setMethod(v)}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METHOD_LABEL) as Method[]).map(m=> <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        <DialogFooter><Button onClick={submit} disabled={loading}>{loading?"Processando...":"Confirmar"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
