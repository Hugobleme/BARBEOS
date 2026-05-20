import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneMask } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — BarberOS" },
      { name: "description", content: "Crie sua conta BarberOS e agende em segundos, com histórico e lembretes." },
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
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: f.email,
      password: f.password,
      options: { emailRedirectTo: `${window.location.origin}/minha-conta`, data: { full_name: f.name, phone: f.phone } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail se necessário.");
    nav({ to: "/minha-conta" });
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
            <p className="text-[10px] font-medium uppercase tracking-[0.35em] text-accent">Cadastro</p>
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl">Criar conta</h1>
            <p className="mt-3 text-sm text-muted-foreground">Reserve sua experiência em segundos.</p>
          </div>

          <div className="mt-10 border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            <form onSubmit={submit} className="space-y-5">
              {[
                { k: "name", l: "Nome completo", t: "text" },
                { k: "email", l: "E-mail", t: "email" },
              ].map((field) => (
                <div key={field.k} className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{field.l}</Label>
                  <Input
                    required
                    type={field.t}
                    value={(f as any)[field.k]}
                    onChange={(e) => setF({ ...f, [field.k]: e.target.value })}
                    className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                  />
                </div>
              ))}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Telefone</Label>
                <Input
                  required
                  value={f.phone}
                  onChange={(e) => setF({ ...f, phone: phoneMask(e.target.value) })}
                  placeholder="(11) 99999-0000"
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Senha (mín. 6)</Label>
                <Input
                  required
                  type="password"
                  minLength={6}
                  value={f.password}
                  onChange={(e) => setF({ ...f, password: e.target.value })}
                  className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                />
              </div>
              <Button className="mt-2 w-full rounded-none uppercase tracking-[0.2em]" disabled={loading}>
                {loading ? "Criando..." : "Criar conta"}
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
                const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/minha-conta` });
                if (r.error) toast.error(r.error.message ?? "Falha no login Google");
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
