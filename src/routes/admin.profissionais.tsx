// @ts-nocheck
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { barbershopService, Professional } from "@/services/barbershop.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Plus,
  Pencil,
  Users,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  Clock,
  Coffee,
  AlertCircle,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/profissionais")({ component: ProfessionalsPage });

function getInitials(name: string) {
  if (!name) return "P";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function ProfessionalsPage() {
  const { shopId } = useCurrentShop();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);

  const { data: barbershop } = useQuery({
    queryKey: ["admin-config-pros", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershops")
        .select("slug")
        .eq("id", shopId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const {
    data: professionals = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("*")
        .eq("barbershop_id", shopId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Professional[];
    },
  });

  const toggleStatusMut = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      return barbershopService.updateBarber(id, { active });
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-pros", shopId] });
    },
    onError: () => toast.error("Não foi possível atualizar o status. Tente novamente."),
  });

  const handleEdit = (p: Professional) => {
    setEditingPro(p);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPro(null);
    setFormOpen(true);
  };

  const handleToggleActive = (p: Professional) => {
    if (p.active) {
      if (
        window.confirm(
          "Desativar este profissional?\\nEle deixará de aparecer nas áreas públicas que consideram profissionais ativos.",
        )
      ) {
        toggleStatusMut.mutate({ id: p.id, active: false });
      }
    } else {
      toggleStatusMut.mutate({ id: p.id, active: true });
    }
  };

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto h-[60vh]">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">
          Não encontramos uma barbearia vinculada Ã  sua conta.
        </h2>
        <p className="text-muted-foreground text-sm">
          Conclua o cadastro da unidade ou procure o responsável pela conta.
        </p>
      </div>
    );
  }

  const activeCount = professionals?.filter((p) => p.active).length || 0;
  const totalCount = professionals?.length || 0;
  const hasSlug = Boolean(barbershop?.slug);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pt-4 pb-12 px-4 sm:px-6">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">
            EQUIPE DA UNIDADE
          </p>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
            Profissionais
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl">
            Organize os profissionais da sua barbearia e mantenha o perfil da equipe atualizado.
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-md mt-4 w-fit">
            <Info className="h-3 w-3" />
            <span>Profissionais ativos podem aparecer no perfil público da sua barbearia.</span>
          </div>
        </div>
        <Button
          onClick={handleCreate}
          className="h-11 px-6 font-bold uppercase tracking-wider text-xs shrink-0 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar profissional
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-40 mb-6" />
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <Card className="p-8 text-center bg-card border-destructive/20 space-y-4">
              <AlertTriangle className="h-10 w-10 text-destructive/40 mx-auto" />
              <h3 className="text-lg font-bold">Não foi possível carregar os profissionais.</h3>
              <p className="text-muted-foreground text-sm">Tente novamente em alguns instantes.</p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                <RefreshCcw className="h-4 w-4 mr-2" /> Tentar novamente
              </Button>
            </Card>
          ) : totalCount === 0 ? (
            <Card className="p-12 text-center bg-card border-dashed border-border/60">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-serif mb-2">
                Você ainda não cadastrou profissionais.
              </h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                Adicione os integrantes da sua equipe para deixar o perfil da barbearia mais
                completo.
              </p>
              <Button onClick={handleCreate} className="font-bold uppercase tracking-wider text-xs">
                Adicionar primeiro profissional
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span>
                  {totalCount}{" "}
                  {totalCount === 1 ? "profissional cadastrado" : "profissionais cadastrados"}
                </span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-accent">
                  {activeCount} {activeCount === 1 ? "ativo" : "ativos"}
                </span>
              </div>

              <div className="grid gap-3">
                {professionals.map((p) => (
                  <Card
                    key={p.id}
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 border-border/40 transition-colors ${!p.active ? "opacity-60 bg-muted/10" : "bg-card hover:border-accent/40"}`}
                  >
                    <div className="flex gap-4 flex-1 min-w-0">
                      <Avatar className="h-14 w-14 shrink-0 rounded-xl border border-border/60 bg-muted/30">
                        <AvatarImage
                          src={p.avatar_url || ""}
                          alt={p.display_name}
                          className="object-cover"
                        />
                        <AvatarFallback className="rounded-xl text-base font-serif bg-transparent text-muted-foreground">
                          {getInitials(p.display_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base truncate">{p.display_name}</h3>
                          {p.active ? (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                              Ativo
                            </span>
                          ) : (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-border bg-muted text-muted-foreground">
                              Inativo
                            </span>
                          )}
                        </div>

                        {p.specialties && p.specialties.length > 0 && (
                          <div className="text-xs text-accent font-medium mb-1.5 truncate">
                            {p.specialties.join(" ”¢ ")}
                          </div>
                        )}

                        {p.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{p.bio}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-border/20 pt-3 sm:pt-0 sm:pl-4 mt-2 sm:mt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(p)}
                        className="w-full text-xs font-bold uppercase tracking-wider h-9"
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(p)}
                        className={`w-full text-xs font-bold uppercase tracking-wider h-9 ${p.active ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30" : "hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30"}`}
                      >
                        {p.active ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PUBLIC PROFILE INFO CARD */}
        <div className="space-y-6">
          <Card className="p-5 bg-muted/10 border-border/40 shadow-sm sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-accent" />
              Como sua equipe aparece
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mantenha nome, especialidades e imagem atualizados para apresentar sua equipe com mais
              clareza no perfil da barbearia.
            </p>
            {hasSlug ? (
              <Button
                asChild
                variant="outline"
                className="w-full text-xs font-bold uppercase tracking-wider border-accent/40 text-accent hover:bg-accent/10"
              >
                <Link to={`/b/${barbershop.slug}`} target="_blank">
                  Ver perfil público
                </Link>
              </Button>
            ) : (
              <div className="space-y-3 pt-3 border-t border-border/40">
                <p className="text-xs text-amber-500 font-medium">
                  Complete o perfil da barbearia para revisar sua página pública.
                </p>
                <Button
                  asChild
                  variant="outline"
                  className="w-full text-xs font-bold uppercase tracking-wider"
                >
                  <Link to="/admin/configuracoes">Editar perfil</Link>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ProfessionalFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        pro={editingPro}
        shopId={shopId}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

interface ProDaySchedule {
  weekday: number;
  name: string;
  isWorking: boolean;
  start_time: string;
  end_time: string;
  hasBreak: boolean;
  break_start: string;
  break_end: string;
}

const DEFAULT_PRO_DAYS = [
  { weekday: 0, name: "Domingo", defaultWorking: false, start: "09:00", end: "18:00" },
  { weekday: 1, name: "Segunda-feira", defaultWorking: true, start: "09:00", end: "19:00" },
  { weekday: 2, name: "Terça-feira", defaultWorking: true, start: "09:00", end: "19:00" },
  { weekday: 3, name: "Quarta-feira", defaultWorking: true, start: "09:00", end: "19:00" },
  { weekday: 4, name: "Quinta-feira", defaultWorking: true, start: "09:00", end: "19:00" },
  { weekday: 5, name: "Sexta-feira", defaultWorking: true, start: "09:00", end: "19:00" },
  { weekday: 6, name: "Sábado", defaultWorking: true, start: "09:00", end: "17:00" },
];

function ProfessionalFormDialog({
  open,
  onClose,
  pro,
  shopId,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  pro: Professional | null;
  shopId: string;
  onSuccess: () => void;
}) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    specialties: "",
    avatar_url: "",
    active: true,
  });

  const [schedule, setSchedule] = useState<ProDaySchedule[]>(() =>
    DEFAULT_PRO_DAYS.map((d) => ({
      weekday: d.weekday,
      name: d.name,
      isWorking: d.defaultWorking,
      start_time: d.start,
      end_time: d.end,
      hasBreak: false,
      break_start: "12:00",
      break_end: "13:00",
    })),
  );

  // Load existing working hours when editing a professional
  const { data: existingHours, isLoading: loadingHours } = useQuery({
    queryKey: ["professional-working-hours", pro?.id],
    enabled: Boolean(pro?.id) && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("working_hours")
        .select("id, professional_id, weekday, start_time, end_time, break_start, break_end")
        .eq("professional_id", pro!.id)
        .order("weekday");
      if (error) throw error;
      return data || [];
    },
  });

  // Load barbershop hours to optionally mirror as defaults
  const { data: shopHours } = useQuery({
    queryKey: ["shop-hours", shopId],
    enabled: Boolean(shopId) && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_business_hours")
        .select("id, weekday, opens_at, closes_at")
        .eq("barbershop_id", shopId)
        .order("weekday");
      if (error) throw error;
      return data || [];
    },
  });

  useEffect(() => {
    if (open) {
      if (pro) {
        setFormData({
          display_name: pro.display_name || "",
          bio: pro.bio || "",
          specialties: Array.isArray(pro.specialties) ? pro.specialties.join(", ") : "",
          avatar_url: pro.avatar_url || "",
          active: pro.active ?? true,
        });
      } else {
        setFormData({
          display_name: "",
          bio: "",
          specialties: "",
          avatar_url: "",
          active: true,
        });
      }
    }
  }, [open, pro]);

  // Sync schedule from existingHours or shopHours
  useEffect(() => {
    if (open) {
      if (pro && existingHours) {
        if (existingHours.length > 0) {
          setSchedule(
            DEFAULT_PRO_DAYS.map((d) => {
              const found = existingHours.find((h: any) => h.weekday === d.weekday);
              if (found) {
                return {
                  weekday: d.weekday,
                  name: d.name,
                  isWorking: true,
                  start_time: found.start_time ? found.start_time.slice(0, 5) : d.start,
                  end_time: found.end_time ? found.end_time.slice(0, 5) : d.end,
                  hasBreak: Boolean(found.break_start && found.break_end),
                  break_start: found.break_start ? found.break_start.slice(0, 5) : "12:00",
                  break_end: found.break_end ? found.break_end.slice(0, 5) : "13:00",
                };
              }
              return {
                weekday: d.weekday,
                name: d.name,
                isWorking: false,
                start_time: d.start,
                end_time: d.end,
                hasBreak: false,
                break_start: "12:00",
                break_end: "13:00",
              };
            }),
          );
        } else {
          // Professional with no saved hours: mirror shop hours if available, else standard defaults
          applyShopHoursOrDefaults();
        }
      } else if (!pro) {
        // New professional: mirror shop hours or default
        applyShopHoursOrDefaults();
      }
    }
  }, [open, pro, existingHours, shopHours]);

  const applyShopHoursOrDefaults = () => {
    setSchedule(
      DEFAULT_PRO_DAYS.map((d) => {
        const sh = shopHours?.find((h: any) => h.weekday === d.weekday);
        if (sh) {
          return {
            weekday: d.weekday,
            name: d.name,
            isWorking: true,
            start_time: sh.opens_at ? sh.opens_at.slice(0, 5) : d.start,
            end_time: sh.closes_at ? sh.closes_at.slice(0, 5) : d.end,
            hasBreak: false,
            break_start: "12:00",
            break_end: "13:00",
          };
        }
        return {
          weekday: d.weekday,
          name: d.name,
          isWorking: d.defaultWorking,
          start_time: d.start,
          end_time: d.end,
          hasBreak: false,
          break_start: "12:00",
          break_end: "13:00",
        };
      }),
    );
  };

  const hasNoSavedSchedule = pro && existingHours && existingHours.length === 0;

  const handleToggleDay = (weekday: number, isWorking: boolean) => {
    setSchedule((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, isWorking } : d)));
  };

  const handleTimeChange = (
    weekday: number,
    field: "start_time" | "end_time" | "break_start" | "break_end",
    value: string,
  ) => {
    setSchedule((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, [field]: value } : d)));
  };

  const handleToggleBreak = (weekday: number, hasBreak: boolean) => {
    setSchedule((prev) => prev.map((d) => (d.weekday === weekday ? { ...d, hasBreak } : d)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const name = formData.display_name.trim();
    if (!name) return toast.error("Informe o nome do profissional.");

    // Validate schedules for working days
    for (const d of schedule) {
      if (d.isWorking) {
        if (!d.start_time || !d.end_time) {
          return toast.error(`Informe o horário de trabalho completo para ${d.name}.`);
        }
        if (d.start_time >= d.end_time) {
          return toast.error(
            `Na ${d.name}, o início (${d.start_time}) deve ser anterior ao término (${d.end_time}).`,
          );
        }
        if (d.hasBreak) {
          if (!d.break_start || !d.break_end) {
            return toast.error(`Informe o início e fim do intervalo para ${d.name}.`);
          }
          if (
            d.start_time >= d.break_start ||
            d.break_start >= d.break_end ||
            d.break_end >= d.end_time
          ) {
            return toast.error(
              `Na ${d.name}, o intervalo (${d.break_start} às ${d.break_end}) deve estar contido dentro do horário de trabalho (${d.start_time} às ${d.end_time}).`,
            );
          }
        }
      }
    }

    const specsArray = formData.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const payload: any = {
        barbershop_id: shopId,
        display_name: name,
        bio: formData.bio.trim() || null,
        specialties: specsArray.length > 0 ? specsArray : null,
        avatar_url: formData.avatar_url.trim() || null,
        active: formData.active,
      };

      let savedProId = pro?.id;

      if (pro) {
        await barbershopService.updateBarber(pro.id, payload);
      } else {
        const created = await barbershopService.createBarber(payload);
        savedProId = created.id;
      }

      if (!savedProId) {
        throw new Error("Não foi possível obter o identificador do profissional.");
      }

      // Persist working hours
      // 1. Delete previous records
      const { error: delErr } = await supabase
        .from("working_hours")
        .delete()
        .eq("professional_id", savedProId);
      if (delErr) {
        throw new Error(
          `Profissional salvo, mas ocorreu erro ao limpar horários anteriores: ${delErr.message}`,
        );
      }

      // 2. Insert enabled workdays only
      const toInsert = schedule
        .filter((d) => d.isWorking)
        .map((d) => ({
          professional_id: savedProId,
          weekday: d.weekday,
          start_time: d.start_time,
          end_time: d.end_time,
          break_start: d.hasBreak ? d.break_start : null,
          break_end: d.hasBreak ? d.break_end : null,
        }));

      if (toInsert.length > 0) {
        const { error: insErr } = await supabase.from("working_hours").insert(toInsert);
        if (insErr) {
          throw new Error(
            `Profissional salvo, mas ocorreu erro ao salvar horários de trabalho: ${insErr.message}`,
          );
        }
      }

      toast.success(
        pro
          ? "Profissional e horários atualizados com sucesso."
          : "Profissional e horários cadastrados com sucesso.",
      );

      qc.invalidateQueries({ queryKey: ["admin-pros", shopId] });
      qc.invalidateQueries({ queryKey: ["professional-working-hours", savedProId] });
      qc.invalidateQueries({ queryKey: ["public-availability", shopId] });
      qc.invalidateQueries({ queryKey: ["onboarding-status", shopId] });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível salvar o profissional. Tente novamente.");
      if (import.meta.env.DEV) {
        console.error("Professional save error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-2xl max-w-[95vw] p-0 overflow-hidden bg-card border-border/60 max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 text-left shrink-0">
          <DialogTitle className="font-serif text-xl">
            {pro ? "Editar profissional" : "Adicionar profissional"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {pro
              ? "Altere as informações cadastrais e a disponibilidade semanal deste integrante da equipe."
              : "Cadastre um novo membro para sua barbearia e configure sua jornada semanal."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1 p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">
                  Nome de exibição <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="p-name"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  required
                  className="h-11"
                  placeholder="Ex: João Silva"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-specs">
                  Especialidades{" "}
                  <span className="text-muted-foreground font-normal">(Separadas por vírgula)</span>
                </Label>
                <Input
                  id="p-specs"
                  value={formData.specialties}
                  onChange={(e) => setFormData({ ...formData, specialties: e.target.value })}
                  className="h-11"
                  placeholder="Ex: Degradê, Barba lenhador"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-avatar">
                  URL da foto <span className="text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <div className="flex gap-3 items-center">
                  <Avatar className="h-11 w-11 shrink-0 rounded-xl border border-border/60 bg-muted/30">
                    <AvatarImage src={formData.avatar_url} className="object-cover" />
                    <AvatarFallback className="rounded-xl text-xs font-serif text-muted-foreground bg-transparent">
                      {getInitials(formData.display_name)}
                    </AvatarFallback>
                  </Avatar>
                  <Input
                    id="p-avatar"
                    type="url"
                    value={formData.avatar_url}
                    onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                    className="h-11 flex-1"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="p-bio">
                  Biografia <span className="text-muted-foreground font-normal">(Opcional)</span>
                </Label>
                <Textarea
                  id="p-bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="resize-none h-20"
                  placeholder="Conte um pouco sobre a experiência do profissional..."
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-muted/10">
                <div className="space-y-0.5">
                  <Label className="text-sm">Profissional ativo</Label>
                  <p className="text-[10px] text-muted-foreground">
                    Profissionais inativos deixam de aparecer nas áreas públicas que usam essa
                    configuração.
                  </p>
                </div>
                <Switch
                  checked={formData.active}
                  onCheckedChange={(c) => setFormData({ ...formData, active: c })}
                />
              </div>

              {/* DISPONIBILIDADE SEMANAL */}
              <div className="pt-6 border-t border-border/40 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base flex items-center gap-2 text-foreground">
                    <Clock className="h-4 w-4 text-accent" />
                    Disponibilidade semanal
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Defina os dias e horários em que este profissional pode receber agendamentos.
                  </p>
                </div>

                {hasNoSavedSchedule && (
                  <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Este profissional ainda não possui disponibilidade cadastrada.</span>
                  </div>
                )}

                {loadingHours ? (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    Carregando disponibilidade...
                  </div>
                ) : (
                  <div className="space-y-3 mt-3">
                    {schedule.map((day) => {
                      const hasTimeError =
                        day.isWorking &&
                        day.start_time &&
                        day.end_time &&
                        day.start_time >= day.end_time;
                      const hasBreakError =
                        day.isWorking &&
                        day.hasBreak &&
                        (day.start_time >= day.break_start ||
                          day.break_start >= day.break_end ||
                          day.break_end >= day.end_time);

                      return (
                        <Card
                          key={day.weekday}
                          className={`p-3.5 border transition-all ${
                            day.isWorking
                              ? "border-border/60 bg-card"
                              : "border-border/30 bg-muted/10 opacity-70"
                          }`}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <Switch
                                  id={`pro-day-${day.weekday}`}
                                  checked={day.isWorking}
                                  onCheckedChange={(c) => handleToggleDay(day.weekday, c)}
                                />
                                <Label
                                  htmlFor={`pro-day-${day.weekday}`}
                                  className="font-bold text-sm cursor-pointer"
                                >
                                  {day.name}
                                </Label>
                              </div>
                              <span
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                  day.isWorking
                                    ? "bg-accent/10 text-accent"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {day.isWorking ? "Trabalha neste dia" : "Folga"}
                              </span>
                            </div>

                            {day.isWorking && (
                              <div className="space-y-2 pt-1 border-t border-border/30">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-16">
                                    Horário:
                                  </span>
                                  <Input
                                    type="time"
                                    value={day.start_time}
                                    onChange={(e) =>
                                      handleTimeChange(day.weekday, "start_time", e.target.value)
                                    }
                                    className="w-24 h-8 text-xs font-mono"
                                  />
                                  <span className="text-xs text-muted-foreground">às</span>
                                  <Input
                                    type="time"
                                    value={day.end_time}
                                    onChange={(e) =>
                                      handleTimeChange(day.weekday, "end_time", e.target.value)
                                    }
                                    className="w-24 h-8 text-xs font-mono"
                                  />

                                  <Button
                                    type="button"
                                    variant={day.hasBreak ? "secondary" : "outline"}
                                    size="sm"
                                    onClick={() => handleToggleBreak(day.weekday, !day.hasBreak)}
                                    className="h-8 text-xs ml-auto"
                                  >
                                    <Coffee className="h-3.5 w-3.5 mr-1" />
                                    {day.hasBreak ? "Remover intervalo" : "Adicionar intervalo"}
                                  </Button>
                                </div>

                                {day.hasBreak && (
                                  <div className="flex items-center gap-2 pl-2 border-l-2 border-accent/40 bg-accent/5 p-2 rounded-r-md">
                                    <span className="text-xs text-muted-foreground w-16">
                                      Intervalo:
                                    </span>
                                    <Input
                                      type="time"
                                      value={day.break_start}
                                      onChange={(e) =>
                                        handleTimeChange(day.weekday, "break_start", e.target.value)
                                      }
                                      className="w-24 h-8 text-xs font-mono"
                                      placeholder="Início"
                                    />
                                    <span className="text-xs text-muted-foreground">às</span>
                                    <Input
                                      type="time"
                                      value={day.break_end}
                                      onChange={(e) =>
                                        handleTimeChange(day.weekday, "break_end", e.target.value)
                                      }
                                      className="w-24 h-8 text-xs font-mono"
                                      placeholder="Fim"
                                    />
                                  </div>
                                )}

                                {hasTimeError && (
                                  <p className="text-[11px] text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Início deve ser anterior ao término.
                                  </p>
                                )}
                                {hasBreakError && (
                                  <p className="text-[11px] text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    Intervalo deve estar dentro do horário de trabalho.
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-3 p-4 border-t border-border/40 shrink-0 bg-muted/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-10 text-xs font-bold uppercase tracking-wider"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-10 text-xs font-bold uppercase tracking-wider px-6 bg-accent text-accent-foreground"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar profissional"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
