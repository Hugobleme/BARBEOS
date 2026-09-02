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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
  Info
} from "lucide-react";
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
      const { data, error } = await supabase.from("barbershops").select("slug").eq("id", shopId!).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: professionals = [], isLoading, isError, refetch } = useQuery({
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
    mutationFn: async ({ id, active }: { id: string, active: boolean }) => {
      return barbershopService.updateBarber(id, { active });
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["admin-pros", shopId] });
    },
    onError: () => toast.error("Não foi possível atualizar o status. Tente novamente.")
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
      if (window.confirm("Desativar este profissional?\\nEle deixará de aparecer nas áreas públicas que consideram profissionais ativos.")) {
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
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">Não encontramos uma barbearia vinculada Ã  sua conta.</h2>
        <p className="text-muted-foreground text-sm">Conclua o cadastro da unidade ou procure o responsável pela conta.</p>
      </div>
    );
  }

  const activeCount = professionals?.filter(p => p.active).length || 0;
  const totalCount = professionals?.length || 0;
  const hasSlug = Boolean(barbershop?.slug);

  return (
    <div className="space-y-8 max-w-5xl mx-auto pt-4 pb-12 px-4 sm:px-6">
      <header className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/40 pb-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-accent">EQUIPE DA UNIDADE</p>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Profissionais</h1>
          <p className="text-sm text-muted-foreground max-w-xl">Organize os profissionais da sua barbearia e mantenha o perfil da equipe atualizado.</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-md mt-4 w-fit">
            <Info className="h-3 w-3" />
            <span>Profissionais ativos podem aparecer no perfil público da sua barbearia.</span>
          </div>
        </div>
        <Button onClick={handleCreate} className="h-11 px-6 font-bold uppercase tracking-wider text-xs shrink-0 w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Adicionar profissional
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-40 mb-6" />
              {[1, 2, 3].map(i => (
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
              <h3 className="text-xl font-bold font-serif mb-2">Você ainda não cadastrou profissionais.</h3>
              <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">Adicione os integrantes da sua equipe para deixar o perfil da barbearia mais completo.</p>
              <Button onClick={handleCreate} className="font-bold uppercase tracking-wider text-xs">
                Adicionar primeiro profissional
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <span>{totalCount} {totalCount === 1 ? 'profissional cadastrado' : 'profissionais cadastrados'}</span>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span className="text-accent">{activeCount} {activeCount === 1 ? 'ativo' : 'ativos'}</span>
              </div>
              
              <div className="grid gap-3">
                {professionals.map((p) => (
                  <Card key={p.id} className={`p-4 sm:p-5 flex flex-col sm:flex-row gap-4 border-border/40 transition-colors ${!p.active ? 'opacity-60 bg-muted/10' : 'bg-card hover:border-accent/40'}`}>
                    <div className="flex gap-4 flex-1 min-w-0">
                      <Avatar className="h-14 w-14 shrink-0 rounded-xl border border-border/60 bg-muted/30">
                        <AvatarImage src={p.avatar_url || ""} alt={p.display_name} className="object-cover" />
                        <AvatarFallback className="rounded-xl text-base font-serif bg-transparent text-muted-foreground">
                          {getInitials(p.display_name)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-base truncate">{p.display_name}</h3>
                          {p.active ? (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-emerald-500/30 bg-emerald-500/10 text-emerald-500">Ativo</span>
                          ) : (
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-border bg-muted text-muted-foreground">Inativo</span>
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
                      <Button variant="outline" size="sm" onClick={() => handleEdit(p)} className="w-full text-xs font-bold uppercase tracking-wider h-9">
                        Editar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleToggleActive(p)} className={`w-full text-xs font-bold uppercase tracking-wider h-9 ${p.active ? 'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30' : 'hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30'}`}>
                        {p.active ? 'Desativar' : 'Ativar'}
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
              Mantenha nome, especialidades e imagem atualizados para apresentar sua equipe com mais clareza no perfil da barbearia.
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

function ProfessionalFormDialog({ 
  open, 
  onClose, 
  pro, 
  shopId, 
  onSuccess 
}: { 
  open: boolean; 
  onClose: () => void; 
  pro: Professional | null; 
  shopId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: "",
    bio: "",
    specialties: "",
    avatar_url: "",
    active: true,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const name = formData.display_name.trim();
    if (!name) return toast.error("Informe o nome do profissional.");

    const specsArray = formData.specialties
      .split(",")
      .map(s => s.trim())
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

      if (pro) {
        await barbershopService.updateBarber(pro.id, payload);
        toast.success("Profissional atualizado com sucesso.");
      } else {
        await barbershopService.createBarber(payload);
        toast.success("Profissional cadastrado com sucesso.");
      }
      
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error("Não foi possível salvar o profissional. Tente novamente.");
      if (import.meta.env.DEV) {
        console.error("Professional save error:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-full max-w-[425px] p-0 overflow-hidden bg-card border-border/60">
        <DialogHeader className="p-6 pb-4 border-b border-border/40 text-left">
          <DialogTitle className="font-serif text-xl">{pro ? "Editar profissional" : "Adicionar profissional"}</DialogTitle>
          <DialogDescription className="text-xs">
            {pro ? "Altere as informações deste integrante da equipe." : "Cadastre um novo membro para sua barbearia."}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="p-name">Nome de exibição <span className="text-destructive">*</span></Label>
              <Input 
                id="p-name" 
                value={formData.display_name} 
                onChange={e => setFormData({ ...formData, display_name: e.target.value })} 
                required 
                className="h-11"
                placeholder="Ex: João Silva"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-specs">Especialidades <span className="text-muted-foreground font-normal">(Separadas por vírgula)</span></Label>
              <Input 
                id="p-specs" 
                value={formData.specialties} 
                onChange={e => setFormData({ ...formData, specialties: e.target.value })} 
                className="h-11"
                placeholder="Ex: Degradê, Barba lenhador"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-avatar">URL da foto <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
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
                  onChange={e => setFormData({ ...formData, avatar_url: e.target.value })} 
                  className="h-11 flex-1"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-bio">Biografia <span className="text-muted-foreground font-normal">(Opcional)</span></Label>
              <Textarea 
                id="p-bio" 
                value={formData.bio} 
                onChange={e => setFormData({ ...formData, bio: e.target.value })} 
                className="resize-none h-20"
                placeholder="Conte um pouco sobre a experiência do profissional..."
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-border/40 rounded-xl bg-muted/10">
              <div className="space-y-0.5">
                <Label className="text-sm">Profissional ativo</Label>
                <p className="text-[10px] text-muted-foreground">Profissionais inativos deixam de aparecer nas áreas públicas que usam essa configuração.</p>
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



