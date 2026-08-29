import { Link, useLocation } from "@tanstack/react-router";
import { Menu, Scissors, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 border-r border-border/40 bg-background/95 backdrop-blur-xl">
              <SheetHeader className="p-6 border-b border-border/40">
                <SheetTitle className="flex items-center gap-2.5 font-serif text-xl tracking-tight">
                  <span className="grid h-8 w-8 place-items-center border border-accent/40 bg-accent/10 text-accent">
                    <Scissors className="h-4 w-4" />
                  </span>
                  BarberOS
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] transition-all active:scale-95 ${loc.pathname === link.to ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"}`}
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="mt-2 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  >
                    Entrar
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>

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
          <ThemeToggle />
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
            className="rounded-none bg-accent text-accent-foreground text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] px-4 sm:px-6 hover:bg-foreground hover:text-background"
          >
            <Link to="/barbearias">Agendar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

