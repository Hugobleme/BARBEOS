import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { Coins } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/comissoes")({ component: Comissoes });

function Comissoes() {
  const shopId = useCurrentShopId();
  const [status, setStatus] = useState<"all"|"pending"|"paid"|"cancelled">("pending");
  const [pro, setPro] = useState<string>("all");

  const { data: pros } = useQuery({
    queryKey: ["pros-list", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("professionals").select("id,display_name").eq("barbershop_id", shopId).eq("active", true)).data ?? [],
  });

  const { data: rows, refetch } = useQuery({
    queryKey: ["commissions", status, pro, shopId], enabled: !!shopId,
    queryFn: async () => {
      let q = supabase.from("commissions")
        .select("*, professional:professionals(display_name), appointment:appointments(scheduled_start, customer:customers(full_name))")
        .eq("barbershop_id", shopId).order("created_at", { ascending: false });
      if (status !== "all") q = q.eq("status", status);
      if (pro !== "all") q = q.eq("professional_id", pro);
      return (await q).data ?? [];
    },
  });

  const total = (rows ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
  const pending = (rows ?? []).filter((r:any)=>r.status==="pending").reduce((s:number,r:any)=>s+Number(r.amount),0);

  async function markPaid(id: string) {
    const { error } = await supabase.from("commissions").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Marcada como paga"); refetch();
  }
  async function cancel(id: string) {
    const { error } = await supabase.from("commissions").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Comissões</h1>
        <p className="text-muted-foreground">Geradas automaticamente ao concluir um atendimento.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5"><div className="text-sm text-muted-foreground">Total filtrado</div><div className="mt-2 font-display text-2xl font-semibold">{brl(total)}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">A pagar</div><div className="mt-2 font-display text-2xl font-semibold">{brl(pending)}</div></Card>
        <Card className="p-5"><div className="text-sm text-muted-foreground">Lançamentos</div><div className="mt-2 font-display text-2xl font-semibold">{rows?.length ?? 0}</div></Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40"><label className="text-xs text-muted-foreground">Status</label>
            <Select value={status} onValueChange={(v:any)=>setStatus(v)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-56"><label className="text-xs text-muted-foreground">Profissional</label>
            <Select value={pro} onValueChange={setPro}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {(pros ?? []).map((p:any)=> <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {(!rows || rows.length === 0) ? (
        <Card className="grid place-items-center p-12 text-center">
          <Coins className="h-10 w-10 text-muted-foreground"/>
          <p className="mt-3 text-sm text-muted-foreground">Nenhuma comissão neste filtro.</p>
        </Card>
      ) : (
        <div className="grid gap-2">
          {rows.map((r:any) => (
            <Card key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium">{r.professional?.display_name}</div>
                <div className="text-xs text-muted-foreground">
                  {r.appointment?.customer?.full_name ?? "—"} · {r.appointment?.scheduled_start ? format(new Date(r.appointment.scheduled_start), "dd/MM HH:mm") : ""}
                  · base {brl(Number(r.base_amount))} × {(Number(r.rate)*100).toFixed(0)}%
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={r.status==="paid"?"bg-success/15 text-success":r.status==="cancelled"?"bg-muted text-muted-foreground":"bg-warning/15 text-warning"}>
                  {r.status==="paid"?"Paga":r.status==="cancelled"?"Cancelada":"Pendente"}
                </Badge>
                <span className="font-display text-lg font-semibold">{brl(Number(r.amount))}</span>
                {r.status === "pending" && <>
                  <Button size="sm" onClick={()=>markPaid(r.id)}>Pagar</Button>
                  <Button size="sm" variant="ghost" onClick={()=>cancel(r.id)}>Cancelar</Button>
                </>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
