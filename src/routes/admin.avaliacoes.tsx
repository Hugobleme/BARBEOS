import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { reviewService } from "@/services/review.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { Star, Trash2, MessageSquare, Reply, ShieldAlert, Filter, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Gestão de Avaliações — BarberOS" }] }),
  component: AvaliacoesPage,
});

function StarRating({ value, size = "md" }: { value: number | null | undefined; size?: "sm" | "md" }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${iconSize} ${i <= value ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

function AvaliacoesPage() {
  const { shopId, shop } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [replyModalReview, setReplyModalReview] = useState<any | null>(null);

  const { data: reviews, isLoading, refetch } = useQuery({
    queryKey: ["admin-reviews", shopId],
    enabled: !!shopId,
    queryFn: () => reviewService.getReviews(shopId!),
  });

  // Filtros aplicados
  const filteredReviews = useMemo(() => {
    return (reviews ?? []).filter((r: any) => {
      const matchRating =
        ratingFilter === "all" ||
        (ratingFilter === "5" && (r.shop_rating === 5 || r.professional_rating === 5)) ||
        (ratingFilter === "4" && (r.shop_rating === 4 || r.professional_rating === 4)) ||
        (ratingFilter === "3" && (r.shop_rating === 3 || r.professional_rating === 3)) ||
        (ratingFilter === "low" && ((r.shop_rating && r.shop_rating <= 2) || (r.professional_rating && r.professional_rating <= 2)));

      const term = searchTerm.trim().toLowerCase();
      const customerName = r.appointment?.customer?.full_name?.toLowerCase() || "";
      const comment = r.comment?.toLowerCase() || "";
      const proName = r.professional?.display_name?.toLowerCase() || "";

      const matchSearch = !term || customerName.includes(term) || comment.includes(term) || proName.includes(term);

      return matchRating && matchSearch;
    });
  }, [reviews, ratingFilter, searchTerm]);

  // Cálculos de Resumo
  const stats = useMemo(() => {
    const list = reviews ?? [];
    if (!list.length) {
      return { avgShop: "0.0", avgPro: "0.0", npsScore: "—", total: 0 };
    }

    const shopRatings = list.map((r: any) => r.shop_rating).filter((v: any): v is number => v != null);
    const proRatings = list.map((r: any) => r.professional_rating).filter((v: any): v is number => v != null);
    const npsList = list.map((r: any) => r.nps).filter((v: any): v is number => v != null);

    const avgShop = shopRatings.length
      ? (shopRatings.reduce((a, b) => a + b, 0) / shopRatings.length).toFixed(1)
      : "5.0";

    const avgPro = proRatings.length
      ? (proRatings.reduce((a, b) => a + b, 0) / proRatings.length).toFixed(1)
      : "5.0";

    let npsScore = "—";
    if (npsList.length) {
      const promoters = npsList.filter((n) => n >= 9).length;
      const detractors = npsList.filter((n) => n <= 6).length;
      npsScore = `${Math.round(((promoters - detractors) / npsList.length) * 100)}`;
    }

    return { avgShop, avgPro, npsScore, total: list.length };
  }, [reviews]);

  async function handleTogglePublic(id: string, isPublic: boolean) {
    if (!canManage) return toast.error("Permissão insuficiente.");

    try {
      await reviewService.updateReview(id, { is_public: isPublic });
      toast.success(isPublic ? "Avaliação exibida publicamente." : "Avaliação ocultada do público.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar visibilidade.");
    }
  }

  async function handleDeleteReview(id: string) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (!confirm("Tem certeza que deseja excluir permanentemente esta avaliação?")) return;

    try {
      await reviewService.deleteReview(id);
      toast.success("Avaliação excluída com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir avaliação.");
    }
  }

  return (
    <div className="space-y-8">
      {/* Topo */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Gestão de Avaliações</h1>
          <p className="text-muted-foreground">
            Acompanhe o nível de satisfação dos clientes, responda comentários e modere a exibição pública.
          </p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid gap-4 sm:grid-cols-4">
        {/* Avaliação Geral da Barbearia */}
        <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Média da Barbearia
            </span>
            <Star className="h-4 w-4 text-accent fill-accent" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-accent">{stats.avgShop}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Baseado em {stats.total} opiniões</p>
        </Card>

        {/* Avaliação dos Profissionais */}
        <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Média dos Barbeiros
            </span>
            <Star className="h-4 w-4 text-foreground/60" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-foreground">{stats.avgPro}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Desempenho da equipe</p>
        </Card>

        {/* Net Promoter Score (NPS) */}
        <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              NPS (Lealdade)
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-emerald-500">{stats.npsScore}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Escala de -100 a +100</p>
        </Card>

        {/* Total de Avaliações */}
        <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Total de Respostas
            </span>
            <MessageSquare className="h-4 w-4 text-accent" />
          </div>
          <div className="mt-2 font-serif text-3xl font-bold text-foreground">{stats.total}</div>
          <p className="mt-1 text-[10px] text-muted-foreground">Feedbacks recebidos</p>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <Card className="rounded-none border border-border bg-card/40 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="min-w-[220px] flex-1">
              <Input
                placeholder="Buscar por cliente, barbeiro ou comentário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-none h-10 text-xs"
              />
            </div>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-[180px] rounded-none h-10 text-xs">
                <SelectValue placeholder="Filtrar por estrelas" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="all">Todas as notas</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ (5 estrelas)</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ (4 estrelas)</SelectItem>
                <SelectItem value="3">⭐⭐⭐ (3 estrelas)</SelectItem>
                <SelectItem value="low">⭐⭐ ou menos (Críticas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Badge variant="outline" className="rounded-none text-xs font-mono text-accent">
            {filteredReviews.length} {filteredReviews.length === 1 ? "avaliação" : "avaliações"}
          </Badge>
        </div>
      </Card>

      {/* Lista de Avaliações */}
      <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
        {isLoading ? (
          <TableSkeleton rows={4} />
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Nenhuma avaliação encontrada"
            description="Os feedbacks enviados pelos clientes após os atendimentos aparecerão aqui."
          />
        ) : (
          <div className="divide-y divide-border/20">
            {filteredReviews.map((r: any) => {
              const customerName = r.appointment?.customer?.full_name || "Cliente";
              const proName = r.professional?.display_name || "Barbeiro";
              const dateStr = r.answered_at
                ? format(new Date(r.answered_at), "dd 'de' MMMM yyyy · HH:mm", { locale: ptBR })
                : "—";

              return (
                <div key={r.id} className="py-6 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2 flex-1">
                      {/* Linha superior: Nome, data, profissional */}
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-serif font-bold text-base text-foreground">{customerName}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{dateStr}</span>
                        <Badge variant="outline" className="rounded-none text-[10px] text-muted-foreground border-border/60">
                          Atendido por {proName}
                        </Badge>
                      </div>

                      {/* Estrelas */}
                      <div className="flex flex-wrap items-center gap-5 text-xs text-muted-foreground pt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Barbearia:</span>
                          <StarRating value={r.shop_rating} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">Profissional:</span>
                          <StarRating value={r.professional_rating} />
                        </div>
                        {r.nps != null && (
                          <div className="flex items-center gap-1.5 font-mono text-xs">
                            <span className="text-muted-foreground">NPS:</span>
                            <strong className="text-accent">{r.nps}/10</strong>
                          </div>
                        )}
                      </div>

                      {/* Comentário do Cliente */}
                      {r.comment ? (
                        <p className="mt-3 text-sm leading-relaxed text-foreground/90 bg-card/60 border border-border/40 p-3.5">
                          "{r.comment}"
                        </p>
                      ) : (
                        <p className="mt-1 text-xs italic text-muted-foreground">Cliente não deixou comentário em texto.</p>
                      )}

                      {/* Resposta Pública da Barbearia (se houver) */}
                      {r.reply && (
                        <div className="mt-3 border-l-2 border-accent bg-accent/5 p-3 text-xs space-y-1">
                          <div className="font-bold text-accent flex items-center gap-1.5">
                            <Reply className="h-3.5 w-3.5" /> Resposta da Barbearia:
                          </div>
                          <p className="text-muted-foreground">{r.reply}</p>
                        </div>
                      )}
                    </div>

                    {/* Ações: Visibilidade, Responder, Excluir */}
                    <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-2 border border-border bg-card/40 px-3 py-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          {r.is_public ? "Pública" : "Oculta"}
                        </span>
                        <Switch
                          checked={r.is_public}
                          onCheckedChange={(val) => handleTogglePublic(r.id, val)}
                          disabled={!canManage}
                        />
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setReplyModalReview(r)}
                        className="rounded-none text-xs"
                      >
                        <Reply className="mr-1.5 h-3.5 w-3.5 text-accent" />
                        {r.reply ? "Editar Resposta" : "Responder"}
                      </Button>

                      {canManage && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReview(r.id)}
                          className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          aria-label="Excluir avaliação"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal para Responder Avaliação */}
      {replyModalReview && (
        <ReplyModal
          review={replyModalReview}
          onClose={() => setReplyModalReview(null)}
          onSuccess={() => {
            setReplyModalReview(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function ReplyModal({
  review,
  onClose,
  onSuccess,
}: {
  review: any;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [replyText, setReplyText] = useState(review.reply || "");
  const [busy, setBusy] = useState(false);

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyText.trim()) return toast.error("Digite sua resposta.");

    setBusy(true);
    try {
      await reviewService.updateReview(review.id, {
        comment: review.comment,
        is_public: review.is_public ?? true,
      } as any);

      toast.success("Resposta enviada com sucesso!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao responder avaliação.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={handleSendReply}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Responder Avaliação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="border border-border bg-card/60 p-3">
              <span className="font-bold text-foreground">
                {review.appointment?.customer?.full_name || "Cliente"}
              </span>
              <p className="mt-1 text-muted-foreground italic">"{review.comment || "Sem comentário"}"</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rep_text">Sua Mensagem Pública *</Label>
              <Textarea
                id="rep_text"
                rows={4}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Agradeça o cliente ou esclareça a experiência..."
                className="rounded-none resize-none"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Salvando..." : "Publicar Resposta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
