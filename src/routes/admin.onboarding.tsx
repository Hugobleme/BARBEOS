import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useOnboardingStatus } from "@/hooks/use-onboarding";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle2, 
  Store, 
  Scissors, 
  Users, 
  Clock, 
  Globe, 
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicLayout } from "@/components/site/PublicLayout";

export const Route = createFileRoute("/admin/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { shopId } = useCurrentShop();
  const { data: status, isLoading, isError, error, refetch } = useOnboardingStatus(shopId);

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto h-[60vh]">
        <AlertCircle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">Não encontramos uma barbearia vinculada à sua conta.</h2>
        <p className="text-muted-foreground text-sm">Entre em contato com o suporte ou conclua o cadastro da sua unidade.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64 mb-2" />
        <Skeleton className="h-4 w-96 mb-8" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </Card>
      </div>
    );
  }

  if (isError || !status) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto h-[60vh]">
        <AlertCircle className="h-16 w-16 text-destructive/50 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2">Não foi possível carregar o andamento da configuração.</h2>
        <p className="text-muted-foreground mb-8">Tente novamente em alguns instantes.</p>
        <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
      </div>
    );
  }

  const { shop, hasProfile, hasServices, hasProfessionals, hasReview, completedCount, totalSteps, isFullyComplete } = status;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-accent mb-2">Primeiros passos</h2>
        <h1 className="font-serif text-3xl font-bold text-foreground">Deixe sua barbearia pronta para receber clientes</h1>
        <p className="text-muted-foreground mt-2 text-sm max-w-2xl">
          Conclua o checklist abaixo para que o perfil da sua barbearia fique visível e pronto para agendamentos online. 
          As etapas são validadas automaticamente com base nos seus dados atuais.
        </p>
      </div>

      <Card className="p-6 md:p-8 bg-card shadow-sm border-border/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-bold">Progresso da configuração</h3>
            <p className="text-sm text-muted-foreground">{completedCount} de {totalSteps} etapas concluídas</p>
          </div>
          <div className="w-full md:w-1/3 flex items-center gap-3">
            <Progress value={progressPercent} className="h-2 flex-1" />
            <span className="text-sm font-bold w-12 text-right">{progressPercent}%</span>
          </div>
        </div>

        <div className="space-y-4">
          {/* 1. Perfil */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${hasProfile ? "bg-accent/5 border-accent/20" : "bg-muted/10 border-border/40"} gap-4`}>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 rounded-full p-1 ${hasProfile ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold flex items-center gap-2">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  Perfil da barbearia
                </h4>
                <p className="text-sm text-muted-foreground mt-1">Nome, logotipo e informações de contato.</p>
              </div>
            </div>
            <Button asChild variant={hasProfile ? "outline" : "default"} className="shrink-0 w-full sm:w-auto">
              <Link to="/admin/configuracoes">Editar perfil</Link>
            </Button>
          </div>

          {/* 2. Serviços */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${hasServices ? "bg-accent/5 border-accent/20" : "bg-muted/10 border-border/40"} gap-4`}>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 rounded-full p-1 ${hasServices ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                  Serviços
                </h4>
                <p className="text-sm text-muted-foreground mt-1">Cadastre pelo menos um serviço ativo.</p>
              </div>
            </div>
            <Button asChild variant={hasServices ? "outline" : "default"} className="shrink-0 w-full sm:w-auto">
              <Link to="/admin/servicos">Cadastrar serviço</Link>
            </Button>
          </div>

          {/* 3. Profissionais */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${hasProfessionals ? "bg-accent/5 border-accent/20" : "bg-muted/10 border-border/40"} gap-4`}>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 rounded-full p-1 ${hasProfessionals ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Profissionais
                </h4>
                <p className="text-sm text-muted-foreground mt-1">Adicione a equipe que realizará os atendimentos.</p>
              </div>
            </div>
            <Button asChild variant={hasProfessionals ? "outline" : "default"} className="shrink-0 w-full sm:w-auto">
              <Link to="/admin/profissionais">Adicionar profissional</Link>
            </Button>
          </div>

          {/* 4. Horários */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-muted/10 border-border/40 gap-4 opacity-75">
            <div className="flex items-start gap-4">
              <div className="mt-0.5 rounded-full p-1 text-muted-foreground bg-muted">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Horários de funcionamento em preparação
                  </h4>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground px-2 py-0.5 rounded">Em breve</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Esta configuração estará disponível em breve. Enquanto isso, mantenha os serviços e a equipe atualizados.</p>
              </div>
            </div>
          </div>

          {/* 5. Review */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${hasReview ? "bg-accent/5 border-accent/20" : "bg-muted/10 border-border/40"} gap-4`}>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 rounded-full p-1 ${hasReview ? "text-accent bg-accent/10" : "text-muted-foreground bg-muted"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  Revisar perfil público
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasReview ? "Pronto para revisar. Veja como os clientes verão sua barbearia." : "Conclua as etapas acima para visualizar o perfil."}
                </p>
              </div>
            </div>
            <Button asChild variant={hasReview ? "default" : "outline"} disabled={!hasReview || !shop?.slug} className={`shrink-0 w-full sm:w-auto ${hasReview ? "bg-accent text-accent-foreground" : ""}`}>
              {hasReview && shop?.slug ? (
                <Link to={`/b/${shop.slug}`} target="_blank">Ver perfil público <ArrowRight className="ml-2 h-4 w-4" /></Link>
              ) : (
                <span>Ver perfil público</span>
              )}
            </Button>
          </div>

        </div>
      </Card>
    </div>
  );
}



