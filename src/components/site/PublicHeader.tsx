import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export function PublicHeader() {
  const { isAuthenticated } = useAuth();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link to="/" className="flex items-center gap-2 font-display text-lg font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
            <Scissors className="h-4 w-4" />
          </span>
          BarberOS
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <Link to="/barbearias" className="hover:text-foreground">Barbearias</Link>
          <Link to="/servicos" className="hover:text-foreground">Serviços</Link>
          <Link to="/profissionais" className="hover:text-foreground">Equipe</Link>
          <Link to="/minha-conta" className="hover:text-foreground">Minha conta</Link>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Button asChild variant="ghost" size="sm"><Link to="/minha-conta">Minha conta</Link></Button>
          ) : (
            <Button asChild variant="ghost" size="sm"><Link to="/login">Entrar</Link></Button>
          )}
          <Button asChild size="sm"><Link to="/agendar">Agendar</Link></Button>
        </div>
      </div>
    </header>
  );
}
