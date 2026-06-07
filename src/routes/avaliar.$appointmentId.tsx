import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/avaliar/$appointmentId")({
  head: () => ({
    meta: [
      { title: "Avaliar atendimento — BarberOS" },
      { name: "description", content: "Compartilhe sua experiência e ajude a elevar o padrão de atendimento." },
      { name: "robots", content: "noindex,follow" },
    ],
  }),
  component: Page,
});

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onClick={() => onChange(i)} className="transition hover:scale-110">
          <Star
            className={`h-9 w-9 transition ${
              i <= value ? "fill-accent text-accent drop-shadow-[0_0_8px_color-mix(in_oklab,var(--accent)_40%,transparent)]" : "text-muted-foreground/40"
            }`}
          />
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

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const { data: appt } = useQuery({
    enabled: !!user,
    queryKey: ["appt-survey", appointmentId],
    queryFn: async () =>
      (
        await supabase
          .from("appointments")
          .select("*, professional:professionals(display_name, id), customer:customers(profile_id)")
          .eq("id", appointmentId)
          .maybeSingle()
      ).data,
  });

  const { data: existing } = useQuery({
    enabled: !!appt,
    queryKey: ["survey-existing", appointmentId],
    queryFn: async () => (await supabase.from("satisfaction_surveys").select("*").eq("appointment_id", appointmentId).maybeSingle()).data,
  });

  useEffect(() => {
    if (existing) setDone(true);
  }, [existing]);

  async function submit() {
    if (shop === 0 || proR === 0) return toast.error("Dê uma nota para a loja e o profissional");
    const { error } = await supabase.from("satisfaction_surveys").insert({
      barbershop_id: appt!.barbershop_id,
      appointment_id: appointmentId,
      professional_id: appt!.professional?.id ?? null,
      shop_rating: shop,
      professional_rating: proR,
      nps: nps,
      comment: comment || null,
      is_public: pub,
    });
    if (error) return toast.error(error.message);
    toast.success("Obrigado pelo feedback!");
    setDone(true);
  }

  if (loading || !user) return null;

  return (
    <PublicLayout>
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]"
        />
        <div className="mx-auto max-w-xl px-6 py-20 md:py-24">
          {done ? (
            <div className="grid place-items-center border border-border/60 bg-card/40 p-12 text-center">
              <CheckCircle2 className="h-14 w-14 text-accent" />
              <h1 className="mt-5 font-serif text-3xl font-bold">
                {shop === 5 ? "Uau, ficamos muito felizes! 🎉" : "Avaliação registrada"}
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {shop === 5 
                  ? "Sua nota 5 é muito importante para nós! Se possível, avalie a barbearia também no Google para nos ajudar a crescer." 
                  : "Sua opinião nos ajuda a melhorar nosso padrão de qualidade."}
              </p>
              
              {shop === 5 ? (
                <div className="mt-8 flex flex-col gap-3 w-full sm:w-auto">
                  <Button asChild size="lg" className="rounded-none uppercase tracking-[0.15em] bg-[#4285F4] text-white hover:bg-[#4285F4]/90 w-full">
                    {/* TO DO: Colar o link real de avaliações do Google Meu Negócio aqui */}
                    <a href="https://maps.google.com/" target="_blank" rel="noopener noreferrer">
                      <Star className="mr-2 h-5 w-5 fill-white" />
                      Avaliar no Google
                    </a>
                  </Button>
                  <Button variant="ghost" className="rounded-none uppercase tracking-[0.2em]" onClick={() => nav({ to: "/minha-conta" })}>
                    Voltar para conta
                  </Button>
                </div>
              ) : (
                <Button className="mt-8 rounded-none uppercase tracking-[0.2em]" onClick={() => nav({ to: "/minha-conta" })}>
                  Voltar
                </Button>
              )}
            </div>
          ) : (
            <div>
              <div className="text-center">
                <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-accent">Avaliação</p>
                <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl">
                  Como foi seu <span className="italic font-normal">atendimento</span>?
                </h1>
                {appt?.professional?.display_name && (
                  <p className="mt-3 text-sm text-muted-foreground">com {appt.professional.display_name}</p>
                )}
              </div>

              <div className="mt-10 space-y-7 border border-border/60 bg-card/40 p-8">
                <div>
                  <Label className="mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Barbearia</Label>
                  <Stars value={shop} onChange={setShop} />
                </div>
                <div>
                  <Label className="mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Profissional</Label>
                  <Stars value={proR} onChange={setProR} />
                </div>
                <div>
                  <Label className="mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                    Qual a chance de nos recomendar? (0–10)
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from({ length: 11 }, (_, i) => i).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNps(n)}
                        className={`h-10 w-10 border text-sm transition ${
                          nps === n ? "border-accent bg-accent text-accent-foreground" : "border-border hover:border-accent/60"
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="mb-3 block text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Comentário (opcional)</Label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="rounded-none border-border bg-transparent"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={pub} onCheckedChange={(v: any) => setPub(!!v)} />
                  Permitir exibir meu comentário publicamente
                </label>
                <Button className="w-full rounded-none uppercase tracking-[0.2em]" size="lg" onClick={submit}>
                  Enviar avaliação
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
