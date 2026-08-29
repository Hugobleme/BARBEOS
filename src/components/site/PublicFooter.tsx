import { Link } from "@tanstack/react-router";
import { Scissors } from "lucide-react";

export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center border border-accent/40 bg-accent/10 text-accent">
                <Scissors className="h-4 w-4" />
              </span>
              <span className="font-serif text-xl tracking-tight text-foreground">BarberOS</span>
            </Link>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Atendimento exclusivo, agendamento sem atritos. A tradiÃ§Ã£o da barbearia elevada ao
              padrÃ£o contemporÃ¢neo.
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">Produto</div>
            <p className="mt-4 text-sm leading-relaxed">
              <Link to="/para-barbearias" className="text-muted-foreground hover:text-accent transition-colors">Para Barbearias</Link>
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">EndereÃ§o</div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Rua Augusta, 1500<br />SÃ£o Paulo Â· SP
            </p>
            <p className="mt-3 text-sm text-muted-foreground">(11) 99999-0000</p>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">HorÃ¡rio</div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Seg â€“ Sex Â· 09h â€“ 19h<br />SÃ¡bado Â· 09h â€“ 17h
            </p>
            <p className="mt-3 text-xs text-muted-foreground/70">
              Cancelamento gratuito atÃ© 2h antes.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-[11px] uppercase tracking-[0.25em] text-muted-foreground md:flex-row">
          <span>Â© {new Date().getFullYear()} BarberOS</span>
          <span>Crafted with precision in SÃ£o Paulo</span>
        </div>
      </div>
    </footer>
  );
}

