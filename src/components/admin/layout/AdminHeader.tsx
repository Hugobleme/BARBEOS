import * as React from "react";
import { Building2, Menu, Moon, Plus, Sun, User, LogOut, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewShopDialog } from "./NewShopDialog";
import { motion } from "framer-motion";
import { CommandMenu } from "./CommandMenu";
import { NotificationCenter } from "./NotificationCenter";
import { useLocation, Link, useNavigate } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { supabase } from "@/integrations/supabase/client";

interface HeaderProps {
  shopId: string | null;
  shops: any[];
  setShopId: (id: string) => void;
  refresh: () => void;
  setOpenSidebar: (open: boolean) => void;
  theme: string | undefined;
  toggleTheme: () => void;
  userEmail?: string;
  navItems: readonly { to: string; label: string; icon: any; exact: boolean }[];
}

export function AdminHeader({
  shopId,
  shops,
  setShopId,
  refresh,
  setOpenSidebar,
  theme,
  toggleTheme,
  userEmail,
  navItems,
}: HeaderProps) {
  const loc = useLocation();
  const navigate = useNavigate();
  const pathSegments = loc.pathname.split("/").filter(Boolean);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  };

  const displayName = userEmail ? userEmail.split("@")[0] : "Usuário";

  return (
    <header className="sticky top-0 z-30 flex h-20 md:h-16 flex-col md:flex-row items-stretch md:items-center justify-between gap-2 md:gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:px-8 py-2 md:py-0">
      <div className="flex items-center justify-between md:justify-start gap-4">
        <button
          type="button"
          aria-label="Abrir menu lateral"
          className="rounded-lg p-2 transition-colors hover:bg-accent/10 active:scale-90 md:hidden"
          onClick={() => setOpenSidebar(true)}
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Current page title for mobile & desktop */}
        <div className="flex-1 md:hidden text-center truncate pr-8">
          <span className="font-serif font-bold text-lg text-foreground capitalize">
            {pathSegments.length > 1
              ? pathSegments[pathSegments.length - 1].replace(/-/g, " ")
              : "Dashboard"}
          </span>
        </div>

        {/* Unit selector only if more than 1 shop */}
        {shops.length > 1 && (
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 rounded-xl border border-border/60 bg-muted/30 px-2 sm:px-3 py-1.5 transition-all hover:bg-muted/50">
            <Building2 className="h-4 w-4 text-accent shrink-0" />
            <Select value={shopId ?? undefined} onValueChange={setShopId}>
              <SelectTrigger className="h-7 w-[120px] sm:w-[180px] border-none bg-transparent p-0 text-sm font-semibold focus:ring-0">
                <SelectValue placeholder="Selecionar" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                {shops.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate max-w-[120px]">{s.name}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 shrink-0">
                        {s.role}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="h-4 w-[1px] bg-border/60 mx-1 shrink-0" />
            <NewShopDialog
              onCreated={refresh}
              trigger={
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Criar nova unidade"
                  className="h-7 w-7 rounded-lg hover:bg-accent/20 hover:text-accent shrink-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          </div>
        )}

        <div className="hidden lg:block">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/admin">Admin</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              {pathSegments.slice(1).map((seg, i) => (
                <React.Fragment key={seg}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="capitalize font-bold text-accent">
                      {seg.replace(/-/g, " ")}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>

      <div className="hidden md:flex items-center justify-between md:justify-end gap-2 md:gap-3">
        <CommandMenu navItems={navItems} />

        <div className="flex items-center gap-1 md:gap-2">
          {/* Notification Button with Badge */}
          <div className="relative">
            <NotificationCenter />
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              aria-label="Alternar tema"
              className="rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent"
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px]" />
              ) : (
                <Moon className="h-[18px] w-[18px]" />
              )}
            </Button>
          </motion.div>
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Menu do usuário"
              className="flex h-9 items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 md:px-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
                <User className="h-3.5 w-3.5 text-accent" />
              </div>
              <span className="hidden md:inline-block text-xs font-medium text-muted-foreground capitalize">
                {displayName}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-border/40">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none capitalize">{displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail || "email@desconhecido.com"}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/minha-conta" className="cursor-pointer gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>Meu perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/admin/configuracoes" className="cursor-pointer gap-2">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Configurações</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
