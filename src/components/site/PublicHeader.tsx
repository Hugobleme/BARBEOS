import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function PublicHeader() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center border border-accent/40 bg-accent/10 text-accent">
            <Scissors className="h-4 w-4" />
          </span>
          <span className="font-serif text-xl tracking-tight">BarberOS</span>
        </Link>
        <nav className="hidden items-center gap-8 text-[11px] font-medium uppercase tracking-[0.25em] text-muted-foreground md:flex">
          <Link to="/barbearias" className="transition-colors hover:text-accent">Barbearias</Link>
          <Link to="/servicos" className="transition-colors hover:text-accent">Serviços</Link>
          <Link to="/profissionais" className="transition-colors hover:text-accent">Equipe</Link>
          <Link to="/minha-conta" className="transition-colors hover:text-accent">Conta</Link>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="sm" className="text-xs uppercase tracking-widest">
              <Link to="/minha-conta">Minha conta</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm" className="text-xs uppercase tracking-widest">
              <Link to="/login">Entrar</Link>
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="rounded-none bg-accent text-accent-foreground text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-foreground hover:text-background"
          >
            <Link to="/agendar">Agendar</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
