import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { barbershopService, Service } from "@/services/barbershop.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CardGridSkeleton, EmptyState } from "@/components/site/LoadingState";
import { brl, minutes } from "@/lib/format";
import { Plus, Pencil, Scissors, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/servicos")({ component: Page });

function Page() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const { data: services, isLoading } = useQuery({
    queryKey: ["admin-services", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getServices(shopId!),
  });

  const [open, setOpen] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_min: 30,
    price: 0,
    active: true,
  });

  function openNew() {
    if (!canManage) {
      toast.error("Permissão insuficiente: apenas administradores ou proprietários podem criar serviços.");
      return;
    }
    setEditService(null);
    setForm({ name: "", description: "", duration_min: 30, price: 0, active: true });
    setOpen(true);
  }

  function openEdit(s: Service) {
    if (!canManage) {
      toast.error("Permissão insuficiente: apenas administradores ou proprietários podem editar serviços.");
      return;
    }
    setEditService(s);
    setForm({
      name: s.name,
      description: s.description ?? "",
      duration_min: s.duration_min,
      price: Number(s.price),
      active: s.active,
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("O nome do serviço é obrigatório.");
    if (!form.duration_min || form.duration_min <= 0) return toast.error("A duração deve ser maior que 0 minutos.");
    if (form.price === undefined || form.price < 0) return toast.error("O preço deve ser válido.");

    setBusy(true);
    try {
      if (editService) {
        await barbershopService.updateService(editService.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_min: form.duration_min,
          price: form.price,
          active: form.active,
        });
        toast.success("Serviço atualizado com sucesso!");
      } else {
        await barbershopService.createService({
          barbershop_id: shopId!,
          name: form.name.trim(),
          description: form.description.trim() || null,
          duration_min: form.duration_min,
          price: form.price,
          active: form.active,
        });
        toast.success("Serviço cadastrado com sucesso!");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-services", shopId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar serviço.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(s: Service) {
    if (!canManage) {
      toast.error("Permissão insuficiente para excluir serviços.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o serviço "${s.name}"?`)) return;

    try {
      await barbershopService.deleteService(s.id);
      toast.success("Serviço excluído com sucesso!");
      qc.invalidateQueries({ queryKey: ["admin-services", shopId] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir serviço.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Catálogo de serviços oferecido pela sua barbearia.</p>
        </div>

        {canManage ? (
          <Button onClick={openNew} className="rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background">
            <Plus className="mr-1.5 h-4 w-4" /> Novo serviço
          </Button>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Modo somente leitura
          </Badge>
        )}
      </div>

      {/* Modal de Criação / Edição de Serviço */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none border-border sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editService ? "Editar serviço" : "Novo serviço"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome do serviço *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Corte Degrade + Barba Terapia"
                  className="rounded-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalhes do serviço, técnicas e produtos utilizados..."
                  className="rounded-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="duration">Duração (minutos) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={5}
                    step={5}
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })}
                    className="rounded-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="price">Preço (R$) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                    className="rounded-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <Label htmlFor="active" className="cursor-pointer">
                  Disponível para agendamento online
                </Label>
                <Switch
                  id="active"
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
                {busy ? "Salvando..." : "Salvar serviço"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Listagem */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : !services || services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço cadastrado"
          description="Cadastre os serviços oferecidos pela barbearia para começar a receber agendamentos."
          action={
            canManage ? (
              <Button onClick={openNew} className="rounded-none bg-accent text-accent-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> Novo serviço
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <Card
              key={s.id}
              className="group relative flex flex-col justify-between border border-border bg-card/50 p-6 backdrop-blur-md transition-all hover:border-accent"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-none bg-accent/10 text-accent">
                    <Scissors className="h-5 w-5" />
                  </div>
                  {!s.active && (
                    <Badge variant="secondary" className="rounded-none text-[10px] font-bold uppercase">
                      Inativo
                    </Badge>
                  )}
                </div>

                <div>
                  <h3 className="font-serif text-xl font-bold text-foreground">{s.name}</h3>
                  {s.description && (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 border-t border-border/40 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Duração
                    </span>
                    <span className="text-xs font-semibold text-foreground">{minutes(s.duration_min)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Preço
                    </span>
                    <div className="font-serif text-lg font-bold text-accent">{brl(Number(s.price))}</div>
                  </div>
                </div>

                {canManage && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(s)}
                      className="flex-1 rounded-none text-xs"
                    >
                      <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(s)}
                      className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
