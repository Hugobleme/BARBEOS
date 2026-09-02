import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/site/PublicLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade | BARBEOS" },
      {
        name: "description",
        content:
          "Entenda como o BARBEOS utiliza informações necessárias para a experiência na plataforma.",
      },
    ],
  }),
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <PublicLayout>
      <div className="bg-background min-h-screen text-foreground selection:bg-accent/30 selection:text-accent-foreground">
        {/* HERO */}
        <section className="px-4 pt-20 pb-16 md:pt-32 md:pb-24 border-b border-border/40">
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-accent">
              Transparência
            </p>
            <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
              Esta página descreve, em linguagem simples, como informações podem ser usadas para
              viabilizar a experiência no BARBEOS.
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
              <h2 className="text-xl font-serif font-bold text-foreground">
                1. Informações usadas pela plataforma
              </h2>
              <p>
                As informações de conta, de perfil e outras necessárias para a utilização do BARBEOS
                podem ser processadas pela plataforma, incluindo dados fornecidos voluntariamente
                durante cadastros e através das áreas administrativas.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">
                2. Uso das informações
              </h2>
              <p>
                Os dados podem ser utilizados para operar contas, apresentar informações de
                barbearias, organizar a experiência na plataforma e manter as funcionalidades
                básicas operando de forma adequada.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">
                3. Informações das barbearias
              </h2>
              <p>
                As informações que uma barbearia opta por tornar públicas, como seu perfil, lista de
                serviços e quadro de profissionais, poderão ser exibidas nas páginas públicas do
                BARBEOS.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">
                4. Acesso e segurança
              </h2>
              <p>
                O acesso às áreas administrativas depende das permissões de conta de cada usuário.
                Recomendamos que todos os usuários protejam suas próprias credenciais de acesso, já
                que a responsabilidade pela manutenção do sigilo dessas informações é do titular da
                conta.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">
                5. Atualizações desta política
              </h2>
              <p>
                Esta página pode ser atualizada conforme a plataforma evolui. A data exibida no
                início do documento indica a versão mais recente e entra em vigor imediatamente após
                sua publicação.
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-serif font-bold text-foreground">6. Dúvidas</h2>
              <p>
                Para dúvidas sobre uma barbearia específica, procure a própria unidade. Para
                questões relacionadas à sua conta, use os canais disponíveis dentro da plataforma
                quando aplicável.
              </p>
            </div>
          </div>

          <Separator className="my-16 opacity-40" />

          <div className="text-center">
            <Button
              asChild
              variant="outline"
              className="h-12 px-8 font-bold uppercase tracking-wider text-xs"
            >
              <Link to="/">Voltar para o início</Link>
            </Button>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
