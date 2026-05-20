import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/convite/$token")({
  head: () => ({
    meta: [
      { title: "Convite — BarberOS" },
      { name: "description", content: "Aceite seu convite para integrar a equipe BarberOS." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AcceptInvite,
});

function AcceptInvite() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [invite, setInvite] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [state, setState] = useState<"loading"|"ready"|"invalid"|"expired"|"used"|"wrong-account"|"accepting"|"done">("loading");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("barbershop_invitations").select("*").eq("token", token).maybeSingle();
      if (!data) { setState("invalid"); return; }
      setInvite(data);
      const { data: s } = await supabase.from("barbershops").select("name").eq("id", data.barbershop_id).single();
      setShop(s);
      if (data.status !== "pending") return setState("used");
      if (new Date(data.expires_at) < new Date()) return setState("expired");
      if (loading) return;
      if (!user) return setState("ready");
      if (user.email?.toLowerCase() !== data.email.toLowerCase()) return setState("wrong-account");
      setState("ready");
    })();
  }, [token, user, loading]);

  async function accept() {
    if (!user || !invite) return;
    setState("accepting");
    const { error: mErr } = await supabase.from("barbershop_members").insert({
      barbershop_id: invite.barbershop_id, profile_id: user.id, role: invite.role,
    });
    if (mErr && !mErr.message.includes("duplicate")) { setState("ready"); return toast.error(mErr.message); }
    const { error: iErr } = await supabase.from("barbershop_invitations").update({
      status: "accepted", accepted_by: user.id, accepted_at: new Date().toISOString(),
    }).eq("id", invite.id);
    if (iErr) { setState("ready"); return toast.error(iErr.message); }
    setState("done");
    toast.success("Convite aceito!");
    setTimeout(() => nav({ to: "/admin" }), 1200);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="max-w-md p-8 text-center">
        {state === "loading" && <p className="text-sm text-muted-foreground">Carregando convite…</p>}

        {state === "invalid" && (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-destructive"/>
            <h1 className="mt-4 font-display text-xl font-bold">Convite inválido</h1>
            <p className="mt-2 text-sm text-muted-foreground">Este link não corresponde a nenhum convite.</p>
          </>
        )}

        {state === "expired" && (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-warning"/>
            <h1 className="mt-4 font-display text-xl font-bold">Convite expirado</h1>
            <p className="mt-2 text-sm text-muted-foreground">Peça à barbearia para enviar um novo convite.</p>
          </>
        )}

        {state === "used" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-success"/>
            <h1 className="mt-4 font-display text-xl font-bold">Convite já utilizado</h1>
            <p className="mt-2 text-sm text-muted-foreground">Este convite já foi aceito ou cancelado.</p>
          </>
        )}

        {state === "wrong-account" && invite && (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-warning"/>
            <h1 className="mt-4 font-display text-xl font-bold">Conta diferente</h1>
            <p className="mt-2 text-sm text-muted-foreground">Este convite foi enviado para <b>{invite.email}</b>, mas você está logado como <b>{user?.email}</b>.</p>
            <Button className="mt-4 w-full" onClick={async ()=>{ await supabase.auth.signOut(); nav({ to: "/login" }); }}>Entrar com outra conta</Button>
          </>
        )}

        {(state === "ready" || state === "accepting") && invite && (
          <>
            <Mail className="mx-auto h-10 w-10 text-accent"/>
            <h1 className="mt-4 font-display text-xl font-bold">Convite para {shop?.name ?? "uma barbearia"}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Você foi convidado(a) como <b>{invite.role}</b>.</p>
            {!user ? (
              <div className="mt-6 grid gap-2">
                <Button asChild><Link to="/login" search={{ next: `/convite/${token}` } as any}>Entrar para aceitar</Link></Button>
                <Button asChild variant="outline"><Link to="/cadastro">Criar conta</Link></Button>
                <p className="text-xs text-muted-foreground">Use o e-mail <b>{invite.email}</b>.</p>
              </div>
            ) : (
              <Button className="mt-6 w-full" disabled={state==="accepting"} onClick={accept}>
                {state === "accepting" ? "Aceitando…" : "Aceitar convite"}
              </Button>
            )}
          </>
        )}

        {state === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-success"/>
            <h1 className="mt-4 font-display text-xl font-bold">Bem-vindo(a) à equipe!</h1>
            <p className="mt-2 text-sm text-muted-foreground">Redirecionando para o painel…</p>
          </>
        )}
      </Card>
    </div>
  );
}
