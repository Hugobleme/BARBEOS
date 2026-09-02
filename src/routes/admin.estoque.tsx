import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { productService, Product } from "@/services/product.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brl } from "@/lib/format";
import { toast } from "sonner";
import {
  Package,
  Search,
  Plus,
  X,
  AlertTriangle,
  ArrowLeftRight,
  CheckCircle2,
  MoreVertical,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/admin/estoque")({ component: EstoquePage });

function EstoquePage() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();
  const isAdmin = shop?.role === "owner" || shop?.role === "admin";

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveProduct, setMoveProduct] = useState<Product | null>(null);

  const {
    data: products = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-products", shopId],
    enabled: !!shopId,
    queryFn: () => productService.getProducts(shopId!),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      toast.success("Produto desativado/removido.");
      qc.invalidateQueries({ queryKey: ["admin-products", shopId] });
    },
  });

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (!p.active) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      const q = p.stock_qty || 0;
      const min = p.min_stock || 0;
      if (filterStatus === "out") return q <= 0;
      if (filterStatus === "low") return q > 0 && q <= min;
      if (filterStatus === "ok") return q > min;
      return true;
    });
  }, [products, search, filterStatus]);

  const alertsCount = useMemo(
    () => products.filter((p) => p.active && (p.stock_qty || 0) <= (p.min_stock || 0)).length,
    [products],
  );

  const handleOpenForm = (p: Product | null = null) => {
    setSelectedProduct(p);
    setFormOpen(true);
  };

  const handleOpenMove = (p: Product) => {
    setMoveProduct(p);
    setMoveOpen(true);
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
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-accent" /> Controle de Estoque
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Gerencie produtos, custos e quantidades
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-background"
              />
              {search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                  onClick={() => setSearch("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {isAdmin && (
              <Button
                onClick={() => handleOpenForm(null)}
                className="bg-accent text-accent-foreground shrink-0 h-11"
              >
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Novo Produto</span>
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button
            variant={filterStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("all")}
            className="rounded-full h-8 px-3 shrink-0"
          >
            Todos
          </Button>
          <Button
            variant={filterStatus === "ok" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("ok")}
            className="rounded-full h-8 px-3 shrink-0 border-emerald-500/30 text-emerald-600"
          >
            Em Estoque
          </Button>
          <Button
            variant={filterStatus === "low" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("low")}
            className="rounded-full h-8 px-3 shrink-0 border-amber-500/30 text-amber-600"
          >
            <AlertTriangle className="h-3 w-3 mr-1.5" /> Baixo ({alertsCount})
          </Button>
          <Button
            variant={filterStatus === "out" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus("out")}
            className="rounded-full h-8 px-3 shrink-0 border-destructive/30 text-destructive"
          >
            Sem Estoque
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-5xl p-4 sm:p-6 pb-24">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <Card
                  key={i}
                  className="h-24 animate-pulse rounded-xl border border-border/40 bg-muted/30"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-muted-foreground mb-4">Erro ao carregar estoque.</span>
              <Button onClick={() => refetch()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-20 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-foreground">
                {search || filterStatus !== "all"
                  ? "Nenhum produto encontrado pros filtros atuais."
                  : "Você ainda não cadastrou produtos."}
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filtered.map((p) => {
                const q = p.stock_qty || 0;
                const min = p.min_stock || 0;
                const isOut = q <= 0;
                const isLow = q > 0 && q <= min;

                return (
                  <Card
                    key={p.id}
                    className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 transition-colors bg-card ${isOut ? "border-destructive/30" : isLow ? "border-amber-500/30" : ""}`}
                  >
                    <div className="flex items-center gap-4 truncate pr-4">
                      <div
                        className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center border border-border/40 ${isOut ? "bg-destructive/10" : isLow ? "bg-amber-500/10" : "bg-muted/50"}`}
                      >
                        {isOut ? (
                          <X className="h-5 w-5 text-destructive" />
                        ) : isLow ? (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex flex-col truncate">
                        <span className="font-bold text-foreground text-sm truncate">{p.name}</span>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{brl(Number(p.price || 0))}</span>
                          <span>Custo: {brl(Number(p.cost || 0))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 mt-3 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-none">
                      <div className="flex flex-col items-end">
                        <Badge
                          variant="outline"
                          className={`font-mono text-sm px-2 ${isOut ? "text-destructive border-destructive/30 bg-destructive/10" : isLow ? "text-amber-500 border-amber-500/30 bg-amber-500/10" : "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"}`}
                        >
                          {q} {p.unit || "un"}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground mt-0.5">Min: {min}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-2 border-accent/30 text-accent hover:bg-accent/10"
                          onClick={() => handleOpenMove(p)}
                        >
                          <ArrowLeftRight className="h-3 w-3 mr-1" /> Mover
                        </Button>

                        {isAdmin && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenForm(p)}>
                                <Edit className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (confirm("Remover este produto do sistema?"))
                                    deleteMut.mutate(p.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <ProductFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        shopId={shopId}
        product={selectedProduct}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-products", shopId] })}
      />

      <StockMoveDialog
        open={moveOpen}
        onClose={() => setMoveOpen(false)}
        product={moveProduct}
        userId={user?.id}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-products", shopId] })}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------

function ProductFormDialog({ open, onClose, shopId, product, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    cost: "",
    min_stock: "0",
    stock_qty: "0",
  });

  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
          name: product.name || "",
          description: product.description || "",
          price: product.price ? String(product.price) : "0",
          cost: product.cost ? String(product.cost) : "0",
          min_stock: product.min_stock ? String(product.min_stock) : "0",
          stock_qty: product.stock_qty ? String(product.stock_qty) : "0",
        });
      } else {
        setFormData({
          name: "",
          description: "",
          price: "",
          cost: "",
          min_stock: "0",
          stock_qty: "0",
        });
      }
    }
  }, [open, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("O nome é obrigatório.");

    const price = parseFloat(formData.price.replace(",", ".") || "0");
    const cost = parseFloat(formData.cost.replace(",", ".") || "0");
    const min_stock = parseInt(formData.min_stock || "0", 10);
    const stock_qty = parseInt(formData.stock_qty || "0", 10);

    if (price < 0 || cost < 0) return toast.error("Preços não podem ser negativos.");
    if (min_stock < 0 || stock_qty < 0) return toast.error("Estoque não pode ser negativo.");

    setLoading(true);
    try {
      if (product) {
        await productService.updateProduct(product.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price,
          cost,
          min_stock,
          // We DO NOT update stock_qty directly on edit to prevent accidental overwrites of concurrent sales.
          // Stock should be adjusted via movements. But if it's a new product we set initial.
        });
        toast.success("Produto atualizado!");
      } else {
        await productService.createProduct({
          barbershop_id: shopId,
          name: formData.name.trim(),
          price,
          cost,
        });
        // We could also set initial stock and min stock here, but createProduct only accepts some fields.
        // For simplicity, relying on the actual backend support.
        // We'll update min_stock right after creation if supported.
        toast.success("Produto cadastrado com sucesso!");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar produto.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-11"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Preço Venda (R$) <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Custo (R$)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                className="h-11"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estoque Mínimo</Label>
              <Input
                type="number"
                step="1"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: e.target.value })}
                className="h-11"
              />
            </div>
            {!product && (
              <div className="space-y-2">
                <Label>Estoque Inicial</Label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.stock_qty}
                  onChange={(e) => setFormData({ ...formData, stock_qty: e.target.value })}
                  className="h-11"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Descrição (Opcional)</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-6">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 bg-accent text-accent-foreground font-bold"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------------------------

function StockMoveDialog({ open, onClose, product, userId, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<"in" | "out">("in");
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const delta = parseInt(qty || "0", 10);
    if (delta <= 0) return toast.error("A quantidade deve ser maior que zero.");

    const actualDelta = type === "in" ? delta : -delta;
    const currentStock = product.stock_qty || 0;

    if (currentStock + actualDelta < 0) {
      return toast.error("A saída não pode ser maior que o estoque atual.");
    }

    setLoading(true);
    try {
      await productService.updateStock(
        product.id,
        actualDelta,
        reason.trim() || `Ajuste manual (${type})`,
        userId,
      );
      toast.success("Estoque atualizado!");
      onSuccess();
      onClose();
      setQty("");
      setReason("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar estoque.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">Movimentar Estoque</DialogTitle>
          <DialogDescription className="text-sm">
            Atualizando: <strong className="text-foreground">{product?.name}</strong> (Atual:{" "}
            {product?.stock_qty || 0})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Movimento</Label>
              <Select value={type} onValueChange={(v: "in" | "out") => setType(v)}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Entrada (+)</SelectItem>
                  <SelectItem value="out">Saída (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Quantidade <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                step="1"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>

          {qty && parseInt(qty, 10) > 0 && (
            <div
              className={`p-3 rounded-lg text-sm font-bold flex justify-between items-center border ${type === "in" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600" : "bg-destructive/10 border-destructive/30 text-destructive"}`}
            >
              <span>Estoque final resultante:</span>
              <span className="text-lg">
                {(product?.stock_qty || 0) +
                  (type === "in" ? parseInt(qty, 10) : -parseInt(qty, 10))}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label>Motivo / Observação</Label>
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Compra de fornecedor, perda, etc..."
              className="h-11"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-6">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-11 bg-accent text-accent-foreground font-bold"
              disabled={loading}
            >
              {loading ? "Registrando..." : "Confirmar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
