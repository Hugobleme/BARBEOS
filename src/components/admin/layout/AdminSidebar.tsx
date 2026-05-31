import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { LogOut, Scissors, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border/60 px-5">
        <Link to="/admin" className="flex items-center gap-2.5 font-serif text-lg tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-sm bg-accent text-accent-foreground">
            <Scissors className="h-4 w-4" />
          </span>
          BarberOS
        </Link>
        <button className="md:hidden" onClick={() => setOpen(false)}>
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="mt-4 px-3">
        {navItems.map((n) => {
          const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              preload="intent"
              className={`group relative mb-0.5 flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              <span className={`absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-accent transition-opacity ${active ? "opacity-100" : "opacity-0"}`} />
              <n.icon className={`h-4 w-4 ${active ? "text-accent" : ""}`} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="absolute inset-x-3 bottom-3">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
