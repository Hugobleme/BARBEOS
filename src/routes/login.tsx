import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — BarberOS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!");
    nav({ to: "/minha-conta" });
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card className="p-6">
          <h1 className="font-display text-2xl font-bold">Entrar</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta BarberOS.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>E-mail</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div><Label>Senha</Label><Input type="password" required value={password} onChange={e=>setPassword(e.target.value)} /></div>
            <Button className="w-full" disabled={loading}>{loading?"Entrando...":"Entrar"}</Button>
          </form>
          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border"/>ou<div className="h-px flex-1 bg-border"/></div>
          <Button type="button" variant="outline" className="w-full" onClick={async()=>{
            const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/minha-conta` });
            if (r.error) toast.error(r.error.message ?? "Falha no login Google");
          }}>Entrar com Google</Button>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/recuperar-senha" className="text-muted-foreground hover:text-foreground">Esqueci minha senha</Link>
            <Link to="/cadastro" className="font-medium hover:text-accent">Criar conta</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
