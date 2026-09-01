import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, Plus, Trash2, ArrowRight } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/horarios")({
  component: AdminHorariosPage,
});

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];

type Interval = { opens_at: string; closes_at: string; id?: string };

function AdminHorariosPage() {
  const { shop } = useCurrentShop();
  const queryClient = useQueryClient();

  const { data: hours, isLoading } = useQuery({
    queryKey: ["shop-hours", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_business_hours")
        .select("*")
        .eq("barbershop_id", shop!.id)
        .order("weekday");
      if (error) throw error;
      return data;
    }
  });

  // Keep local state for editing
  const [editing, setEditing] = useState<Record<number, Interval[]>>({});
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    const next: Record<number, Interval[]> = {};
    for (let i = 0; i < 7; i++) next[i] = [];
    if (hours) {
      hours.forEach(h => {
        next[h.weekday].push({ opens_at: h.opens_at, closes_at: h.closes_at, id: h.id });
      });
    }
    setEditing(next);
    setIsEditing(true);
  };

  const saveMut = useMutation({
    mutationFn: async (payload: Record<number, Interval[]>) => {
      // Clear old hours
      const { error: delErr } = await supabase.from("barbershop_business_hours").delete().eq("barbershop_id", shop!.id);
      if (delErr) throw delErr;

      // Insert new hours
      const toInsert: any[] = [];
      for (const [day, intervals] of Object.entries(payload)) {
         for (const inv of intervals) {
             if (inv.opens_at && inv.closes_at) {
                 toInsert.push({ barbershop_id: shop!.id, weekday: parseInt(day), opens_at: inv.opens_at, closes_at: inv.closes_at });
             }
         }
      }

      if (toInsert.length > 0) {
         const { error: insErr } = await supabase.from("barbershop_business_hours").insert(toInsert);
         if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-hours"] });
      toast.success("Horários de funcionamento atualizados.");
      setIsEditing(false);
    },
    onError: (e) => toast.error("Erro: " + e.message)
  });

  const addInterval = (day: number) => {
    setEditing(prev => ({ ...prev, [day]: [...prev[day], { opens_at: "09:00", closes_at: "18:00" }] }));
  };

  const remInterval = (day: number, index: number) => {
    setEditing(prev => {
      const next = [...prev[day]];
      next.splice(index, 1);
      return { ...prev, [day]: next };
    });
  };

  const updateInterval = (day: number, index: number, field: "opens_at" | "closes_at", val: string) => {
    setEditing(prev => {
      const next = [...prev[day]];
      next[index] = { ...next[index], [field]: val };
      return { ...prev, [day]: next };
    });
  };

  const copyToAll = (day: number) => {
     const source = editing[day];
     const next = { ...editing };
     for (let i = 1; i < 6; i++) {
        next[i] = source.map(s => ({ ...s }));
     }
     setEditing(next);
     toast.info("Horários copiados para dias úteis (Seg a Sex).");
  };

  if (!shop) return <div className="h-[calc(100vh-4rem)] flex flex-col bg-background/50"><div>Carregando...</div></div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background/50">
      <div className="h-full flex flex-col">
        <header className="px-6 py-4 border-b border-border/40 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold font-serif">Horários de Funcionamento</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Configure quando sua barbearia está aberta</p>
          </div>
          {!isEditing && (
            <Button onClick={handleEdit} className="bg-accent text-accent-foreground font-bold text-xs uppercase tracking-wider">
              Editar Horários
            </Button>
          )}
          {isEditing && (
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={() => saveMut.mutate(editing)} disabled={saveMut.isPending} className="bg-accent text-accent-foreground font-bold">
                {saveMut.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}
        </header>
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-3xl space-y-4">
            {!isEditing ? (
              <Card className="p-6">
                 {isLoading ? <p>Carregando...</p> : (
                   <div className="space-y-4">
                     {WEEKDAYS.map((name, i) => {
                        const dayHours = hours?.filter(h => h.weekday === i) || [];
                        return (
                          <div key={i} className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border/40 last:border-0 gap-4">
                             <div className="w-32 font-bold text-sm">{name}</div>
                             <div className="flex-1 flex flex-col gap-1">
                               {dayHours.length === 0 ? (
                                  <span className="text-muted-foreground text-sm">Fechado</span>
                               ) : (
                                  dayHours.map((h, idx) => (
                                    <span key={idx} className="text-sm">{h.opens_at.slice(0,5)} às {h.closes_at.slice(0,5)}</span>
                                  ))
                               )}
                             </div>
                          </div>
                        );
                     })}
                   </div>
                 )}
              </Card>
            ) : (
              <div className="space-y-4">
                {WEEKDAYS.map((name, i) => (
                  <Card key={i} className="p-4 flex flex-col gap-3">
                     <div className="flex items-center justify-between">
                       <h3 className="font-bold text-sm">{name}</h3>
                       <div className="flex gap-2">
                          {editing[i]?.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => copyToAll(i)} className="text-xs">Copiar para Seg-Sex</Button>
                          )}
                          <Button variant="outline" size="sm" onClick={() => addInterval(i)}><Plus className="h-4 w-4 mr-1"/> Adicionar Horário</Button>
                       </div>
                     </div>
                     {editing[i].length === 0 ? (
                        <p className="text-sm text-muted-foreground">Fechado</p>
                     ) : (
                        <div className="flex flex-col gap-2">
                           {editing[i].map((inv, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <Input type="time" value={inv.opens_at} onChange={e => updateInterval(i, idx, "opens_at", e.target.value)} className="w-32" />
                                <span className="text-muted-foreground">até</span>
                                <Input type="time" value={inv.closes_at} onChange={e => updateInterval(i, idx, "closes_at", e.target.value)} className="w-32" />
                                <Button variant="ghost" size="icon" onClick={() => remInterval(i, idx)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4"/></Button>
                              </div>
                           ))}
                        </div>
                     )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
