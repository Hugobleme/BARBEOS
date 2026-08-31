import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, minutes } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { Check, ChevronLeft, ChevronRight, Scissors, User as UserIcon, Clock, AlertCircle, MapPin } from "lucide-react";
import { addDays, format, isBefore, startOfDay, parse, addMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { appointmentService } from "@/services/appointment.service";
import { z } from "zod";

const searchSchema = z.object({
  barbershop: z.string().catch("").optional(),
  service: z.string().catch("").optional(),
  professional: z.string().catch("").optional(),
});

export const Route = createFileRoute("/agendar")({
  validateSearch: (search) => searchSchema.parse(search),
  component: BookingPage,
  errorComponent: BookingErrorBoundary,
});

function BookingErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Booking route error", error);
  const isChunkError = error.name === "ChunkLoadError" || error.message.includes("Failed to fetch dynamically imported module") || error.message.includes("Importing a module script failed");
  if (isChunkError) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-accent mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">Uma nova versão do BARBEOS estÃ¡ disponível.</h2>
          <p className="text-muted-foreground mb-8">Atualize a página para acessar a melhor experiência.</p>
          <Button onClick={() => window.location.reload()} className="font-bold uppercase tracking-wider text-xs px-6">Atualizar agora</Button>
        </div>
      </PublicLayout>
    );
  }
  return (
    <PublicLayout>
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
        <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2">Não conseguimos acessar a agenda neste momento.</h2>
        <p className="text-muted-foreground mb-8">Aconteceu um erro inesperado. Tente novamente ou retorne para a lista.</p>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto justify-center">
          <Button onClick={() => window.location.reload()} variant="outline" className="font-bold uppercase tracking-wider text-xs">Tentar novamente</Button>
          <Button asChild className="font-bold uppercase tracking-wider text-xs"><Link to="/barbearias">Encontrar outro local</Link></Button>
        </div>
      </div>
    </PublicLayout>
  );
}

const STEPS = ["Serviço", "Profissional", "3. Escolha o dia e horário", "Confirmar"] as const;

type Service = { id: string; name: string; duration_min: number; price: number; description: string | null };
type Pro = { id: string; display_name: string; avatar_url: string | null; specialties: string[] | null };
type TimeSlot = string;

