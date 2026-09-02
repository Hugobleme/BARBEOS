import { useState, lazy, Suspense } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

const AuroraDrawer = lazy(() =>
  import("./AuroraDrawer").then((m) => ({ default: m.AuroraDrawer })),
);

interface Props {
  barbershopId: string;
  barbershopName?: string;
  className?: string;
}

export function AuroraFab({ barbershopId, barbershopName, className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Falar com a Aurora"
        className={cn(
          "fixed bottom-5 right-5 z-40 group flex items-center gap-2 rounded-full pl-4 pr-5 py-3",
          "bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 text-background font-medium",
          "shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 transition-all",
          "ring-1 ring-amber-300/40",
          className,
        )}
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-background/15">
          <Mic className="h-5 w-5" />
          <span className="absolute inset-0 rounded-full bg-background/20 animate-ping opacity-60 group-hover:opacity-100" />
        </span>
        <span className="text-sm hidden sm:inline">Falar com Aurora</span>
      </button>
      {open && (
        <Suspense fallback={null}>
          <AuroraDrawer
            open={open}
            onOpenChange={setOpen}
            barbershopId={barbershopId}
            barbershopName={barbershopName}
          />
        </Suspense>
      )}
    </>
  );
}
