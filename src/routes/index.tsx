import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { barbershopService } from "@/services/barbershop.service";
import { PublicLayout } from "@/components/site/PublicLayout";
import { MapProvider, MapView, MapPin as LeafletPin } from "@/components/map/MapProvider";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin as MapPinIcon, Star, Filter, Navigation, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/")({
  component: CustomerHome,
});

function getDeterministicCoords(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  const rnd1 = ((hash % 1000) / 1000) * 0.05 - 0.025;
  const rnd2 = (((hash / 1000) % 1000) / 1000) * 0.05 - 0.025;
  return { lat: -23.5505 + rnd1, lng: -46.6333 + rnd2 };
}

const FILTERS = ["Aberto agora", "Até R$50", "Patrocinada", "Tem produto"];

function CustomerHome() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const { data: shops = [] } = useQuery({
    queryKey: ["all-barbershops-map"],
    queryFn: async () => {
      const res = await barbershopService.getBarbershops({ limit: 100 });
      return res.data;
    }
  });

  const filteredShops = useMemo(() => {
    let result = shops;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.address && JSON.stringify(s.address).toLowerCase().includes(q))
      );
    }
    if (activeFilter === "Patrocinada") {
      result = result.filter(s => s.is_sponsored);
    }
    return result;
  }, [shops, debouncedSearch, activeFilter]);

  const pins = useMemo(() => {
    return filteredShops.map(s => {
      let lat = -23.5505, lng = -46.6333;
      if (s.address && typeof s.address === "object" && "lat" in s.address && "lng" in s.address) {
        lat = Number(s.address.lat);
        lng = Number(s.address.lng);
      } else {
        const coords = getDeterministicCoords(s.id);
        lat = coords.lat; lng = coords.lng;
      }
      return {
        id: s.id,
        lat,
        lng,
        title: s.name,
        is_sponsored: s.is_sponsored,
        popupContent: (
          <div className="flex flex-col gap-1 min-w-[160px] text-zinc-950 font-sans">
            <h3 className="font-bold text-sm truncate">{s.name}</h3>
            {s.is_sponsored && <span className="text-[9px] uppercase font-bold text-amber-700 bg-amber-100 w-fit px-1.5 py-0.5 rounded-sm">Patrocinada</span>}
            <div className="flex items-center gap-1 text-xs text-zinc-600 my-1">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              {(s as any).shop_rating?.toFixed(1) || "5.0"}
            </div>
            {s.is_sponsored ? (
               <Button asChild size="sm" className="mt-1 h-8 bg-amber-500 text-amber-950 hover:bg-amber-600 rounded-md text-xs font-bold w-full">
                 <Link to="/b/$slug" params={{ slug: s.slug }}>Agendar</Link>
               </Button>
            ) : (
               <Button asChild variant="outline" size="sm" className="mt-1 h-8 rounded-md text-xs font-medium w-full">
                 <Link to="/b/$slug" params={{ slug: s.slug }}>Ver Perfil</Link>
               </Button>
            )}
          </div>
        )
      };
    });
  }, [filteredShops]);

  const center: [number, number] = pins.length > 0 ? [pins[0].lat, pins[0].lng] : [-23.5505, -46.6333];

  return (
    <PublicLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Top Search & Filter Bar overlay */}
        <div className="absolute top-[64px] left-0 right-0 z-20 flex flex-col gap-3 p-4 bg-gradient-to-b from-background/90 to-transparent pointer-events-none">
          <div className="pointer-events-auto relative max-w-2xl mx-auto w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar bairro, endereço ou nome..." 
              className="pl-10 bg-background/90 backdrop-blur-md border-border/60 shadow-lg h-12 rounded-full text-[15px]"
            />
          </div>
          
          <div className="pointer-events-auto flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-2xl mx-auto w-full px-1">
            {FILTERS.map(f => (
              <Badge 
                key={f} 
                variant={activeFilter === f ? "default" : "outline"}
                className={`shrink-0 h-8 px-4 text-xs cursor-pointer transition-colors ${
                  activeFilter === f 
                    ? "bg-amber-500 text-amber-950 hover:bg-amber-600 border-transparent" 
                    : "bg-background/80 backdrop-blur-md hover:bg-muted"
                }`}
                onClick={() => setActiveFilter(activeFilter === f ? null : f)}
              >
                {f}
              </Badge>
            ))}
          </div>
        </div>

        {/* Fullscreen Map Area */}
        <div className="flex-1 relative bg-zinc-900 z-10">
          <MapProvider>
            <MapView pins={pins} center={center} zoom={debouncedSearch ? 14 : 12} />
          </MapProvider>
        </div>

        {/* Bottom List (Overlapping the map slightly, or just in a bottom drawer, but let's do a scrolling list below) */}
        <div className="h-[40vh] md:h-[45vh] bg-background border-t border-border/40 overflow-y-auto z-20 shadow-2xl rounded-t-3xl -mt-6">
          <div className="sticky top-0 bg-background/95 backdrop-blur-md z-10 px-6 py-4 border-b border-border/40 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">Perto de você</h2>
            <span className="text-xs text-muted-foreground">{filteredShops.length} resultados</span>
          </div>
          
          <div className="p-4 md:p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredShops.map(s => (
              <div key={s.id} className="flex gap-4 p-4 rounded-2xl border border-border/50 bg-card/40 transition-colors hover:border-amber-500/50">
                <Avatar className="h-20 w-20 rounded-xl border border-border/50 bg-muted shrink-0">
                  <AvatarFallback className="rounded-xl font-serif text-lg bg-accent/10 text-accent">
                    {s.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold font-serif text-[15px] truncate">{s.name}</h3>
                      <div className="flex items-center gap-1 text-[11px] font-medium bg-muted/50 px-1.5 py-0.5 rounded-sm shrink-0">
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        {(s as any).shop_rating?.toFixed(1) || "5.0"}
                      </div>
                    </div>
                    <p className="text-[12px] text-muted-foreground mt-1 line-clamp-1">
                      {(s.address as any)?.neighborhood || (s.address as any)?.city || "São Paulo, SP"}
                    </p>
                  </div>
                  
                  <div className="mt-3 flex items-center gap-2">
                    {s.is_sponsored ? (
                      <Button asChild size="sm" className="h-9 w-full bg-amber-500 text-amber-950 font-bold uppercase tracking-widest text-[10px] hover:bg-amber-600 rounded-lg">
                        <Link to="/b/$slug" params={{ slug: s.slug }}>Agendar</Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm" className="h-9 w-full font-bold uppercase tracking-widest text-[10px] rounded-lg">
                        <Link to="/b/$slug" params={{ slug: s.slug }}>Ver Perfil</Link>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {filteredShops.length === 0 && (
              <div className="col-span-full py-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                <Compass className="h-10 w-10 opacity-20" />
                <p>Nenhuma barbearia encontrada na sua busca.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
