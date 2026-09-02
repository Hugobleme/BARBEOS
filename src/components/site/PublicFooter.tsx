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
              Atendimento exclusivo, agendamento sem atritos. A tradição da barbearia elevada ao
              padrão contemporâneo.
            </p>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              Institucional
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed">
              <li>
                <Link
                  to="/ajuda"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Ajuda
                </Link>
              </li>
              <li>
                <Link
                  to="/privacidade"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Privacidade
                </Link>
              </li>
              <li>
                <Link
                  to="/termos"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link
                  to="/para-barbearias"
                  className="text-muted-foreground hover:text-accent transition-colors"
                >
                  Para barbearias
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              Endereço
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Rua Augusta, 1500
              <br />
              São Paulo — SP
            </p>
            <p className="mt-3 text-sm text-muted-foreground">(11) 99999-0000</p>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent">
              Horário
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Seg — Sex • 09h — 19h
              <br />
              Sábado • 09h — 17h
            </p>
            <p className="mt-3 text-xs text-muted-foreground/70">
              Cancelamento gratuito até 2h antes.
            </p>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-border/40 pt-6 text-[11px] uppercase tracking-[0.25em] text-muted-foreground md:flex-row">
          <span>© {new Date().getFullYear()} BarberOS</span>
          <span>Crafted with precision in São Paulo</span>
        </div>
      </div>
    </footer>
  );
}
