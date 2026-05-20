import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Star, Trash2, MessageSquare } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/avaliacoes")({
  head: () => ({ meta: [{ title: "Avaliações — Admin" }, { name: "robots", content: "noindex,nofollow" }] }),
  component: Page,
});

function Stars({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-4 w-4 ${i <= value ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function Page() {
  const shopId = useCurrentShopId();
  const qc = useQueryClient();

  const { data: surveys = [] } = useQuery({
    enabled: !!shopId,
    queryKey: ["surveys", shopId],
    queryFn: async () => {
      const { data } = await supabase
        .from("satisfaction_surveys")
        .select("*, professional:professionals(display_name), appointment:appointments(customer:customers(full_name))")
        .eq("barbershop_id", shopId!)
        .order("answered_at", { ascending: false });
      return data ?? [];
    },
  });

  async function togglePublic(id: string, v: boolean) {
    const { error } = await supabase.from("satisfaction_surveys").update({ is_public: v }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(v ? "Publicada" : "Ocultada");
    qc.invalidateQueries({ queryKey: ["surveys", shopId] });
  }

  async function remove(id: string) {
    if (!confirm("Excluir avaliação?")) return;
    const { error } = await supabase.from("satisfaction_surveys").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Avaliação removida");
    qc.invalidateQueries({ queryKey: ["surveys", shopId] });
  }

  const avg = (key: "shop_rating" | "professional_rating") => {
    const vals = surveys.map((s: any) => s[key]).filter((v: number | null): v is number => v != null);
    if (!vals.length) return null;
    return (vals.reduce((a: number, b: number) => a + b, 0) / vals.length).toFixed(1);
  };
  const npsScore = (() => {
    const v = surveys.map((s: any) => s.nps).filter((n: number | null): n is number => n != null);
    if (!v.length) return null;
    const promoters = v.filter((n: number) => n >= 9).length;
    const detractors = v.filter((n: number) => n <= 6).length;
    return Math.round(((promoters - detractors) / v.length) * 100);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Avaliações</h1>
        <p className="text-sm text-muted-foreground">Modere comentários públicos e acompanhe a satisfação dos clientes.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Nota loja</div>
          <div className="mt-2 font-display text-3xl font-bold">{avg("shop_rating") ?? "—"}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Nota profissional</div>
          <div className="mt-2 font-display text-3xl font-bold">{avg("professional_rating") ?? "—"}</div>
        </Card>
        <Card className="p-5">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">NPS</div>
          <div className="mt-2 font-display text-3xl font-bold">{npsScore ?? "—"}</div>
        </Card>
      </div>

      <Card className="divide-y divide-border">
        {surveys.length === 0 && (
          <div className="grid place-items-center gap-2 p-10 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-8 w-8 opacity-50" />
            Nenhuma avaliação ainda.
          </div>
        )}
        {surveys.map((s: any) => (
          <div key={s.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{s.appointment?.customer?.full_name ?? "Cliente"}</span>
                <Badge variant="outline" className="text-xs">{format(new Date(s.answered_at), "d MMM yyyy", { locale: ptBR })}</Badge>
                {s.professional?.display_name && <span className="text-xs text-muted-foreground">com {s.professional.display_name}</span>}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">Loja <Stars value={s.shop_rating} /></span>
                <span className="flex items-center gap-1.5">Profissional <Stars value={s.professional_rating} /></span>
                {s.nps != null && <span>NPS: <strong className="text-foreground">{s.nps}</strong></span>}
              </div>
              {s.comment && <p className="mt-3 text-sm leading-relaxed">{s.comment}</p>}
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={s.is_public} onCheckedChange={(v) => togglePublic(s.id, v)} />
                Pública
              </label>
              <Button variant="ghost" size="icon" onClick={() => remove(s.id)} aria-label="Excluir">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
