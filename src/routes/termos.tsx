import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso | BARBEOS" },
      { name: "description", content: "Regras básicas de utilização da plataforma BARBEOS." },
    ],
  }),
  component: TermosPage,
});

function TermosPage() {
  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground selection:bg-accent/30 selection:text-accent-foreground">
        
        {/* HERO */}
        <section className="px-4 pt-20 pb-16 md:pt-32 md:pb-24 border-b border-border/40">
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Uso da plataforma
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
              Termos de Uso
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Estes termos apresentam regras básicas para a utilização do BARBEOS por clientes e barbearias.
            </p>
            <div className="pt-4">
              <span className="inline-block bg-muted/40 text-muted-foreground text-xs font-medium px-3 py-1 rounded-md">
                Última atualização: agosto de 2026
              </span>
            </div>
          </div>
        </section>

        {/* CONTENT */}
        <section className="px-4 py-16 md:py-24 max-w-3xl mx-auto">
          <div className="space-y-12 text-muted-foreground leading-relaxed">
            
            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">1. Sobre o BARBEOS</h2>
              <p>
                O BARBEOS é uma plataforma digital que apoia a apresentação pública e a gestão operacional 
                de barbearias, conectando clientes aos serviços de unidades parceiras.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">2. Contas e acesso</h2>
              <p>
                Os usuários são responsáveis por fornecer informações precisas no momento do cadastro e por 
                proteger as suas credenciais, evitando acessos não autorizados.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">3. Responsabilidade pelas informações</h2>
              <p>
                Cada barbearia é inteiramente responsável pelas informações que cadastra e publica na plataforma, 
                incluindo a descrição de seus serviços, os preços praticados, as informações profissionais e sua disponibilidade de agenda, 
                quando aplicável.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">4. Uso adequado</h2>
              <p>
                Os usuários concordam em não realizar tentativas de acesso não autorizado, em não interferir no funcionamento 
                da plataforma e em não utilizá-la em violação à legislação aplicável.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">5. Disponibilidade da plataforma</h2>
              <p>
                As funcionalidades do BARBEOS podem evoluir com o tempo e a plataforma pode ficar temporariamente indisponível 
                para manutenção ou por motivos técnicos imprevistos.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">6. Atualizações</h2>
              <p>
                Estes termos podem ser atualizados à medida que a plataforma evolui. Os usuários devem revisitar 
                esta página periodicamente para tomar conhecimento de alterações.
              </p>
            </div>

          </div>

          <Separator className="my-16 opacity-40" />

          <div className="text-center">
            <Button asChild className="h-12 px-8 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-wider text-xs">
              <Link to="/para-barbearias">Conhecer o BARBEOS para barbearias</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
