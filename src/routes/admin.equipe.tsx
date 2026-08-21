import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { barbershopService, BarbershopMember } from "@/services/barbershop.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { Copy, Mail, Plus, Trash2, UsersRound, ShieldAlert, UserCog, Check, Clock } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/equipe")({
  head: () => ({ meta: [{ title: "Equipe & Membros — BarberOS" }] }),
  component: EquipePage,
});

const ROLE_LABELS: Record<string, string> = {
  owner: "Proprietário (Dono)",
  admin: "Administrador",
  professional: "Barbeiro / Profissional",
  barber: "Barbeiro",
  receptionist: "Recepção / Atendimento",
  customer: "Cliente",
};

function EquipePage() {
  const { shopId, shop } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const { data: members, isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ["admin-team-members", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getMembers(shopId!),
  });

  const { data: invites, isLoading: loadingInvites, refetch: refetchInvites } = useQuery({
    queryKey: ["admin-invites", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_invitations")
        .select("*")
        .eq("barbershop_id", shopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  async function handleRevokeInvite(id: string) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    try {
      const { error } = await supabase.from("barbershop_invitations").update({ status: "revoked" }).eq("id", id);
      if (error) throw error;
      toast.success("Convite revogado com sucesso!");
      refetchInvites();
    } catch (err: any) {
      toast.error(err.message || "Erro ao revogar convite.");
    }
  }

  async function handleToggleActive(member: BarbershopMember) {
    if (!canManage) return toast.error("Permissão insuficiente.");
    if (member.role === "owner") return toast.error("O proprietário principal não pode ser desativado.");

    try {
      const next = !member.active;
      const { error } = await supabase.from("barbershop_members").update({ active: next }).eq("id", member.id);
      if (error) throw error;
      toast.success(next ? "Membro reativado com sucesso!" : "Membro desativado da equipe.");
      refetchMembers();
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar status do membro.");
    }
  }

  function handleCopyInviteLink(token: string) {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url);
    toast.success("Link do convite copiado para a área de transferência!");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Equipe & Permissões</h1>
          <p className="text-muted-foreground">
            Gerencie os membros da equipe administrativa, recepção e profissionais da barbearia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManage ? (
            <InviteDialog shopId={shopId!} onCreated={refetchInvites} />
          ) : (
            <Badge variant="outline" className="flex items-center gap-1.5 rounded-none text-muted-foreground">
              <ShieldAlert className="h-3.5 w-3.5" /> Somente leitura
            </Badge>
          )}

          <Button asChild variant="outline" size="sm" className="rounded-none text-xs uppercase font-bold">
            <Link to="/admin/profissionais">
              <UserCog className="mr-1.5 h-3.5 w-3.5 text-accent" /> Gestão de Barbeiros
            </Link>
          </Button>
        </div>
      </div>

      {/* Lista de Membros Ativos */}
      <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2 font-serif text-lg font-bold">
            <UsersRound className="h-5 w-5 text-accent" />
            <span>Membros da Barbearia</span>
          </div>
          <Badge variant="outline" className="rounded-none text-[10px] font-mono text-accent">
            {members?.length ?? 0} membros
          </Badge>
        </div>

        {loadingMembers ? (
          <TableSkeleton />
        ) : !members || members.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="Nenhum membro cadastrado"
            description="Convide membros para auxiliar no gerenciamento da barbearia."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-3">Nome / Usuário</th>
                  <th className="py-3">Função / Papel</th>
                  <th className="py-3">Telefone</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {members.map((m: any) => (
                  <tr key={m.id} className="hover:bg-card/60 transition-colors">
                    <td className="py-3">
                      <div className="font-serif font-bold text-foreground">
                        {m.profile?.full_name || "Membro sem nome"}
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant="outline" className="rounded-none text-[10px] font-bold uppercase border-border/60">
                        {ROLE_LABELS[m.role] || m.role}
                      </Badge>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">{m.profile?.phone || "—"}</td>
                    <td className="py-3">
                      {m.active ? (
                        <Badge variant="outline" className="rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
                          Inativo
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {canManage && m.role !== "owner" ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(m)}
                          className="rounded-none text-xs hover:text-accent"
                        >
                          {m.active ? "Desativar" : "Reativar"}
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Lista de Convites Enviados */}
      <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
        <div className="mb-4 flex items-center justify-between border-b border-border/40 pb-3">
          <div className="flex items-center gap-2 font-serif text-lg font-bold">
            <Mail className="h-5 w-5 text-accent" />
            <span>Convites Enviados</span>
          </div>
          <Badge variant="outline" className="rounded-none text-[10px] font-mono text-muted-foreground">
            {invites?.length ?? 0} convites
          </Badge>
        </div>

        {loadingInvites ? (
          <TableSkeleton />
        ) : !invites || invites.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            Nenhum convite pendente. Clique em "Convidar Membro" para enviar links de acesso.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="py-3">E-mail</th>
                  <th className="py-3">Papel Pretendido</th>
                  <th className="py-3">Data de Envio</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {invites.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-card/60 transition-colors">
                    <td className="py-3 font-mono text-xs font-bold text-foreground">{inv.email}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="rounded-none text-[10px] uppercase">
                        {ROLE_LABELS[inv.role] || inv.role}
                      </Badge>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground">
                      {format(new Date(inv.created_at), "dd/MM/yyyy · HH:mm")}
                    </td>
                    <td className="py-3">
                      {inv.status === "pending" ? (
                        <Badge variant="outline" className="rounded-none border-amber-500/30 text-amber-500 text-[10px] font-bold uppercase">
                          Pendente
                        </Badge>
                      ) : inv.status === "accepted" ? (
                        <Badge variant="outline" className="rounded-none border-emerald-500/30 text-emerald-500 text-[10px] font-bold uppercase">
                          Aceito
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-none border-destructive/30 text-destructive text-[10px] uppercase">
                          Revogado
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {inv.status === "pending" && canManage && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyInviteLink(inv.token)}
                            className="rounded-none text-xs"
                          >
                            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copiar Link
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="rounded-none text-xs text-destructive hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function InviteDialog({ shopId, onCreated }: { shopId: string; onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"professional" | "receptionist" | "owner">("professional");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return toast.error("Informe um e-mail válido.");

    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("barbershop_invitations")
        .insert({
          barbershop_id: shopId,
          email: email.toLowerCase().trim(),
          role,
          invited_by: u.user?.id,
        })
        .select("token")
        .single();

      if (error || !data) throw error || new Error("Falha ao gerar convite.");

      const url = `${window.location.origin}/convite/${data.token}`;
      navigator.clipboard.writeText(url);
      toast.success("Convite criado! O link de acesso foi copiado para a área de transferência.");
      setOpen(false);
      setEmail("");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar convite.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background">
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Convidar Membro
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Convidar Membro da Equipe</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="inv_email">E-mail do Membro *</Label>
              <Input
                id="inv_email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@barbearia.com"
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Função / Permissão no Sistema</Label>
              <Select value={role} onValueChange={(v: any) => setRole(v)}>
                <SelectTrigger className="rounded-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="professional">Barbeiro / Profissional</SelectItem>
                  <SelectItem value="receptionist">Recepção / Atendente</SelectItem>
                  <SelectItem value="owner">Sócio / Proprietário</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-[10px] text-muted-foreground border-t border-border/40 pt-3">
              Ao gerar o convite, um link exclusivo será criado para o novo membro aceitar e definir sua senha.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Gerando..." : "Gerar e Copiar Link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
