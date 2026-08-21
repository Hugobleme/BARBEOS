import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { CalendarOff, Plus, Trash2, Check, X, Clock, AlertCircle, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/folgas")({
  head: () => ({ meta: [{ title: "Gestão de Folgas & Bloqueios — BarberOS" }] }),
  component: FolgasPage,
});

type Pro = { id: string; display_name: string };
type TimeOff = {
  id: string;
  professional_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
  status?: "pending" | "approved" | "rejected";
};

function FolgasPage() {
  const { shopId, shop } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const [filterPro, setFilterPro] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Consulta de Profissionais da Barbearia
  const { data: pros = [], isLoading: loadingPros } = useQuery({
    enabled: !!shopId,
    queryKey: ["folgas-pros", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, display_name")
        .eq("barbershop_id", shopId!)
        .eq("active", true)
        .order("display_name");
      if (error) throw error;
      return (data ?? []) as Pro[];
    },
  });

  const proIds = useMemo(() => pros.map((p) => p.id), [pros]);

  // Consulta de Folgas / Bloqueios
  const { data: items = [], isLoading: loadingItems, refetch } = useQuery({
    enabled: proIds.length > 0,
    queryKey: ["admin-time-off-list", proIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off")
        .select("*")
        .in("professional_id", proIds)
        .order("start_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TimeOff[];
    },
  });

  const filteredItems = useMemo(() => {
    if (filterPro === "all") return items;
    return items.filter((it) => it.professional_id === filterPro);
  }, [items, filterPro]);

  const nameOf = (id: string) => pros.find((p) => p.id === id)?.display_name ?? "Profissional";

  async function handleRemove(id: string) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm("Deseja realmente remover esta folga/bloqueio?")) return;

    try {
      const { error } = await supabase.from("time_off").delete().eq("id", id);
      if (error) throw error;
      toast.success("Bloqueio removido com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover bloqueio.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Topo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Folgas & Bloqueios de Agenda</h1>
          <p className="text-muted-foreground">
            Defina ausências, férias ou bloqueios de horários para evitar agendamentos indevidos.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Folga / Bloqueio
        </Button>
      </div>

      {/* Barra de Filtro */}
      <Card className="rounded-none border border-border bg-card/40 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Profissional:
            </Label>
            <Select value={filterPro} onValueChange={setFilterPro}>
              <SelectTrigger className="w-[220px] rounded-none h-10 text-xs">
                <SelectValue placeholder="Todos os barbeiros" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Todos os profissionais</SelectItem>
                {pros.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="rounded-none text-xs font-mono text-accent">
            {filteredItems.length} {filteredItems.length === 1 ? "bloqueio registrado" : "bloqueios registrados"}
          </Badge>
        </div>
      </Card>

      {/* Tabela de Folgas */}
      <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2 font-serif text-lg font-bold">
            <CalendarOff className="h-5 w-5 text-accent" />
            <span>Períodos de Indisponibilidade</span>
          </div>
        </div>

        {loadingPros || loadingItems ? (
          <TableSkeleton rows={4} />
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={CalendarOff}
            title="Nenhuma folga cadastrada"
            description="Quando um profissional tirar folga ou houver feriado, cadastre o bloqueio aqui."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-3">Profissional</th>
                  <th className="py-3">Início</th>
                  <th className="py-3">Término</th>
                  <th className="py-3">Motivo / Observação</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredItems.map((it) => {
                  const s = new Date(it.start_at);
                  const e = new Date(it.end_at);
                  const isUpcoming = e.getTime() >= Date.now();

                  return (
                    <tr key={it.id} className="hover:bg-card/60 transition-colors">
                      <td className="py-3 font-serif font-bold text-foreground">
                        {nameOf(it.professional_id)}
                      </td>
                      <td className="py-3 text-xs font-mono text-muted-foreground">
                        {format(s, "dd/MM/yyyy · HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3 text-xs font-mono text-muted-foreground">
                        {format(e, "dd/MM/yyyy · HH:mm", { locale: ptBR })}
                      </td>
                      <td className="py-3 text-xs text-foreground/80">
                        {it.reason || <span className="text-muted-foreground italic">Não especificado</span>}
                      </td>
                      <td className="py-3">
                        {isUpcoming ? (
                          <Badge variant="outline" className="rounded-none border-amber-500/30 bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">
                            Bloqueio Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none border-border bg-muted/40 text-muted-foreground text-[10px] uppercase">
                            Finalizado
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        {canManage && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemove(it.id)}
                            className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal: Novo Bloqueio */}
      <CreateBlockModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        pros={pros}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

function CreateBlockModal({
  open,
  onOpenChange,
  pros,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pros: Pro[];
  onSuccess: () => void;
}) {
  const [proId, setProId] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState("08:00");
  const [endDate, setEndDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [endTime, setEndTime] = useState("20:00");
  const [allDay, setAllDay] = useState(true);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!proId) return toast.error("Selecione o profissional.");
    if (!startDate) return toast.error("Informe a data de início.");

    const startISO = allDay
      ? new Date(`${startDate}T00:00:00`).toISOString()
      : new Date(`${startDate}T${startTime}:00`).toISOString();

    const endISO = allDay
      ? new Date(`${endDate || startDate}T23:59:59`).toISOString()
      : new Date(`${endDate || startDate}T${endTime}:00`).toISOString();

    if (new Date(endISO) <= new Date(startISO)) {
      return toast.error("A data de término deve ser posterior à data de início.");
    }

    setBusy(true);
    try {
      const { error } = await supabase.from("time_off").insert({
        professional_id: proId,
        start_at: startISO,
        end_at: endISO,
        reason: reason.trim() || null,
      });

      if (error) throw error;
      toast.success("Bloqueio de horário registrado com sucesso!");
      setReason("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar bloqueio.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Bloquear Horário / Registrar Folga</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label>Profissional / Barbeiro *</Label>
              <Select value={proId} onValueChange={setProId} required>
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  {pros.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="all_day_check"
                type="checkbox"
                checked={allDay}
                onChange={(e) => setAllDay(e.target.checked)}
                className="h-4 w-4 rounded-none accent-current"
              />
              <Label htmlFor="all_day_check" className="cursor-pointer">
                Dia inteiro (ou múltiplos dias de ausência)
              </Label>
            </div>

            {allDay ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data de Início *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Data de Retorno</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-none"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setEndDate(e.target.value);
                    }}
                    className="rounded-none"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label>Início</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fim</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="rounded-none"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="to_reason">Motivo da Ausência (Opcional)</Label>
              <Textarea
                id="to_reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ex.: Férias anuais, Consulta médica, Treinamento externo..."
                className="rounded-none resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Salvando..." : "Confirmar Bloqueio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
