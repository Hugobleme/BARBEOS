import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { barbershopService } from "@/services/barbershop.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar as CalIcon, Clock, Trash2, Plus, CalendarOff, Search, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/folgas")({ component: FolgasPage });

function FolgasPage() {
  const { shopId } = useCurrentShop();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [filterPro, setFilterPro] = useState("all");

  const { data: professionals = [] } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  const { data: timeoffs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-timeoff", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_off")
        .select(`*, professional:professionals!inner(id, display_name, barbershop_id)`)
        .eq("professional.barbershop_id", shopId!)
        .order("start_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("time_off").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Registro de folga removido.");
      qc.invalidateQueries({ queryKey: ["admin-timeoff", shopId] });
    }
  });

  const filtered = timeoffs.filter(t => filterPro === "all" || t.professional_id === filterPro);

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
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarOff className="h-6 w-6 text-accent" /> Controle de Ausências
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gerencie bloqueios de agenda e folgas</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={filterPro} onValueChange={setFilterPro}>
              <SelectTrigger className="w-full sm:w-[180px] h-11 bg-background">
                <SelectValue placeholder="Profissional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Profissionais</SelectItem>
                {professionals.map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setFormOpen(true)} className="bg-accent text-accent-foreground shrink-0 h-11">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Nova Folga</span>
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-24">
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Card key={i} className="h-20 animate-pulse rounded-xl border border-border/40 bg-muted/30" />)}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-muted-foreground mb-4">Erro ao carregar registros.</span>
              <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-20 text-center">
              <CalendarOff className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-foreground">Você ainda não cadastrou folgas.</h3>
              <p className="text-sm text-muted-foreground mt-1">Os profissionais estão com as agendas totalmente livres.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(t => {
                const start = new Date(t.start_at);
                const end = new Date(t.end_at);
                const isPast = end < new Date();
                
                return (
                  <Card key={t.id} className={`flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card ${isPast ? 'opacity-70' : ''}`}>
                    <div className="flex flex-col gap-1 truncate pr-4">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-bold text-sm text-foreground truncate">{t.professional?.display_name || "Desconhecido"}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><CalIcon className="h-3 w-3" /> {(isNaN(start.getTime()) ? 'Inv�lido' : format(start, "dd/MM/yy HH:mm"))} até {(isNaN(end.getTime()) ? 'Inv�lido' : format(end, "dd/MM/yy HH:mm"))}</span>
                      </div>
                      {t.reason && (
                        <span className="text-xs text-muted-foreground italic truncate mt-1 bg-muted/30 px-2 py-0.5 rounded-md inline-block w-fit max-w-full">
                          Motivo: {t.reason}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <div className="hidden sm:block">
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full border ${isPast ? 'bg-muted text-muted-foreground border-border/50' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'}`}>
                          {isPast ? 'Encerrado' : 'Registrado'}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => {
                        if (confirm("Deseja remover este bloqueio de agenda?")) deleteMut.mutate(t.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <TimeOffForm open={formOpen} onClose={() => setFormOpen(false)} shopId={shopId} professionals={professionals} onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-timeoff", shopId] })} />
    </div>
  );
}

function TimeOffForm({ open, onClose, shopId, professionals, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    professional_id: "",
    start_at: "",
    end_at: "",
    reason: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.professional_id || !formData.start_at || !formData.end_at) {
      return toast.error("Preencha profissional, data de início e fim.");
    }
    
    const start = new Date(formData.start_at);
    const end = new Date(formData.end_at);
    
    if (end <= start) return toast.error("A data de término deve ser posterior à data de início.");

    setLoading(true);
    try {
      // Overlap check
      const { data: overlaps } = await supabase
        .from("time_off")
        .select("id")
        .eq("professional_id", formData.professional_id)
        .lt("start_at", end.toISOString())
        .gt("end_at", start.toISOString());

      if (overlaps && overlaps.length > 0) {
        setLoading(false);
        return toast.error("Já existe um bloqueio de agenda neste período para o profissional.");
      }

      const { error } = await supabase.from("time_off").insert({
        professional_id: formData.professional_id,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        reason: formData.reason.trim() || null
      });

      if (error) throw error;
      toast.success("Ausência/Folga registrada com sucesso! A agenda foi bloqueada.");
      onSuccess();
      onClose();
      setFormData({ professional_id: "", start_at: "", end_at: "", reason: "" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Adicionar Folga / Bloqueio</DialogTitle>
          <DialogDescription>
            Bloqueie a agenda do profissional para evitar novos agendamentos neste período.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          <div className="space-y-2">
            <Label>Profissional <span className="text-destructive">*</span></Label>
            <Select value={formData.professional_id} onValueChange={(v) => setFormData({ ...formData, professional_id: v })}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {professionals.map((p:any) => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início <span className="text-destructive">*</span></Label>
              <Input type="datetime-local" value={formData.start_at} onChange={e => setFormData({ ...formData, start_at: e.target.value })} required className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Término <span className="text-destructive">*</span></Label>
              <Input type="datetime-local" value={formData.end_at} onChange={e => setFormData({ ...formData, end_at: e.target.value })} required className="h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Motivo (Opcional)</Label>
            <Input value={formData.reason} onChange={e => setFormData({ ...formData, reason: e.target.value })} placeholder="Ex: Férias, Médico, Pessoal..." className="h-11" />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-6">
            <Button type="button" variant="outline" className="h-11" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" className="h-11 bg-accent text-accent-foreground font-bold" disabled={loading}>
              {loading ? "Salvando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
