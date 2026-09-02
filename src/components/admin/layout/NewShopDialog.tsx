import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { barbershopService } from "@/services/barbershop.service";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils";

export function NewShopDialog({
  onCreated,
  trigger,
}: {
  onCreated: () => void;
  trigger: React.ReactNode;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return toast.error("Informe o nome da barbearia");
    if (!user) return;

    setBusy(true);
    try {
      const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
      await barbershopService.create(name.trim(), slug, user.id);
      toast.success("Barbearia criada!");
      setOpen(false);
      setName("");
      onCreated();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar barbearia");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova barbearia</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2">
          <Label>Nome</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: BarberOS Centro"
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={create} disabled={busy}>
            {busy ? "Criando…" : "Criar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
