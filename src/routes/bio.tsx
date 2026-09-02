import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Scissors, Crown, CalendarCheck, MessageCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/bio")({
  head: () => ({
    meta: [
      { title: "Links — BarberOS" },
      { name: "description", content: "Agende seu horário e conheça nossos serviços." },
    ],
  }),
  component: BioPage,
});

function BioPage() {
  const { data: shop } = useQuery({
    queryKey: ["bio-shop"],
    queryFn: async () => {
      const { data } = await supabase.from("barbershops").select("*").limit(1).maybeSingle();
      return data;
    },
  });

  const phone = ((shop?.contacts as any)?.phone as string | undefined)?.replace(/\D/g, "") || "";
  const waLink = phone ? `https://wa.me/55${phone}` : "#";

  return (
    <main className="min-h-[100dvh] bg-background text-foreground flex flex-col items-center py-16 px-6 relative overflow-hidden">
      {/* Background Effect */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_15%,transparent),transparent_70%)]"
      />

      {/* Profile / Logo Area */}
      <div className="flex flex-col items-center text-center space-y-4 mb-10">
        <div className="h-24 w-24 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center shadow-[0_0_20px_color-mix(in_oklab,var(--accent)_40%,transparent)]">
          <Scissors className="h-10 w-10 text-accent" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold tracking-tight">
            {shop?.name || "BarberOS"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">A melhor experiência em barbearia</p>
        </div>
      </div>

      {/* Links Area */}
      <div className="w-full max-w-sm flex flex-col gap-4">
        <Button
          asChild
          size="lg"
          className="h-14 w-full rounded-none bg-accent text-accent-foreground hover:bg-accent/90 justify-start px-6 transition-transform hover:scale-[1.02]"
        >
          <Link to="/barbearias">
            <CalendarCheck className="mr-4 h-5 w-5" />
            Agendar Horário
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 w-full rounded-none border-border/60 bg-card/50 backdrop-blur-sm hover:border-accent hover:text-accent hover:bg-accent/10 justify-start px-6 transition-transform hover:scale-[1.02]"
        >
          <Link to="/clube">
            <Crown className="mr-4 h-5 w-5" />
            Clube VIP (Assinaturas)
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 w-full rounded-none border-border/60 bg-card/50 backdrop-blur-sm hover:border-accent hover:text-accent hover:bg-accent/10 justify-start px-6 transition-transform hover:scale-[1.02]"
        >
          <Link to="/servicos">
            <Scissors className="mr-4 h-5 w-5" />
            Tabela de Preços
          </Link>
        </Button>

        <Button
          asChild
          size="lg"
          variant="outline"
          className="h-14 w-full rounded-none border-border/60 bg-card/50 backdrop-blur-sm hover:border-[#25D366] hover:text-[#25D366] hover:bg-[#25D366]/10 justify-start px-6 transition-transform hover:scale-[1.02]"
        >
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="mr-4 h-5 w-5" />
            Falar no WhatsApp
          </a>
        </Button>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-16">
        <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Powered by BarberOS
        </p>
      </div>
    </main>
  );
}
