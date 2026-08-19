import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — BarberOS" },
      { name: "description", content: "Acesse sua conta BarberOS para gerenciar agendamentos e preferências." },
      { property: "og:title", content: "Entrar — BarberOS" },
      { property: "og:description", content: "Acesso seguro à sua conta BarberOS." },
      { property: "og:url", content: "/login" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "/login" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Redireciona usuário se já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      redirectAfterAuth(user.id);
    }
  }, [user, authLoading]);

  async function redirectAfterAuth(userId: string) {
    try {
      const { data: memberships } = await supabase
        .from("barbershop_members")
        .select("barbershop_id")
        .eq("profile_id", userId)
        .eq("active", true);

      if (memberships && memberships.length > 0) {
        nav({ to: "/admin" });
      } else {
        nav({ to: "/minha-conta" });
      }
    } catch {
      nav({ to: "/minha-conta" });
    }
  }

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return toast.error("Por favor, informe um e-mail válido.");
    }

    if (!password || password.length < 6) {
      return toast.error("A senha deve ter no mínimo 6 caracteres.");
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });
    setLoading(false);

    if (error) {
      if (error.message.includes("Invalid login credentials") || error.message.includes("invalid_grant")) {
        return toast.error("E-mail ou senha incorretos.");
      }
      if (error.message.includes("Email not confirmed")) {
        return toast.error("Por favor, confirme seu e-mail antes de acessar.");
      }
      return toast.error(error.message || "Erro ao efetuar login.");
    }

    toast.success("Bem-vindo de volta!");
    if (data.user) {
      await redirectAfterAuth(data.user.id);
    }
  }

  return (
    <PublicLayout>
      <section className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_70%)]"
        />
        <div className="mx-auto max-w-md px-6 py-20 md:py-28">
          <div className="text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-accent">Acesso</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl">
              Entrar
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Continue de onde parou.
            </p>
          </div>

          <div className="mt-10 border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">E-mail</Label>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Senha</Label>
                <Input
                  type="password"
                  required
                  autoComplete="current-password"
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <Button className="mt-2 w-full rounded-none uppercase tracking-[0.2em]" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              ou
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-none uppercase tracking-[0.2em]"
              onClick={async () => {
                const { error } = await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: `${window.location.origin}/minha-conta` },
                });
                if (error) toast.error(error.message ?? "Falha no login com Google");
              }}
            >
              Continuar com Google
            </Button>

            <div className="mt-6 flex items-center justify-between text-xs">
              <Link to="/recuperar-senha" className="text-muted-foreground transition hover:text-accent">
                Esqueci minha senha
              </Link>
              <Link to="/cadastro" className="font-medium text-accent hover:underline">
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
