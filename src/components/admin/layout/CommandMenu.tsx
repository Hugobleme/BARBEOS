import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  DollarSign,
  LayoutDashboard,
  Search,
  ShoppingCart,
  Users,
  Settings,
  Scissors,
  BarChart3,
  Package,
  Wallet,
  Building2,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

interface CommandMenuProps {
  navItems: readonly { to: string; label: string; icon: any; exact: boolean }[];
}

export function CommandMenu({ navItems }: CommandMenuProps) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/40 bg-muted/20 text-muted-foreground transition-all hover:bg-accent/10 hover:text-accent md:h-10 md:w-40 md:justify-start md:px-3 md:gap-2"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="hidden text-xs font-medium md:inline-block">Buscar...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 md:ml-auto md:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite um comando ou busque..." />
        <CommandList className="max-h-[300px] overflow-y-auto">
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Navegação">
            {navItems.map((item) => (
              <CommandItem
                key={item.to}
                onSelect={() => runCommand(() => navigate({ to: item.to }))}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Ações Rápidas">
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/admin/agenda" }))}>
              <Calendar className="mr-2 h-4 w-4" />
              <span>Novo Agendamento</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/admin/pdv" }))}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>Abrir PDV</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/admin/clientes" }))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Cadastrar Cliente</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
