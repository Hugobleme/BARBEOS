import { Building2, Menu, Moon, Plus, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewShopDialog } from "./NewShopDialog";
import { motion } from "framer-motion";

interface HeaderProps {
  shopId: string | null;
  shops: any[];
  setShopId: (id: string) => void;
  refresh: () => void;
  setOpenSidebar: (open: boolean) => void;
  theme: string | undefined;
  toggleTheme: () => void;
  userEmail?: string;
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
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/40 bg-background/80 px-4 backdrop-blur-xl md:px-8">
      <div className="flex items-center gap-4">
        <button 
          className="rounded-lg p-2 transition-colors hover:bg-accent/10 active:scale-90 md:hidden" 
          onClick={() => setOpenSidebar(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-3 py-1.5 transition-all hover:bg-muted/50">
          <Building2 className="h-4 w-4 text-accent" />
          <Select value={shopId ?? undefined} onValueChange={setShopId}>
            <SelectTrigger className="h-7 w-[180px] border-none bg-transparent p-0 text-sm font-semibold focus:ring-0">
              <SelectValue placeholder="Selecionar barbearia" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/40">
              {shops.map((s) => (
                <SelectItem key={s.id} value={s.id} className="rounded-lg">
                  <div className="flex items-center justify-between gap-2">
                    <span>{s.name}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{s.role}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-4 w-[1px] bg-border/60 mx-1" />
          <NewShopDialog onCreated={refresh} trigger={
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg hover:bg-accent/20 hover:text-accent">
              <Plus className="h-4 w-4"/>
            </Button>
          } />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className="rounded-xl text-muted-foreground hover:bg-accent/10 hover:text-accent"
          >
            {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </Button>
        </motion.div>

        <div className="hidden h-9 items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-4 md:flex">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20">
            <User className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{userEmail}</span>
        </div>
      </div>
    </header>
  );
}
