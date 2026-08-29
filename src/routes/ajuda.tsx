import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/ajuda")({
  head: () => ({
    meta: [
      { title: "Ajuda | BARBEOS" },
      { name: "description", content: "Tire dúvidas sobre como encontrar barbearias, criar uma conta e usar o BARBEOS." },
    ],
  }),
  component: AjudaPage,
});

function AjudaPage() {
  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground selection:bg-accent/30 selection:text-accent-foreground">
        
        {/* HERO */}
        <section className="px-4 pt-20 pb-16 md:pt-32 md:pb-24 border-b border-border/40">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-accent flex items-center justify-center gap-2">
              <HelpCircle className="h-4 w-4" />
              Central de Ajuda
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
              Dúvidas frequentes
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Encontre respostas rápidas sobre contas, barbearias e a experiência no BARBEOS.
            </p>
          </div>
        </section>

        {/* FAQ CONTENT */}
        <section className="px-4 py-16 md:py-24 max-w-3xl mx-auto">
          
          <div className="mb-16">
            <h2 className="text-2xl font-serif font-bold mb-8">Para clientes</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="c1" className="border-border/40">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  Como encontro uma barbearia?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Acesse a página de barbearias e use os filtros disponíveis para encontrar unidades por cidade, bairro ou avaliação, quando essas informações estiverem cadastradas.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="c2" className="border-border/40">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  Preciso criar uma conta para conhecer as barbearias?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Não. Você pode explorar os perfis públicos das barbearias antes de entrar ou criar uma conta.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="c3" className="border-border/40">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  O que encontro no perfil de uma barbearia?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  O perfil pode apresentar informações da unidade, serviços, profissionais e outros dados que a própria barbearia disponibilizar.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="c4" className="border-border/40 border-b-0">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  Como acesso minha conta?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Use a opção “Minha conta” no menu para entrar ou criar seu cadastro no BARBEOS.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="mb-16">
            <h2 className="text-2xl font-serif font-bold mb-8">Para barbearias</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="b1" className="border-border/40">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  Como cadastro minha barbearia no BARBEOS?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Crie sua conta e acesse o painel. O checklist de primeiros passos ajuda a completar perfil, serviços, profissionais, horários e revisão do perfil público.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b2" className="border-border/40">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  Posso cadastrar mais de um profissional?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Sim. Pelo painel administrativo, a barbearia pode organizar os profissionais vinculados à sua operação.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b3" className="border-border/40">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  Como atualizo serviços e preços?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  No painel administrativo, acesse a área de serviços para cadastrar e atualizar as informações disponíveis ao público.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="b4" className="border-border/40 border-b-0">
                <AccordionTrigger className="text-left font-bold hover:text-accent">
                  Onde encontro os primeiros passos de configuração?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  Após acessar o painel administrativo, abra “Primeiros passos” para acompanhar o andamento da configuração da unidade.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          {/* SUPPORT CTA */}
          <Card className="p-8 md:p-12 text-center bg-muted/20 border-border/40 rounded-3xl mt-12">
            <h2 className="text-2xl font-serif font-bold mb-3">Ainda precisa de ajuda?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Acesse sua conta ou fale com a equipe responsável pela sua barbearia para obter suporte sobre informações específicas.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="w-full sm:w-auto h-12 bg-foreground text-background hover:bg-foreground/90 font-bold uppercase tracking-wider text-xs">
                <Link to="/login">Entrar na minha conta</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-12 font-bold uppercase tracking-wider text-xs">
                <Link to="/para-barbearias">Sou uma barbearia</Link>
              </Button>
            </div>
          </Card>

        </section>
      </div>
    </PublicLayout>
  );
}
