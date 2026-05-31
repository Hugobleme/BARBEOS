import { Building2, Menu, Moon, Plus, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NewShopDialog } from "./NewShopDialog";

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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl md:px-8">
      <button className="md:hidden" onClick={() => setOpenSidebar(true)}>
        <Menu className="h-5 w-5" />
      </button>
      <div className="flex flex-1 items-center gap-2">
        <Building2 className="h-4 w-4 text-accent" />
        <Select value={shopId ?? undefined} onValueChange={setShopId}>
          <SelectTrigger className="h-9 w-[220px] border-border/60 bg-transparent">
            <SelectValue placeholder="Selecionar barbearia" />
          </SelectTrigger>
          <SelectContent>
            {shops.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} <span className="ml-2 text-xs text-muted-foreground">({s.role})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <NewShopDialog onCreated={refresh} trigger={<Button size="sm" variant="ghost"><Plus className="h-4 w-4"/></Button>} />
      </div>
      <Button
        size="icon"
        variant="ghost"
        onClick={toggleTheme}
        aria-label="Alternar tema"
        className="text-muted-foreground hover:text-accent"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>
      <div className="hidden text-sm text-muted-foreground md:block">{userEmail}</div>
    </header>
  );
}
