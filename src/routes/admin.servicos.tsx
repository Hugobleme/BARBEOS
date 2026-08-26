import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { barbershopService, Service } from "@/services/barbershop.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brl, minutes } from "@/lib/format";
import { Plus, Pencil, Scissors, Trash2, Clock, DollarSign, GripVertical, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/servicos")({ component: Servicos });

function Servicos() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const { data: services, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-services", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getServices(shopId!),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => barbershopService.deleteService(id),
    onSuccess: () => {
      toast.success("Serviço excluído.");
      qc.invalidateQueries({ queryKey: ["admin-services", shopId] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir."),
  });

  const handleEdit = (s: Service) => {
    setEditingService(s);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setTimeout(() => setEditingService(null), 300);
  };

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card/40 p-4 sm:p-5 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie o catálogo de serviços da barbearia</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate} className="bg-accent text-accent-foreground shrink-0 h-11 px-4">
            <Plus className="mr-2 h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Cadastrar</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-24">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-24 animate-pulse rounded-xl border border-border/40 bg-muted/30" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-muted-foreground mb-4">Ocorreu um erro ao carregar os serviços.</span>
              <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
            </div>
          ) : !Array.isArray(services) || services.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-20 text-center">
              <Scissors className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-foreground">Você ainda não cadastrou serviços.</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Adicione cortes, barbas, tratamentos e outros serviços oferecidos.
              </p>
              {canManage && (
                <Button onClick={handleCreate} className="mt-6 bg-accent text-accent-foreground font-bold h-11 px-6">
                  Cadastrar primeiro serviço
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((s) => (
                <Card key={s.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 transition-colors hover:border-accent/50 ${!s.active ? 'opacity-60 bg-muted/20' : 'bg-card'}`}>
                  
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10">
                      <Scissors className="h-6 w-6 text-accent" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground text-base">{s.name}</h3>
                        {!s.active && <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase border-border">Inativo</Badge>}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {minutes(s.duration_min)}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-accent">
                          <DollarSign className="h-3 w-3" /> {brl(Number(s.price || 0))}
                        </span>
                        {s.sort !== null && s.sort > 0 && (
                          <span className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 opacity-50" /> Ordem: {s.sort}
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1 opacity-80">{s.description}</p>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="mt-4 flex items-center justify-end gap-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-none">
                      <Button variant="outline" className="h-10 px-3" onClick={() => handleEdit(s)} aria-label={`Editar ${s.name}`}>
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                      </Button>
                      <Button 
                        variant="outline" 
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 h-10 w-10 p-0 shrink-0"
                        aria-label={`Excluir ${s.name}`}
                        onClick={() => {
                          if (confirm(`Excluir permanentemente o serviço "${s.name}"? Agendamentos passados não perderão o registro do serviço em seus totais, mas links podem quebrar.`)) {
                            deleteMut.mutate(s.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <ServiceFormDialog 
        open={formOpen} 
        onClose={handleClose} 
        shopId={shopId} 
        service={editingService} 
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-services", shopId] })}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------

function ServiceFormDialog({ open, onClose, shopId, service, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_min: "30",
    price: "0.00",
    active: true,
    sort: "",
  });

  useEffect(() => {
    if (open) {
      if (service) {
        setFormData({
          name: service.name || "",
          description: service.description || "",
          duration_min: String(service.duration_min || 30),
          price: (service.price || 0).toFixed(2),
          active: service.active ?? true,
          sort: service.sort ? String(service.sort) : "",
        });
      } else {
        setFormData({
          name: "",
          description: "",
          duration_min: "30",
          price: "0.00",
          active: true,
          sort: "",
        });
      }
    }
  }, [open, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const dur = parseInt(formData.duration_min, 10);
    const prc = parseFloat(formData.price.replace(",", "."));
    const srt = formData.sort ? parseInt(formData.sort, 10) : null;

    if (dur <= 0) return toast.error("A duração deve ser maior que zero.");
    if (prc < 0) return toast.error("O preço não pode ser negativo.");

    setLoading(true);
    try {
      if (service) {
        await barbershopService.updateService(service.id, {
          name: formData.name,
          description: formData.description,
          duration_min: dur,
          price: prc,
          active: formData.active,
          sort: srt,
        });
        toast.success("Serviço atualizado!");
      } else {
        await barbershopService.createService({
          barbershop_id: shopId,
          name: formData.name,
          description: formData.description,
          duration_min: dur,
          price: prc,
          active: formData.active,
          sort: srt || undefined,
        } as any); 
        toast.success("Serviço criado com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar serviço.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-5 border-b border-border/40 shrink-0 text-left">
          <DialogTitle className="text-xl">{service ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
          <DialogDescription>
            {service ? "Altere as configurações deste serviço." : "Cadastre um novo serviço para sua barbearia."}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-5">
          <form id="service-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="s-name">Nome do Serviço <span className="text-destructive">*</span></Label>
              <Input 
                id="s-name" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required 
                placeholder="Ex: Corte Degradê" 
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="s-desc">Descrição <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
              <Textarea 
                id="s-desc" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                placeholder="Detalhes sobre o serviço..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-dur">Duração (minutos) <span className="text-destructive">*</span></Label>
                <Input 
                  id="s-dur" 
                  type="number"
                  min="1"
                  step="1"
                  value={formData.duration_min} 
                  onChange={e => setFormData({ ...formData, duration_min: e.target.value })} 
                  required 
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s-price">Preço (R$) <span className="text-destructive">*</span></Label>
                <Input 
                  id="s-price" 
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price} 
                  onChange={e => setFormData({ ...formData, price: e.target.value })} 
                  required 
                  className="h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-sort">Ordem de exibição</Label>
                <Input 
                  id="s-sort" 
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex: 1"
                  value={formData.sort} 
                  onChange={e => setFormData({ ...formData, sort: e.target.value })} 
                  className="h-11"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl mt-2">
              <div className="space-y-0.5">
                <Label htmlFor="s-active" className="text-base cursor-pointer">Serviço Ativo</Label>
                <p className="text-xs text-muted-foreground">Clientes poderão ver e agendar.</p>
              </div>
              <Switch 
                id="s-active" 
                checked={formData.active}
                onCheckedChange={c => setFormData({ ...formData, active: c })}
              />
            </div>

          </form>
        </ScrollArea>
        
        <div className="p-5 border-t border-border/40 shrink-0 flex flex-col sm:flex-row justify-end gap-3 bg-background">
          <Button type="button" variant="outline" className="h-11" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" form="service-form" disabled={loading} className="h-11 bg-accent text-accent-foreground font-bold">
            {loading ? "Salvando..." : "Salvar Serviço"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
