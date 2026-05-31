import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KPIProps {
  label: string;
  value: string;
  accent?: boolean;
}

export function KPI({ label, value, accent }: KPIProps) {
  return (
    <Card className={cn("p-4", accent && "border-accent/50 bg-accent/5")}>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-2xl font-bold font-display">{value}</p>
    </Card>
  );
}
