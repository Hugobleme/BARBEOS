import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { barbershopService, Service } from "@/services/barbershop.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { brl } from "@/lib/format";
import { 
  Plus, 
  Pencil, 
  Scissors, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  RefreshCcw,
  CheckCircle2,
  XCircle,
  Eye,
  Settings
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/servicos")({ component: ServicesPage });

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return "0 min";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}min`;
}

function ServicesPage() {
  const { shopId } = useCurrentShop();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Shop details for the public profile link
  const { data: barbershop } = useQuery({
    queryKey: ["admin-config-servicos", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase.from("barbershops").select("slug").eq("id", shopId!).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: services, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-services", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getServices(shopId!),
  });

  const toggleStatusMut = useMutation({
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      return barbershopService.updateService(id, { active });
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-services", shopId] });
    },
    onError: () => toast.error("Não foi possível atualizar o status. Tente novamente.")
  });

  const handleEdit = (s: Service) => {
    setEditingService(s);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingService(null);
    setFormOpen(true);
  };

  const handleToggleActive = (s: Service) => {
    if (s.active) {
      if (window.confirm("Desativar este serviço?\\nClientes deixarão de vê-lo no perfil público enquanto ele estiver inativo.")) {
        toggleStatusMut.mutate({ id: s.id, active: false });
      }
    } else {
      toggleStatusMut.mutate({ id: s.id, active: true });
    }
  };

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto h-[60vh]">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">Não encontramos uma barbearia vinculada à sua conta.</h2>
        <p className="text-muted-foreground text-sm">Conclua o cadastro da unidade ou procure o responsável pela conta.</p>
      </div>
    );
  }

  const activeCount = services?.filter(s => s.active).length || 0;
  const totalCount = services?.length || 0;
  const hasSlug = Boolean(barbershop?.slug);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pt-4 pb-12 px-4 sm:px-6">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">CATÁLOGO DA UNIDADE</p>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Serviços e preços</h1>
          <p className="text-sm text-muted-foreground max-w-xl">Organize os serviços que sua barbearia oferece e mantenha as informações claras para os clientes.</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-md mt-4 w-fit">
            <Info className="h-3 w-3" />
            <span>Serviços ativos podem aparecer no perfil público da sua barbearia.</span>
          </div>
        </div>
        <Button onClick={handleCreate} className="h-11 px-6 font-bold uppercase tracking-wider text-xs shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Novo serviço
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-32 mb-6" />
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <Card className="p-8 text-center bg-card border-destructive/20 space-y-4">
              <AlertTriangle className="h-10 w-10 text-destructive/40 mx-auto" />
              <h3 className="text-lg font-bold">Não foi possível carregar os serviços.</h3>
              <p className="text-muted-foreground text-sm">Tente novamente em alguns instantes.</p>
              <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-2">
                <RefreshCcw className="h-4 w-4 mr-2" /> Tentar novamente
              </Button>
            </Card>
          ) : totalCount === 0 ? (
            <Card className="p-12 text-center bg-card border-dashed border-border/60">
              <Scissors className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold font-serif mb-2">Você ainda não cadastrou serviços.</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">Comece adicionando os serviços principais da sua barbearia.</p>
              <Button onClick={handleCreate} className="font-bold uppercase tracking-wider text-xs">
                Cadastrar primeiro serviço
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span>{totalCount} {totalCount === 1 ? 'serviço cadastrado' : 'serviços cadastrados'}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-accent">{activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}</span>
              </div>
              
              <div className="grid gap-3">
                {services.map((s) => (
                  <Card key={s.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border/40 transition-colors ${!s.active ? 'opacity-60 bg-muted/10' : 'bg-card hover:border-accent/40'}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-base truncate">{s.name}</h3>
                        {s.active ? (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">Ativo</span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-border bg-muted text-muted-foreground">Inativo</span>
                        )}
                      </div>
                      
                      {s.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 max-w-xl">{s.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-foreground font-medium">
                        <span className="flex items-center gap-1.5 opacity-80">
                          <Clock className="h-3.5 w-3.5" /> {formatDuration(s.duration_min)}
                        </span>
                        <span className="flex items-center gap-1.5 font-bold text-accent">
                          <DollarSign className="h-3.5 w-3.5" /> {brl(Number(s.price || 0))}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:self-center self-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20 w-full sm:w-auto">
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(s)} className={`flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider h-9 ${s.active ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30' : 'hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30'}`}>
                        {s.active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(s)} className="flex-1 sm:flex-none text-xs font-bold uppercase tracking-wider h-9">
                        Editar
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
              Como seus serviços aparecem
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Mantenha nome, duração e preço atualizados para que o perfil da sua barbearia apresente informações mais claras.
            </p>
            {hasSlug ? (
              <Button asChild variant="outline" className="w-full text-xs font-bold uppercase tracking-wider border-accent/40 text-accent hover:bg-accent/10">
                <Link to={`/b/${barbershop.slug}`} target="_blank">Ver perfil público</Link>
              </Button>
            ) : (
              <div className="space-y-3 pt-3 border-t border-border/40">
                <p className="text-xs text-amber-500 font-medium">Complete o perfil da barbearia para revisar sua página pública.</p>
                <Button asChild variant="outline" className="w-full text-xs font-bold uppercase tracking-wider">
                  <Link to="/admin/configuracoes">Editar perfil</Link>
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>

      <ServiceFormDialog 
        open={formOpen} 
        onClose={() => setFormOpen(false)} 
        service={editingService} 
        shopId={shopId} 
        onSuccess={() => refetch()} 
      />
    </div>
  );
}

function ServiceFormDialog({ 
  open, 
  onClose, 
  service, 
  shopId, 
  onSuccess 
}: { 
  open: boolean; 
  onClose: () => void; 
  service: Service | null; 
  shopId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration_min: "30",
    price: "0.00",
    active: true,
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
        });
      } else {
        setFormData({
          name: "",
          description: "",
          duration_min: "30",
          price: "0.00",
          active: true,
        });
      }
    }
  }, [open, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const name = formData.name.trim();
    if (!name) return toast.error("Informe o nome do serviço.");

    const dur = parseInt(formData.duration_min, 10);
    if (isNaN(dur) || dur <= 0) return toast.error("Informe uma duração válida.");

    const prc = parseFloat(formData.price.replace(",", "."));
    if (isNaN(prc) || prc < 0) return toast.error("Informe um preço válido.");

    setLoading(true);
    try {
      if (service) {
        await barbershopService.updateService(service.id, {
          name,
          description: formData.description.trim() || null,
          duration_min: dur,
          price: prc,
          active: formData.active,
        });
        toast.success("Serviço atualizado com sucesso.");
      } else {
        await barbershopService.createService({
          barbershop_id: shopId,
          name,
          description: formData.description.trim() || null,
          duration_min: dur,
          price: prc,
          active: formData.active,
        }); 
        toast.success("Serviço cadastrado com sucesso.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Não foi possível salvar o serviço. Tente novamente.");
      if (import.meta.env.DEV) {
        console.error("Service save error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden bg-card border-border/60">
        <DialogHeader className="p-6 pb-4 border-b border-border/40">
          <DialogTitle className="font-serif text-xl">{service ? "Editar serviço" : "Novo serviço"}</DialogTitle>
          <DialogDescription className="text-xs">
            {service ? "Altere as informações deste serviço." : "Cadastre um novo serviço para sua barbearia."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s-name">Nome do serviço <span className="text-destructive">*</span></Label>
              <Input 
                id="s-name" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required 
                className="h-11"
                placeholder="Ex: Corte Degradê"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="s-desc">Descrição</Label>
              <Textarea 
                id="s-desc" 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                className="resize-none h-20"
                placeholder="Detalhes opcionais que o cliente verá ao agendar..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="s-dur">Duração (Min) <span className="text-destructive">*</span></Label>
                <Input 
                  id="s-dur" 
                  type="number"
                  min="5"
                  step="5"
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

            <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-muted/10">
              <div className="space-y-0.5">
                <Label className="text-sm">Serviço ativo</Label>
                <p className="text-[10px] text-muted-foreground">Exibir no perfil público</p>
              </div>
              <Switch 
                checked={formData.active} 
                onCheckedChange={c => setFormData({ ...formData, active: c })} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
            <Button type="button" variant="outline" onClick={onClose} className="h-10 text-xs font-bold uppercase tracking-wider" disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" className="h-10 text-xs font-bold uppercase tracking-wider px-6" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}


