import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cashService, PaymentMethod } from "@/services/cash.service";

interface TransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string | null;
  sessionId: string | undefined;
  preset: { kind: string; description?: string } | null;
  onDone: () => void;
}

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  debit: "Débito",
  credit: "Crédito",
  pix: "Pix",
  transfer: "Transferência",
  other: "Outro",
};

export function TransactionDialog({
  open,
  onOpenChange,
  shopId,
  sessionId,
  preset,
  onDone,
}: TransactionDialogProps) {
  const { user } = useAuth();
  const [kind, setKind] = useState<string>("sale");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  // Sync preset
  if (open && preset && kind !== preset.kind) {
    setKind(preset.kind);
    if (preset.description) setDescription(preset.description);
  }

  async function submit() {
    if (!shopId || !sessionId || !user) return;
    if (!amount || !description) return toast.error("Preencha todos os campos");

    setBusy(true);
    try {
      await cashService.createTransaction({
        barbershop_id: shopId,
        session_id: sessionId,
        kind,
        method,
        amount: Number(amount),
        description,
        created_by: user.id,
      });
      toast.success("Lançamento realizado");
      onDone();
      onOpenChange(false);
      setAmount("");
      setDescription("");
    } catch (error: any) {
      toast.error(error.message || "Erro ao realizar lançamento");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sale">Venda</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Método</Label>
              <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                    <SelectItem key={m} value={m}>
                      {METHOD_LABEL[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Valor</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="grid gap-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento fornecedor"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
