import { PublicLayout } from "@/components/site/PublicLayout";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/recuperar-senha")({
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
      <div className="mx-auto max-w-md px-4 py-12">
        <Card className="p-6">
          <h1 className="font-display text-2xl font-bold">Recuperar senha</h1>
          {sent ? (
            <p className="mt-4 text-sm text-muted-foreground">Se houver uma conta com esse e-mail, enviamos um link para redefinir sua senha.</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div><Label>E-mail</Label><Input type="email" required value={email} onChange={e=>setEmail(e.target.value)} /></div>
              <Button className="w-full">Enviar link</Button>
            </form>
          )}
          <p className="mt-4 text-center text-sm"><Link to="/login" className="text-muted-foreground hover:text-foreground">Voltar ao login</Link></p>
        </Card>
      </div>
    </div>
  );
}
