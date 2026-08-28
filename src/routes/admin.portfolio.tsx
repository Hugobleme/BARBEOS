import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { barbershopService } from "@/services/barbershop.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ImagePlus, Plus, Trash2, User, Image as ImageIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/portfolio")({
  component: PortfolioPage,
});

function PortfolioPage() {
  const { shopId } = useCurrentShop();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data: professionals = [] } = useQuery({
    queryKey: ["admin-pros", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getBarbers(shopId!),
  });

  const { data: items = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-portfolio", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("id, barbershop_id, caption, image_url, professional_id, created_at")
        .eq("barbershop_id", shopId!)
        .order("created_at", { ascending: false });
        
      if (error) {
        if (import.meta.env.DEV) {
          console.error("Portfolio query failed", error);
        }
        throw error;
      }
      return data || [];
    }
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Foto removida do portfólio.");
      qc.invalidateQueries({ queryKey: ["admin-portfolio", shopId] });
    }
  });

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            <ImagePlus className="h-6 w-6 text-accent" /> Portfólio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Mostre seus melhores cortes e trabalhos</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button onClick={() => setFormOpen(true)} className="bg-accent text-accent-foreground shrink-0 h-11 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Adicionar Foto
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-6xl p-4 sm:p-6 pb-24">
          
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => <Card key={i} className="aspect-square animate-pulse rounded-xl border border-border/40 bg-muted/30" />)}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-destructive/30 rounded-xl bg-destructive/5 text-destructive mt-8">
              <p className="font-bold mb-2">O portfólio ainda não está configurado nesta unidade.</p>
              <p className="text-sm opacity-80 max-w-md mx-auto mb-4">Estamos preparando a infraestrutura para que você possa exibir seus trabalhos em breve.</p>
              <Button onClick={() => refetch()} variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10">Tentar novamente</Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/40 rounded-xl bg-muted/10 mt-8">
              <ImageIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-bold text-foreground">Seu portfólio ainda está vazio.</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">Adicione fotos dos seus melhores trabalhos.</p>
              <Button onClick={() => setFormOpen(true)} variant="outline" className="mt-6 border-accent/30 text-accent hover:bg-accent/10">Adicionar Primeira Foto</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {items.map(it => {
                const pro = it.professional_id ? professionals.find(p => p.id === it.professional_id) : null;
                
                return (
                  <Card key={it.id} className="group relative rounded-xl border border-border/40 overflow-hidden bg-card flex flex-col h-full shadow-sm hover:shadow-md transition-all">
                    
                    <div className="aspect-[4/5] sm:aspect-square relative overflow-hidden bg-muted">
                      <img 
                        src={it.image_url} 
                        alt={it.caption || "Corte"} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                          (e.target as HTMLImageElement).classList.add('object-contain', 'p-8', 'opacity-50');
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity z-10" 
                        onClick={() => {
                          if (confirm("Remover esta foto do portfólio?")) deleteMut.mutate(it.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-foreground line-clamp-1">{it.caption || "Sem título"}</span>
                      </div>
                      {pro && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted/40 px-1.5 py-0.5 rounded-sm w-fit truncate max-w-full">
                          <User className="h-3 w-3 shrink-0" /> <span className="truncate">{pro.display_name}</span>
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <PortfolioForm open={formOpen} onClose={() => setFormOpen(false)} shopId={shopId} professionals={professionals} onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-portfolio", shopId] })} />
    </div>
  );
}

function PortfolioForm({ open, onClose, shopId, professionals, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    image_url: "",
    caption: "",
    professional_id: "none"
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url.trim()) return toast.error("A URL da imagem é obrigatória.");

    setLoading(true);
    try {
      const { error } = await supabase.from("portfolio_items").insert({
        barbershop_id: shopId,
        image_url: formData.image_url.trim(),
        caption: formData.caption.trim() || null,
        professional_id: formData.professional_id === "none" ? null : formData.professional_id,
      });

      if (error) throw error;
      toast.success("Foto adicionada ao portfólio!");
      onSuccess();
      onClose();
      setFormData({ image_url: "", caption: "", professional_id: "none" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar foto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Nova Foto</DialogTitle>
          <DialogDescription>
            Adicione uma imagem externa ao portfólio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          
          <div className="space-y-2">
            <Label>URL da Imagem <span className="text-destructive">*</span></Label>
            <Input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://exemplo.com/corte.jpg" required className="h-11" />
            
            {formData.image_url && (
              <div className="mt-2 aspect-[4/3] sm:aspect-video w-full rounded-lg bg-muted border border-border/40 overflow-hidden flex items-center justify-center">
                <img 
                  src={formData.image_url} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                    (e.target as HTMLImageElement).classList.add('object-none');
                  }}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Título / Descrição Curta</Label>
            <Input value={formData.caption} onChange={e => setFormData({ ...formData, caption: e.target.value })} placeholder="Ex: Degradê com barba" className="h-11" />
          </div>

          <div className="space-y-2">
            <Label>Profissional (Opcional)</Label>
            <Select value={formData.professional_id} onValueChange={(v) => setFormData({ ...formData, professional_id: v })}>
              <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Geral / Nenhum</SelectItem>
                {professionals.map((p:any) => (
                  <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-6">
            <Button type="button" variant="outline" className="h-11" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" className="h-11 bg-accent text-accent-foreground font-bold" disabled={loading}>
              {loading ? "Adicionando..." : "Adicionar Foto"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
