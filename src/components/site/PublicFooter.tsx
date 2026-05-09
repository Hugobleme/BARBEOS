export function PublicFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-muted-foreground md:grid-cols-3 md:px-6">
        <div>
          <div className="font-display text-base font-semibold text-foreground">BarberOS Demo</div>
          <p className="mt-2 max-w-xs">Rua Augusta, 1500 — São Paulo/SP</p>
          <p>(11) 99999-0000</p>
        </div>
        <div>
          <div className="font-medium text-foreground">Horário</div>
          <p className="mt-2">Seg a Sex • 09h–19h</p>
          <p>Sábado • 09h–17h</p>
        </div>
        <div>
          <div className="font-medium text-foreground">Política</div>
          <p className="mt-2">Cancelamento gratuito até 2h antes do horário marcado.</p>
        </div>
      </div>
      <div className="border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BarberOS — feito com cuidado.
      </div>
    </footer>
  );
}
