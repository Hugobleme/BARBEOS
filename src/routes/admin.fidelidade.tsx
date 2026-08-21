import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { loyaltyService, Reward, LoyaltyBalance } from "@/services/loyalty.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { EmptyState, TableSkeleton, CardGridSkeleton } from "@/components/site/LoadingState";
import { toast } from "sonner";
import { Gift, Search, Sparkles, Plus, Trash2, Pencil, Award, Users, ShieldAlert, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/admin/fidelidade")({
  head: () => ({ meta: [{ title: "Fidelidade — Admin BarberOS" }, { name: "robots", content: "noindex" }] }),
  component: Page,
});

function Page() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const [q, setQ] = useState("");
  const [openRewardDialog, setOpenRewardDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [rewardForm, setRewardForm] = useState({
    name: "",
    description: "",
    points_required: 100,
    active: true,
  });
  const [busyReward, setBusyReward] = useState(false);

  // Modal de resgate de pontos
  const [redeemCustomer, setRedeemCustomer] = useState<LoyaltyBalance | null>(null);
  const [redeemPointsAmount, setRedeemPointsAmount] = useState(50);
  const [redeemReason, setRedeemReason] = useState("");
  const [busyRedeem, setBusyRedeem] = useState(false);

  // Configurações do programa de fidelidade
  const { data: settings, refetch: refetchSettings } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-settings", shopId],
    queryFn: async () => {
      const { data } = await supabase.from("barbershops").select("settings").eq("id", shopId!).single();
      const l = ((data?.settings as any)?.loyalty ?? {}) as { enabled?: boolean; points_per_real?: number; redeem_rate?: number };
      return { enabled: !!l.enabled, points_per_real: Number(l.points_per_real ?? 1), redeem_rate: Number(l.redeem_rate ?? 100) };
    },
  });

  // Lista de Recompensas
  const { data: rewards, isLoading: loadingRewards, refetch: refetchRewards } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-rewards", shopId],
    queryFn: () => loyaltyService.getRewards(shopId!),
  });

  // Lista de Clientes com Saldo de Pontos
  const { data: balances, isLoading: loadingBalances, refetch: refetchBalances } = useQuery({
    enabled: !!shopId,
    queryKey: ["loyalty-balances", shopId],
    queryFn: () => loyaltyService.getCustomersWithPoints(shopId!),
  });

  const filteredBalances = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return balances ?? [];
    return (balances ?? []).filter((b: any) =>
      (b.customer?.full_name ?? "").toLowerCase().includes(term) ||
      (b.customer?.phone ?? "").toLowerCase().includes(term)
    );
  }, [balances, q]);

  async function saveSettings(next: { enabled: boolean; points_per_real: number; redeem_rate: number }) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    const { data: cur } = await supabase.from("barbershops").select("settings").eq("id", shopId!).single();
    const merged = { ...((cur?.settings as any) ?? {}), loyalty: next };
    const { error } = await supabase.from("barbershops").update({ settings: merged }).eq("id", shopId!);
    if (error) return toast.error(error.message);
    toast.success("Configurações do programa de fidelidade atualizadas!");
    refetchSettings();
  }

  function openNewReward() {
    if (!canManage) return toast.error("Permissão insuficiente para criar recompensas.");
    setEditingReward(null);
    setRewardForm({ name: "", description: "", points_required: 100, active: true });
    setOpenRewardDialog(true);
  }

  function openEditReward(r: Reward) {
    if (!canManage) return toast.error("Permissão insuficiente para editar recompensas.");
    setEditingReward(r);
    setRewardForm({
      name: r.name,
      description: r.description ?? "",
      points_required: r.sessions_total || 100,
      active: r.active,
    });
    setOpenRewardDialog(true);
  }

  async function handleSaveReward(e: React.FormEvent) {
    e.preventDefault();
    if (!rewardForm.name.trim()) return toast.error("Nome da recompensa é obrigatório.");
    if (!rewardForm.points_required || rewardForm.points_required <= 0) {
      return toast.error("A quantidade de pontos deve ser maior que 0.");
    }

    setBusyReward(true);
    try {
      if (editingReward) {
        await loyaltyService.updateReward(editingReward.id, {
          name: rewardForm.name.trim(),
          description: rewardForm.description.trim() || null,
          sessions_total: rewardForm.points_required,
          active: rewardForm.active,
        });
        toast.success("Recompensa atualizada com sucesso!");
      } else {
        await loyaltyService.createReward({
          barbershop_id: shopId!,
          name: rewardForm.name.trim(),
          description: rewardForm.description.trim() || null,
          points_required: rewardForm.points_required,
          active: rewardForm.active,
        });
        toast.success("Recompensa criada com sucesso!");
      }
      setOpenRewardDialog(false);
      refetchRewards();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar recompensa.");
    } finally {
      setBusyReward(false);
    }
  }

  async function handleDeleteReward(r: Reward) {
    if (!canManage) return toast.error("Permissão insuficiente para excluir.");
    if (!confirm(`Tem certeza que deseja excluir a recompensa "${r.name}"?`)) return;

    try {
      await loyaltyService.deleteReward(r.id);
      toast.success("Recompensa excluída com sucesso!");
      refetchRewards();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir recompensa.");
    }
  }

  async function handleRedeemSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!redeemCustomer) return;
    if (redeemPointsAmount <= 0) return toast.error("Quantidade de pontos inválida.");
    if (redeemPointsAmount > Number(redeemCustomer.points)) {
      return toast.error(`Saldo insuficiente (o cliente possui ${redeemCustomer.points} pts).`);
    }

    setBusyRedeem(true);
    try {
      await loyaltyService.redeemPoints({
        customerId: redeemCustomer.customer_id,
        barbershopId: shopId!,
        points: redeemPointsAmount,
        reason: redeemReason.trim() || "Resgate manual de fidelidade",
        createdBy: user?.id,
      });
      toast.success(`Resgate de ${redeemPointsAmount} pontos realizado com sucesso!`);
      setRedeemCustomer(null);
      refetchBalances();
    } catch (err: any) {
      toast.error(err.message || "Erro ao resgatar pontos.");
    } finally {
      setBusyRedeem(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Programa de Fidelidade</h1>
          <p className="text-muted-foreground">
            Recompense seus clientes fiéis com pontos acumulados a cada serviço realizado.
          </p>
        </div>

        {!canManage && (
          <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Modo somente leitura
          </Badge>
        )}
      </div>

      {/* Regras e Ativação do Programa */}
      <Card className="rounded-none border border-border bg-card/50 p-6 backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-none bg-accent/10 text-accent">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-foreground">Acúmulo Automático de Pontos</div>
              <div className="text-xs text-muted-foreground">
                Ao finalizar agendamentos e vendas, o cliente recebe pontos no saldo.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="loyalty_switch" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {settings?.enabled ? "Ativo" : "Inativo"}
            </Label>
            <Switch
              id="loyalty_switch"
              checked={!!settings?.enabled}
              disabled={!canManage}
              onCheckedChange={(v) =>
                saveSettings({
                  points_per_real: settings?.points_per_real ?? 1,
                  redeem_rate: settings?.redeem_rate ?? 100,
                  enabled: v,
                })
              }
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 border-t border-border/40 pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Pontos por R$ 1,00 gasto</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              disabled={!canManage}
              defaultValue={settings?.points_per_real ?? 1}
              onBlur={(e) =>
                saveSettings({
                  enabled: !!settings?.enabled,
                  redeem_rate: settings?.redeem_rate ?? 100,
                  points_per_real: Number(e.target.value) || 1,
                })
              }
              className="rounded-none"
            />
            <p className="text-[10px] text-muted-foreground">Ex: R$ 50 gastos geram 50 pontos.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Valor do ponto no resgate (Pontos por R$ 1)</Label>
            <Input
              type="number"
              min="1"
              disabled={!canManage}
              defaultValue={settings?.redeem_rate ?? 100}
              onBlur={(e) =>
                saveSettings({
                  enabled: !!settings?.enabled,
                  points_per_real: settings?.points_per_real ?? 1,
                  redeem_rate: Number(e.target.value) || 100,
                })
              }
              className="rounded-none"
            />
            <p className="text-[10px] text-muted-foreground">Ex: 100 pontos equivalem a R$ 1,00 de desconto.</p>
          </div>
        </div>
      </Card>

      {/* Tabs: Recompensas e Clientes com Pontos */}
      <Tabs defaultValue="rewards">
        <TabsList className="rounded-none border border-border/60 bg-card/40">
          <TabsTrigger value="rewards" className="rounded-none text-xs uppercase tracking-wider">
            <Gift className="mr-1.5 h-3.5 w-3.5" /> Catálogo de Recompensas
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-none text-xs uppercase tracking-wider">
            <Users className="mr-1.5 h-3.5 w-3.5" /> Clientes com Pontos ({balances?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Recompensas */}
        <TabsContent value="rewards" className="mt-4 space-y-4">
          <div className="flex justify-end">
            {canManage && (
              <Button onClick={openNewReward} className="rounded-none bg-accent text-accent-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> Nova recompensa
              </Button>
            )}
          </div>

          {loadingRewards ? (
            <CardGridSkeleton count={3} />
          ) : !rewards || rewards.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Nenhuma recompensa cadastrada"
              description="Cadastre itens como 'Corte Grátis' ou 'Pomada' para os clientes resgatarem com pontos."
              action={
                canManage ? (
                  <Button onClick={openNewReward} className="rounded-none bg-accent text-accent-foreground">
                    <Plus className="mr-1.5 h-4 w-4" /> Nova recompensa
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((r) => (
                <Card key={r.id} className="group flex flex-col justify-between border border-border bg-card/50 p-6 rounded-none backdrop-blur-md">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="grid h-10 w-10 place-items-center bg-accent/10 text-accent">
                        <Award className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="rounded-none font-mono text-xs font-bold text-accent border-accent/40">
                        {r.sessions_total} PONTOS
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-bold text-foreground">{r.name}</h3>
                      {r.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{r.description}</p>
                      )}
                    </div>
                  </div>

                  {canManage && (
                    <div className="mt-6 flex gap-2 border-t border-border/40 pt-4">
                      <Button size="sm" variant="outline" onClick={() => openEditReward(r)} className="flex-1 rounded-none text-xs">
                        <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteReward(r)} className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba 2: Clientes com Pontos */}
        <TabsContent value="customers" className="mt-4 space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente com saldo por nome ou telefone..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 rounded-none pl-9 text-xs"
            />
          </div>

          {loadingBalances ? (
            <TableSkeleton />
          ) : filteredBalances.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Nenhum cliente com pontos"
              description="Os clientes que acumularem pontos em agendamentos aparecerão aqui."
            />
          ) : (
            <Card className="overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Telefone</th>
                      <th className="px-6 py-4">Saldo Atual</th>
                      <th className="px-6 py-4">Total Vitalício</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {filteredBalances.map((b: any) => (
                      <tr key={b.id} className="transition-colors hover:bg-card/80">
                        <td className="px-6 py-4">
                          <span className="font-serif font-bold text-foreground">{b.customer?.full_name || "Cliente"}</span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground">{b.customer?.phone || "—"}</td>
                        <td className="px-6 py-4 font-mono font-bold text-accent text-base">{Number(b.points)} pts</td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-mono">{Number(b.lifetime_points || b.points)} pts</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRedeemCustomer(b);
                              setRedeemPointsAmount(Math.min(50, Number(b.points)));
                              setRedeemReason("");
                            }}
                            className="rounded-none text-xs hover:border-accent hover:text-accent"
                          >
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" /> Resgatar Pontos
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Nova / Editar Recompensa */}
      <Dialog open={openRewardDialog} onOpenChange={setOpenRewardDialog}>
        <DialogContent className="rounded-none border-border sm:max-w-md">
          <form onSubmit={handleSaveReward}>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingReward ? "Editar recompensa" : "Nova recompensa de fidelidade"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="reward_name">Nome do Benefício / Recompensa *</Label>
                <Input
                  id="reward_name"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="Ex: Corte de Cabelo Grátis"
                  className="rounded-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reward_points">Pontos Necessários para Resgatar *</Label>
                <Input
                  id="reward_points"
                  type="number"
                  min={1}
                  value={rewardForm.points_required}
                  onChange={(e) => setRewardForm({ ...rewardForm, points_required: Number(e.target.value) })}
                  className="rounded-none font-mono font-bold"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reward_desc">Descrição (opcional)</Label>
                <Textarea
                  id="reward_desc"
                  rows={2}
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Regras de utilização ou validade da recompensa..."
                  className="rounded-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <Label htmlFor="reward_active" className="cursor-pointer">
                  Disponível para resgate
                </Label>
                <Switch
                  id="reward_active"
                  checked={rewardForm.active}
                  onCheckedChange={(v) => setRewardForm({ ...rewardForm, active: v })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpenRewardDialog(false)} className="rounded-none">
                Cancelar
              </Button>
              <Button type="submit" disabled={busyReward} className="rounded-none bg-accent text-accent-foreground">
                {busyReward ? "Salvando..." : "Salvar recompensa"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Resgatar Pontos do Cliente */}
      <Dialog open={!!redeemCustomer} onOpenChange={(o) => !o && setRedeemCustomer(null)}>
        <DialogContent className="rounded-none border-border sm:max-w-md">
          {redeemCustomer && (
            <form onSubmit={handleRedeemSubmit}>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Resgatar Pontos</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                <div className="border border-border/60 bg-card/40 p-4">
                  <div className="font-bold text-foreground text-sm">
                    {redeemCustomer.customer?.full_name}
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Saldo disponível: <span className="font-mono font-bold text-accent">{redeemCustomer.points} pontos</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="redeem_amount">Quantidade de pontos a debitar *</Label>
                  <Input
                    id="redeem_amount"
                    type="number"
                    min={1}
                    max={Number(redeemCustomer.points)}
                    value={redeemPointsAmount}
                    onChange={(e) => setRedeemPointsAmount(Number(e.target.value))}
                    className="rounded-none font-mono font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="redeem_motivo">Motivo do Resgate / Prêmio</Label>
                  <Input
                    id="redeem_motivo"
                    value={redeemReason}
                    onChange={(e) => setRedeemReason(e.target.value)}
                    placeholder="Ex: Troca por Pomada Modeladora"
                    className="rounded-none"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setRedeemCustomer(null)} className="rounded-none">
                  Cancelar
                </Button>
                <Button type="submit" disabled={busyRedeem} className="rounded-none bg-accent text-accent-foreground">
                  {busyRedeem ? "Processando..." : "Confirmar Resgate"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
