import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/folgas")({ component: Folgas });

type Pro = { id: string; display_name: string };
type TimeOff = {
  id: string; professional_id: string;
  start_at: string; end_at: string; reason: string | null;
};

function Folgas() {
  const shopId = useCurrentShopId();

  const { data: pros = [] } = useQuery({
    enabled: !!shopId,
    queryKey: ["folgas-pros", shopId],
    queryFn: async () =>
      ((await supabase
        .from("professionals")
        .select("id, display_name")
        .eq("barbershop_id", shopId)
        .order("display_name")).data ?? []) as Pro[],
  });

  const proIds = useMemo(() => pros.map((p) => p.id), [pros]);

  const { data: items = [], refetch } = useQuery({
    enabled: proIds.length > 0,
    queryKey: ["folgas", proIds.join(",")],
    queryFn: async () => {
      const { data } = await supabase
        .from("time_off")
        .select("*")
        .in("professional_id", proIds)
        .order("start_at", { ascending: false });
      return (data ?? []) as TimeOff[];
    },
  });

  const nameOf = (id: string) => pros.find((p) => p.id === id)?.display_name ?? "—";

  async function remove(id: string) {
    const { error } = await supabase.from("time_off").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Folga removida");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Folgas e bloqueios</h1>
          <p className="text-sm text-muted-foreground">
            Bloqueie períodos em que um profissional não está disponível para agendamento.
          </p>
        </div>
        <NewBlockDialog pros={pros} onCreated={refetch} />
      </div>

      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
          <CalendarOff className="h-4 w-4" /> Próximas e recentes
        </div>
        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhum bloqueio cadastrado.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((t) => {
              const s = new Date(t.start_at);
              const e = new Date(t.end_at);
              const sameDay = s.toDateString() === e.toDateString();
              const upcoming = e.getTime() >= Date.now();
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium">{nameOf(t.professional_id)}</div>
                    <div className="text-xs text-muted-foreground">
                      {sameDay
                        ? `${format(s, "EEE, dd/MM 'de' HH:mm", { locale: ptBR })} até ${format(e, "HH:mm")}`
                        : `${format(s, "dd/MM HH:mm", { locale: ptBR })} → ${format(e, "dd/MM HH:mm", { locale: ptBR })}`}
                      {t.reason ? ` · ${t.reason}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={upcoming ? "default" : "outline"}>
                      {upcoming ? "Ativo" : "Passado"}
                    </Badge>
                    <Button variant="ghost" size="sm" onClick={() => remove(t.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

function NewBlockDialog({
  pros, onCreated,
}: { pros: Pro[]; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [proId, setProId] = useState<string>("");
  const [date, setDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [endDate, setEndDate] = useState<string>("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!proId) return toast.error("Escolha o profissional");
    if (!date) return toast.error("Informe a data");

    const startISO = allDay
      ? new Date(`${date}T00:00:00`).toISOString()
      : new Date(`${date}T${startTime}:00`).toISOString();
    const endISO = allDay
      ? new Date(`${endDate || date}T23:59:59`).toISOString()
      : new Date(`${date}T${endTime}:00`).toISOString();

    if (new Date(endISO) <= new Date(startISO))
      return toast.error("O fim deve ser após o início");

    setBusy(true);
    const { error } = await supabase.from("time_off").insert({
      professional_id: proId,
      start_at: startISO,
      end_at: endISO,
      reason: reason.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bloqueio criado");
    setOpen(false);
    setReason("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-2 h-4 w-4" />Novo bloqueio</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Bloquear horário</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Profissional</Label>
            <Select value={proId} onValueChange={setProId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {pros.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="h-4 w-4 accent-current"
            />
            Dia inteiro (ou intervalo de dias)
          </label>

          {allDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>De</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Até (opcional)</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Data</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Início</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Fim</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Motivo (opcional)</Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: férias, médico, treinamento…"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy ? "Salvando…" : "Bloquear"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
