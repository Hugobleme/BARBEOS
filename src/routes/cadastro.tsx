import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneMask } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar minha conta — BarberOS" },
      {
        name: "description",
        content: "Crie sua conta BarberOS e agende em segundos, com histórico e lembretes.",
      },
      { property: "og:title", content: "Criar conta — BarberOS" },
      { property: "og:description", content: "Cadastro gratuito para agendar online 24/7." },
      { property: "og:url", content: "/cadastro" },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "/cadastro" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const redirectingRef = useRef(false);

  async function redirectBasedOnMembership(userId: string) {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    try {
      const { data: membership } = await supabase
        .from("barbershop_members")
        .select("barbershop_id, role")
        .eq("profile_id", userId)
        .eq("active", true)
        .limit(1)
        .maybeSingle();

      if (
        membership &&
        ["owner", "admin", "barber", "manager", "receptionist"].includes(membership.role)
      ) {
        nav({ to: "/admin" });
      } else {
        nav({ to: "/minha-conta" });
      }
    } catch {
      nav({ to: "/minha-conta" });
    }
  }

  // 1. Redirecionamento se já houver sessão
  useEffect(() => {
    if (!authLoading && user) {
      redirectBasedOnMembership(user.id);
    }
  }, [user, authLoading]);

  // 2. Auth State Listener para login em tempo real ou OAuth
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        redirectBasedOnMembership(session.user.id);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  function validateEmail(val: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cleanName = f.name.trim();
    const cleanEmail = f.email.trim().toLowerCase();

    if (!cleanName || cleanName.length < 3) {
      return toast.error("Por favor, informe seu nome completo.");
    }

    if (!cleanEmail || !validateEmail(cleanEmail)) {
      return toast.error("Por favor, informe um e-mail válido.");
    }

    if (!f.phone || f.phone.replace(/\D/g, "").length < 10) {
      return toast.error("Por favor, informe um telefone válido com DDD.");
    }

    if (!f.password || f.password.length < 6) {
      return toast.error("A senha deve ter no mínimo 6 caracteres.");
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: f.password,
      options: {
        emailRedirectTo: `${window.location.origin}/minha-conta`,
        data: { full_name: cleanName, phone: f.phone },
      },
    });
    setLoading(false);

    if (error) {
      if (
        error.message.includes("User already registered") ||
        error.message.includes("already exists")
      ) {
        return toast.error("Este e-mail já está cadastrado. Tente entrar.");
      }
      if (error.message.includes("Password should be at least")) {
        return toast.error("A senha deve ter no mínimo 6 caracteres.");
      }
      return toast.error(error.message || "Erro ao criar conta.");
    }

    if (data.session) {
      toast.success("Conta criada com sucesso!");
      if (data.user) {
        await redirectBasedOnMembership(data.user.id);
      }
    } else {
      toast.success("Conta criada! Verifique seu e-mail para confirmar seu cadastro.");
      nav({ to: "/login" });
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
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-accent">
              Cadastro
            </p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl">
              Criar conta
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Crie sua conta em 30 segundos para agendar horários ou gerenciar seu negócio.
            </p>
          </div>

          <div className="mt-10 border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Nome completo
                </Label>
                <Input
                  required
                  type="text"
                  autoComplete="name"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  placeholder="Como você quer ser chamado?"
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  E-mail
                </Label>
                <Input
                  required
                  type="email"
                  autoComplete="email"
                  value={f.email}
                  onChange={(e) => setF({ ...f, email: e.target.value })}
                  placeholder="exemplo@email.com"
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Telefone celular
                </Label>
                <Input
                  required
                  type="tel"
                  autoComplete="tel"
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: phoneMask(e.target.value) })}
                  placeholder="(11) 99999-0000"
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Senha (mínimo 6 dígitos)
                </Label>
                <Input
                  required
                  type="password"
                  autoComplete="new-password"
                  minLength={6}
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                  placeholder="••••••••"
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>

              <Button
                className="mt-2 w-full rounded-none uppercase tracking-[0.2em]"
                disabled={loading}
              >
                {loading ? "Criando conta..." : "Criar conta"}
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
                if (error) toast.error(error.message ?? "Falha no cadastro com Google");
              }}
            >
              Continuar com Google
            </Button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Já tem conta?{" "}
              <Link to="/login" className="font-medium text-accent hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
