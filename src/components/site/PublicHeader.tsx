import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Scissors, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";


const NAV_LINKS = [
  { to: "/barbearias", label: "Barbearias" },
  { to: "/servicos", label: "ServiÃ§os" },
  { to: "/profissionais", label: "Equipe" },
  { to: "/clube", label: "Clube VIP" },
  { to: "/para-barbearias", label: "Para Barbearias" },
  { to: "/minha-conta", label: "Conta" },
];

export function PublicHeader() {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          

          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center border border-accent/40 bg-accent/10 text-accent">
              <Scissors className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl tracking-tight hidden xs:inline">BarberOS</span>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground md:flex">
          {NAV_LINKS.map(link => (
            <Link key={link.to} to={link.to} className="transition-colors hover:text-accent">{link.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="sm" className="hidden text-xs uppercase tracking-widest sm:flex">
              <Link to="/minha-conta">Minha conta</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="hidden text-xs uppercase tracking-widest sm:flex">
              <Link to="/login">Entrar</Link>
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="rounded-none bg-amber-500 text-amber-950 text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] px-4 sm:px-6 hover:bg-foreground hover:text-background"
          >
            <Link to="/barbearias">Agendar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}


