// @ts-nocheck
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { loyaltyService, type Reward } from "@/services/loyalty.service";
import { customerService } from "@/services/customer.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Gift, Plus, Trophy, Coins, Pencil, Trash2, ArrowRightLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/admin/fidelidade")({
  component: AdminLoyaltyPage,
});

function AdminLoyaltyPage() {
  const { shopId, shop } = useCurrentShop();
  const isOwner = shop?.role === 'owner';
  const isAdmin = shop?.role === 'admin' || shop?.role === 'manager';
  const canManage = isOwner || isAdmin;
  const qc = useQueryClient();

  const [rewardFormOpen, setRewardFormOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);

  const [pointsFormOpen, setPointsFormOpen] = useState(false);

  const { data: rewards = [], isLoading: loadingRewards } = useQuery({
    queryKey: ["admin-rewards", shopId],
    enabled: !!shopId,
    queryFn: () => loyaltyService.getRewards(shopId!),
  });

  const { data: balances = [], isLoading: loadingBalances } = useQuery({
    queryKey: ["admin-loyalty-balances", shopId],
    enabled: !!shopId,
    queryFn: () => loyaltyService.getCustomersWithPoints(shopId!),
  });

  const deleteRewardMut = useMutation({
    mutationFn: (id: string) => loyaltyService.deleteReward(id),
    onSuccess: () => {
      toast.success("Recompensa removida.");
      qc.invalidateQueries({ queryKey: ["admin-rewards", shopId] });
    },
  });

  const handleDeleteReward = (r: Reward) => {
    if (confirm(`Excluir a recompensa "${r.name}"?`)) {
      deleteRewardMut.mutate(r.id);
    }
  };

  const openNewReward = () => {
    setEditingReward(null);
    setRewardFormOpen(true);
  };
  const openEditReward = (r: Reward) => {
    setEditingReward(r);
    setRewardFormOpen(true);
  };

    if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-[60vh]">
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">
          Não encontramos uma barbearia vinculada à sua conta.
        </h2>
      </div>
    );
  }



  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-accent" /> Fidelidade
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Programa de pontos e recompensas</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canManage && (
            <>
              <Button onClick={() => setPointsFormOpen(true)} variant="outline" className="flex-1 sm:flex-none h-11 border-accent/30 text-accent hover:bg-accent/10">
                <ArrowRightLeft className="h-4 w-4 mr-2" /> Ajustar Pontos
              </Button>
              <Button onClick={openNewReward} className="flex-1 sm:flex-none bg-accent text-accent-foreground h-11">
                <Plus className="h-4 w-4 mr-2" /> Nova Recompensa
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 pb-24 space-y-6 sm:space-y-8">
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Card className="p-4 bg-card/40 flex items-center gap-3 border-border/40">
              <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
                <Trophy className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Recompensas</p>
                <p className="text-xl sm:text-2xl font-black">{rewards.length}</p>
              </div>
            </Card>
            <Card className="p-4 bg-card/40 flex items-center gap-3 border-border/40">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Coins className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-bold uppercase">Clientes com Pontos</p>
                <p className="text-xl sm:text-2xl font-black">{balances.length}</p>
              </div>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Gift className="h-5 w-5 text-accent" /> Recompensas Disponíveis
            </h2>
            
            {loadingRewards ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {[1,2].map(i => <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />)}
              </div>
            ) : rewards.length === 0 ? (
              <div className="p-6 sm:p-8 text-center border border-dashed border-border/40 rounded-xl bg-muted/10">
                <h3 className="font-bold">Você ainda não cadastrou recompensas.</h3>
                  <p className="text-muted-foreground text-sm mt-1">Comece adicionando a primeira recompensa.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rewards.map(r => (
                  <Card key={r.id} className="p-4 sm:p-5 flex flex-col justify-between gap-4 border-border/40 group">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold text-foreground line-clamp-2">{r.name}</h3>
                        {!r.active && <Badge variant="outline" className="text-[10px]">Inativo</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">{r.description || "Nenhuma descrição."}</p>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border/40 pt-3">
                      <span className="font-bold text-accent text-sm flex items-center gap-1.5">
                        <Coins className="h-4 w-4" /> {r.sessions_total} pontos
                      </span>
                      {canManage && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => openEditReward(r)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteReward(r)}>
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

          <div>
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" /> Top Clientes
            </h2>
            
            <Card className="border-border/40 overflow-hidden">
              {loadingBalances ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}
                </div>
              ) : balances.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">Nenhum cliente com pontos no momento.</div>
              ) : (
                <div className="divide-y divide-border/20">
                  {balances.slice(0, 10).map((b, i) => (
                    <div key={b.id} className="p-3 sm:p-4 flex items-center justify-between hover:bg-card/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-full bg-accent/10 text-accent font-bold text-xs flex items-center justify-center">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-bold">{b.customer?.full_name || "Desconhecido"}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">{b.customer?.phone || "Sem telefone"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-accent">{b.points} <span className="text-[10px] text-muted-foreground uppercase font-normal tracking-wider">pts</span></p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

        </div>
      </ScrollArea>

      {rewardFormOpen && (
        <RewardForm 
          open={rewardFormOpen} 
          onClose={() => setRewardFormOpen(false)} 
          shopId={shopId!} 
          reward={editingReward} 
          onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-rewards", shopId] })} 
        />
      )}

      {pointsFormOpen && (
        <PointsForm 
          open={pointsFormOpen} 
          onClose={() => setPointsFormOpen(false)} 
          shopId={shopId!} 
          rewards={rewards.filter(r => r.active)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-loyalty-balances", shopId] })} 
        />
      )}
    </div>
  );
}

function RewardForm({ open, onClose, shopId, reward, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: reward?.name || "",
    description: reward?.description || "",
    points_required: reward?.sessions_total?.toString() || "",
    active: reward ? reward.active : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("O nome é obrigatório.");
    
    const pts = parseInt(form.points_required);
    if (isNaN(pts) || pts <= 0) return toast.error("Os pontos necessários devem ser maiores que zero.");

    setLoading(true);
    try {
      if (reward) {
        await loyaltyService.updateReward(reward.id, {
          name: form.name.trim(),
          description: form.description.trim() || null,
          sessions_total: pts,
          active: form.active,
        });
        toast.success("Recompensa atualizada.");
      } else {
        await loyaltyService.createReward({
          barbershop_id: shopId,
          name: form.name.trim(),
          description: form.description.trim() || null,
          points_required: pts,
          active: form.active,
        });
        toast.success("Recompensa criada.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar recompensa.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>{reward ? "Editar Recompensa" : "Nova Recompensa"}</DialogTitle>
          <DialogDescription>Premiações que os clientes podem resgatar.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome da Recompensa <span className="text-destructive">*</span></Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Corte Grátis" required className="h-11" />
          </div>

          <div className="space-y-2">
            <Label>Pontos Necessários <span className="text-destructive">*</span></Label>
            <Input type="number" min="1" step="1" value={form.points_required} onChange={e => setForm({ ...form, points_required: e.target.value })} placeholder="10" required className="h-11" />
          </div>

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex: Válido de ter a sex" className="h-11" />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Label>Recompensa Ativa</Label>
            <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" className="h-11 w-full sm:w-auto bg-accent text-accent-foreground" disabled={loading}>Salvar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PointsForm({ open, onClose, shopId, rewards, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);
  
  const [action, setAction] = useState<"add"|"redeem">("add");
  const [points, setPoints] = useState("");
  const [reason, setReason] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (search.length < 3) return toast.error("Digite ao menos 3 caracteres.");
    
    setLoading(true);
    try {
      const results = await customerService.searchCustomers(shopId, search);
      setCustomers(Array.isArray(results) ? results : []);
      if (results.length === 0) toast.error("Nenhum cliente encontrado.");
    } catch (err: any) {
      toast.error("Erro na busca.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (c: any) => {
    setCustomer(c);
    setCustomers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return toast.error("Selecione um cliente.");
    
    const pts = parseInt(points);
    if (isNaN(pts) || pts <= 0) return toast.error("A quantidade de pontos deve ser maior que zero.");
    
    if (action === "redeem") {
      if (!confirm(`Deseja realmente resgatar ${pts} pontos de ${customer.full_name}?`)) return;
    } else {
      if (!confirm(`Deseja adicionar ${pts} pontos para ${customer.full_name}?`)) return;
    }

    setLoading(true);
    try {
      if (action === "add") {
        await loyaltyService.addPoints({
          barbershopId: shopId,
          customerId: customer.id,
          points: pts,
          reason: reason.trim() || "Ajuste manual",
        });
        toast.success("Pontos adicionados com sucesso.");
      } else {
        await loyaltyService.redeemPoints({
          barbershopId: shopId,
          customerId: customer.id,
          points: pts,
          reason: reason.trim() || "Resgate manual",
        });
        toast.success("Resgate realizado com sucesso.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro na operação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Ajustar Pontos / Resgatar</DialogTitle>
          <DialogDescription>Adicione pontos manualmente ou faça um resgate.</DialogDescription>
        </DialogHeader>

        {!customer ? (
          <div className="space-y-4 py-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nome ou telefone..." className="h-11" />
              <Button type="submit" disabled={loading} className="h-11 px-4">Buscar</Button>
            </form>
            
            {customers.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border/40 p-2 rounded-lg">
                {customers.map(c => (
                  <div key={c.id} onClick={() => handleSelectCustomer(c)} className="p-2 hover:bg-muted cursor-pointer rounded text-sm">
                    <p className="font-bold">{c.full_name}</p>
                    <p className="text-muted-foreground">{c.phone || c.email || "Sem contato"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="p-3 bg-muted/30 border border-border/40 rounded-lg flex justify-between items-center">
              <div>
                <p className="font-bold text-sm">{customer.full_name}</p>
                <p className="text-xs text-muted-foreground">Cliente selecionado</p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setCustomer(null)} className="h-8 px-2 text-xs">Alterar</Button>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
              <div 
                className={`text-center p-2 rounded-md cursor-pointer text-sm font-bold transition-colors ${action === "add" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                onClick={() => setAction("add")}
              >
                Adicionar
              </div>
              <div 
                className={`text-center p-2 rounded-md cursor-pointer text-sm font-bold transition-colors ${action === "redeem" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}
                onClick={() => setAction("redeem")}
              >
                Resgatar
              </div>
            </div>

            {action === "redeem" && rewards.length > 0 && (
              <div className="space-y-2">
                <Label>Recompensa Rápida</Label>
                <div className="flex flex-wrap gap-2">
                  {rewards.map((r:any) => (
                    <Badge 
                      key={r.id} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      onClick={() => { setPoints(r.sessions_total.toString()); setReason(`Resgate: ${r.name}`); }}
                    >
                      {r.name} ({r.sessions_total} pts)
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Quantidade de Pontos <span className="text-destructive">*</span></Label>
              <Input type="number" min="1" step="1" value={points} onChange={e => setPoints(e.target.value)} required className="h-11" placeholder="Ex: 5" />
            </div>

            <div className="space-y-2">
              <Label>Motivo / Observação</Label>
              <Input value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex: Correção de saldo" className="h-11" />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button type="submit" className="h-11 w-full sm:w-auto bg-accent text-accent-foreground" disabled={loading}>Confirmar</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

