import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, AlertCircle, Copy, Save, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/horarios")({
  component: AdminHorariosPage,
});

interface WeekdayConfig {
  weekday: number;
  name: string;
  defaultOpen: boolean;
  defaultOpenTime: string;
  defaultCloseTime: string;
}

const WEEKDAYS: WeekdayConfig[] = [
  {
    weekday: 0,
    name: "Domingo",
    defaultOpen: false,
    defaultOpenTime: "09:00",
    defaultCloseTime: "18:00",
  },
  {
    weekday: 1,
    name: "Segunda-feira",
    defaultOpen: true,
    defaultOpenTime: "09:00",
    defaultCloseTime: "19:00",
  },
  {
    weekday: 2,
    name: "Terça-feira",
    defaultOpen: true,
    defaultOpenTime: "09:00",
    defaultCloseTime: "19:00",
  },
  {
    weekday: 3,
    name: "Quarta-feira",
    defaultOpen: true,
    defaultOpenTime: "09:00",
    defaultCloseTime: "19:00",
  },
  {
    weekday: 4,
    name: "Quinta-feira",
    defaultOpen: true,
    defaultOpenTime: "09:00",
    defaultCloseTime: "19:00",
  },
  {
    weekday: 5,
    name: "Sexta-feira",
    defaultOpen: true,
    defaultOpenTime: "09:00",
    defaultCloseTime: "19:00",
  },
  {
    weekday: 6,
    name: "Sábado",
    defaultOpen: true,
    defaultOpenTime: "09:00",
    defaultCloseTime: "17:00",
  },
];

interface DayState {
  weekday: number;
  name: string;
  isOpen: boolean;
  opens_at: string;
  closes_at: string;
}

