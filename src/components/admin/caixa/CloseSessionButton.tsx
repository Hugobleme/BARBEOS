import { useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { cashService } from "@/services/cash.service";

interface CloseSessionButtonProps {
  session: any;
  onDone: () => void;
}

export function CloseSessionButton({ session, onDone }: CloseSessionButtonProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);

  async function close() {
    if (!user) return;
    setBusy(true);
    try {
      await cashService.closeSession(session.id, user.id, Number(amount));
      toast.success("Caixa fechado com sucesso");
      onDone();
      setOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao fechar caixa");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Lock className="mr-1 h-3 w-3" /> Fechar caixa
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fechar Caixa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            <Label>Valor Final em Dinheiro</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
            <p className="text-xs text-muted-foreground">Informe o valor total em espécie (notas e moedas) presente no caixa agora.</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={close} disabled={busy}>{busy ? "Fechando..." : "Confirmar Fechamento"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
