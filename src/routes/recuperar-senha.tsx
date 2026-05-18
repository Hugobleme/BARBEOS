import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — BarberOS" },
      { name: "description", content: "Receba um link seguro para redefinir sua senha BarberOS." },
      { name: "robots", content: "noindex,follow" },
    ],
    links: [{ rel: "canonical", href: "/recuperar-senha" }],
  }),
  component: Page,
});

function Page() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` });
    if (error) return toast.error(error.message);
    setSent(true);
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
            <h1 className="mt-3 font-serif text-4xl font-bold tracking-tight md:text-5xl">Recuperar senha</h1>
            <p className="mt-3 text-sm text-muted-foreground">Informe seu e-mail e enviaremos um link.</p>
          </div>

          <div className="mt-10 border border-border/60 bg-card/40 p-8 backdrop-blur-sm">
            {sent ? (
              <p className="text-center text-sm text-muted-foreground">
                Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha.
              </p>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">E-mail</Label>
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-none border-x-0 border-t-0 border-b border-border bg-transparent px-0 focus-visible:ring-0"
                  />
                </div>
                <Button className="mt-2 w-full rounded-none uppercase tracking-[0.2em]">Enviar link</Button>
              </form>
            )}
            <p className="mt-6 text-center text-xs">
              <Link to="/login" className="text-muted-foreground transition hover:text-accent">
                Voltar ao login
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
