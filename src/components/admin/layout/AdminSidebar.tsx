import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { LogOut, Scissors, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  navItems: readonly { to: string; label: string; icon: any; exact: boolean }[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function AdminSidebar({ navItems, open, setOpen }: SidebarProps) {
  const loc = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <aside className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-sidebar-border/50 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border/40 px-6">
          <Link to="/admin" className="flex items-center gap-3 font-serif text-xl tracking-tight transition-transform active:scale-95">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
              <Scissors className="h-5 w-5" />
            </span>
            <span className="font-bold">BarberOS</span>
          </Link>
          <button className="rounded-lg p-2 hover:bg-sidebar-accent md:hidden" onClick={() => setOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="mt-6 space-y-1 px-3">
          {navItems.map((n) => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                preload="intent"
                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm" 
                    : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                }`}
              >
                {active && (
                  <motion.span 
                    layoutId="active-pill"
                    className="absolute left-0 h-6 w-1 rounded-r-full bg-accent"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <n.icon className={`h-[18px] w-[18px] transition-colors ${active ? "text-accent" : "group-hover:text-accent/80"}`} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-3 bottom-6">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/40 transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sair do Sistema
          </button>
        </div>
      </aside>
    </>
  );
}
