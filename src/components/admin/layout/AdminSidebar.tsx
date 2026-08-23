import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { LogOut, Scissors, X, Search, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";

interface NavItem {
  to: string;
  label: string;
  icon: any;
  exact: boolean;
}

interface SidebarProps {
  navItems: readonly NavItem[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function AdminSidebar({ navItems, open, setOpen }: SidebarProps) {
  const loc = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  // Agrupamento lógico das 20 telas por categoria de negócio
  const navGroups: NavGroup[] = useMemo(() => {
    const map: Record<string, string[]> = {
      "Operação & Vendas": [
        "/admin",
        "/admin/agenda",
        "/admin/pdv",
        "/admin/caixa",
        "/admin/carteira",
      ],
      "Catálogo & Equipe": [
        "/admin/servicos",
        "/admin/profissionais",
        "/admin/equipe",
        "/admin/folgas",
        "/admin/portfolio",
      ],
      "Clientes & Marketing": [
        "/admin/clientes",
        "/admin/fidelidade",
        "/admin/pacotes",
        "/admin/cupons",
        "/admin/avaliacoes",
      ],
      "Gestão & Negócios": [
        "/admin/estoque",
        "/admin/comissoes",
        "/admin/relatorios",
        "/admin/franquia",
        "/admin/configuracoes",
      ],
    };

    const itemsByPath = new Map(navItems.map((item) => [item.to, item]));

    return Object.entries(map).map(([title, paths]) => ({
      title,
      items: paths.map((p) => itemsByPath.get(p)).filter(Boolean) as NavItem[],
    }));
  }, [navItems]);

  // Filtro por termo de busca
  const filteredGroups = useMemo(() => {
    if (!searchTerm.trim()) return navGroups;
    const term = searchTerm.toLowerCase();

    return navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(term)),
      }))
      .filter((g) => g.items.length > 0);
  }, [navGroups, searchTerm]);

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
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-64 flex-col border-r border-sidebar-border/50 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navegação Administrativa"
      >
        {/* Topo / Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border/40 px-6">
          <Link
            to="/admin"
            className="flex items-center gap-3 font-serif text-xl tracking-tight transition-transform active:scale-95"
            aria-label="BarberOS Painel Principal"
          >
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
              <Scissors className="h-5 w-5" />
            </span>
            <span className="font-bold text-foreground">BarberOS</span>
          </Link>
          <button
            className="rounded-lg p-2 hover:bg-sidebar-accent md:hidden text-muted-foreground"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu lateral"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Campo de Busca Rápida no Menu */}
        <div className="p-3 border-b border-sidebar-border/40 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar menu (ex: PDV, Caixa)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 rounded-lg border-sidebar-border/60 bg-sidebar-accent/30 pl-8 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-accent"
            />
          </div>
        </div>

        {/* Itens de Navegação Agrupados (Rolagem Fluida) */}
        <nav className="flex-1 overflow-y-auto min-h-0 space-y-4 p-3 scrollbar-thin scrollbar-thumb-sidebar-border/60">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              Nenhuma tela encontrada para "{searchTerm}".
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                  {group.title}
                </div>

                {group.items.map((n) => {
                  const active = n.exact
                    ? loc.pathname === n.to
                    : loc.pathname.startsWith(n.to);

                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setOpen(false)}
                      preload="intent"
                      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium transition-all ${
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute left-0 h-5 w-1 rounded-r-full bg-accent"
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30,
                          }}
                        />
                      )}
                      <n.icon
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active
                            ? "text-accent"
                            : "text-muted-foreground group-hover:text-accent"
                        }`}
                      />
                      <span className="truncate flex-1">{n.label}</span>
                      {active && (
                        <ChevronRight className="h-3 w-3 text-accent shrink-0" />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        {/* Rodapé Fixo: Sair do Sistema */}
        <div className="shrink-0 border-t border-sidebar-border/40 p-3 bg-sidebar">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95"
            aria-label="Sair da conta e encerrar sessão"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>
    </>
  );
}