function AdminHorariosPage() {
  const { shop, shopId } = useCurrentShop();
  const queryClient = useQueryClient();

  const {
    data: hours,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shop-hours", shopId],
    enabled: Boolean(shopId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_business_hours")
        .select("id, weekday, opens_at, closes_at")
        .eq("barbershop_id", shopId!)
        .order("weekday");
      if (error) throw error;
      return data;
    },
  });

  const [schedule, setSchedule] = useState<DayState[]>(() =>
    WEEKDAYS.map((w) => ({
      weekday: w.weekday,
      name: w.name,
      isOpen: w.defaultOpen,
      opens_at: w.defaultOpenTime,
      closes_at: w.defaultCloseTime,
    })),
  );

  const [isDirty, setIsDirty] = useState(false);

  // Sync state when query data loads
  useEffect(() => {
    if (hours) {
      if (hours.length > 0) {
        setSchedule(
          WEEKDAYS.map((w) => {
            const existing = hours.find((h) => h.weekday === w.weekday);
            if (existing) {
              return {
                weekday: w.weekday,
                name: w.name,
                isOpen: true,
                opens_at: existing.opens_at ? existing.opens_at.slice(0, 5) : w.defaultOpenTime,
                closes_at: existing.closes_at ? existing.closes_at.slice(0, 5) : w.defaultCloseTime,
              };
            }
            return {
              weekday: w.weekday,
              name: w.name,
              isOpen: false,
              opens_at: w.defaultOpenTime,
              closes_at: w.defaultCloseTime,
            };
          }),
        );
      } else {
        // No saved hours in database: use default unsaved presets
        setSchedule(
          WEEKDAYS.map((w) => ({
            weekday: w.weekday,
            name: w.name,
            isOpen: w.defaultOpen,
            opens_at: w.defaultOpenTime,
            closes_at: w.defaultCloseTime,
          })),
        );
      }
      setIsDirty(false);
    }
  }, [hours]);

  const hasConfiguredHours = hours && hours.length > 0;

  const handleToggleDay = (weekday: number, isOpen: boolean) => {
    setSchedule((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, isOpen } : d)));
    setIsDirty(true);
  };

  const handleTimeChange = (weekday: number, field: "opens_at" | "closes_at", value: string) => {
    setSchedule((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d)));
    setIsDirty(true);
  };

  const copyToWorkdays = (sourceDayIndex: number) => {
    const source = schedule.find((d) => d.weekday === sourceDayIndex);
    if (!source) return;

    setSchedule((prev) =>
      prev.map((d) => {
        // Apply to Monday (1) through Friday (5)
        if (d.weekday >= 1 && d.weekday <= 5) {
          return {
            ...d,
            isOpen: source.isOpen,
            opens_at: source.opens_at,
            closes_at: source.closes_at,
          };
        }
        return d;
      }),
    );
    setIsDirty(true);
    toast.info(`Horários de ${source.name} copiados para Segunda a Sexta.`);
  };

  const saveMut = useMutation({
    mutationFn: async (currentSchedule: DayState[]) => {
      if (!shopId) throw new Error("Barbearia não selecionada.");

      // Validate times for open days
      for (const day of currentSchedule) {
        if (day.isOpen) {
          if (!day.opens_at || !day.closes_at) {
            throw new Error(`Informe os horários de abertura e fechamento para ${day.name}.`);
          }
          if (day.opens_at >= day.closes_at) {
            throw new Error(
              `Na ${day.name}, o horário de abertura (${day.opens_at}) deve ser anterior ao de fechamento (${day.closes_at}).`,
            );
          }
        }
      }

      // Delete old hours for active shop
      const { error: delErr } = await supabase
        .from("barbershop_business_hours")
        .delete()
        .eq("barbershop_id", shopId);
      if (delErr) throw delErr;

      // Insert new hours for open days only
      const toInsert = currentSchedule
        .filter((d) => d.isOpen)
        .map((d) => ({
          barbershop_id: shopId,
          weekday: d.weekday,
          opens_at: d.opens_at,
          closes_at: d.closes_at,
        }));

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from("barbershop_business_hours").insert(toInsert);
        if (insErr) throw insErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-hours", shopId] });
      queryClient.invalidateQueries({ queryKey: ["onboarding-status", shopId] });
      queryClient.invalidateQueries({ queryKey: ["book-shop"] });
      toast.success("Horários de funcionamento atualizados.");
      setIsDirty(false);
    },
    onError: (e: any) => {
      toast.error(e?.message || "Não foi possível atualizar os horários. Tente novamente.");
    },
  });

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto h-[60vh]">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">
          Não encontramos uma barbearia vinculada à sua conta.
        </h2>
        <p className="text-muted-foreground text-sm">
          Selecione uma unidade ou entre em contato com o administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background/50">
      <div className="h-full flex flex-col max-w-4xl mx-auto w-full">
        <header className="px-6 py-4 border-b border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-serif">Horários de funcionamento</h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
              Defina os dias e horários em que sua barbearia atende clientes.
            </p>
          </div>
          <Button
            onClick={() => saveMut.mutate(schedule)}
            disabled={saveMut.isPending || isLoading}
            className="bg-accent text-accent-foreground font-bold text-xs uppercase tracking-wider shrink-0"
          >
            <Save className="h-4 w-4 mr-1.5" />
            {saveMut.isPending ? "Salvando..." : isDirty ? "Salvar alterações" : "Salvar"}
          </Button>
        </header>

        <ScrollArea className="flex-1 p-4 md:p-6">
          <div className="space-y-4 max-w-3xl mx-auto pb-12">
            {!isLoading && !hasConfiguredHours && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-bold">
                    Você ainda não configurou os horários de funcionamento.
                  </p>
                  <p className="text-xs opacity-90 mt-0.5">
                    Defina seus horários para liberar agendamentos online. Os valores abaixo são uma
                    sugestão inicial; ajuste como preferir e clique em Salvar.
                  </p>
                </div>
              </div>
            )}

            {isLoading ? (
              <Card className="p-8 text-center text-muted-foreground">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent mx-auto mb-2" />
                <p className="text-sm">Carregando horários...</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {schedule.map((day) => {
                  const hasTimeError =
                    day.isOpen && day.opens_at && day.closes_at && day.opens_at >= day.closes_at;

                  return (
                    <Card
                      key={day.weekday}
                      className={`p-4 md:p-5 transition-all border ${
                        day.isOpen
                          ? "border-border/60 bg-card shadow-sm"
                          : "border-border/30 bg-muted/10 opacity-75"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            id={`toggle-${day.weekday}`}
                            checked={day.isOpen}
                            onCheckedChange={(checked) => handleToggleDay(day.weekday, checked)}
                          />
                          <div>
                            <Label
                              htmlFor={`toggle-${day.weekday}`}
                              className="font-bold text-sm md:text-base cursor-pointer"
                            >
                              {day.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">
                              {day.isOpen ? "Aberto neste dia" : "Fechado"}
                            </p>
                          </div>
                        </div>

                        {day.isOpen ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="time"
                                value={day.opens_at}
                                onChange={(e) =>
                                  handleTimeChange(day.weekday, "opens_at", e.target.value)
                                }
                                className={`w-28 h-9 text-center font-mono text-sm ${
                                  hasTimeError
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : ""
                                }`}
                              />
                              <span className="text-xs text-muted-foreground font-medium">até</span>
                              <Input
                                type="time"
                                value={day.closes_at}
                                onChange={(e) =>
                                  handleTimeChange(day.weekday, "closes_at", e.target.value)
                                }
                                className={`w-28 h-9 text-center font-mono text-sm ${
                                  hasTimeError
                                    ? "border-destructive focus-visible:ring-destructive"
                                    : ""
                                }`}
                              />
                            </div>

                            {day.weekday >= 1 && day.weekday <= 5 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToWorkdays(day.weekday)}
                                title="Copiar este horário para Segunda a Sexta"
                                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                              >
                                <Copy className="h-3.5 w-3.5 mr-1" />
                                Copiar Seg-Sex
                              </Button>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 px-3 py-1.5 rounded-lg bg-muted/20">
                            Fechado
                          </span>
                        )}
                      </div>

                      {hasTimeError && (
                        <p className="text-xs text-destructive font-medium mt-2 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5" />O horário de abertura deve ser
                          anterior ao de fechamento.
                        </p>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
