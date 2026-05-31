import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface KPIProps {
  label: string;
  value: string;
  accent?: boolean;
}

export function KPI({ label, value, accent }: KPIProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        "relative overflow-hidden p-5 transition-all hover:shadow-lg hover:shadow-black/5", 
        accent ? "border-accent/40 bg-accent/5 shadow-md shadow-accent/5" : "bg-card/50 backdrop-blur-sm border-border/40"
      )}>
        {accent && <div className="absolute right-0 top-0 h-12 w-12 translate-x-4 -translate-y-4 rounded-full bg-accent/10 blur-xl" />}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
        <p className={cn(
          "mt-2 font-display text-2xl font-bold tracking-tight",
          accent ? "text-foreground" : "text-foreground/90"
        )}>
          {value}
        </p>
      </Card>
    </motion.div>
  );
}
