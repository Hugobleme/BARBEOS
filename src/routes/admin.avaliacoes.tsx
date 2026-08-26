import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MessageCircleHeart, Filter, Clock, User, Calendar, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/admin/avaliacoes")({ component: AvaliacoesPage });

function AvaliacoesPage() {
  const { shopId } = useCurrentShop();
  const qc = useQueryClient();

  const [filterRating, setFilterRating] = useState("all");

  const { data: surveys = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-surveys", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("satisfaction_surveys")
        .select(`
          *,
          appointment:appointments(
            scheduled_start,
            customer:customers(full_name, phone)
          ),
          professional:professionals(display_name)
        `)
        .eq("barbershop_id", shopId!)
        .order("answered_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const hideMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("satisfaction_surveys").update({ is_public: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação ocultada do perfil público.");
      qc.invalidateQueries({ queryKey: ["admin-surveys", shopId] });
    }
  });

  const filtered = useMemo(() => {
    return surveys.filter(s => {
      if (filterRating === "all") return true;
      const r = s.shop_rating || 0;
      return r === parseInt(filterRating, 10);
    });
  }, [surveys, filterRating]);

  const stats = useMemo(() => {
    let total = 0;
    let sum = 0;
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;

    surveys.forEach(s => {
      const r = s.shop_rating;
      if (r && r > 0 && r <= 5) {
        total++;
        sum += r;
        dist[r]++;
      }
    });

    return { total, avg: total > 0 ? sum / total : 0, dist };
  }, [surveys]);

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      
      {/* HEADER */}
      <div className="flex flex-col gap-4 border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
              <MessageCircleHeart className="h-6 w-6 text-accent" /> Avaliações
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Acompanhe a satisfação dos seus clientes</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={filterRating} onValueChange={setFilterRating}>
              <SelectTrigger className="w-[140px] h-11 bg-background">
                <Filter className="h-4 w-4 mr-2 opacity-50" />
                <SelectValue placeholder="Estrelas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Notas</SelectItem>
                <SelectItem value="5">5 Estrelas</SelectItem>
                <SelectItem value="4">4 Estrelas</SelectItem>
                <SelectItem value="3">3 Estrelas</SelectItem>
                <SelectItem value="2">2 Estrelas</SelectItem>
                <SelectItem value="1">1 Estrela</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-card border-border/40 rounded-xl flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-accent/10 border border-accent/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-2xl font-bold text-accent font-mono leading-none">{stats.avg.toFixed(1)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Média Geral</span>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(stats.avg) ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              <span className="text-xs text-muted-foreground mt-1">Baseado em {stats.total} avaliações</span>
            </div>
          </Card>
          
          <Card className="p-4 bg-card border-border/40 rounded-xl flex flex-col justify-center gap-1.5 md:col-span-2">
            {[5, 4, 3, 2, 1].map(r => {
              const count = stats.dist[r];
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={r} className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 w-12 shrink-0 text-muted-foreground">
                    <span>{r}</span> <Star className="h-3 w-3 fill-current" />
                  </div>
                  <div className="flex-1 h-2 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-24">
          
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <Card key={i} className="h-32 animate-pulse rounded-xl border border-border/40 bg-muted/30" />)}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-muted-foreground mb-4">Erro ao carregar avaliações.</span>
              <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-20 text-center">
              <MessageCircleHeart className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-foreground">
                {filterRating !== "all" ? "Nenhuma avaliação com esta nota." : "Sua barbearia ainda não tem avaliações."}
              </h3>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map(s => {
                const appt = s.appointment as any;
                const cust = appt?.customer;
                const custName = cust?.full_name || "Cliente não identificado";
                const rating = s.shop_rating || 0;
                
                return (
                  <Card key={s.id} className={`flex flex-col p-4 sm:p-5 rounded-xl border border-border/40 transition-colors bg-card ${!s.is_public ? 'opacity-70' : ''}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star key={star} className={`h-3.5 w-3.5 ${star <= rating ? 'text-accent fill-accent' : 'text-muted-foreground/30'}`} />
                            ))}
                          </div>
                          <span className="font-bold text-sm text-foreground ml-1">{rating.toFixed(1)}</span>
                          {!s.is_public && <Badge variant="outline" className="text-[10px] uppercase bg-muted/50 text-muted-foreground ml-2"><EyeOff className="h-3 w-3 mr-1" /> Oculta</Badge>}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1 font-semibold text-foreground"><User className="h-3 w-3 text-muted-foreground" /> {custName}</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(s.answered_at), "dd/MM/yy")}</span>
                          {s.professional && (
                            <span className="flex items-center gap-1 bg-muted/50 px-2 py-0.5 rounded-md">Atendido por: {s.professional.display_name}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {s.comment && (
                      <div className="mt-3 p-3 bg-muted/20 border border-border/40 rounded-lg text-sm text-foreground italic">
                        "{s.comment}"
                      </div>
                    )}
                    
                    {!s.comment && (
                      <div className="mt-2 text-xs text-muted-foreground italic opacity-60">
                        (Avaliação sem comentário escrito)
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-4 pt-3 border-t border-border/40">
                      {/* Note: the database does not currently support saving a reply. 
                          We disable the button and show a friendly message to avoid faking persistence. */}
                      <Button variant="outline" size="sm" className="h-8 text-xs border-accent/30 text-accent hover:bg-accent/10" onClick={() => {
                        toast.info("Respostas públicas estarão disponíveis em breve!");
                      }}>
                        Responder
                      </Button>

                      {s.is_public && (
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10 ml-2" onClick={() => {
                          if (confirm("Deseja ocultar esta avaliação do seu perfil público?")) hideMut.mutate(s.id);
                        }}>
                          Ocultar
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
