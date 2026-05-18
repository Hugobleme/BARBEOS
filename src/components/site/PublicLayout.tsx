import type { ReactNode } from "react";
import { PublicHeader } from "./PublicHeader";
import { PublicFooter } from "./PublicFooter";

/**
 * Wraps public-facing pages in the Midnight Prestige dark theme.
 * Admin layouts stay in the light scheme because they are not nested here.
 */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dark">
      <div className="min-h-screen bg-background text-foreground selection:bg-accent/30">
        <PublicHeader />
        {children}
        <PublicFooter />
      </div>
    </div>
  );
}
