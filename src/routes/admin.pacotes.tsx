import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { packageService, Package } from "@/services/package.service";
import { customerService } from "@/services/customer.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardGridSkeleton, EmptyState, TableSkeleton } from "@/components/site/LoadingState";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Package as PkgIcon, Plus, Trash2, Pencil, ShoppingBag, ShoppingCart, ShieldAlert, CheckCircle2, User } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pacotes")({
  head: () => ({ meta: [{ title: "Pacotes & Planos — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: PacotesPage,
});

function PacotesPage() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const [openDialog, setOpenDialog] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [pkgForm, setPkgForm] = useState({
    name: "",
    description: "",
    price: 100,
    sessions_total: 4,
    validity_days: 30,
    active: true,
  });
  const [busy, setBusy] = useState(false);

  // Modal Vender Pacote
  const [sellModalOpen, setSellModalOpen] = useState(false);
  const [sellingPkg, setSellingPkg] = useState<Package | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [sellBusy, setSellBusy] = useState(false);

  // Lista de Pacotes
  const { data: packages, isLoading: loadingPackages, refetch: refetchPackages } = useQuery({
    queryKey: ["admin-packages", shopId],
    enabled: !!shopId,
    queryFn: () => packageService.getPackages(shopId!),
  });

  // Lista de Assinaturas/Pacotes Vendidos
  const { data: subscriptions, isLoading: loadingSubs, refetch: refetchSubs } = useQuery({
    queryKey: ["admin-subscriptions", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customer_subscriptions")
        .select("*, package:packages(name, price), customer:customers(id, full_name, phone)")
        .eq("barbershop_id", shopId!)
        .order("purchased_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data ?? [];
    },
  });

  // Busca de Clientes para venda
  const { data: customersData } = useQuery({
    queryKey: ["sell-customers", shopId, customerSearch],
    enabled: !!shopId && customerSearch.length > 1,
    queryFn: () => customerService.getCustomers(shopId!, { q: customerSearch, limit: 10 }),
  });

  function openNew() {
    if (!canManage) return toast.error("Permissão insuficiente.");
    setEditingPkg(null);
    setPkgForm({ name: "", description: "", price: 100, sessions_total: 4, validity_days: 30, active: true });
    setOpenDialog(true);
  }

  function openEdit(p: Package) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    setEditingPkg(p);
    setPkgForm({
      name: p.name,
      description: p.description ?? "",
      price: Number(p.price),
      sessions_total: p.sessions_total,
      validity_days: p.validity_days || 30,
      active: p.active,
    });
    setOpenDialog(true);
  }

  async function handleSavePackage(e: React.FormEvent) {
    e.preventDefault();
    if (!pkgForm.name.trim()) return toast.error("Nome do pacote é obrigatório.");
    if (pkgForm.price <= 0) return toast.error("O preço deve ser maior que 0.");
    if (pkgForm.sessions_total <= 0) return toast.error("A quantidade de sessões deve ser no mínimo 1.");

    setBusy(true);
    try {
      if (editingPkg) {
        await packageService.updatePackage(editingPkg.id, {
          name: pkgForm.name.trim(),
          description: pkgForm.description.trim() || null,
          price: pkgForm.price,
          sessions_total: pkgForm.sessions_total,
          validity_days: pkgForm.validity_days,
          active: pkgForm.active,
        });
        toast.success("Pacote atualizado com sucesso!");
      } else {
        await packageService.createPackage({
          barbershop_id: shopId!,
          name: pkgForm.name.trim(),
          description: pkgForm.description.trim() || null,
          price: pkgForm.price,
          sessions_total: pkgForm.sessions_total,
          validity_days: pkgForm.validity_days,
          active: pkgForm.active,
        });
        toast.success("Pacote criado com sucesso!");
      }
      setOpenDialog(false);
      refetchPackages();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar pacote.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeletePackage(p: Package) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm(`Tem certeza que deseja desativar o pacote "${p.name}"?`)) return;

    try {
      await packageService.deletePackage(p.id);
      toast.success("Pacote desativado com sucesso!");
      refetchPackages();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir pacote.");
    }
  }

  function startSell(p: Package) {
    setSellingPkg(p);
    setSelectedCustomerId("");
    setCustomerSearch("");
    setSellModalOpen(true);
  }

  async function handleConfirmSell(e: React.FormEvent) {
    e.preventDefault();
    if (!sellingPkg || !selectedCustomerId) return toast.error("Selecione o cliente.");

    setSellBusy(true);
    try {
      await packageService.purchasePackage({
        barbershopId: shopId!,
        packageId: sellingPkg.id,
        customerId: selectedCustomerId,
      });

      toast.success(`Pacote "${sellingPkg.name}" vendido com sucesso!`);
      setSellModalOpen(false);
      refetchSubs();
    } catch (err: any) {
      toast.error(err.message || "Erro ao vender pacote.");
    } finally {
      setSellBusy(false);
    }
  }

  async function handleConsumeSession(subId: string, currentRemaining: number) {
    if (currentRemaining <= 0) return toast.error("Este pacote já teve todas as sessões utilizadas.");
    if (!confirm("Confirmar uso de 1 sessão deste pacote?")) return;

    try {
      const next = currentRemaining - 1;
      const status = next === 0 ? "exhausted" : "active";
      await supabase.from("customer_subscriptions").update({ sessions_remaining: next, status }).eq("id", subId);
      toast.success(`Sessão debitada. Restam ${next} sessões.`);
      refetchSubs();
    } catch (err: any) {
      toast.error(err.message || "Erro ao debitar sessão.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Pacotes & Planos Pré-Pagos</h1>
          <p className="text-muted-foreground">
            Venda combos de sessões (ex: 4 cortes no mês) e fidelize a receita da barbearia.
          </p>
        </div>

        {canManage ? (
          <Button onClick={openNew} className="rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background">
            <Plus className="mr-1.5 h-4 w-4" /> Novo pacote
          </Button>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Modo somente leitura
          </Badge>
        )}
      </div>

      <Tabs defaultValue="packages">
        <TabsList className="rounded-none border border-border/60 bg-card/40">
          <TabsTrigger value="packages" className="rounded-none text-xs uppercase tracking-wider">
            <PkgIcon className="mr-1.5 h-3.5 w-3.5" /> Catálogo de Pacotes ({packages?.length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="rounded-none text-xs uppercase tracking-wider">
            <ShoppingBag className="mr-1.5 h-3.5 w-3.5" /> Pacotes Vendidos ({subscriptions?.length ?? 0})
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Pacotes Criados */}
        <TabsContent value="packages" className="mt-4">
          {loadingPackages ? (
            <CardGridSkeleton count={3} />
          ) : !packages || packages.length === 0 ? (
            <EmptyState
              icon={PkgIcon}
              title="Nenhum pacote cadastrado"
              description="Crie pacotes promocionais com múltiplas sessões para alavancar suas vendas recorrentes."
              action={
                canManage ? (
                  <Button onClick={openNew} className="rounded-none bg-accent text-accent-foreground">
                    <Plus className="mr-1.5 h-4 w-4" /> Novo pacote
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((p) => (
                <Card
                  key={p.id}
                  className="group flex flex-col justify-between border border-border bg-card/50 p-6 rounded-none backdrop-blur-md"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="grid h-10 w-10 place-items-center bg-accent/10 text-accent">
                        <PkgIcon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="rounded-none text-[10px] font-mono text-accent border-accent/40">
                        {p.sessions_total} SESSÕES
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-serif text-xl font-bold text-foreground">{p.name}</h3>
                      {p.description && (
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {p.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between border-t border-border/30 pt-3">
                      <span className="text-xs text-muted-foreground">
                        Validade: {p.validity_days ? `${p.validity_days} dias` : "Sem expiração"}
                      </span>
                      <span className="font-serif text-2xl font-bold text-accent">{brl(Number(p.price))}</span>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2 border-t border-border/40 pt-4">
                    <Button
                      onClick={() => startSell(p)}
                      className="w-full rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
                    >
                      <ShoppingCart className="mr-1.5 h-3.5 w-3.5" /> Vender Pacote
                    </Button>

                    {canManage && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1 rounded-none text-xs">
                          <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDeletePackage(p)} className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Aba 2: Pacotes Vendidos */}
        <TabsContent value="subscriptions" className="mt-4">
          {loadingSubs ? (
            <TableSkeleton />
          ) : !subscriptions || subscriptions.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Nenhum pacote vendido"
              description="Quando você realizar a venda de um pacote a um cliente, ele aparecerá aqui com o saldo restante."
            />
          ) : (
            <Card className="overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4">Cliente</th>
                      <th className="px-6 py-4">Pacote Adquirido</th>
                      <th className="px-6 py-4">Sessões Restantes</th>
                      <th className="px-6 py-4">Data Compra</th>
                      <th className="px-6 py-4">Validade</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {subscriptions.map((sub: any) => {
                      const isExpired = sub.expires_at && new Date(sub.expires_at) < new Date();

                      return (
                        <tr key={sub.id} className="transition-colors hover:bg-card/80">
                          <td className="px-6 py-4">
                            <div className="font-serif font-bold text-foreground">{sub.customer?.full_name || "Cliente"}</div>
                            {sub.customer?.phone && <div className="text-[10px] text-muted-foreground">{sub.customer.phone}</div>}
                          </td>
                          <td className="px-6 py-4 font-bold text-foreground">{sub.package?.name}</td>
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-accent text-base">{sub.sessions_remaining}</span>
                            <span className="text-xs text-muted-foreground"> restantes</span>
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {format(new Date(sub.purchased_at), "dd/MM/yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {sub.expires_at ? format(new Date(sub.expires_at), "dd/MM/yyyy", { locale: ptBR }) : "—"}
                          </td>
                          <td className="px-6 py-4">
                            {sub.status === "active" && !isExpired ? (
                              <Badge variant="outline" className="rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                                Ativo
                              </Badge>
                            ) : sub.status === "exhausted" ? (
                              <Badge variant="outline" className="rounded-none border-muted text-muted-foreground text-[10px] uppercase">
                                Esgotado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="rounded-none border-destructive/30 text-destructive text-[10px] uppercase">
                                Expirado
                              </Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {sub.sessions_remaining > 0 && sub.status === "active" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConsumeSession(sub.id, sub.sessions_remaining)}
                                className="rounded-none text-xs hover:border-accent hover:text-accent"
                              >
                                Usar 1 Sessão
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal Criar / Editar Pacote */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="rounded-none border-border sm:max-w-md">
          <form onSubmit={handleSavePackage}>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingPkg ? "Editar pacote" : "Novo pacote de serviços"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="pkg_name">Nome do Pacote *</Label>
                <Input
                  id="pkg_name"
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                  placeholder="Ex: Plano Mensal (4 Cortes + 2 Barbas)"
                  className="rounded-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pkg_price">Preço Total (R$) *</Label>
                  <Input
                    id="pkg_price"
                    type="number"
                    step="0.01"
                    min={1}
                    value={pkgForm.price}
                    onChange={(e) => setPkgForm({ ...pkgForm, price: Number(e.target.value) })}
                    className="rounded-none font-bold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="pkg_sessions">Total de Sessões *</Label>
                  <Input
                    id="pkg_sessions"
                    type="number"
                    min={1}
                    value={pkgForm.sessions_total}
                    onChange={(e) => setPkgForm({ ...pkgForm, sessions_total: Number(e.target.value) })}
                    className="rounded-none font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pkg_validity">Validade em dias</Label>
                <Input
                  id="pkg_validity"
                  type="number"
                  min={1}
                  value={pkgForm.validity_days}
                  onChange={(e) => setPkgForm({ ...pkgForm, validity_days: Number(e.target.value) })}
                  className="rounded-none"
                />
                <p className="text-[10px] text-muted-foreground">Ex: 30 dias para utilizar todas as sessões.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pkg_desc">Descrição (opcional)</Label>
                <Textarea
                  id="pkg_desc"
                  rows={2}
                  value={pkgForm.description}
                  onChange={(e) => setPkgForm({ ...pkgForm, description: e.target.value })}
                  placeholder="Instruções ou regras de agendamento..."
                  className="rounded-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <Label htmlFor="pkg_active" className="cursor-pointer">
                  Disponível para venda
                </Label>
                <Switch
                  id="pkg_active"
                  checked={pkgForm.active}
                  onCheckedChange={(v) => setPkgForm({ ...pkgForm, active: v })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpenDialog(false)} className="rounded-none">
                Cancelar
              </Button>
              <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
                {busy ? "Salvando..." : "Salvar pacote"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Vender Pacote */}
      <Dialog open={sellModalOpen} onOpenChange={setSellModalOpen}>
        <DialogContent className="rounded-none border-border sm:max-w-md">
          {sellingPkg && (
            <form onSubmit={handleConfirmSell}>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Vender Pacote</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-4 text-xs">
                <div className="border border-border/60 bg-card/40 p-4 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Pacote Selecionado
                  </span>
                  <div className="font-bold text-foreground text-sm">{sellingPkg.name}</div>
                  <div className="flex justify-between font-mono pt-1 text-muted-foreground">
                    <span>{sellingPkg.sessions_total} sessões</span>
                    <span className="font-serif font-bold text-accent text-base">{brl(Number(sellingPkg.price))}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Buscar e Selecionar Cliente *</Label>
                  <Input
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setSelectedCustomerId("");
                    }}
                    placeholder="Digite o nome ou telefone do cliente..."
                    className="h-10 rounded-none"
                    required={!selectedCustomerId}
                  />

                  {customersData?.data && customersData.data.length > 0 && !selectedCustomerId && (
                    <div className="max-h-36 divide-y divide-border/20 overflow-y-auto border border-border/40 bg-background text-xs">
                      {customersData.data.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedCustomerId(c.id);
                            setCustomerSearch(c.full_name);
                          }}
                          className="w-full p-2.5 text-left hover:bg-muted/40 font-medium flex items-center justify-between"
                        >
                          <span>{c.full_name}</span>
                          <span className="text-muted-foreground text-[10px]">{c.phone}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedCustomerId && (
                    <div className="flex items-center gap-1.5 text-emerald-500 font-bold mt-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Cliente vinculado para o pacote
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setSellModalOpen(false)} className="rounded-none">
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={sellBusy || !selectedCustomerId}
                  className="rounded-none bg-accent text-accent-foreground"
                >
                  {sellBusy ? "Confirmando..." : "Confirmar Venda"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
