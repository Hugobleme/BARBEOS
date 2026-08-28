import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { barbershopService } from "@/services/barbershop.service";
import { useAuth } from "@/hooks/use-auth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Building2, Plus, ArrowRight, MapPin, Phone, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/admin/franquia")({
  component: AdminFranquiaPage,
});

function AdminFranquiaPage() {
  const { user } = useAuth();
  const { shopId, shops, setShopId, refresh } = useCurrentShop();
  const qc = useQueryClient();

  const [createModalOpen, setCreateModalOpen] = useState(false);

  const shopIds = useMemo(() => shops.map(s => s.id), [shops]);

  // Busca detalhes completos das unidades
  const { data: barbershops = [], isLoading } = useQuery({
    queryKey: ["admin-franquia-shops", shopIds],
    enabled: shopIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershops")
        .select("*")
        .in("id", shopIds)
        .order("created_at");
      if (error) throw error;
      return data;
    },
  });

  // Busca estatísticas básicas do mês
  const { data: stats = {} } = useQuery({
    queryKey: ["admin-franquia-stats", shopIds],
    enabled: shopIds.length > 0,
    queryFn: async () => {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      
      const result: Record<string, { revenue: number, count: number }> = {};
      
      await Promise.all(shopIds.map(async (id) => {
        const { data, error } = await supabase
          .from("appointments")
          .select("total_amount, status")
          .eq("barbershop_id", id)
          .gte("scheduled_start", startOfMonth)
          .lte("scheduled_start", endOfMonth)
          .eq("status", "completed");
          
        if (!error && data) {
          result[id] = {
            count: data.length,
            revenue: data.reduce((acc, curr) => acc + Number(curr.total_amount || 0), 0)
          };
        } else {
          result[id] = { count: 0, revenue: 0 };
        }
      }));
      
      return result;
    },
  });

  const handleSelectShop = (id: string) => {
    if (id === shopId) return;
    setShopId(id);
    toast.success("Unidade alterada com sucesso.");
    setTimeout(() => {
      window.location.href = "/admin";
    }, 500);
  };

  const isSingleUnit = shops.length === 1;

  if (!shopId || !user) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-accent" /> Gestão de Unidades
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Expanda sua rede e gerencie filiais</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button onClick={() => setCreateModalOpen(true)} className="bg-accent text-accent-foreground h-11 w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" /> Cadastrar Unidade
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 pb-24 max-w-5xl mx-auto space-y-6">
          
          {isSingleUnit && (
            <Card className="p-6 sm:p-8 text-center border border-accent/20 bg-accent/5 rounded-xl">
              <Building2 className="h-12 w-12 text-accent/60 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Você administra 1 unidade.</h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                Quando expandir, você poderá cadastrar novas unidades e acompanhar os resultados de toda a sua rede em um só lugar.
              </p>
              <Button onClick={() => setCreateModalOpen(true)} className="bg-accent text-accent-foreground font-bold h-11 px-8">
                Cadastrar Nova Unidade
              </Button>
            </Card>
          )}

          {!isSingleUnit && (
            <div className="grid gap-4 md:grid-cols-2">
              {barbershops.map(b => {
                const isCurrent = b.id === shopId;
                const shopRole = shops.find(s => s.id === b.id)?.role || "membro";
                const stat = stats[b.id] || { count: 0, revenue: 0 };
                const address = b.address as any;
                const cityState = address?.city ? `${address.city} - ${address.state}` : "";
                
                return (
                  <Card key={b.id} className={`p-5 flex flex-col justify-between border ${isCurrent ? 'border-accent shadow-md bg-accent/5' : 'border-border/40 bg-card'} rounded-xl transition-all`}>
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-lg leading-tight flex items-center gap-2">
                            {b.name}
                            {isCurrent && <Badge variant="outline" className="bg-accent text-accent-foreground border-0 text-[10px] h-5">Atual</Badge>}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {!b.active && <Badge variant="outline" className="text-[10px] text-destructive border-destructive/30">Inativa</Badge>}
                            <Badge variant="outline" className="text-[10px] text-muted-foreground capitalize">{shopRole}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5 mt-4">
                        {cityState && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" /> {cityState}
                          </p>
                        )}
                        {(b.contacts as any)?.phone && (
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 shrink-0" /> {(b.contacts as any).phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Faturamento (Mês)</p>
                        <p className="font-bold text-foreground text-sm mt-0.5">{brl(stat.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Atendimentos</p>
                        <p className="font-bold text-foreground text-sm mt-0.5">{stat.count}</p>
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleSelectShop(b.id)} 
                      disabled={isCurrent}
                      variant={isCurrent ? "secondary" : "outline"}
                      className={`w-full mt-5 h-11 ${!isCurrent ? 'hover:bg-accent hover:text-accent-foreground hover:border-accent' : ''}`}
                    >
                      {isCurrent ? (
                        <>Painel Aberto</>
                      ) : (
                        <>Gerenciar Unidade <ArrowRight className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}

        </div>
      </ScrollArea>

      <CreateShopModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        ownerId={user.id}
        onSuccess={() => {
          setCreateModalOpen(false);
          refresh();
        }}
      />
    </div>
  );
}

function CreateShopModal({ open, onOpenChange, ownerId, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    street: "",
    neighborhood: "",
    city: "",
    state: "SP",
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("O nome é obrigatório.");

    setLoading(true);
    try {
      await barbershopService.createBarbershop({
        name: form.name.trim(),
        ownerId,
        phone: form.phone.trim() || undefined,
        address: {
          street: form.street.trim() || null,
          neighborhood: form.neighborhood.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim().toUpperCase() || "SP",
        },
      });

      toast.success("Nova unidade criada com sucesso!");
      setForm({ name: "", phone: "", street: "", neighborhood: "", city: "", state: "SP" });
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar nova unidade.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Cadastrar Nova Unidade</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome da Unidade / Filial <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Barbearia Matriz" required className="h-11" />
          </div>

          <div className="space-y-2">
            <Label>Telefone / WhatsApp</Label>
            <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-0000" className="h-11" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Rua / Endereço</Label>
              <Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} placeholder="Rua 15" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Bairro</Label>
              <Input value={form.neighborhood} onChange={e => setForm({ ...form, neighborhood: e.target.value })} placeholder="Centro" className="h-11" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <Label>Cidade</Label>
              <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="São Paulo" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>UF</Label>
              <Input maxLength={2} value={form.state} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })} placeholder="SP" className="h-11 uppercase" />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" className="h-11 w-full sm:w-auto bg-accent text-accent-foreground" disabled={loading}>
              {loading ? "Criando..." : "Criar Unidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
