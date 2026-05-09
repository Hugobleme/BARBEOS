import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Copy, Mail, Plus, Trash2, UsersRound } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/equipe")({ component: Equipe });

const ROLE_LABEL: Record<string, string> = {
  owner: "Dono", professional: "Profissional", receptionist: "Recepção", customer: "Cliente",
};

function Equipe() {
  const shopId = useCurrentShopId();

  const { data: members, refetch: refetchMembers } = useQuery({
    queryKey: ["members", shopId], enabled: !!shopId,
    queryFn: async () => {
      const { data } = await supabase
        .from("barbershop_members")
        .select("id, role, active, profile_id, profiles(full_name)")
        .eq("barbershop_id", shopId).order("created_at");
      return data ?? [];
    },
  });

  const { data: invites, refetch: refetchInvites } = useQuery({
    queryKey: ["invites", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("barbershop_invitations").select("*").eq("barbershop_id", shopId).order("created_at",{ascending:false})).data ?? [],
  });

  async function revoke(id: string) {
    const { error } = await supabase.from("barbershop_invitations").update({ status: "revoked" }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Convite cancelado");
    refetchInvites();
  }

  async function deactivate(memberId: string, active: boolean) {
    const { error } = await supabase.from("barbershop_members").update({ active }).eq("id", memberId);
    if (error) return toast.error(error.message);
    refetchMembers();
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Equipe</h1>
          <p className="text-sm text-muted-foreground">Membros e convites desta barbearia.</p>
        </div>
        <InviteDialog onCreated={refetchInvites} />
      </div>

      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium"><UsersRound className="h-4 w-4"/>Membros ativos</div>
        {!members?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum membro ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {members.map((m: any) => (
              <li key={m.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{m.profiles?.full_name ?? "Membro"}</div>
                  <div className="text-xs text-muted-foreground">{ROLE_LABEL[m.role] ?? m.role}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.active ? "default" : "outline"}>{m.active ? "Ativo" : "Inativo"}</Badge>
                  {m.role !== "owner" && (
                    <Button variant="ghost" size="sm" onClick={() => deactivate(m.id, !m.active)}>
                      {m.active ? "Desativar" : "Reativar"}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium"><Mail className="h-4 w-4"/>Convites</div>
        {!invites?.length ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum convite enviado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {invites.map((inv: any) => (
              <li key={inv.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <div className="font-medium">{inv.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {ROLE_LABEL[inv.role]} · enviado {format(new Date(inv.created_at), "dd/MM")} · expira {format(new Date(inv.expires_at), "dd/MM")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inv.status === "pending" ? "default" : "outline"}>{inv.status}</Badge>
                  {inv.status === "pending" && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => copyLink(inv.token)}><Copy className="h-4 w-4"/></Button>
                      <Button variant="ghost" size="sm" onClick={() => revoke(inv.id)}><Trash2 className="h-4 w-4"/></Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function InviteDialog({ onCreated }: { onCreated: () => void }) {
  const shopId = useCurrentShopId();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"professional"|"receptionist"|"owner">("professional");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.includes("@")) return toast.error("E-mail inválido");
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("barbershop_invitations")
      .insert({ barbershop_id: shopId, email: email.toLowerCase().trim(), role, invited_by: u.user?.id })
      .select("token").single();
    setBusy(false);
    if (error || !data) return toast.error(error?.message ?? "Erro");
    const url = `${window.location.origin}/convite/${data.token}`;
    navigator.clipboard.writeText(url);
    toast.success("Convite criado! Link copiado para a área de transferência.");
    setOpen(false); setEmail("");
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4"/>Convidar</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Convidar membro</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>E-mail</Label>
            <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="pessoa@exemplo.com"/>
          </div>
          <div className="grid gap-2">
            <Label>Papel</Label>
            <Select value={role} onValueChange={(v)=>setRole(v as any)}>
              <SelectTrigger><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="receptionist">Recepção</SelectItem>
                <SelectItem value="owner">Dono</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">Ao criar, o link do convite será copiado para você compartilhar.</p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={()=>setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={busy}>{busy?"Enviando…":"Criar convite"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
