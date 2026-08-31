import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowRight, 
  Calendar, 
  CheckCircle2, 
  Globe, 
  Scissors, 
  Users, 
  ChevronDown
} from "lucide-react";

export const Route = createFileRoute("/para-barbearias")({
  head: () => ({
    meta: [
      { title: "BARBEOS para Barbearias | Gestão e agendamentos em um só lugar" },
      { name: "description", content: "Organize sua agenda, equipe, serviços e presença online com o BARBEOS." },
      { property: "og:title", content: "BARBEOS para Barbearias" },
      { property: "og:description", content: "Organize sua agenda, equipe, serviços e presença online com o BARBEOS." },
    ],
  }),
  component: ParaBarbeariasPage,
});

function ParaBarbeariasPage() {
  const scrollToFeatures = () => {
    document.getElementById("recursos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground selection:bg-accent/30 selection:text-accent-foreground">
        
        {/* HERO */}
        <section className="relative px-4 py-20 md:py-32 flex flex-col items-center text-center overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none opacity-40">
            <div className="w-full max-w-[300px] h-[300px] md:w-full max-w-[600px] md:h-[600px] bg-accent/20 rounded-full blur-[100px]" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto space-y-6">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-accent">
              BARBEROS PARA NEGÓCIOS
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight leading-[1.1]">
              A plataforma definitiva para barbearias de alta performance.
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Transforme sua gestão, elimine horários vazios e entregue uma experiência de agendamento premium que fideliza clientes 24h por dia.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 bg-accent text-accent-foreground hover:bg-foreground hover:text-background text-sm font-bold uppercase tracking-wider transition-all">
                <Link to="/cadastro">Criar minha conta gratuitamente</Link>
              </Button>
              <Button onClick={scrollToFeatures} variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 text-sm font-bold uppercase tracking-wider">
                Conhecer recursos <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 pt-10 text-xs text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                <span>Fim do agendamento manual</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                <span>Controle total da operação</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                <span>Presença digital premium</span>
              </div>
            </div>
          </div>
        </section>

        {/* PROBLEM / VALUE */}
        <section className="px-4 py-20 bg-muted/20 border-y border-border/40">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-serif font-bold">Menos improviso. Mais tempo para atender bem.</h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="p-8 bg-card border-border/40 hover:border-accent/30 transition-colors">
                <Calendar className="h-10 w-10 text-accent mb-6" />
                <h3 className="text-xl font-bold mb-3">Agenda sob controle</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Automatize 100% da sua agenda e liberte-se do WhatsApp. Seus clientes agendam em segundos, sem fricção.
                </p>
              </Card>
              <Card className="p-8 bg-card border-border/40 hover:border-accent/30 transition-colors">
                <Users className="h-10 w-10 text-accent mb-6" />
                <h3 className="text-xl font-bold mb-3">Equipe alinhada</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Acompanhe comissões, desempenho da equipe e faturamento em tempo real num dashboard construído para o dono.
                </p>
              </Card>
              <Card className="p-8 bg-card border-border/40 hover:border-accent/30 transition-colors">
                <Globe className="h-10 w-10 text-accent mb-6" />
                <h3 className="text-xl font-bold mb-3">Presença digital</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Não seja apenas mais uma barbearia. Tenha uma página de agendamento exclusiva, que valoriza sua marca e converte visitantes em clientes.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="recursos" className="px-4 py-24 scroll-mt-20">
          <div className="max-w-5xl mx-auto text-center space-y-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold">O essencial para gerenciar sua operação</h2>
            
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-12 text-left">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Agenda e atendimentos</h3>
                  <p className="text-muted-foreground">Monitore os agendamentos realizados pelos clientes e tenha uma visão clara do dia a dia da barbearia.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Scissors className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Serviços e preços</h3>
                  <p className="text-muted-foreground">Cadastre cortes, barbas e tratamentos com valores, durações e descrições detalhadas.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Profissionais e equipe</h3>
                  <p className="text-muted-foreground">Vincule os membros da sua equipe, defina as especialidades e conecte os serviços que cada um realiza.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Globe className="h-5 w-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">Perfil público da barbearia</h3>
                  <p className="text-muted-foreground">Uma página dedicada para sua marca onde os clientes podem consultar informações e iniciar novos agendamentos.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="px-4 py-24 bg-muted/20 border-y border-border/40">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold">Comece em poucos passos</h2>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
              <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-[1px] bg-border border-dashed z-0" aria-hidden="true" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-card border border-accent/40 text-accent font-serif font-bold flex items-center justify-center text-xl mb-6 shadow-sm">
                  1
                </div>
                <h3 className="text-lg font-bold mb-2">Crie sua conta</h3>
                <p className="text-muted-foreground">Entre no BARBEOS usando o cadastro da sua barbearia.</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-card border border-accent/40 text-accent font-serif font-bold flex items-center justify-center text-xl mb-6 shadow-sm">
                  2
                </div>
                <h3 className="text-lg font-bold mb-2">Configure sua unidade</h3>
                <p className="text-muted-foreground">Complete o perfil, cadastre os serviços, a equipe e os horários.</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-card border border-accent/40 text-accent font-serif font-bold flex items-center justify-center text-xl mb-6 shadow-sm">
                  3
                </div>
                <h3 className="text-lg font-bold mb-2">Divulgue seu perfil</h3>
                <p className="text-muted-foreground">Revise sua página pública e comece a organizar seus atendimentos.</p>
              </div>
            </div>

            <div className="pt-8">
              <Button asChild size="lg" className="h-14 px-10 bg-foreground text-background hover:bg-foreground/90 text-sm font-bold uppercase tracking-wider">
                <Link to="/cadastro">Criar minha conta agora</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ADMIN ONBOARDING CTA */}
        <section className="px-4 py-20 bg-background">
          <div className="max-w-3xl mx-auto text-center p-10 md:p-14 border border-border/60 rounded-3xl bg-card shadow-sm">
            <h2 className="text-2xl font-serif font-bold mb-4">Saiba exatamente o que falta para começar</h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Após acessar o painel, o checklist de primeiros passos mostra o que falta configurar: perfil, serviços, profissionais, horários e revisão do perfil público.
            </p>
            <Button asChild variant="outline" className="h-12 px-8 text-sm font-bold uppercase tracking-wider">
              <Link to="/admin/onboarding">Ver primeiros passos <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-4 py-24 md:py-32 flex flex-col items-center text-center bg-accent/5 border-t border-accent/10">
          <div className="max-w-2xl space-y-8">
            <h2 className="text-3xl md:text-5xl font-serif font-bold leading-tight">
              Pronto para profissionalizar a rotina da sua barbearia?
            </h2>
            <p className="text-muted-foreground md:text-lg">
              Crie sua conta e organize sua operação com uma base pensada para barbearias.
            </p>
            <div className="pt-4">
              <Button asChild size="lg" className="h-14 px-10 bg-accent text-accent-foreground hover:bg-foreground hover:text-background text-sm font-bold uppercase tracking-wider transition-all">
                <Link to="/cadastro">Criar conta gratuitamente</Link>
              </Button>
            </div>
          </div>
        </section>

      </div>
    </PublicLayout>
  );
}
