import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/site/PublicHeader";
import { PublicFooter } from "@/components/site/PublicFooter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { brl, minutes, phoneMask, DEMO_BARBERSHOP_ID } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { Check, ChevronLeft, ChevronRight, Scissors, User as UserIcon, Calendar as Cal, Clock } from "lucide-react";
import { addDays, addMinutes, format, isBefore, parse, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/agendar")({
  head: () => ({ meta: [{ title: "Agendar — BarberOS" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ shop: typeof s.shop === "string" ? s.shop : undefined }),
  component: Booking,
});

type Service = { id: string; name: string; duration_min: number; price: number; description: string | null };
type Pro = { id: string; display_name: string; specialties: string[] | null };
type WH = { professional_id: string; weekday: number; start_time: string; end_time: string; break_start: string | null; break_end: string | null };

const STEPS = ["Serviços","Profissional","Data","Horário","Identificação","Confirmação"] as const;

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2 text-xs md:text-sm">
      {STEPS.map((s, i) => (
        <li key={s} className="flex items-center gap-2">
          <span className={`grid h-7 w-7 place-items-center rounded-full border ${i<step?"bg-accent border-accent text-accent-foreground": i===step?"border-primary bg-primary text-primary-foreground":"border-border text-muted-foreground"}`}>{i<step?<Check className="h-3.5 w-3.5"/>:i+1}</span>
          <span className={i===step?"font-medium":"text-muted-foreground"}>{s}</span>
          {i<STEPS.length-1 && <ChevronRight className="h-4 w-4 text-muted-foreground"/>}
        </li>
      ))}
    </ol>
  );
}

