import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { cashService, CashTransaction, PaymentMethod } from "@/services/cash.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { brl } from "@/lib/format";
import { format, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { 
  ArrowDownCircle, ArrowUpCircle, Banknote, Calendar as Cal, CheckCircle2, 
  CreditCard, DollarSign, Filter, Lock, Plus, QrCode, Search, Trash2, Wallet,
  ArrowLeftRight, FileText
} from "lucide-react";

export const Route = createFileRoute("/admin/caixa")({ component: CaixaPage });

function CaixaPage() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();

  const isAdmin = shop?.role === "owner" || shop?.role === "admin";
  
  const [dateStr, setDateStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [entryType, setEntryType] = useState<"in" | "out">("in");

  const selectedDate = new Date(dateStr + "T12:00:00");

  const { data: openSession } = useQuery({
    queryKey: ["admin-cash-session", shopId],
    enabled: !!shopId,
    queryFn: () => cashService.getOpenSession(shopId!),
  });

  const { data: transactions = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-cash-tx", shopId, dateStr],
    enabled: !!shopId,
    queryFn: () => cashService.getCashEntries(shopId!, startOfDay(selectedDate), endOfDay(selectedDate)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => cashService.deleteCashEntry(id),
    onSuccess: () => {
      toast.success("Lançamento removido.");
      qc.invalidateQueries({ queryKey: ["admin-cash-tx", shopId, dateStr] });
      qc.invalidateQueries({ queryKey: ["admin-cash-session", shopId] });
    }
  });

  const filteredTx = useMemo(() => {
    if (filterMethod === "all") return transactions;
    return transactions.filter(t => t.method === filterMethod);
  }, [transactions, filterMethod]);

  const summary = useMemo(() => {
    let inputs = 0;
    let outputs = 0;
    const methods: Record<string, number> = {};

    filteredTx.forEach(t => {
      const amt = Number(t.amount || 0);
      if (t.kind === "in" || t.kind === "sale" || t.kind === "deposit") {
        inputs += amt;
      } else {
        outputs += amt;
      }
      methods[t.method] = (methods[t.method] || 0) + (t.kind === 'out' || t.kind === 'withdraw' ? -amt : amt);
    });

    return { inputs, outputs, balance: inputs - outputs, methods };
  }, [filteredTx]);

  const handleCreateEntry = (type: "in" | "out") => {
    setEntryType(type);
    setNewEntryOpen(true);
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
              <Wallet className="h-6 w-6 text-accent" /> Fluxo de Caixa
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gerencie entradas e saídas do dia</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Input 
              type="date" 
              value={dateStr} 
              onChange={e => setDateStr(e.target.value)} 
              className="w-auto h-11 bg-background"
            />
            {isAdmin && (
              <div className="flex gap-2">
                <Button variant="outline" className="h-11 px-3 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleCreateEntry("in")}>
                  <ArrowUpCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Entrada</span>
                </Button>
                <Button variant="outline" className="h-11 px-3 border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleCreateEntry("out")}>
                  <ArrowDownCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Saída</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 bg-card border-border/40 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" /> Entradas</span>
            <span className="font-mono font-bold text-emerald-500 text-lg sm:text-xl truncate">{brl(summary.inputs)}</span>
          </Card>
          <Card className="p-3 bg-card border-border/40 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><ArrowDownCircle className="h-3.5 w-3.5 text-destructive" /> Saídas</span>
            <span className="font-mono font-bold text-destructive text-lg sm:text-xl truncate">{brl(summary.outputs)}</span>
          </Card>
          <Card className="p-3 bg-accent/5 border-accent/20 rounded-xl flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Saldo</span>
            <span className="font-mono font-bold text-accent text-lg sm:text-xl truncate">{brl(summary.balance)}</span>
          </Card>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <Button variant={filterMethod === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterMethod("all")} className="rounded-full h-8 px-3 shrink-0">Todos</Button>
          <Button variant={filterMethod === "pix" ? "default" : "outline"} size="sm" onClick={() => setFilterMethod("pix")} className="rounded-full h-8 px-3 shrink-0"><QrCode className="h-3 w-3 mr-1.5" /> PIX</Button>
          <Button variant={filterMethod === "cash" ? "default" : "outline"} size="sm" onClick={() => setFilterMethod("cash")} className="rounded-full h-8 px-3 shrink-0"><Banknote className="h-3 w-3 mr-1.5" /> Dinheiro</Button>
          <Button variant={filterMethod === "credit" ? "default" : "outline"} size="sm" onClick={() => setFilterMethod("credit")} className="rounded-full h-8 px-3 shrink-0"><CreditCard className="h-3 w-3 mr-1.5" /> Crédito</Button>
          <Button variant={filterMethod === "debit" ? "default" : "outline"} size="sm" onClick={() => setFilterMethod("debit")} className="rounded-full h-8 px-3 shrink-0"><CreditCard className="h-3 w-3 mr-1.5" /> Débito</Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-24">
          
          <div className="mb-4">
            <Badge variant="outline" className={`font-mono px-3 py-1 text-xs uppercase ${openSession ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-muted text-muted-foreground'}`}>
              <Lock className="h-3 w-3 mr-1.5" />
              {openSession ? "Caixa Aberto" : "Caixa Fechado"}
            </Badge>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => <Card key={i} className="h-16 animate-pulse rounded-xl border border-border/40 bg-muted/30" />)}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-muted-foreground mb-4">Erro ao carregar movimentações.</span>
              <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
            </div>
          ) : filteredTx.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-20 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-foreground">Nenhuma movimentação neste período.</h3>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTx.map(tx => {
                const isIn = tx.kind === "in" || tx.kind === "sale" || tx.kind === "deposit";
                const isSale = tx.kind === "sale";
                const amt = Number(tx.amount || 0);
                
                return (
                  <Card key={tx.id} className="group flex items-center justify-between p-3 sm:p-4 rounded-xl border border-border/40 bg-card">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${isIn ? 'bg-emerald-500/10' : 'bg-destructive/10'}`}>
                        {isIn ? <ArrowUpCircle className="h-5 w-5 text-emerald-500" /> : <ArrowDownCircle className="h-5 w-5 text-destructive" />}
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="font-bold text-foreground text-sm truncate">{tx.description}</span>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                          <span>{format(new Date(tx.created_at), "HH:mm")}</span>
                          <span>•</span>
                          <span className="uppercase font-semibold flex items-center gap-1">
                            {tx.method === "pix" && <QrCode className="h-3 w-3" />}
                            {tx.method === "cash" && <Banknote className="h-3 w-3" />}
                            {(tx.method === "credit" || tx.method === "debit") && <CreditCard className="h-3 w-3" />}
                            {tx.method === "other" && <ArrowLeftRight className="h-3 w-3" />}
                            {tx.method}
                          </span>
                          {tx.customer && (
                            <>
                              <span>•</span>
                              <span className="truncate">Cliente: {tx.customer.full_name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className={`font-mono font-bold ${isIn ? 'text-emerald-500' : 'text-destructive'}`}>
                        {isIn ? '+' : '-'}{brl(amt)}
                      </span>
                      {isAdmin && !isSale && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                          if (confirm("Remover este lançamento manual do caixa?")) deleteMut.mutate(tx.id);
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      <NewEntryDialog 
        open={newEntryOpen} 
        onClose={() => setNewEntryOpen(false)} 
        shopId={shopId} 
        userId={user?.id}
        type={entryType} 
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["admin-cash-tx", shopId] });
          qc.invalidateQueries({ queryKey: ["admin-cash-session", shopId] });
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------

function NewEntryDialog({ open, onClose, shopId, userId, type, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    method: "cash" as PaymentMethod,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(formData.amount.replace(",", "."));
    if (isNaN(amt) || amt <= 0) return toast.error("Valor inválido.");
    if (!formData.description.trim()) return toast.error("A descrição é obrigatória.");

    setLoading(true);
    try {
      await cashService.createCashEntry({
        barbershop_id: shopId,
        description: formData.description.trim(),
        amount: amt,
        type: type === "in" ? "in" : "out",
        method: formData.method,
        created_by: userId,
      });
      toast.success("Lançamento registrado!");
      onSuccess();
      onClose();
      setFormData({ description: "", amount: "", method: "cash" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar lançamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {type === "in" ? (
              <><ArrowUpCircle className="h-5 w-5 text-emerald-500" /> Nova Entrada</>
            ) : (
              <><ArrowDownCircle className="h-5 w-5 text-destructive" /> Nova Saída</>
            )}
          </DialogTitle>
          <DialogDescription>
            Registre um lançamento avulso (ex: sangria, suprimento, pagamento de conta).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Descrição <span className="text-destructive">*</span></Label>
            <Input 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
              placeholder={type === "in" ? "Ex: Troco inicial" : "Ex: Compra de materiais"} 
              required 
              className="h-11"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) <span className="text-destructive">*</span></Label>
              <Input 
                type="number" 
                min="0.01" 
                step="0.01" 
                value={formData.amount} 
                onChange={e => setFormData({ ...formData, amount: e.target.value })} 
                required 
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Método <span className="text-destructive">*</span></Label>
              <Select value={formData.method} onValueChange={(v: PaymentMethod) => setFormData({ ...formData, method: v })}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="credit">Crédito</SelectItem>
                  <SelectItem value="debit">Débito</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-border/40">
            <Button type="button" variant="outline" className="h-11" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" className="h-11 bg-accent text-accent-foreground font-bold" disabled={loading}>
              {loading ? "Registrando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