function BookingPage() {
  const { barbershop: shopSlug, service: initialService, professional: initialPro } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Basic queries
  const { data: shop, isLoading: shopLoading, error: shopError } = useQuery({
    queryKey: ["book-shop", shopSlug],
    enabled: !!shopSlug,
    queryFn: async () => {
      const { data, error } = await supabase.from("barbershops").select("id, name, slug, logo_url, is_sponsored").eq("slug", shopSlug!).eq("active", true).maybeSingle();
      if (error) {
        if (import.meta.env.DEV) console.error("Booking page load failed: barbershop", error);
        throw error;
      }
      return data;
    },
  });

  const { data: services = [], isLoading: svcsLoading, error: svcsError } = useQuery({
    queryKey: ["book-services", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("services").select("id, name, duration_min, price, description").eq("barbershop_id", shop!.id).eq("active", true).order("name");
      if (error) {
        if (import.meta.env.DEV) console.error("Booking page load failed: services", error);
        throw error;
      }
      return (data as Service[]) || [];
    },
  });

  const { data: pros = [], isLoading: prosLoading, error: prosError } = useQuery({
    queryKey: ["book-pros", shop?.id],
    enabled: !!shop?.id,
    queryFn: async () => {
      const { data, error } = await supabase.from("professionals").select("id, display_name, avatar_url, specialties").eq("barbershop_id", shop!.id).eq("active", true);
      if (error) {
        if (import.meta.env.DEV) console.error("Booking page load failed: professionals", error);
        throw error;
      }
      return (data as Pro[]) || [];
    },
  });

  // Booking state
  const [step, setStep] = useState(0);
  const [pickedServices, setPickedServices] = useState<Service[]>([]);
  const [proId, setProId] = useState<string | "any">("any");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string | null>(null);

  // Auth state (if not logged in)
  const [authMode, setAuthMode] = useState<"login"|"register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  
  const [submitting, setSubmitting] = useState(false);

  // Handle URL pre-selections
  useEffect(() => {
    if (services.length > 0 && initialService && pickedServices.length === 0) {
      const s = services.find(x => x.id === initialService);
      if (s) setPickedServices([s]);
    }
  }, [services, initialService, pickedServices.length]);

  useEffect(() => {
    if (pros.length > 0 && initialPro && proId === "any") {
      const p = pros.find(x => x.id === initialPro);
      if (p) setProId(p.id);
    }
  }, [pros, initialPro, proId]);

  // Derived state
  
  const slug = shopSlug?.trim();

  // Reset steps if parent selections change
  useEffect(() => {
    if (pickedServices.length === 0 && step > 0) setStep(0);
  }, [pickedServices.length, step]);
  useEffect(() => {
    if (proId === "any" && pros.length > 0 && step > 1) { /* maybe reset? but any is fine */ }
  }, [proId, pros, step]);
  useEffect(() => {
    if (!date && step > 2) setStep(2);
  }, [date, step]);

  const totalDuration = pickedServices.reduce((a, b) => a + (b.duration_min || 0), 0);
  const totalPrice = pickedServices.reduce((a, b) => a + (Number(b.price) || 0), 0);

  // Availability calculation (mocking time slots based on totalDuration for simplicity, but integrating nicely)
  const { data: slotsData, isLoading: slotsLoading, error: slotsError } = useQuery({
      queryKey: ["book-slots", shop?.id, proId, date?.toISOString(), totalDuration],
      enabled: !!shop?.id && !!date && pickedServices.length > 0 && pros.length > 0,
      queryFn: async () => {
        try {
          const selectedPros = proId === "any" ? pros : pros.filter(p => p.id === proId);
          if (selectedPros.length === 0) return { times: [], timeToPros: {} };
          
          const proIds = selectedPros.map(p => p.id);
          const jsDay = date!.getDay();
          
          const { data: whData, error: whErr } = await supabase
            .from("working_hours")
            .select("*")
            .in("professional_id", proIds)
            .eq("weekday", jsDay);
          if (whErr) throw whErr;
          
          const dayStart = startOfDay(date!);
          const dayEnd = addDays(dayStart, 1);
          
          const { data: toData, error: toErr } = await supabase
            .from("time_off")
            .select("*")
            .in("professional_id", proIds)
            .gte("end_at", dayStart.toISOString())
            .lt("start_at", dayEnd.toISOString());
          if (toErr) throw toErr;
          
          const { data: appData, error: appErr } = await supabase
            .from("appointments")
            .select("professional_id, scheduled_start, scheduled_end, status")
            .in("professional_id", proIds)
            .neq("status", "cancelled")
            .gte("scheduled_end", dayStart.toISOString())
            .lt("scheduled_start", dayEnd.toISOString());
          if (appErr) throw appErr;

          const times = new Set<string>();
          const timeToPros: Record<string, string[]> = {};
          const now = new Date();

          const parseTime = (tStr: string, base: Date) => {
            const [h, m] = tStr.split(":");
            const d = new Date(base);
            d.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
            return d;
          };

          for (const pro of selectedPros) {
            const whList = whData.filter(w => w.professional_id === pro.id);
            if (whList.length === 0) continue;
            
            const toList = toData.filter(t => t.professional_id === pro.id).map(t => ({
              start: new Date(t.start_at).getTime(),
              end: new Date(t.end_at).getTime()
            }));
            
            const appList = appData.filter(a => a.professional_id === pro.id).map(a => ({
              start: new Date(a.scheduled_start).getTime(),
              end: new Date(a.scheduled_end).getTime()
            }));

            for (const wh of whList) {
              const startDateTime = parseTime(wh.start_time, dayStart);
              const endDateTime = parseTime(wh.end_time, dayStart);
              let breakStartTime = null;
              let breakEndTime = null;
              
              if (wh.break_start && wh.break_end) {
                breakStartTime = parseTime(wh.break_start, dayStart);
                breakEndTime = parseTime(wh.break_end, dayStart);
              }
              
              let current = startDateTime;
              while (addMinutes(current, totalDuration) <= endDateTime) {
                const currentEnd = addMinutes(current, totalDuration);
                
                if (current < now) {
                  current = addMinutes(current, 30);
                  continue;
                }
                
                if (breakStartTime && breakEndTime) {
                  if (current < breakEndTime && currentEnd > breakStartTime) {
                    current = addMinutes(current, 30);
                    continue;
                  }
                }
                
                const cTime = current.getTime();
                const eTime = currentEnd.getTime();
                
                let conflict = false;
                for (const t of toList) {
                  if (cTime < t.end && eTime > t.start) { conflict = true; break; }
                }
                if (conflict) { current = addMinutes(current, 30); continue; }
                
                for (const a of appList) {
                  if (cTime < a.end && eTime > a.start) { conflict = true; break; }
                }
                if (conflict) { current = addMinutes(current, 30); continue; }
                
                const timeStr = format(current, "HH:mm");
                times.add(timeStr);
                if (!timeToPros[timeStr]) timeToPros[timeStr] = [];
                timeToPros[timeStr].push(pro.id);
                
                current = addMinutes(current, 30);
              }
            }
          }
          
          return {
            times: Array.from(times).sort(),
            timeToPros
          };
        } catch (err) {
          if (import.meta.env.DEV) console.error("Booking page load failed: slots", err);
          throw err;
        }
      },
    });

    const slots = slotsData?.times || [];

  const canNext = useMemo(() => {
    if (step === 0) return pickedServices.length > 0;
    if (step === 1) return !!proId;
    if (step === 2) return !!date && !!time;
    return true;
  }, [step, pickedServices, proId, date, time]);

  if (!slug) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">Descubra sua próxima barbearia.</h2>
          <Button asChild className="mt-4"><Link to="/barbearias">Explorar locais</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  if (shopError || svcsError || prosError || slotsError) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">Tivemos um problema ao conectar com a barbearia.</h2>
          <p className="text-muted-foreground mb-8">Tente novamente em alguns instantes.</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="font-bold uppercase tracking-wider text-xs">Tentar novamente</Button>
        </div>
      </PublicLayout>
    );
  }

  if (shopLoading) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent mb-4" />
          <p className="text-muted-foreground text-sm">Carregando agendamento...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!shopLoading && !shop) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">Ops, não encontramos este local.</h2>
          <p className="text-muted-foreground mb-8">A barbearia que você procura parece estar indisponível. Veja outras excelentes opções.</p>
          <Button asChild variant="outline" className="font-bold uppercase tracking-wider text-xs"><Link to="/barbearias">Voltar para barbearias</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  if (!svcsLoading && services.length === 0) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">A barbearia ainda não configurou seus serviços online.</h2>
          <Button asChild className="mt-4 font-bold uppercase tracking-wider text-xs"><Link to="/barbearias">Voltar para barbearias</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  if (!prosLoading && pros.length === 0) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="text-xl font-bold font-serif mb-2">No momento, nenhum profissional está com a agenda aberta nesta unidade.</h2>
          <Button asChild className="mt-4 font-bold uppercase tracking-wider text-xs"><Link to="/barbearias">Voltar para barbearias</Link></Button>
        </div>
      </PublicLayout>
    );
  }

  const submit = async () => {
    if (!shop) return;
    setSubmitting(true);
    try {
      let currentUser = user;
      
      // Inline auth if needed
      if (!currentUser) {
        if (authMode === "register") {
          const { data: signupRes, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: name, phone } }
          });
          if (error) throw error;
          currentUser = signupRes.user;
        } else {
          const { data: loginRes, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          if (error) throw error;
          currentUser = loginRes.user;
        }
      }

      if (!currentUser) throw new Error("Falha na autenticaÃ§Ã£o.");

      // Verify or create customer record
      const { data: existingCustomer } = await supabase.from("customers").select("id").eq("profile_id", currentUser.id).eq("barbershop_id", shop.id).maybeSingle();
      
      let customerId = existingCustomer?.id;
      if (!customerId) {
        const { data: newCust, error: custErr } = await supabase.from("customers").insert({
          barbershop_id: shop.id,
          profile_id: currentUser.id,
          full_name: currentUser.user_metadata?.full_name || name || "Cliente",
          email: currentUser.email,
          phone: currentUser.user_metadata?.phone || phone || null,
        }).select().maybeSingle();
        if (custErr) throw custErr;
        customerId = newCust?.id;
      }

      // Create appointment
      const [hour, min] = time!.split(":");
      const start = new Date(date!);
      start.setHours(parseInt(hour), parseInt(min), 0, 0);
      const end = addMinutes(start, totalDuration);

      const finalProId = proId === "any" ? (slotsData?.timeToPros[time!]?.[0] || pros[0]?.id) : proId;

      await appointmentService.createAppointment({
        barbershopId: shop.id,
        customerId: customerId,
        professionalId: finalProId,
        startsAt: start,
        customerData: { name: name || currentUser?.user_metadata?.full_name || "Cliente", phone: phone || currentUser?.user_metadata?.phone || "", email: currentUser?.email },
        
        
        services: pickedServices.map(s => ({
          id: s.id,
          price: Number(s.price),
          duration_min: s.duration_min,
        })),
      });

      toast.success("Agendamento solicitado!");
      navigate({ to: "/minha-conta" });
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("row-level security") || err.code === "42501") {
        toast.error("Não foi possível confirmar o agendamento. Esta barbearia pode não estar aceitando reservas no momento.");
      } else {
        toast.error(msg || "Erro ao confirmar agendamento.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // State: No Barbershop selected
  if (!shopSlug) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <Scissors className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h1 className="text-2xl font-bold font-serif mb-2">Escolha uma barbearia para agendar</h1>
          <p className="text-muted-foreground mb-8">Escolha a unidade desejada para agendar o seu horário exclusivo.</p>
          <Button asChild className="h-12 px-8 bg-accent text-accent-foreground font-bold">
            <Link to="/barbearias">Ver barbearias</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (shopLoading) {
    return (
      <PublicLayout>
        <div className="flex justify-center p-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" /></div>
      </PublicLayout>
    );
  }

  if (!shop) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
          <h1 className="text-2xl font-bold font-serif mb-2">Barbearia não encontrada</h1>
          <p className="text-muted-foreground mb-8">O link que você acessou expirou ou a barbearia pausou os agendamentos online.</p>
          <Button asChild className="h-12 px-8 bg-accent text-accent-foreground font-bold">
            <Link to="/barbearias">Ver barbearias</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  if (shop && !shop.is_sponsored) {
    return (
      <PublicLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <AlertCircle className="h-16 w-16 text-amber-500/50 mb-4" />
          <h1 className="text-2xl font-bold font-serif mb-2">Agendamento indisponível</h1>
          <p className="text-muted-foreground mb-8">Esta barbearia não aceita agendamentos online pelo aplicativo no momento.</p>
          <Button asChild className="h-12 px-8 bg-accent text-accent-foreground font-bold">
            <Link to="/barbearias">Ver barbearias parceiras</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="bg-muted/30 border-b border-border/40 py-6 md:py-10">
        <div className="mx-auto max-w-3xl px-4 flex items-center justify-between">
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold">Agendar horário</h1>
            <p className="text-muted-foreground text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="h-3.5 w-3.5" /> {shop.name}
            </p>
          </div>
          {shop.logo_url && (
            <img src={shop.logo_url} alt="Logo" className="h-12 w-12 rounded-lg object-cover border border-border/40 shadow-sm hidden md:block" />
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12 pb-32">
        {/* Stepper indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Passo {step + 1} de {STEPS.length}
            </span>
            <span className="text-sm font-bold text-accent">{STEPS[step]}</span>
          </div>
          <div className="h-2 w-full bg-border/40 rounded-full overflow-hidden">
            <div className="h-full bg-accent transition-all duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          
          {step === 0 && (
            <Card className="p-4 md:p-6 border-border/40 shadow-sm">
              <h2 className="text-lg font-bold mb-4">1. O que vamos fazer hoje?</h2>
              {!svcsLoading && services.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum serviço disponível para esta barbearia.</p>
                ) : svcsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />)}
                </div>
              ) : services.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum serviço disponível.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map(s => {
                    const sel = pickedServices.some(x => x.id === s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => {
                          if (sel) setPickedServices(prev => prev.filter(x => x.id !== s.id));
                          else setPickedServices(prev => [...prev, s]);
                        }}
                        className={`text-left p-4 rounded-xl border transition-all ${
                          sel ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border/60 hover:border-accent/40 bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold">{s.name}</h3>
                          {sel && <Check className="h-4 w-4 text-accent shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 mt-3 text-xs font-medium">
                          <span className="bg-muted px-2 py-1 rounded text-foreground">{brl(Number(s.price))}</span>
                          <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {minutes(s.duration_min)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>
          )}

          {step === 1 && (
            <Card className="p-4 md:p-6 border-border/40 shadow-sm">
              <h2 className="text-lg font-bold mb-4">2. Escolha o profissional</h2>
              {!prosLoading && pros.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Nenhum profissional disponível para agendamento.</p>
                ) : prosLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1,2].map(i => <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />)}
                </div>
              ) : pros.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum profissional disponível.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setProId("any")}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center ${
                      proId === "any" ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border/60 hover:border-accent/40 bg-card"
                    }`}
                  >
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <span className="font-bold text-sm">Qualquer um</span>
                    <span className="text-[10px] text-muted-foreground mt-1">DisponÃ­vel mais cedo</span>
                  </button>
                  {pros.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setProId(p.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all text-center ${
                        proId === p.id ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border/60 hover:border-accent/40 bg-card"
                      }`}
                    >
                      <Avatar className="h-12 w-12 mb-3">
                        <AvatarImage src={p.avatar_url || ""} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-sm font-bold">{p.display_name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-bold text-sm">{p.display_name}</span>
                      <span className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{p.specialties?.[0] || "Barbeiro"}</span>
                    </button>
                  ))}
                </div>
              )}
            </Card>
          )}

          {step === 2 && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-4 md:p-6 border-border/40 shadow-sm">
                <h2 className="text-lg font-bold mb-4">Data</h2>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => { setDate(d); setTime(null); }}
                  disabled={(d) => isBefore(d, startOfDay(new Date()))}
                  className="rounded-xl border border-border/40 p-3 mx-auto w-full max-w-[280px]"
                />
              </Card>

              <Card className="p-4 md:p-6 border-border/40 shadow-sm">
                <h2 className="text-lg font-bold mb-4">4. Selecione o horário</h2>
                {!date ? (
                  <p className="text-sm text-muted-foreground">Por favor, escolha o dia do seu atendimento.</p>
                ) : slotsLoading ? (
                  <div className="flex justify-center p-6"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" /></div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Agenda lotada para este dia. Que tal verificar os dias seguintes?</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map(t => (
                      <button
                        key={t}
                        onClick={() => setTime(t)}
                        className={`py-2 px-1 text-center rounded-lg text-sm font-bold border transition-colors ${
                          time === t ? "border-accent bg-accent text-accent-foreground" : "border-border/60 hover:border-accent/40"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {step === 3 && (
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-4 md:p-6 border-border/40 shadow-sm">
                <h2 className="text-lg font-bold mb-4">5. Confirme seu agendamento</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Serviços</span>
                    <span className="text-right font-medium">{pickedServices.map(s => s.name).join(" + ")}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">DuraÃ§Ã£o</span>
                    <span className="text-right font-medium">{minutes(totalDuration)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Profissional</span>
                    <span className="text-right font-medium">{proId === "any" ? "Qualquer profissional" : pros.find(p=>p.id===proId)?.display_name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Data/Hora</span>
                    <span className="text-right font-medium text-accent">
                      {date && format(date, "dd/MM/yyyy", { locale: ptBR })} Ã s {time}
                    </span>
                  </div>
                  <div className="border-t border-border/40 pt-3 mt-3 flex justify-between items-center text-base">
                    <span className="font-bold">Total a pagar no local</span>
                    <span className="font-black text-xl">{brl(totalPrice)}</span>
                  </div>
                </div>
              </Card>

              {!user && (
                <Card className="p-4 md:p-6 border-border/40 shadow-sm bg-accent/5">
                  <h2 className="text-lg font-bold mb-4">IdentificaÃ§Ã£o</h2>
                  
                  <div className="flex rounded-lg overflow-hidden border border-border/60 mb-4 text-xs font-bold">
                    <button 
                      onClick={() => setAuthMode("login")}
                      className={`flex-1 py-2 text-center transition-colors ${authMode === "login" ? "bg-accent text-accent-foreground" : "bg-card hover:bg-muted"}`}
                    >
                      Já tenho conta
                    </button>
                    <button 
                      onClick={() => setAuthMode("register")}
                      className={`flex-1 py-2 text-center transition-colors ${authMode === "register" ? "bg-accent text-accent-foreground" : "bg-card hover:bg-muted"}`}
                    >
                      Criar conta
                    </button>
                  </div>

                  <div className="space-y-3">
                    {authMode === "register" && (
                      <>
                        <div className="space-y-1">
                          <Label>Nome completo</Label>
                          <Input value={name} onChange={e=>setName(e.target.value)} className="h-10 bg-background" />
                        </div>
                        <div className="space-y-1">
                          <Label>Telefone (WhatsApp)</Label>
                          <Input value={phone} onChange={e=>setPhone(e.target.value)} className="h-10 bg-background" placeholder="(11) 90000-0000" />
                        </div>
                      </>
                    )}
                    <div className="space-y-1">
                      <Label>E-mail</Label>
                      <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="h-10 bg-background" />
                    </div>
                    <div className="space-y-1">
                      <Label>Senha</Label>
                      <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="h-10 bg-background" />
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center justify-between pt-6 border-t border-border/40">
            <Button variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep(s => s - 1)} className="h-12 px-6">
              <ChevronLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            
            {step < 3 ? (
              <Button disabled={!canNext} onClick={() => setStep(s => s + 1)} className="h-12 px-8 bg-foreground text-background font-bold">
                Continuar <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button disabled={submitting} onClick={submit} className="h-12 px-8 bg-accent text-accent-foreground font-bold">
                {submitting ? "Processando..." : "Confirmar Agendamento"} <Check className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Nav */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-background/95 backdrop-blur-md border-t border-border/40 p-4 z-40 flex items-center gap-3">
        <Button variant="outline" size="icon" disabled={step === 0 || submitting} onClick={() => setStep(s => s - 1)} className="h-12 w-12 shrink-0 border-border/60">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        {step < 3 ? (
          <Button disabled={!canNext} onClick={() => setStep(s => s + 1)} className="h-12 flex-1 bg-foreground text-background font-bold uppercase tracking-wider text-xs">
            Continuar <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button disabled={submitting} onClick={submit} className="h-12 flex-1 bg-accent text-accent-foreground font-bold uppercase tracking-wider text-xs">
            {submitting ? "..." : "Confirmar"} <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </PublicLayout>
  );
}