function Booking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [pickedServices, setPicked] = useState<Service[]>([]);
  const [proId, setProId] = useState<string | "any">("any");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", createAccount: false, password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({data}) => {
        setForm(f => ({ ...f, name: data?.full_name ?? "", phone: data?.phone ?? "", email: user.email ?? "" }));
      });
    }
  }, [user]);

  const { data: services = [] } = useQuery({
    queryKey: ["svc"],
    queryFn: async () => ((await supabase.from("services").select("*").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true).order("sort")).data ?? []) as Service[],
  });
  const { data: pros = [] } = useQuery({
    queryKey: ["pros-all"],
    queryFn: async () => ((await supabase.from("professionals").select("*").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("active", true)).data ?? []) as Pro[],
  });
  const { data: workingHours = [] } = useQuery({
    queryKey: ["wh"],
    queryFn: async () => ((await supabase.from("working_hours").select("*")).data ?? []) as WH[],
  });

  const totalDuration = pickedServices.reduce((a, s) => a + s.duration_min, 0);
  const totalPrice = pickedServices.reduce((a, s) => a + Number(s.price), 0);
  const candidatePros = useMemo(() => proId === "any" ? pros : pros.filter(p => p.id === proId), [proId, pros]);

  const { data: dayAppts = [] } = useQuery({
    enabled: !!date && candidatePros.length > 0,
    queryKey: ["appts", date?.toISOString().slice(0,10), candidatePros.map(p=>p.id).join(",")],
    queryFn: async () => {
      if (!date) return [];
      const start = startOfDay(date).toISOString();
      const end = addDays(startOfDay(date), 1).toISOString();
      const { data } = await supabase.from("appointments")
        .select("professional_id, scheduled_start, scheduled_end, status")
        .in("professional_id", candidatePros.map(p=>p.id))
        .gte("scheduled_start", start).lt("scheduled_start", end)
        .neq("status", "cancelled");
      return data ?? [];
    },
  });

  const slots = useMemo(() => {
    if (!date || totalDuration === 0 || candidatePros.length === 0) return [] as { time: string; proId: string }[];
    const wd = date.getDay();
    const out: { time: string; proId: string }[] = [];
    const seen = new Set<string>();
    for (const pro of candidatePros) {
      const wh = workingHours.find(w => w.professional_id === pro.id && w.weekday === wd);
      if (!wh) continue;
      const dayStart = parse(wh.start_time, "HH:mm:ss", date);
      const dayEnd = parse(wh.end_time, "HH:mm:ss", date);
      const breakS = wh.break_start ? parse(wh.break_start, "HH:mm:ss", date) : null;
      const breakE = wh.break_end ? parse(wh.break_end, "HH:mm:ss", date) : null;
      const proAppts = dayAppts.filter(a => a.professional_id === pro.id).map(a => ({ s: new Date(a.scheduled_start), e: new Date(a.scheduled_end) }));

      let cur = dayStart;
      const now = new Date();
      while (addMinutes(cur, totalDuration) <= dayEnd) {
        const slotStart = cur;
        const slotEnd = addMinutes(cur, totalDuration);
        const inBreak = breakS && breakE && (slotStart < breakE && slotEnd > breakS);
        const overlaps = proAppts.some(a => slotStart < a.e && slotEnd > a.s);
        const inPast = isBefore(slotStart, addMinutes(now, 30));
        if (!inBreak && !overlaps && !inPast) {
          const key = format(slotStart, "HH:mm");
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ time: key, proId: pro.id });
          }
        }
        cur = addMinutes(cur, 15);
      }
    }
    return out.sort((a,b)=> a.time.localeCompare(b.time));
  }, [date, totalDuration, candidatePros, workingHours, dayAppts]);

  const toggleService = (s: Service) =>
    setPicked(prev => prev.find(p => p.id === s.id) ? prev.filter(p => p.id !== s.id) : [...prev, s]);

  const canNext = [
    pickedServices.length > 0,
    true,
    !!date,
    !!time,
    form.name.trim() && form.phone.replace(/\D/g,"").length >= 10 && (!form.createAccount || form.password.length >= 6),
    true,
  ][step];

  async function submit() {
    if (!date || !time) return;
    setSubmitting(true);
    try {
      const slot = slots.find(s => s.time === time);
      if (!slot) throw new Error("Horário indisponível");
      const start = parse(time, "HH:mm", date);
      const end = addMinutes(start, totalDuration);

      // create account?
      let userId: string | null = user?.id ?? null;
      if (!user && form.createAccount) {
        const redirectUrl = `${window.location.origin}/minha-conta`;
        const { data: signUp, error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { emailRedirectTo: redirectUrl, data: { full_name: form.name, phone: form.phone } },
        });
        if (error) throw error;
        userId = signUp.user?.id ?? null;
      }

      // create or get customer
      let customerId: string | null = null;
      if (userId) {
        const { data: existing } = await supabase.from("customers")
          .select("id").eq("barbershop_id", DEMO_BARBERSHOP_ID).eq("profile_id", userId).maybeSingle();
        if (existing) customerId = existing.id;
        else {
          const { data: c, error } = await supabase.from("customers").insert({
            barbershop_id: DEMO_BARBERSHOP_ID, profile_id: userId,
            full_name: form.name, phone: form.phone, email: form.email || null,
          }).select("id").single();
          if (error) throw error;
          customerId = c.id;
        }
      } else {
        const { data: c, error } = await supabase.from("customers").insert({
          barbershop_id: DEMO_BARBERSHOP_ID,
          full_name: form.name, phone: form.phone, email: form.email || null,
        }).select("id").single();
        if (error) throw error;
        customerId = c.id;
      }

      const { data: appt, error: aerr } = await supabase.from("appointments").insert({
        barbershop_id: DEMO_BARBERSHOP_ID,
        customer_id: customerId!,
        professional_id: slot.proId,
        scheduled_start: start.toISOString(),
        scheduled_end: end.toISOString(),
        total_amount: totalPrice,
        source: "web",
      }).select("id").single();
      if (aerr) throw aerr;

      const { error: serr } = await supabase.from("appointment_services").insert(
        pickedServices.map(s => ({ appointment_id: appt.id, service_id: s.id, price_snapshot: s.price, duration_snapshot: s.duration_min }))
      );
      if (serr) throw serr;

      setDoneId(appt.id);
      toast.success("Agendamento confirmado!");
    } catch (e: any) {
      toast.error(e.message ?? "Não foi possível concluir.");
    } finally {
      setSubmitting(false);
    }
  }

  if (doneId) {
    return (
      <div className="min-h-screen bg-background">
        <PublicHeader />
        <div className="mx-auto max-w-2xl px-4 py-16 md:px-6">
          <Card className="p-8 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success/15 text-success"><Check className="h-8 w-8" /></div>
            <h1 className="mt-4 font-display text-3xl font-bold">Agendamento confirmado!</h1>
            <p className="mt-2 text-muted-foreground">Protocolo: <span className="font-mono">{doneId.slice(0,8).toUpperCase()}</span></p>
            <div className="mt-6 rounded-xl bg-muted p-4 text-left text-sm">
              <div className="flex items-center gap-2"><Cal className="h-4 w-4 text-accent" />{date && format(date, "EEEE, d 'de' MMMM", { locale: ptBR })} • {time}</div>
              <div className="mt-2 flex items-center gap-2"><Scissors className="h-4 w-4 text-accent"/>{pickedServices.map(s=>s.name).join(" + ")}</div>
              <div className="mt-2 font-semibold">{brl(totalPrice)}</div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button asChild><Link to="/minha-conta">Ver meus agendamentos</Link></Button>
              <Button asChild variant="outline"><Link to="/">Voltar à home</Link></Button>
            </div>
          </Card>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <h1 className="font-display text-3xl font-bold md:text-4xl">Agendar horário</h1>
        <p className="mt-1 text-muted-foreground">Escolha serviços, profissional, data e horário.</p>

        <div className="mt-8">
          <Stepper step={step} />

          {step === 0 && (
            <Card className="p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Quais serviços?</h2>
              <div className="grid gap-2">
                {services.map(s => {
                  const sel = pickedServices.find(p => p.id === s.id);
                  return (
                    <button key={s.id} onClick={()=>toggleService(s)} className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${sel?"border-accent bg-accent/5":"hover:bg-muted/40"}`}>
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{minutes(s.duration_min)} · {brl(Number(s.price))}</div>
                      </div>
                      <div className={`grid h-6 w-6 place-items-center rounded-full border ${sel?"border-accent bg-accent text-accent-foreground":"border-border"}`}>{sel && <Check className="h-3.5 w-3.5"/>}</div>
                    </button>
                  );
                })}
              </div>
              {pickedServices.length>0 && (
                <div className="mt-4 flex items-center justify-between rounded-lg bg-muted px-4 py-3 text-sm">
                  <span>{pickedServices.length} serviço(s) · {minutes(totalDuration)}</span>
                  <span className="font-semibold">{brl(totalPrice)}</span>
                </div>
              )}
            </Card>
          )}

          {step === 1 && (
            <Card className="p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Com quem?</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                <button onClick={()=>setProId("any")} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${proId==="any"?"border-accent bg-accent/5":""}`}>
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-accent/15 text-accent"><UserIcon className="h-5 w-5"/></div>
                  <div><div className="font-medium">Qualquer profissional</div><div className="text-xs text-muted-foreground">Mais rápido</div></div>
                </button>
                {pros.map(p => (
                  <button key={p.id} onClick={()=>setProId(p.id)} className={`flex items-center gap-3 rounded-xl border p-4 text-left ${proId===p.id?"border-accent bg-accent/5":""}`}>
                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary text-primary-foreground">{p.display_name.split(" ").map(n=>n[0]).slice(0,2).join("")}</AvatarFallback></Avatar>
                    <div className="min-w-0">
                      <div className="font-medium">{p.display_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.specialties?.slice(0,2).join(" · ")}</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {step === 2 && (
            <Card className="p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Qual dia?</h2>
              <Calendar mode="single" selected={date} onSelect={setDate} locale={ptBR} disabled={(d)=> d < startOfDay(new Date()) || d > addDays(new Date(), 60)} className="rounded-md border" />
            </Card>
          )}

          {step === 3 && (
            <Card className="p-5">
              <h2 className="mb-3 font-display text-lg font-semibold">Que horas?</h2>
              {slots.length === 0 ? (
                <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  Nenhum horário disponível neste dia. Escolha outra data.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                  {slots.map(s => (
                    <button key={s.time+s.proId} onClick={()=>setTime(s.time)} className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-sm transition ${time===s.time?"border-accent bg-accent text-accent-foreground":"hover:bg-muted"}`}>
                      <Clock className="h-3.5 w-3.5 opacity-60"/>{s.time}
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {step === 4 && (
            <Card className="space-y-4 p-5">
              <h2 className="font-display text-lg font-semibold">Seus dados</h2>
              <div className="grid gap-3">
                <div><Label>Nome completo *</Label><Input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div><Label>Telefone *</Label><Input value={form.phone} onChange={e=>setForm(f=>({...f,phone:phoneMask(e.target.value)}))} placeholder="(11) 99999-0000" /></div>
                  <div><Label>E-mail</Label><Input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} /></div>
                </div>
                {!user && (
                  <>
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={form.createAccount} onCheckedChange={(v)=>setForm(f=>({...f,createAccount:!!v}))} />
                      Criar conta para acompanhar meus agendamentos
                    </label>
                    {form.createAccount && (
                      <div><Label>Senha (mín. 6)</Label><Input type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} /></div>
                    )}
                  </>
                )}
              </div>
            </Card>
          )}

          {step === 5 && (
            <Card className="space-y-4 p-5">
              <h2 className="font-display text-lg font-semibold">Confirmação</h2>
              <div className="space-y-2 text-sm">
                <Row label="Serviços">{pickedServices.map(s=>s.name).join(" + ")}</Row>
                <Row label="Duração">{minutes(totalDuration)}</Row>
                <Row label="Profissional">{proId==="any" ? "Qualquer profissional" : pros.find(p=>p.id===proId)?.display_name}</Row>
                <Row label="Data">{date && format(date, "EEEE, d 'de' MMMM", { locale: ptBR })}</Row>
                <Row label="Horário">{time}</Row>
                <Row label="Cliente">{form.name}</Row>
                <div className="mt-3 flex items-center justify-between border-t pt-3 text-base">
                  <span className="font-medium">Total</span>
                  <span className="text-xl font-semibold">{brl(totalPrice)}</span>
                </div>
                <p className="pt-3 text-xs text-muted-foreground">Pagamento na barbearia. Cancelamento gratuito até 2h antes.</p>
              </div>
            </Card>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" disabled={step===0} onClick={()=>setStep(s=>s-1)}><ChevronLeft className="mr-1 h-4 w-4"/>Voltar</Button>
            {step < 5 ? (
              <Button disabled={!canNext} onClick={()=>setStep(s=>s+1)}>Continuar<ChevronRight className="ml-1 h-4 w-4"/></Button>
            ) : (
              <Button disabled={submitting} onClick={submit}>{submitting?"Confirmando...":"Confirmar agendamento"}</Button>
            )}
          </div>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="text-right font-medium">{children}</span></div>;
}
