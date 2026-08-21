import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { couponService, Coupon } from "@/services/coupon.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { EmptyState, TableSkeleton } from "@/components/site/LoadingState";
import { TicketPercent, Plus, Trash2, Pencil, ShieldAlert, Calendar } from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — BarberOS" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Page,
});

function Page() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const { data: coupons, isLoading, refetch } = useQuery({
    queryKey: ["admin-coupons", shopId],
    enabled: !!shopId,
    queryFn: () => couponService.getCoupons(shopId!),
  });

  const [open, setOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [busy, setBusy] = useState(false);

  const [form, setForm] = useState({
    code: "",
    kind: "percent" as "percent" | "fixed",
    value: 10,
    min_amount: 0,
    valid_until: "",
    usage_limit: "",
    active: true,
  });

  function openNew() {
    if (!canManage) {
      toast.error("Permissão insuficiente para criar cupons.");
      return;
    }
    setEditingCoupon(null);
    setForm({
      code: "",
      kind: "percent",
      value: 10,
      min_amount: 0,
      valid_until: "",
      usage_limit: "",
      active: true,
    });
    setOpen(true);
  }

  function openEdit(c: Coupon) {
    if (!canManage) {
      toast.error("Permissão insuficiente para editar cupons.");
      return;
    }
    setEditingCoupon(c);
    setForm({
      code: c.code,
      kind: c.kind === "fixed" ? "fixed" : "percent",
      value: Number(c.value),
      min_amount: Number(c.min_amount || 0),
      valid_until: c.valid_until ? c.valid_until.split("T")[0] : "",
      usage_limit: c.usage_limit ? String(c.usage_limit) : "",
      active: c.active,
    });
    setOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.code.trim()) return toast.error("O código do cupom é obrigatório.");
    if (form.value <= 0) return toast.error("O valor do desconto deve ser maior que 0.");
    if (form.kind === "percent" && form.value > 100) return toast.error("O percentual de desconto não pode exceder 100%.");

    setBusy(true);
    try {
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon.id, {
          code: form.code.toUpperCase().trim(),
          kind: form.kind,
          value: Number(form.value),
          min_amount: Number(form.min_amount) || 0,
          valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
          usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
          active: form.active,
        });
        toast.success("Cupom atualizado com sucesso!");
      } else {
        await couponService.createCoupon({
          barbershop_id: shopId!,
          code: form.code.toUpperCase().trim(),
          kind: form.kind,
          value: Number(form.value),
          min_amount: Number(form.min_amount) || 0,
          valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
          usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
        });
        toast.success("Cupom criado com sucesso!");
      }
      setOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cupom.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(c: Coupon) {
    if (!canManage) {
      toast.error("Permissão insuficiente para excluir cupons.");
      return;
    }
    if (!confirm(`Tem certeza que deseja excluir o cupom "${c.code}"?`)) return;

    try {
      await couponService.deleteCoupon(c.id);
      toast.success("Cupom excluído com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir cupom.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Cupons de Desconto</h1>
          <p className="text-muted-foreground">
            Crie campanhas promocionais para uso no PDV e agendamento online.
          </p>
        </div>

        {canManage ? (
          <Button
            onClick={openNew}
            className="rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Novo cupom
          </Button>
        ) : (
          <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Modo somente leitura
          </Badge>
        )}
      </div>

      {/* Modal de Criação / Edição */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-none border-border sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {editingCoupon ? "Editar cupom" : "Novo cupom de desconto"}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="coupon_code">Código do Cupom *</Label>
                <Input
                  id="coupon_code"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="EX: PROMO10, CLIENTEVIP"
                  className="rounded-none font-mono uppercase font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Tipo de Desconto</Label>
                  <Select
                    value={form.kind}
                    onValueChange={(v: "percent" | "fixed") => setForm({ ...form, kind: v })}
                  >
                    <SelectTrigger className="rounded-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-none">
                      <SelectItem value="percent">Porcentagem (%)</SelectItem>
                      <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="coupon_val">
                    {form.kind === "percent" ? "Desconto (%) *" : "Desconto (R$) *"}
                  </Label>
                  <Input
                    id="coupon_val"
                    type="number"
                    step={form.kind === "percent" ? "1" : "0.01"}
                    min={1}
                    max={form.kind === "percent" ? 100 : undefined}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
                    className="rounded-none font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="coupon_valid">Válido até (opcional)</Label>
                  <Input
                    id="coupon_valid"
                    type="date"
                    value={form.valid_until}
                    onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                    className="rounded-none text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="coupon_limit">Limite de Usos (opcional)</Label>
                  <Input
                    id="coupon_limit"
                    type="number"
                    min={1}
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                    placeholder="Sem limite"
                    className="rounded-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="coupon_min">Valor mínimo do pedido (R$)</Label>
                <Input
                  id="coupon_min"
                  type="number"
                  step="0.01"
                  min={0}
                  value={form.min_amount}
                  onChange={(e) => setForm({ ...form, min_amount: Number(e.target.value) })}
                  placeholder="0.00"
                  className="rounded-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <Label htmlFor="coupon_active" className="cursor-pointer">
                  Cupom ativo para uso
                </Label>
                <Switch
                  id="coupon_active"
                  checked={form.active}
                  onCheckedChange={(v) => setForm({ ...form, active: v })}
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-none">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={busy}
                className="rounded-none bg-accent text-accent-foreground hover:bg-foreground hover:text-background"
              >
                {busy ? "Salvando..." : "Salvar cupom"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabela de Cupons */}
      {isLoading ? (
        <TableSkeleton />
      ) : !coupons || coupons.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="Nenhum cupom cadastrado"
          description="Crie o primeiro cupom promocional para oferecer descontos aos seus clientes."
          action={
            canManage ? (
              <Button onClick={openNew} className="rounded-none bg-accent text-accent-foreground">
                <Plus className="mr-1.5 h-4 w-4" /> Novo cupom
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Código</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4">Desconto</th>
                  <th className="px-6 py-4">Validade</th>
                  <th className="px-6 py-4">Utilizações</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {coupons.map((c) => {
                  const isExpired = c.valid_until && new Date(c.valid_until) < new Date();

                  return (
                    <tr key={c.id} className="transition-colors hover:bg-card/80">
                      <td className="px-6 py-4">
                        <span className="font-mono text-base font-bold text-accent">{c.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className="rounded-none text-[10px] uppercase border-border/60">
                          {c.kind === "percent" ? "Percentual" : "Valor fixo"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-foreground">
                        {c.kind === "percent" ? `${c.value}%` : brl(Number(c.value))}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {c.valid_until ? (
                          <span className={isExpired ? "text-destructive font-bold" : ""}>
                            {format(new Date(c.valid_until), "dd/MM/yyyy", { locale: ptBR })}
                            {isExpired && " (Expirado)"}
                          </span>
                        ) : (
                          "Sem validade"
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono">
                        <span className="font-bold text-foreground">{c.used_count || 0}</span>
                        {c.usage_limit ? ` / ${c.usage_limit}` : " usos"}
                      </td>
                      <td className="px-6 py-4">
                        {c.active && !isExpired ? (
                          <Badge variant="outline" className="rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
                            Inativo
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {canManage ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => openEdit(c)}
                              className="h-8 w-8 rounded-none text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(c)}
                              className="h-8 w-8 rounded-none text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
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
    </div>
  );
}
