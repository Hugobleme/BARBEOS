import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { barbershopService } from "@/services/barbershop.service";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, Scissors, Star, Calendar, ExternalLink } from "lucide-react";
import { brl, minutes } from "@/lib/format";

export const Route = createFileRoute("/b/$slug")({
  loader: async ({ params }) => {
    try {
      const data = await barbershopService.getBarbershopBySlug(params.slug);
      if (!data || !data.shop) throw notFound();
      return data;
    } catch {
      throw notFound();
    }
  },
  component: BarbershopProfilePage,
});

function BarbershopProfilePage() {
  const data = Route.useLoaderData();
  const { slug } = Route.useParams();
  
  const shop = data.shop;
  const services = data.services ?? [];
  const professionals = data.professionals ?? [];
  const reviews = data.reviews ?? [];
  const portfolio = data.portfolio ?? [];

  const addr = (shop.address ?? {}) as any;
  const locationText = [addr.street, addr.neighborhood, addr.city, addr.state].filter(Boolean).join(", ");
  const phone = (shop.contacts as any)?.phone;

  return (
    <PublicLayout>
      {/* Banner / Cover */}
      <div className="relative h-64 md:h-80 w-full bg-muted overflow-hidden">
        {shop.banner_url ? (
          <img src={shop.banner_url} alt={shop.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted/50">
            <Scissors className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 max-w-5xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 md:h-28 md:w-28 rounded-xl bg-card border-4 border-background overflow-hidden shrink-0 shadow-lg">
              {shop.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-muted flex items-center justify-center font-serif text-3xl text-muted-foreground">
                  {shop.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="mb-2 md:mb-4">
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-foreground leading-tight">{shop.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                <Badge variant="secondary" className="flex items-center gap-1 font-bold">
                  <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                  {shop.rating?.toFixed(1) ?? "5.0"}
                </Badge>
                {locationText && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {addr.city || "Local"}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="hidden md:block mb-4">
            <Button asChild className="h-12 px-8 font-bold text-base bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg transition-transform hover:scale-105">
              <Link to="/agendar" search={{ barbershop: slug }}>
                Agendar Horário <Calendar className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 md:py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Column */}
        <div className="md:col-span-2 space-y-12">
          
          {/* About */}
          {shop.description && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Sobre a barbearia</h2>
              <p className="text-muted-foreground leading-relaxed">{shop.description}</p>
            </section>
          )}

          {/* Services */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Serviços</h2>
            {services.length === 0 ? (
              <div className="p-8 text-center bg-card/50 border border-border/40 rounded-xl">
                <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {services.map((s: any) => (
                  <Card key={s.id} className="p-4 flex items-center justify-between gap-4 border-border/40 hover:border-accent/40 transition-colors">
                    <div>
                      <h3 className="font-bold">{s.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                        <span className="bg-muted px-2 py-1 rounded text-foreground">{brl(s.price)}</span>
                        <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {minutes(s.duration)}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="h-10 shrink-0 border-accent/30 text-accent hover:bg-accent hover:text-accent-foreground">
                      <Link to="/agendar" search={{ barbershop: slug, service: s.id }}>
                        Agendar
                      </Link>
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Professionals */}
          {professionals.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Profissionais</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {professionals.map((p: any) => (
                  <Card key={p.id} className="p-4 flex flex-col justify-between border-border/40 hover:border-accent/40 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                        <AvatarImage src={p.avatar_url || ""} />
                        <AvatarFallback className="bg-muted text-muted-foreground font-serif">{p.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold group-hover:text-accent transition-colors">{p.display_name}</h3>
                        <p className="text-xs text-muted-foreground">{p.specialty || "Barbeiro"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      {p.slug ? (
                        <Button asChild variant="ghost" size="sm" className="h-9 text-xs">
                          <Link to="/b/$slug/p/$proSlug" params={{ slug, proSlug: p.slug }}>Ver perfil</Link>
                        </Button>
                      ) : (
                        <Button disabled variant="ghost" size="sm" className="h-9 text-xs opacity-50">Sem perfil</Button>
                      )}
                      <Button asChild variant="secondary" size="sm" className="h-9 text-xs bg-accent/10 text-accent hover:bg-accent hover:text-accent-foreground">
                        <Link to="/agendar" search={{ barbershop: slug, professional: p.id }}>Agendar</Link>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Gallery */}
          {portfolio.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Galeria</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {portfolio.slice(0, 6).map((img: any) => (
                  <div key={img.id} className="aspect-square rounded-xl overflow-hidden bg-muted">
                    <img src={img.image_url} alt="Trabalho" loading="lazy" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Reviews */}
          {reviews.length > 0 && (
            <section>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">Avaliações</h2>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="p-4 bg-card/30 border border-border/40 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[1,2,3,4,5].map(star => (
                          <Star key={star} className={`h-3.5 w-3.5 ${star <= r.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold">{r.customer?.full_name || "Cliente"}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="p-5 border-border/40 bg-card/50">
            <h3 className="font-bold mb-4">Informações</h3>
            <div className="space-y-4 text-sm text-muted-foreground">
              {locationText && (
                <div className="flex gap-3">
                  <MapPin className="h-5 w-5 text-accent shrink-0" />
                  <span>{locationText}</span>
                </div>
              )}
              {phone && (
                <div className="flex gap-3">
                  <Phone className="h-5 w-5 text-accent shrink-0" />
                  <span>{phone}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky Mobile CTA */}
      <div className="md:hidden fixed bottom-0 left-0 w-full p-4 bg-background/80 backdrop-blur-md border-t border-border/40 z-40">
        <Button asChild className="w-full h-12 font-bold text-base bg-accent text-accent-foreground shadow-lg">
          <Link to="/agendar" search={{ barbershop: slug }}>
            Agendar Horário <Calendar className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
      <div className="h-20 md:hidden" /> {/* Spacer */}
    </PublicLayout>
  );
}
