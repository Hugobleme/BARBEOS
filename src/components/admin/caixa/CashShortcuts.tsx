import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface CashShortcutsProps {
  onOpenTx: (preset: { kind: "expense"; description: string }) => void;
}

export function CashShortcuts({ onOpenTx }: CashShortcutsProps) {
  const shortcuts = [
    { label: "Vale", description: "Vale profissional" },
    { label: "Material", description: "Material" },
    { label: "Limpeza", description: "Limpeza" },
    { label: "Contas", description: "Contas (água/luz/internet)" },
    { label: "Outros", description: "Outros" },
  ];

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Receipt className="h-4 w-4" /> Atalhos de despesa
      </div>
      <div className="flex flex-wrap gap-2">
        {shortcuts.map((s) => (
          <Button
            key={s.label}
            variant="outline"
            size="sm"
            onClick={() => onOpenTx({ kind: "expense", description: s.description })}
          >
            {s.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
