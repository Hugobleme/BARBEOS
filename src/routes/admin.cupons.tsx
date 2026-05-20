import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState, TableSkeleton } from "@/components/site/LoadingState";
import { TicketPercent, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Page,
});

type Coupon = {
  id: string; code: string; kind: "percent"|"fixed"|"first_visit"; value: number;
  min_amount: number; valid_from: string | null; valid_until: string | null;
  usage_limit: number | null; used_count: number; active: boolean;
};

function Page() {
  const shopId = useCurrentShopId();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["coupons", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("coupons" as any).select("*")
      .eq("barbershop_id", shopId).order("created_at", { ascending: false })).data as Coupon[] | null,
  });
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);

  async function remove(id: string) {
    if (!confirm("Excluir este cupom?")) return;
    const { error } = await supabase.from("coupons" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Cupom excluído");
    refetch();
  }
  async function toggleActive(c: Coupon) {
    const { error } = await supabase.from("coupons" as any).update({ active: !c.active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Cupons</h1>
          <p className="text-muted-foreground">Crie códigos promocionais para o PDV e o agendamento.</p>
        </div>
        <Dialog open={open} onOpenChange={(o)=>{ setOpen(o); if (!o) setEditing(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}><Plus className="mr-2 h-4 w-4"/>Novo cupom</Button>
          </DialogTrigger>
          <CouponDialog shopId={shopId} editing={editing} onClose={() => { setOpen(false); setEditing(null); refetch(); }} />
        </Dialog>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={TicketPercent} title="Nenhum cupom cadastrado" description="Crie um cupom para começar a oferecer descontos." />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Mínimo</th>
                <th className="px-4 py-3">Validade</th>
                <th className="px-4 py-3">Uso</th>
                <th className="px-4 py-3">Ativo</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono font-semibold">{c.code}</td>
                  <td className="px-4 py-3"><Badge variant="outline">{c.kind === "percent" ? "Percentual" : c.kind === "fixed" ? "Valor fixo" : "1ª visita"}</Badge></td>
                  <td className="px-4 py-3">{c.kind === "percent" ? `${c.value}%` : brl(Number(c.value))}</td>
                  <td className="px-4 py-3 text-muted-foreground">{Number(c.min_amount) > 0 ? brl(Number(c.min_amount)) : "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.valid_from && <div>de {new Date(c.valid_from).toLocaleDateString("pt-BR")}</div>}
                    {c.valid_until && <div>até {new Date(c.valid_until).toLocaleDateString("pt-BR")}</div>}
                    {!c.valid_from && !c.valid_until && "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                  <td className="px-4 py-3"><Switch checked={c.active} onCheckedChange={() => toggleActive(c)} /></td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4"/></Button>
                    <Button size="sm" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function CouponDialog({ shopId, editing, onClose }: { shopId: string | null; editing: Coupon | null; onClose: () => void }) {
  const [f, setF] = useState({
    code: editing?.code ?? "",
    kind: (editing?.kind ?? "percent") as "percent"|"fixed"|"first_visit",
    value: editing ? String(editing.value) : "",
    min_amount: editing && Number(editing.min_amount) > 0 ? String(editing.min_amount) : "",
    valid_from: editing?.valid_from ? editing.valid_from.slice(0,10) : "",
    valid_until: editing?.valid_until ? editing.valid_until.slice(0,10) : "",
    usage_limit: editing?.usage_limit ? String(editing.usage_limit) : "",
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!shopId) return;
    if (!f.code.trim()) return toast.error("Informe o código");
    if (!f.value || Number(f.value) <= 0) return toast.error("Informe o valor");
    setBusy(true);
    const payload: any = {
      barbershop_id: shopId,
      code: f.code.trim().toUpperCase(),
      kind: f.kind,
      value: Number(f.value),
      min_amount: f.min_amount ? Number(f.min_amount) : 0,
      valid_from: f.valid_from ? new Date(f.valid_from).toISOString() : null,
      valid_until: f.valid_until ? new Date(`${f.valid_until}T23:59:59`).toISOString() : null,
      usage_limit: f.usage_limit ? Number(f.usage_limit) : null,
    };
    const { error } = editing
      ? await supabase.from("coupons" as any).update(payload).eq("id", editing.id)
      : await supabase.from("coupons" as any).insert(payload);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Cupom atualizado" : "Cupom criado");
    onClose();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{editing ? "Editar cupom" : "Novo cupom"}</DialogTitle></DialogHeader>
      <div className="grid gap-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label>Código</Label>
            <Input value={f.code} onChange={e=>setF({...f, code: e.target.value.toUpperCase()})} placeholder="PROMO10"/>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={f.kind} onValueChange={(v:any) => setF({...f, kind: v})}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percentual (%)</SelectItem>
                <SelectItem value="fixed">Valor fixo (R$)</SelectItem>
                <SelectItem value="first_visit">1ª visita (% sobre total)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <Label>{f.kind === "fixed" ? "Valor (R$)" : "Percentual (%)"}</Label>
            <Input type="number" step="0.01" value={f.value} onChange={e=>setF({...f, value: e.target.value})}/>
          </div>
          <div>
            <Label>Valor mínimo (R$)</Label>
            <Input type="number" step="0.01" value={f.min_amount} onChange={e=>setF({...f, min_amount: e.target.value})} placeholder="Opcional"/>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <div>
            <Label>Válido de</Label>
            <Input type="date" value={f.valid_from} onChange={e=>setF({...f, valid_from: e.target.value})}/>
          </div>
          <div>
            <Label>Válido até</Label>
            <Input type="date" value={f.valid_until} onChange={e=>setF({...f, valid_until: e.target.value})}/>
          </div>
          <div>
            <Label>Limite de uso</Label>
            <Input type="number" value={f.usage_limit} onChange={e=>setF({...f, usage_limit: e.target.value})} placeholder="Ilimitado"/>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={save} disabled={busy}>{busy ? "Salvando…" : "Salvar"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}
