// @ts-nocheck
import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Star, CheckCircle2, Scissors, ArrowLeft, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/avaliar/$appointmentId")({
  component: ReviewPage,
});

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2 justify-center my-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <button 
          key={i} 
          type="button" 
          onClick={() => onChange(i)} 
          className="transition hover:scale-110 p-1"
        >
          <Star className={`h-10 w-10 md:h-12 md:w-12 ${i <= value ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewPage() {
  const { appointmentId } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [success, setSuccess] = useState(false);

  const { data: appt, isLoading, error } = useQuery({
    queryKey: ["review-appt", appointmentId],
    enabled: !!user?.id,
    queryFn: async () => {
      // Find customer ID first
      const { data: customers } = await supabase.from("customers").select("id").eq("profile_id", user!.id);
      const custIds = (customers || []).map(c => c.id);
      
      if (custIds.length === 0) throw new Error("Usuário sem registro de cliente.");

      const { data, error } = await supabase.from("appointments").select(`
        id, scheduled_start, status, barbershop_id, customer_id, professional_id,
        barbershop:barbershops(name),
        professional:professionals(display_name),
        satisfaction_surveys(id)
      `).eq("id", appointmentId).in("customer_id", custIds).maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Agendamento não encontrado ou não pertence a você.");

      const isCanceled = ["cancelled", "no_show"].includes(data.status || "");
      const past = isPast(new Date(data.scheduled_start));

      if (isCanceled) throw new Error("Este agendamento foi cancelado.");
      if (!past) throw new Error("Este agendamento ainda não aconteceu.");
      if (data.satisfaction_surveys) throw new Error("Você já avaliou este agendamento.");

      return data;
    },
    retry: false,
  });

  const submitMut = useMutation({
    mutationFn: async () => {
      if (!appt) return;
      const { error } = await supabase.from("satisfaction_surveys").insert({
        barbershop_id: appt.barbershop_id,
        professional_id: appt.professional_id,
        customer_id: appt.customer_id,
        appointment_id: appt.id,
        shop_rating: rating,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSuccess(true);
      toast.success("AvaliaÃ§Ã£o enviada!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao enviar avaliaÃ§Ã£o.")
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return toast.error("Selecione de 1 a 5 estrelas.");
    submitMut.mutate();
  };

  if (authLoading) return <PublicLayout><div className="flex justify-center p-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent"/></div></PublicLayout>;
  
  if (!user) {
    navigate({ to: "/login", search: { redirect: `/avaliar/${appointmentId}` } });
    return null;
  }

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center p-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
      </PublicLayout>
    );
  }

  if (error || !appt) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-xl font-bold font-serif mb-2">Não Ã© possível avaliar</h1>
          <p className="text-muted-foreground mb-8">{(error as Error)?.message || "Agendamento invÃ¡lido."}</p>
          <Button asChild className="h-12 w-full bg-accent text-accent-foreground font-bold">
            <Link to="/minha-conta">Voltar para Minha Conta</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (success) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <CheckCircle2 className="h-20 w-20 text-emerald-500 mb-6" />
          <h1 className="text-3xl font-bold font-serif mb-2">Obrigado!</h1>
          <p className="text-muted-foreground mb-8">Sua avaliaÃ§Ã£o ajuda a melhorar nossos serviços.</p>
          <Button asChild className="h-12 w-full bg-foreground text-background font-bold">
            <Link to="/minha-conta">Voltar para Minha Conta</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-16">
        <Button asChild variant="ghost" className="mb-6 -ml-4 text-muted-foreground">
          <Link to="/minha-conta"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar</Link>
        </Button>

        <Card className="p-6 md:p-8 border-border/60 shadow-lg">
          <div className="text-center mb-8">
            <Scissors className="h-8 w-8 text-accent mx-auto mb-3" />
            <h1 className="font-serif text-2xl md:text-3xl font-bold mb-2">Como foi o atendimento?</h1>
            <p className="text-sm text-muted-foreground">
              {appt.barbershop?.name} â€¢ {appt.professional?.display_name} <br/>
              {format(new Date(appt.scheduled_start), "dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Stars value={rating} onChange={setRating} />

            <div className="space-y-2">
              <Label className="text-base font-bold">ComentÃ¡rio (opcional)</Label>
              <Textarea 
                value={comment} 
                onChange={e => setComment(e.target.value)} 
                placeholder="Conte o que achou do serviço..."
                className="min-h-[120px] bg-background text-base resize-none"
              />
            </div>

            <Button 
              type="submit" 
              disabled={submitMut.isPending || rating === 0} 
              className="w-full h-12 md:h-14 bg-accent text-accent-foreground font-bold text-lg shadow-lg hover:scale-[1.02] transition-transform"
            >
              {submitMut.isPending ? "Enviando..." : "Enviar AvaliaÃ§Ã£o"}
            </Button>
          </form>
        </Card>
      </div>
    </PublicLayout>
  );
}

