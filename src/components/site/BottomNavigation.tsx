import { Link, useLocation } from "@tanstack/react-router";
import { Home, Search, Calendar, Heart, User } from "lucide-react";

const NAV_ITEMS = [
  { to: "/", icon: Home, label: "Início" },
  { to: "/barbearias", icon: Search, label: "Buscar" },
  { to: "/minha-conta", icon: Calendar, label: "Horários" }, // Could point to a specific tab later
  { to: "/clube", icon: Heart, label: "Favoritos" }, // Assuming Clube/Favoritos route
  { to: "/minha-conta", icon: User, label: "Perfil" },
];

export function BottomNavigation() {
  const loc = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between border-t border-border/60 bg-background/90 backdrop-blur-xl pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = loc.pathname === item.to || (item.to !== "/" && loc.pathname.startsWith(item.to));
        
        return (
          <Link
            key={item.label}
            to={item.to}
            className={`flex flex-col items-center justify-center w-full h-[60px] gap-1 transition-colors ${
              isActive ? "text-amber-500" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium tracking-wide">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
