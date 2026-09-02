import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { couponService, type Coupon } from "@/services/coupon.service";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { TicketPercent, Plus, Pencil, Trash2, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/cupons")({
  component: AdminCuponsPage,
});

function AdminCuponsPage() {
  const { shopId, shop } = useCurrentShop();
  const isOwner = shop?.role === 'owner';
  const isAdmin = shop?.role === 'admin' || shop?.role === 'manager';
  const canManage = isOwner || isAdmin;
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons", shopId],
    enabled: !!shopId,
    queryFn: () => couponService.getCoupons(shopId!),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => couponService.deleteCoupon(id),
    onSuccess: () => {
      toast.success("Cupom removido.");
      qc.invalidateQueries({ queryKey: ["admin-coupons", shopId] });
    },
  });

  const filtered = useMemo(() => {
    if (!Array.isArray(coupons)) return [];
    const now = new Date();
    return coupons.filter(c => {
      const matchSearch = c.code.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      
      const isExpired = c.valid_until && new Date(c.valid_until) < now;
      const isLimitReached = c.usage_limit && (c.used_count || 0) >= c.usage_limit;
      
      let status = "active";
      if (!c.active) status = "paused";
      else if (isExpired) status = "expired";
      else if (isLimitReached) status = "limit";

      if (statusFilter === "all") return true;
      return status === statusFilter;
    });
  }, [coupons, search, statusFilter]);

  const handleDelete = (c: Coupon) => {
    if (confirm(`Tem certeza que deseja excluir o cupom ${c.code}?`)) {
      deleteMut.mutate(c.id);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setFormOpen(true);
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
            <TicketPercent className="h-6 w-6 text-accent" /> Cupons de Desconto
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gerencie códigos promocionais e descontos</p>
        </div>
        {canManage && (
          <Button onClick={openNew} className="bg-accent text-accent-foreground w-full sm:w-auto h-11">
            <Plus className="h-4 w-4 mr-2" /> Novo Cupom
          </Button>
        )}
      </div>

      <div className="p-4 sm:p-5 border-b border-border/40 bg-card/20 shrink-0">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Buscar por código..." 
              className="pl-9 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativos</SelectItem>
              <SelectItem value="paused">Pausados</SelectItem>
              <SelectItem value="expired">Expirados</SelectItem>
              <SelectItem value="limit">Limite atingido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 sm:p-6 pb-24">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/40 rounded-xl bg-muted/10 mt-8">
              <TicketPercent className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="font-bold">Você ainda não cadastrou cupons.</h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">Comece adicionando o primeiro cupom.</p>
              {canManage && (
                <Button onClick={openNew} variant="outline" className="mt-6 text-accent border-accent/30 hover:bg-accent/10">
                  Criar Primeiro Cupom
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-1">
              {/* Responsive: Grid of cards on mobile, vertical list of cards on desktop */}
              {filtered.map(c => {
                const isExpired = c.valid_until && new Date(c.valid_until) < new Date();
                const isLimit = c.usage_limit && (c.used_count || 0) >= c.usage_limit;

                return (
                  <Card key={c.id} className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-lg font-black text-accent">{c.code}</span>
                          {!c.active ? (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-0 text-[10px]">Pausado</Badge>
                          ) : isExpired ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-0 text-[10px]">Expirado</Badge>
                          ) : isLimit ? (
                            <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-0 text-[10px]">Esgotado</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-0 text-[10px]">Ativo</Badge>
                          )}
                        </div>
                        <div className="font-bold text-lg">
                          {c.kind === "percent" ? `${c.value}% OFF` : `${brl(Number(c.value))} OFF`}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground flex flex-col gap-0.5">
                        {c.valid_until ? (
                          <span>Válido até: {format(new Date(c.valid_until), "dd/MM/yyyy")}</span>
                        ) : (
                          <span>Sem validade</span>
                        )}
                        <span>Usos: {c.used_count || 0} {c.usage_limit ? `/ ${c.usage_limit}` : ""}</span>
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center justify-end gap-2 mt-2 lg:mt-0 pt-3 lg:pt-0 border-t lg:border-0 border-border/40">
                        <Button variant="outline" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(c)}>
                          Excluir
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {formOpen && (
        <CouponForm 
          open={formOpen} 
          onClose={() => setFormOpen(false)} 
          shopId={shopId!} 
          coupon={editing} 
          existingCodes={coupons.map(c => c.code)}
          onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-coupons", shopId] })} 
        />
      )}
    </div>
  );
}

function CouponForm({ open, onClose, shopId, coupon, existingCodes, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    code: coupon?.code || "",
    kind: coupon?.kind || "percent",
    value: coupon?.value?.toString() || "",
    valid_until: coupon?.valid_until ? coupon.valid_until.split("T")[0] : "",
    usage_limit: coupon?.usage_limit?.toString() || "",
    active: coupon ? coupon.active : true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = form.code.trim().toUpperCase();
    if (!code) return toast.error("Código é obrigatório.");
    if (!coupon && existingCodes.includes(code)) {
      return toast.error("Este código já existe na barbearia.");
    }

    const valueNum = Number(form.value);
    if (isNaN(valueNum) || valueNum <= 0) {
      return toast.error("O valor de desconto deve ser maior que zero.");
    }
    if (form.kind === "percent" && valueNum > 100) {
      return toast.error("O desconto percentual não pode ser maior que 100%.");
    }

    setLoading(true);
    try {
      const payload: any = {
        code,
        kind: form.kind,
        value: valueNum,
        valid_until: form.valid_until ? new Date(form.valid_until + "T23:59:59").toISOString() : null,
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
        active: form.active,
      };

      if (coupon) {
        await couponService.updateCoupon(coupon.id, payload);
        toast.success("Cupom atualizado!");
      } else {
        await couponService.createCoupon({ ...payload, barbershop_id: shopId });
        toast.success("Cupom criado!");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cupom.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-[95vw] rounded-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">{coupon ? "Editar Cupom" : "Novo Cupom"}</DialogTitle>
          <DialogDescription>
            Configure as regras do desconto promocional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Código do Cupom <span className="text-destructive">*</span></Label>
            <Input 
              value={form.code} 
              onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
              placeholder="Ex: VERAO20" 
              disabled={!!coupon}
              className="h-11 font-mono uppercase" 
              required 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo de Desconto</Label>
              <Select value={form.kind} onValueChange={v => setForm({ ...form, kind: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percentual (%)</SelectItem>
                  <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Valor do Desconto <span className="text-destructive">*</span></Label>
              <Input 
                type="number" 
                step={form.kind === "percent" ? "1" : "0.01"} 
                min="0.01" 
                value={form.value} 
                onChange={e => setForm({ ...form, value: e.target.value })} 
                placeholder={form.kind === "percent" ? "20" : "15.00"} 
                className="h-11" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Validade (Opcional)</Label>
              <Input 
                type="date" 
                value={form.valid_until} 
                onChange={e => setForm({ ...form, valid_until: e.target.value })} 
                className="h-11" 
              />
            </div>
            
            <div className="space-y-2">
              <Label>Limite de Usos (Opcional)</Label>
              <Input 
                type="number" 
                min="1" 
                value={form.usage_limit} 
                onChange={e => setForm({ ...form, usage_limit: e.target.value })} 
                placeholder="Sem limite" 
                className="h-11" 
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-2">
            <div className="space-y-0.5">
              <Label>Cupom Ativo</Label>
              <p className="text-[10px] text-muted-foreground">Permitir o uso deste cupom</p>
            </div>
            <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
          </div>

          <DialogFooter className="gap-2 pt-4 sm:pt-6">
            <Button type="button" variant="outline" className="h-11 w-full sm:w-auto" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" className="h-11 w-full sm:w-auto bg-accent text-accent-foreground" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
