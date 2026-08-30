import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";
import { BottomNavigation } from "./BottomNavigation";

/**
 * Wraps public-facing pages in the Midnight Prestige dark theme.
 * Admin layouts stay in the light scheme because they are not nested here.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground selection:bg-amber-500/30 pb-[60px] md:pb-0 flex flex-col">
        <PublicHeader />
        <main className="flex-1">
          {children}
        </main>
        <PublicFooter />
        <BottomNavigation />
      </div>
    </div>
  );
}
