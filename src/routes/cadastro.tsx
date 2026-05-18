import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { phoneMask } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/cadastro")({
  head: () => ({ meta: [{ title: "Criar conta — BarberOS" }] }),
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
      email: f.email, password: f.password,
      options: { emailRedirectTo: `${window.location.origin}/minha-conta`, data: { full_name: f.name, phone: f.phone } },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Verifique seu e-mail se necessário.");
    nav({ to: "/minha-conta" });
  }
  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-12">
        <Card className="p-6">
          <h1 className="font-display text-2xl font-bold">Criar conta</h1>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div><Label>Nome completo</Label><Input required value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></div>
            <div><Label>E-mail</Label><Input required type="email" value={f.email} onChange={e=>setF({...f,email:e.target.value})} /></div>
            <div><Label>Telefone</Label><Input required value={f.phone} onChange={e=>setF({...f,phone:phoneMask(e.target.value)})} placeholder="(11) 99999-0000" /></div>
            <div><Label>Senha (mín. 6)</Label><Input required type="password" minLength={6} value={f.password} onChange={e=>setF({...f,password:e.target.value})} /></div>
            <Button className="w-full" disabled={loading}>{loading?"Criando...":"Criar conta"}</Button>
          </form>
          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground"><div className="h-px flex-1 bg-border"/>ou<div className="h-px flex-1 bg-border"/></div>
          <Button type="button" variant="outline" className="w-full" onClick={async()=>{
            const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/minha-conta` });
            if (r.error) toast.error(r.error.message ?? "Falha no login Google");
          }}>Continuar com Google</Button>
          <p className="mt-4 text-center text-sm text-muted-foreground">Já tem conta? <Link to="/login" className="font-medium hover:text-accent">Entrar</Link></p>
        </Card>
      </div>
    </div>
  );
}
