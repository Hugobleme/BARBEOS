import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-muted/20 p-12 text-center"
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 max-w-[280px] text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {actionLabel && (
        <Button 
          onClick={onAction}
          className="mt-8 rounded-xl px-8"
        >
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
