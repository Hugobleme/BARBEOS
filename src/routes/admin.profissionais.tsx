import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { barbershopService, Professional } from "@/services/barbershop.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CardGridSkeleton, EmptyState } from "@/components/site/LoadingState";
import { Plus, Pencil, UserCog, Trash2, Percent, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profissionais")({ component: Page });

function Page() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const { data: pros, isLoading } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  const [open, setOpen] = useState(false);
  const [editPro, setEditPro] = useState<Professional | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    display_name: "",
    bio: "",
    specialties: "Corte, Barba",
    commission_percent: 40,
    active: true,
  });

  function openNew() {
    if (!canManage) {
      toast.error("Permissão insuficiente: apenas administradores ou proprietários podem adicionar profissionais.");
      return;
    }
    setEditPro(null);
    setForm({
      display_name: "",
      bio: "",
      specialties: "Corte, Barba",
      commission_percent: 40,
      active: true,
    });
    setOpen(true);
  }

  function openEdit(p: Professional) {
    if (!canManage) {
      toast.error("Permissão insuficiente para editar profissionais.");
      return;
    }
    setEditPro(p);
    const rule = (p.commission_rule as any) ?? {};
    const percent = Number(rule.percentage ?? rule.percent ?? rule.rate ?? 40);

    setForm({
      display_name: p.display_name,
      bio: p.bio ?? "",
      specialties: (p.specialties ?? []).join(", "),
      commission_percent: percent,
      active: p.active,
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.display_name.trim()) return toast.error("O nome do profissional é obrigatório.");

    const specialtiesList = form.specialties
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    setBusy(true);
    try {
      if (editPro) {
        await barbershopService.updateBarber(editPro.id, {
          display_name: form.display_name.trim(),
          bio: form.bio.trim() || null,
          specialties: specialtiesList,
          commission_percent: Number(form.commission_percent) || 0,
          active: form.active,
        });
        toast.success("Profissional atualizado com sucesso!");
      } else {
        await barbershopService.createBarber({
          barbershop_id: shopId!,
          display_name: form.display_name.trim(),
          bio: form.bio.trim() || null,
          specialties: specialtiesList,
          commission_percent: Number(form.commission_percent) || 40,
          active: form.active,
        });
        toast.success("Profissional adicionado com sucesso!");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-pros", shopId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar profissional.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(p: Professional) {
    if (!canManage) {
      toast.error("Permissão insuficiente para remover profissionais.");
      return;
    }
    if (!confirm(`Tem certeza que deseja remover o profissional "${p.display_name}"?`)) return;

    try {
      await barbershopService.deleteBarber(p.id);
      toast.success("Profissional removido com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-pros", shopId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover profissional.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Profissionais</h1>
          <p className="text-muted-foreground">Equipe de barbeiros e especialistas da barbearia.</p>
        </div>

        {canManage ? (
          <Button onClick={openNew} className="rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background">
            <Plus className="mr-1.5 h-4 w-4" /> Novo profissional
          </Button>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Modo somente leitura
          </Badge>
        )}
      </div>

      {/* Modal de Criação / Edição de Profissional */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none border-border sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editPro ? "Editar profissional" : "Novo profissional"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="pro_name">Nome completo *</Label>
                <Input
                  id="pro_name"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  placeholder="Ex: Carlos Oliveira"
                  className="rounded-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pro_specialties">Especialidades (separadas por vírgula)</Label>
                <Input
                  id="pro_specialties"
                  value={form.specialties}
                  onChange={(e) => setForm({ ...form, specialties: e.target.value })}
                  placeholder="Ex: Barba Clássica, Degradê, Visagismo"
                  className="rounded-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pro_commission">Comissão padrão (%)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pro_commission"
                    type="number"
                    min={0}
                    max={100}
                    value={form.commission_percent}
                    onChange={(e) => setForm({ ...form, commission_percent: Number(e.target.value) })}
                    className="rounded-none pl-9"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pro_bio">Biografia / Descrição curta</Label>
                <Textarea
                  id="pro_bio"
                  rows={2}
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Especialista com mais de 8 anos de experiência em visagismo..."
                  className="rounded-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <Label htmlFor="pro_active" className="cursor-pointer">
                  Profissional ativo para agendamentos
                </Label>
                <Switch
                  id="pro_active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-none">
                Cancelar
              </Button>
              <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background">
                {busy ? "Salvando..." : "Salvar profissional"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Listagem */}
      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : !pros || pros.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum profissional cadastrado"
          description="Adicione os barbeiros e profissionais para que eles apareçam na agenda e agendamento online."
          action={
            canManage ? (
              <Button onClick={openNew} className="rounded-none bg-accent text-accent-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> Novo profissional
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pros.map((p) => {
            const rule = (p.commission_rule as any) ?? {};
            const percent = Number(rule.percentage ?? rule.percent ?? rule.rate ?? 40);

            return (
              <Card
                key={p.id}
                className="group relative flex flex-col justify-between border border-border bg-card/50 p-6 backdrop-blur-md transition-all hover:border-accent"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-none border border-accent/20">
                      <AvatarFallback className="rounded-none bg-accent/10 font-serif text-lg font-bold text-accent">
                        {p.display_name
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-serif text-xl font-bold truncate">{p.display_name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="rounded-none text-[10px] text-accent border-accent/30">
                          {percent}% comissão
                        </Badge>
                        {!p.active && (
                          <Badge variant="secondary" className="rounded-none text-[10px] uppercase">
                            Inativo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {p.bio && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.bio}</p>}

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {p.specialties?.map((s) => (
                      <Badge key={s} variant="outline" className="rounded-none text-[10px] uppercase border-border/60">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>

                {canManage && (
                  <div className="mt-6 flex gap-2 border-t border-border/40 pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(p)}
                      className="flex-1 rounded-none text-xs"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(p)}
                      className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
