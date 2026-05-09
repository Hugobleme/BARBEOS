import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PublicHeader } from "@/components/site/PublicHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { brl, DEMO_BARBERSHOP_ID } from "@/lib/format";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Clock, LogOut, Scissors } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({ meta: [{ title: "Minha conta — BarberOS" }] }),
  component: Page,
});

function Page() {
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [loading, user, nav]);

  const { data: appts } = useQuery({
    enabled: !!user,
    queryKey: ["my-appts", user?.id],
    queryFn: async () => {
      const { data: customers } = await supabase.from("customers").select("id").eq("profile_id", user!.id);
      const ids = (customers ?? []).map(c => c.id);
      if (ids.length === 0) return [];
      const { data } = await supabase.from("appointments")
        .select("*, professional:professionals(display_name), services:appointment_services(service:services(name))")
        .in("customer_id", ids).order("scheduled_start", { ascending: false });
      return data ?? [];
    },
  });

  if (loading || !user) return null;
  const upcoming = (appts ?? []).filter(a => new Date(a.scheduled_start) >= new Date() && a.status !== "cancelled");
  const past = (appts ?? []).filter(a => new Date(a.scheduled_start) < new Date() || a.status === "cancelled");

  async function cancel(id: string) {
    const { error } = await supabase.from("appointments").update({ status: "cancelled" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Agendamento cancelado");
    location.reload();
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Olá!</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={()=>supabase.auth.signOut().then(()=>nav({to:"/"}))}><LogOut className="mr-1 h-4 w-4"/>Sair</Button>
        </div>

        <h2 className="mt-10 mb-3 font-display text-xl font-semibold">Próximos agendamentos</h2>
        <div className="grid gap-3">
          {upcoming.length === 0 && (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              Você não tem agendamentos. <Link to="/agendar" className="font-medium text-accent hover:underline">Agendar agora →</Link>
            </Card>
          )}
          {upcoming.map((a: any) => (
            <Card key={a.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-accent/15 text-accent"><Calendar className="h-5 w-5"/></div>
                <div>
                  <div className="font-semibold">{format(new Date(a.scheduled_start), "EEEE, d 'de' MMM • HH:mm", { locale: ptBR })}</div>
                  <div className="text-sm text-muted-foreground">{a.services?.map((s:any)=>s.service.name).join(" + ")} · com {a.professional?.display_name}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{brl(Number(a.total_amount))}</Badge>
                <Button size="sm" variant="outline" onClick={()=>cancel(a.id)}>Cancelar</Button>
              </div>
            </Card>
          ))}
        </div>

        <h2 className="mt-10 mb-3 font-display text-xl font-semibold">Histórico</h2>
        <div className="grid gap-2">
          {past.length === 0 && <p className="text-sm text-muted-foreground">Nada por aqui ainda.</p>}
          {past.map((a: any) => (
            <Card key={a.id} className="flex flex-col gap-2 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground"/>
                <span>{format(new Date(a.scheduled_start), "d 'de' MMM yyyy • HH:mm", { locale: ptBR })}</span>
                <span className="text-muted-foreground">· {a.services?.map((s:any)=>s.service.name).join(", ")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={a.status === "cancelled" ? "destructive" : "secondary"}>{a.status === "cancelled" ? "Cancelado" : a.status === "completed" ? "Concluído" : a.status}</Badge>
                {a.status === "completed" && (
                  <Button asChild size="sm" variant="outline">
                    <Link to="/avaliar/$appointmentId" params={{ appointmentId: a.id }}>Avaliar</Link>
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
