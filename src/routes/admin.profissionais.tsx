import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { barbershopService, Professional } from "@/services/barbershop.service";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, User, Phone, Mail, Calendar, Trash2, Percent } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profissionais")({ component: Profissionais });

function Profissionais() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const [formOpen, setFormOpen] = useState(false);
  const [editingPro, setEditingPro] = useState<Professional | null>(null);

  const { data: professionals, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  const handleEdit = (p: Professional) => {
    setEditingPro(p);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingPro(null);
    setFormOpen(true);
  };

  const handleClose = () => {
    setFormOpen(false);
    setTimeout(() => setEditingPro(null), 300);
  };

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card/40 p-4 sm:p-5 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Profissionais</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie sua equipe de barbeiros</p>
        </div>
        {canManage && (
          <Button onClick={handleCreate} className="bg-accent text-accent-foreground shrink-0 h-11 px-4">
            <Plus className="mr-2 h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Adicionar</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-24">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-28 animate-pulse rounded-xl border border-border/40 bg-muted/30" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-muted-foreground mb-4">Ocorreu um erro ao carregar os profissionais.</span>
              <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
            </div>
          ) : !Array.isArray(professionals) || professionals.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-20 text-center">
              <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-foreground">Nenhum profissional cadastrado.</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                Adicione membros à equipe para que possam receber agendamentos.
              </p>
              {canManage && (
                <Button onClick={handleCreate} className="mt-6 bg-accent text-accent-foreground font-bold h-11 px-6">
                  Adicionar profissional
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {professionals.map((p) => {
                const commission = p.commission_rule ? (p.commission_rule as any).percentage : 0;
                
                return (
                  <Card key={p.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 rounded-xl border border-border/40 transition-colors hover:border-accent/50 ${!p.active ? 'opacity-60 bg-muted/20' : 'bg-card'}`}>
                    
                    <div className="flex items-start gap-4">
                      <Avatar className="h-14 w-14 border border-border/40">
                        <AvatarImage src={p.avatar_url || ""} alt={p.display_name} className="object-cover" />
                        <AvatarFallback className="bg-accent/10 text-accent font-bold text-lg">
                          {p.display_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground text-lg leading-none">{p.display_name}</h3>
                          {!p.active && <Badge variant="outline" className="text-[10px] text-muted-foreground uppercase border-border leading-none">Inativo</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {Array.isArray(p.specialties) ? p.specialties.join(", ") : "Barbeiro"}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <Percent className="h-3 w-3" /> {commission}% de comissão
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-end gap-2 sm:mt-0 pt-4 sm:pt-0 border-t border-border/40 sm:border-none">
                      <Button 
                        variant="outline" 
                        className="h-10 px-3 bg-card" 
                        onClick={() => navigate({ to: "/admin/agenda" })} 
                        aria-label={`Ver agenda de ${p.display_name}`}
                      >
                        <Calendar className="mr-2 h-4 w-4" /> Agenda
                      </Button>
                      
                      {canManage && (
                        <Button 
                          variant="outline" 
                          className="h-10 px-3" 
                          onClick={() => handleEdit(p)} 
                          aria-label={`Editar ${p.display_name}`}
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Editar
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <ProfessionalFormDialog 
        open={formOpen} 
        onClose={handleClose} 
        shopId={shopId} 
        pro={editingPro} 
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-pros", shopId] })}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------

function ProfessionalFormDialog({ open, onClose, shopId, pro, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    specialties: "",
    commission_percent: "40",
    avatar_url: "",
    active: true,
  });

  useEffect(() => {
    if (open) {
      if (pro) {
        const commission = pro.commission_rule ? (pro.commission_rule as any).percentage : 40;
        setFormData({
          display_name: pro.display_name || "",
          bio: pro.bio || "",
          specialties: Array.isArray(pro.specialties) ? pro.specialties.join(", ") : "",
          commission_percent: String(commission),
          avatar_url: pro.avatar_url || "",
          active: pro.active ?? true,
        });
      } else {
        setFormData({
          display_name: "",
          bio: "",
          specialties: "",
          commission_percent: "40",
          avatar_url: "",
          active: true,
        });
      }
    }
  }, [open, pro]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const commission = parseInt(formData.commission_percent, 10);
    if (isNaN(commission) || commission < 0 || commission > 100) {
      return toast.error("A comissão deve ser um valor entre 0 e 100.");
    }

    const specsArray = formData.specialties
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const payload: any = {
        barbershop_id: shopId,
        display_name: formData.display_name,
        bio: formData.bio,
        specialties: specsArray.length > 0 ? specsArray : undefined,
        commission_percent: commission,
        avatar_url: formData.avatar_url || null,
        active: formData.active,
      };

      if (pro) {
        await barbershopService.updateBarber(pro.id, payload);
        toast.success("Profissional atualizado!");
      } else {
        await barbershopService.createBarber(payload);
        toast.success("Profissional cadastrado com sucesso!");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar profissional.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl">
        <DialogHeader className="p-5 border-b border-border/40 shrink-0 text-left">
          <DialogTitle className="text-xl">{pro ? "Editar Profissional" : "Novo Profissional"}</DialogTitle>
          <DialogDescription>
            {pro ? "Altere as configurações deste membro da equipe." : "Cadastre um novo barbeiro ou funcionário."}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 p-5">
          <form id="pro-form" onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome Completo <span className="text-destructive">*</span></Label>
              <Input 
                id="p-name" 
                value={formData.display_name} 
                onChange={e => setFormData({ ...formData, display_name: e.target.value })} 
                required 
                placeholder="Ex: João Silva" 
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-specs">Especialidades <span className="text-muted-foreground font-normal">(Separadas por vírgula)</span></Label>
              <Input 
                id="p-specs" 
                value={formData.specialties} 
                onChange={e => setFormData({ ...formData, specialties: e.target.value })} 
                placeholder="Ex: Corte Clássico, Barba, Tesoura" 
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-comm">Comissão (%) <span className="text-destructive">*</span></Label>
              <Input 
                id="p-comm" 
                type="number"
                min="0"
                max="100"
                step="1"
                value={formData.commission_percent} 
                onChange={e => setFormData({ ...formData, commission_percent: e.target.value })} 
                required 
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-avatar">Foto URL <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
              <Input 
                id="p-avatar" 
                type="url"
                value={formData.avatar_url} 
                onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} 
                placeholder="https://exemplo.com/foto.jpg" 
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-bio">Biografia / Descrição <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
              <Textarea 
                id="p-bio" 
                value={formData.bio} 
                onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                placeholder="Breve descrição do profissional..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/20 border border-border/40 rounded-xl mt-2">
              <div className="space-y-0.5">
                <Label htmlFor="p-active" className="text-base cursor-pointer">Profissional Ativo</Label>
                <p className="text-xs text-muted-foreground">Se desativado, não receberá novos agendamentos.</p>
              </div>
              <Switch 
                id="p-active" 
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
          <Button type="submit" form="pro-form" disabled={loading} className="h-11 bg-accent text-accent-foreground font-bold">
            {loading ? "Salvando..." : "Salvar Profissional"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
