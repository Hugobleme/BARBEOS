import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PublicHeader } from "@/components/site/PublicHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/avaliar/$appointmentId")({
  head: () => ({ meta: [{ title: "Avaliar atendimento — BarberOS" }] }),
  component: Page,
});

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button" onClick={()=>onChange(i)} className="transition hover:scale-110">
          <Star className={`h-8 w-8 ${i <= value ? "fill-accent text-accent" : "text-muted-foreground/40"}`} />
        </button>
      ))}
    </div>
  );
}

function Page() {
  const { appointmentId } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [shop, setShop] = useState(0);
  const [proR, setProR] = useState(0);
  const [nps, setNps] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [pub, setPub] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => { if (!loading && !user) nav({ to: "/login" }); }, [loading, user, nav]);

  const { data: appt } = useQuery({
    enabled: !!user,
    queryKey: ["appt-survey", appointmentId],
    queryFn: async () => (await supabase.from("appointments")
      .select("*, professional:professionals(display_name, id), customer:customers(profile_id)")
      .eq("id", appointmentId).maybeSingle()).data,
  });

  const { data: existing } = useQuery({
    enabled: !!appt,
    queryKey: ["survey-existing", appointmentId],
    queryFn: async () => (await supabase.from("satisfaction_surveys").select("*").eq("appointment_id", appointmentId).maybeSingle()).data,
  });

  useEffect(() => { if (existing) setDone(true); }, [existing]);

  async function submit() {
    if (shop === 0 || proR === 0) return toast.error("Dê uma nota para a loja e o profissional");
    const { error } = await supabase.from("satisfaction_surveys").insert({
      barbershop_id: appt!.barbershop_id,
      appointment_id: appointmentId,
      professional_id: appt!.professional?.id ?? null,
      shop_rating: shop, professional_rating: proR,
      nps: nps, comment: comment || null, is_public: pub,
    });
    if (error) return toast.error(error.message);
    toast.success("Obrigado pelo feedback!"); setDone(true);
  }

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-xl px-4 py-10 md:px-6">
        <Card className="p-6 md:p-8">
          {done ? (
            <div className="grid place-items-center text-center">
              <CheckCircle2 className="h-14 w-14 text-success"/>
              <h1 className="mt-4 font-display text-2xl font-bold">Avaliação registrada</h1>
              <p className="mt-1 text-sm text-muted-foreground">Sua opinião nos ajuda a melhorar.</p>
              <Button className="mt-6" onClick={()=>nav({ to: "/minha-conta" })}>Voltar</Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-bold">Como foi seu atendimento?</h1>
              {appt?.professional?.display_name && <p className="mt-1 text-sm text-muted-foreground">com {appt.professional.display_name}</p>}

              <div className="mt-6 space-y-5">
                <div><Label className="mb-2 block">Avaliação da barbearia</Label><Stars value={shop} onChange={setShop}/></div>
                <div><Label className="mb-2 block">Avaliação do profissional</Label><Stars value={proR} onChange={setProR}/></div>
                <div>
                  <Label className="mb-2 block">De 0 a 10, qual a chance de você nos recomendar?</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({length:11}, (_,i)=>i).map(n => (
                      <button key={n} type="button" onClick={()=>setNps(n)}
                        className={`h-10 w-10 rounded-md border text-sm transition ${nps===n?"border-accent bg-accent text-accent-foreground":"border-border hover:border-accent/60"}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <div><Label className="mb-2 block">Comentário (opcional)</Label><Textarea value={comment} onChange={e=>setComment(e.target.value)} rows={3}/></div>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={pub} onCheckedChange={(v:any)=>setPub(!!v)}/> Permitir exibir meu comentário publicamente</label>
                <Button className="w-full" size="lg" onClick={submit}>Enviar avaliação</Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
