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
import { appointmentService } from "@/services/appointment.service";
import { cashService } from "@/services/cash.service";
import { PaymentMethod } from "@/services/cash.service";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Dinheiro",
  debit: "Débito",
  credit: "Crédito",
  pix: "Pix",
  transfer: "Transferência",
  other: "Outro",
};

interface CompletePaymentDialogProps {
  appt: any;
  onClose: () => void;
  userId: string | undefined;
  onDone: () => void;
}

export function CompletePaymentDialog({
  appt,
  onClose,
  userId,
  onDone,
}: CompletePaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (appt && amount === "") setAmount(String(Number(appt.total_amount)));

  async function submit() {
    if (!appt || !userId) return;
    setLoading(true);
    try {
      // 1. Get or open session
      const openSession = await cashService.getOpenSession(appt.barbershop_id);
      let sessionId = openSession?.id;

      if (!sessionId) {
        const created = await cashService.openSession(appt.barbershop_id, userId, 0);
        sessionId = created.id;
      }

      // 2. Complete and pay
      await appointmentService.completeAndPay({
        appointmentId: appt.id,
        barbershopId: appt.barbershop_id,
        customerId: appt.customer_id,
        professionalId: appt.professional_id,
        amount: Number(amount),
        method,
        userId,
        sessionId,
      });

      toast.success("Pagamento registrado e agendamento concluído!");
      onDone();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!appt} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Concluir Atendimento</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label>Valor Total</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Método de Pagamento</Label>
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
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? "Processando..." : "Confirmar e Receber"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
