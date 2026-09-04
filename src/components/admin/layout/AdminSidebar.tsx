import { useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LogOut,
  Scissors,
  X,
  Search,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { useCurrentShop } from "@/hooks/use-current-shop";

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
  const { shop } = useCurrentShop();

  const [collapsed, setCollapsed] = useState(false);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    OPERAÇão: true,
    GESTão: true,
    CRESCIMENTO: true,
    CONFIGURAÇÕES: true,
  });

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const navGroups: NavGroup[] = useMemo(() => {
    const map: Record<string, string[]> = {
      OPERAÇão: ["/admin", "/admin/agenda", "/admin/pdv", "/admin/caixa"],
      GESTão: [
        "/admin/clientes",
        "/admin/servicos",
        "/admin/profissionais",
        "/admin/equipe",
        "/admin/estoque",
        "/admin/comissoes",
      ],
      CRESCIMENTO: [
        "/admin/avaliacoes",
        "/admin/cupons",
        "/admin/fidelidade",
        "/admin/pacotes",
        "/admin/portfolio",
        "/admin/relatorios",
      ],
      CONFIGURAÇÕES: [
        "/admin/horarios",
        "/admin/franquia",
        "/admin/folgas",
        "/admin/carteira",
        "/admin/configuracoes",
      ],
    };

    const itemsByPath = new Map(navItems.map((item) => [item.to, item]));

    return Object.entries(map).map(([title, paths]) => ({
      title,
      items: paths.map((p) => itemsByPath.get(p)).filter(Boolean) as NavItem[],
    }));
  }, [navItems]);

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
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-sidebar-border/50 bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out ${
          open ? "translate-x-0 w-72" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "md:w-20" : "md:w-64"}`}
        aria-label="Navegação Administrativa"
      >
        <div
          className={`flex h-16 shrink-0 items-center border-b border-sidebar-border/40 px-4 ${collapsed ? "justify-center" : "justify-between"}`}
        >
          <Link
            to="/admin"
            className={`flex items-center gap-3 font-serif text-xl tracking-tight transition-transform active:scale-95 ${collapsed ? "justify-center" : ""}`}
            aria-label="BarberOS Painel Principal"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
              <Scissors className="h-4 w-4" />
            </span>
            {!collapsed && <span className="font-bold text-foreground">BarberOS</span>}
          </Link>
          <div className="flex items-center gap-2">
            {!collapsed && (
              <button
                className="hidden md:flex rounded-lg p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
                onClick={() => setCollapsed(true)}
                aria-label="Recolher menu lateral"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent md:hidden"
              onClick={() => setOpen(false)}
              aria-label="Fechar menu lateral"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {collapsed && (
          <div className="hidden md:flex justify-center p-2 border-b border-sidebar-border/40">
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menu lateral"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {!collapsed && shop && (
          <div className="p-4 border-b border-sidebar-border/40 shrink-0">
            <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/30 p-3 border border-sidebar-border/40">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent font-bold uppercase overflow-hidden">
                {shop.name?.charAt(0) || "B"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-sm font-bold text-foreground">{shop.name}</span>
                <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                  {shop.role}
                </span>
              </div>
            </div>
          </div>
        )}

        {!collapsed && (
          <div className="p-3 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-8 rounded-lg border-sidebar-border/60 bg-sidebar-accent/30 pl-8 text-xs placeholder:text-muted-foreground/60 focus-visible:ring-accent"
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto min-h-0 p-3 scrollbar-thin scrollbar-thumb-sidebar-border/60">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              {!collapsed && "Nenhuma tela encontrada."}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map((group) => {
                const isOpen = openSections[group.title] !== false || searchTerm.length > 0;
                return (
                  <div key={group.title} className="space-y-1">
                    {!collapsed ? (
                      <button
                        onClick={() => toggleSection(group.title)}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        {group.title}
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                    ) : (
                      <div className="h-px w-full bg-sidebar-border/40 my-2" />
                    )}

                    <AnimatePresence initial={false}>
                      {(isOpen || collapsed) && (
                        <motion.div
                          initial={collapsed ? false : { height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-1 overflow-hidden"
                        >
                          {group.items.map((n) => {
                            const active = n.exact
                              ? loc.pathname === n.to
                              : loc.pathname.startsWith(n.to);

                            return (
                              <Link
                                key={n.to}
                                to={n.to}
                                onClick={() => {
                                  if (window.innerWidth < 768) setOpen(false);
                                }}
                                preload="intent"
                                title={collapsed ? n.label : undefined}
                                className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-xs font-medium transition-all ${
                                  active
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm"
                                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground"
                                } ${collapsed ? "justify-center px-0" : ""}`}
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
                                  className={`h-[18px] w-[18px] shrink-0 transition-colors ${
                                    active
                                      ? "text-accent"
                                      : "text-muted-foreground group-hover:text-accent"
                                  }`}
                                />
                                {!collapsed && (
                                  <>
                                    <span className="truncate flex-1">{n.label}</span>
                                    {active && (
                                      <ChevronRight className="h-3.5 w-3.5 text-accent shrink-0" />
                                    )}
                                  </>
                                )}
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border/40 p-3 bg-sidebar">
          <button
            onClick={handleSignOut}
            className={`flex items-center rounded-xl py-3 min-h-[44px] text-xs font-medium text-sidebar-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive active:scale-95 ${collapsed ? "w-full justify-center px-0" : "w-full gap-3 px-3"}`}
            aria-label="Sair da conta e encerrar sessão"
            title={collapsed ? "Sair do Sistema" : undefined}
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            {!collapsed && <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
