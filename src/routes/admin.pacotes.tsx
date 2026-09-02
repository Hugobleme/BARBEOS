// @ts-nocheck
import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { packageService, type Package } from "@/services/package.service";
import { customerService } from "@/services/customer.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { PackageOpen, Plus, Pencil, Trash2, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { brl } from "@/lib/format";

export const Route = createFileRoute("/admin/pacotes")({
  component: AdminPackagesPage,
});

function AdminPackagesPage() {
  const { shopId, shop } = useCurrentShop();
  const isOwner = shop?.role === "owner";
  const isAdmin = shop?.role === "admin" || shop?.role === "manager";
  const canManage = isOwner || isAdmin;
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);

  const [sellFormOpen, setSellFormOpen] = useState(false);

  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["admin-packages", shopId],
    enabled: !!shopId,
    queryFn: () => packageService.getPackages(shopId!),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => packageService.deletePackage(id),
    onSuccess: () => {
      toast.success("Pacote inativado/removido.");
      qc.invalidateQueries({ queryKey: ["admin-packages", shopId] });
    },
  });

  const handleDelete = (p: Package) => {
    if (confirm(`Excluir/Inativar o pacote "${p.name}"?`)) {
      deleteMut.mutate(p.id);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (p: Package) => {
    setEditing(p);
    setFormOpen(true);
  };

  const filtered = useMemo(() => {
    if (!Array.isArray(packages)) return [];
    // We only display real packages, not rewards. In loyalty, rewards are packages with price = 0
    return packages.filter(
      (p) => p.price > 0 || (p.price === 0 && p.name.toLowerCase().includes("pacote")),
    );
  }, [packages]);

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
            <PackageOpen className="h-6 w-6 text-accent" /> Pacotes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Gerencie pacotes e planos de serviços recorrentes
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {canManage && (
            <>
              <Button
                onClick={() => setSellFormOpen(true)}
                variant="outline"
                className="flex-1 sm:flex-none h-11 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"
              >
                <ShoppingCart className="h-4 w-4 mr-2" /> Vender
              </Button>
              <Button
                onClick={openNew}
                className="flex-1 sm:flex-none bg-accent text-accent-foreground h-11"
              >
                <Plus className="h-4 w-4 mr-2" /> Novo Pacote
              </Button>
            </>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 pb-24">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/40 rounded-xl bg-muted/10 mt-8">
              <PackageOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-bold">Você ainda não cadastrou pacotes.</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Comece adicionando o primeiro pacote.
              </p>
              {canManage && (
                <Button
                  onClick={openNew}
                  variant="outline"
                  className="mt-6 text-accent border-accent/30 hover:bg-accent/10"
                >
                  Criar Primeiro Pacote
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p) => (
                <Card
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col justify-between gap-4 border-border/40 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg text-foreground line-clamp-2">{p.name}</h3>
                      {!p.active && (
                        <Badge variant="outline" className="text-[10px]">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="font-black text-2xl text-accent mb-2">{brl(p.price)}</p>
                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                      {p.description || "Sem descrição"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border/40 pt-3">
                    <span className="font-bold text-sm bg-muted px-2 py-1 rounded-md">
                      {p.sessions_total} Sessões
                    </span>
                    {canManage && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(p)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(p)}
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
      </ScrollArea>

      {formOpen && (
        <PackageForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          shopId={shopId!}
          pkg={editing}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-packages", shopId] })}
        />
      )}

      {sellFormOpen && (
        <SellForm
          open={sellFormOpen}
          onClose={() => setSellFormOpen(false)}
          shopId={shopId!}
          packages={filtered.filter((p) => p.active)}
        />
      )}
    </div>
  );
}

function PackageForm({ open, onClose, shopId, pkg, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: pkg?.name || "",
    description: pkg?.description || "",
    price: pkg?.price?.toString() || "",
    sessions_total: pkg?.sessions_total?.toString() || "",
    validity_days: pkg?.validity_days?.toString() || "30",
    active: pkg ? pkg.active : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("O nome é obrigatório.");

    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum <= 0) return toast.error("O preço deve ser maior que zero.");

    const sess = parseInt(form.sessions_total);
    if (isNaN(sess) || sess <= 0) return toast.error("O pacote precisa ter pelo menos 1 sessão.");

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        price_cents: Math.round(priceNum * 100), // Converted to cents internally in updatePackage if used
        price: priceNum,
        sessions_total: sess,
        validity_days: form.validity_days ? parseInt(form.validity_days) : null,
        active: form.active,
      };

      if (pkg) {
        await packageService.updatePackage(pkg.id, payload as any);
        toast.success("Pacote atualizado.");
      } else {
        await packageService.createPackage({ ...payload, barbershop_id: shopId });
        toast.success("Pacote criado.");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar pacote.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>{pkg ? "Editar Pacote" : "Novo Pacote"}</DialogTitle>
          <DialogDescription>Configuração do pacote de serviços.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Nome do Pacote <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Pacote de 4 Cortes"
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Preço (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="100.00"
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label>
                Quantidade de Sessões <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.sessions_total}
                onChange={(e) => setForm({ ...form, sessions_total: e.target.value })}
                placeholder="4"
                required
                className="h-11"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Validade em Dias (Opcional)</Label>
            <Input
              type="number"
              min="1"
              step="1"
              value={form.validity_days}
              onChange={(e) => setForm({ ...form, validity_days: e.target.value })}
              placeholder="Ex: 30"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detalhes do pacote..."
              className="h-11"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border/40 mt-2">
            <Label>Pacote Ativo</Label>
            <Switch
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full sm:w-auto"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 w-full sm:w-auto bg-accent text-accent-foreground"
              disabled={loading}
            >
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SellForm({ open, onClose, shopId, packages }: any) {
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [customer, setCustomer] = useState<any>(null);

  const [selectedPkgId, setSelectedPkgId] = useState<string>("");

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

  const handleSelectCustomer = (c: any) => {
    setCustomer(c);
    setCustomers([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return toast.error("Selecione um cliente.");
    if (!selectedPkgId) return toast.error("Selecione um pacote.");

    const pkg = packages.find((p: any) => p.id === selectedPkgId);
    if (!pkg) return toast.error("Pacote inválido.");

    if (!confirm(`Confirmar venda do "${pkg.name}" para ${customer.full_name}?`)) return;

    setLoading(true);
    try {
      // Create subscription. In a real scenario, cash transaction would be linked here if API supports it in one go.
      // packageService.purchasePackage currently does not create a cash entry, it only creates the subscription.
      // We will rely on existing functionality which is robust.
      await packageService.purchasePackage({
        customerId: customer.id,
        packageId: pkg.id,
        barbershopId: shopId,
        notes: "Venda efetuada pelo painel administrativo",
      });

      toast.success("Venda registrada com sucesso! Cliente agora possui as sessões.");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar venda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle>Vender Pacote</DialogTitle>
          <DialogDescription>Associe um pacote a um cliente.</DialogDescription>
        </DialogHeader>

        {!customer ? (
          <div className="space-y-4 py-2">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nome ou telefone..."
                className="h-11"
              />
              <Button type="submit" disabled={loading} className="h-11 px-4">
                Buscar
              </Button>
            </form>

            {customers.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto border border-border/40 p-2 rounded-lg">
                {customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-2 hover:bg-muted cursor-pointer rounded text-sm"
                  >
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
                <p className="text-xs text-muted-foreground">Comprador</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCustomer(null)}
                className="h-8 px-2 text-xs"
              >
                Alterar
              </Button>
            </div>

            <div className="space-y-2">
              <Label>
                Selecione o Pacote <span className="text-destructive">*</span>
              </Label>
              {packages.length === 0 ? (
                <div className="text-sm text-destructive">Não há pacotes ativos cadastrados.</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {packages.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPkgId(p.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${selectedPkgId === p.id ? "border-accent bg-accent/5" : "border-border/40 hover:bg-muted"}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-sm">{p.name}</span>
                        <span className="font-bold text-accent">{brl(p.price)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.sessions_total} sessões</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="pt-4 mt-2">
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full sm:w-auto"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 w-full sm:w-auto bg-emerald-500 text-white hover:bg-emerald-600"
                disabled={loading || !selectedPkgId}
              >
                Confirmar Venda
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
