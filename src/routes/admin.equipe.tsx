import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { barbershopService } from "@/services/barbershop.service";
import { toast } from "sonner";
import { UsersRound, Mail, Plus, Trash2, Copy, ShieldAlert, Check, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/equipe")({
  component: EquipePage,
});

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: "Dono", color: "text-purple-500 border-purple-500/30 bg-purple-500/10" },
  admin: { label: "Administrador", color: "text-blue-500 border-blue-500/30 bg-blue-500/10" },
  barber: { label: "Barbeiro", color: "text-accent border-accent/30 bg-accent/10" },
  professional: { label: "Profissional", color: "text-accent border-accent/30 bg-accent/10" },
  receptionist: { label: "Recepção", color: "text-emerald-500 border-emerald-500/30 bg-emerald-500/10" },
};

function EquipePage() {
  const { shopId, shop } = useCurrentShop();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);

  const isOwner = shop?.role === "owner";
  const isAdmin = shop?.role === "admin";
  const canManage = isOwner || isAdmin;

  const { data: members, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-team", shopId],
    enabled: !!shopId,
    queryFn: () => barbershopService.getMembers(shopId!),
  });

  const { data: invitations } = useQuery({
    queryKey: ["admin-invitations", shopId],
    enabled: !!shopId && canManage,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("barbershop_invitations")
        .select("*")
        .eq("barbershop_id", shopId!)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const removeMut = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("barbershop_members")
        .delete()
        .eq("id", memberId)
        .eq("barbershop_id", shopId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido da equipe.");
      refetch();
    },
    onError: (err: any) => toast.error(err.message || "Erro ao remover membro."),
  });

  const cancelInviteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("barbershop_invitations").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite cancelado.");
      qc.invalidateQueries({ queryKey: ["admin-invitations", shopId] });
    },
  });

  const handleRemove = (m: any) => {
    if (m.role === "owner") {
      return toast.error("Não é possível remover o dono da barbearia.");
    }
    if (m.profile_id === user?.id) {
      return toast.error("Você não pode remover seu próprio acesso por aqui.");
    }
    if (isAdmin && m.role === "admin") {
      return toast.error("Administradores não podem remover outros administradores.");
    }

    if (confirm(`Tem certeza que deseja remover o acesso de ${m.profile?.full_name || "este membro"}?`)) {
      removeMut.mutate(m.id);
    }
  };

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-border/40 bg-card/40 p-4 sm:p-5 backdrop-blur-md shrink-0">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Equipe e Acessos</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Gerencie quem tem acesso ao sistema</p>
        </div>
        {canManage && (
          <Button onClick={() => setInviteOpen(true)} className="bg-accent text-accent-foreground shrink-0 h-11 px-4">
            <Plus className="mr-2 h-4 w-4 hidden sm:block" />
            <span className="hidden sm:inline">Convidar Membro</span>
            <span className="sm:hidden">Convidar</span>
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-24 space-y-6">
          
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <UsersRound className="h-4 w-4" /> Membros Ativos
            </h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Card key={i} className="h-20 animate-pulse rounded-xl border border-border/40 bg-muted/30" />)}
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <span className="text-muted-foreground mb-4">Ocorreu um erro ao carregar a equipe.</span>
                <Button onClick={() => refetch()} variant="outline">Tentar novamente</Button>
              </div>
            ) : !Array.isArray(members) || members.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-16 text-center">
                <ShieldAlert className="h-10 w-10 text-muted-foreground/30 mb-4" />
                <h3 className="font-serif text-lg font-bold text-foreground">Nenhum membro ativo encontrado.</h3>
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((m) => {
                  const roleCfg = ROLE_LABELS[m.role as string] || { label: m.role, color: "border-border" };
                  const canRemove = canManage && m.role !== "owner" && m.profile_id !== user?.id && !(isAdmin && m.role === "admin");

                  return (
                    <Card key={m.id} className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 transition-colors hover:border-accent/50 bg-card">
                      
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 border border-border/40">
                          <AvatarImage src={m.profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-accent/10 text-accent font-bold">
                            {(m.profile?.full_name || "M")[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-0.5">
                          <h3 className="font-bold text-foreground text-base leading-none">
                            {m.profile?.full_name || "Usuário sem nome"} {m.profile_id === user?.id && <span className="text-xs font-normal text-muted-foreground">(Você)</span>}
                          </h3>
                          <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider mt-1 ${roleCfg.color}`}>
                            {roleCfg.label}
                          </Badge>
                        </div>
                      </div>

                      {canManage && (
                        <div className="mt-4 flex items-center justify-end gap-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-none">
                          {canRemove ? (
                            <Button 
                              variant="outline" 
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20 h-9 px-3 text-xs"
                              onClick={() => handleRemove(m)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover Acesso
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic px-3">Acesso restrito</span>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* INVITATIONS */}
          {canManage && Array.isArray(invitations) && invitations.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-border/40">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" /> Convites Pendentes
              </h2>
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <Card key={inv.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-border/40 bg-card/40 border-dashed">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{inv.email}</h3>
                        <Badge variant="outline" className="text-[10px] uppercase bg-muted text-muted-foreground border-border">Pendente</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>Acesso: {ROLE_LABELS[inv.role as string]?.label || inv.role}</span>
                        <span>•</span>
                        <span>Expira em: {format(new Date(inv.expires_at), "dd/MM/yyyy")}</span>
                      </p>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-end gap-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/40 sm:border-none">
                      <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => {
                        const link = `${window.location.origin}/invite?token=${inv.token}`;
                        navigator.clipboard.writeText(link);
                        toast.success("Link copiado para a área de transferência!");
                      }}>
                        <Copy className="mr-2 h-3 w-3" /> Copiar Link
                      </Button>
                      <Button variant="outline" size="icon" className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground" onClick={() => {
                        if (confirm("Cancelar este convite?")) cancelInviteMut.mutate(inv.id);
                      }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

        </div>
      </ScrollArea>

      <InviteDialog 
        open={inviteOpen} 
        onClose={() => { setInviteOpen(false); setGeneratedToken(null); }} 
        shopId={shopId}
        userId={user?.id}
        isAdmin={isAdmin}
        generatedToken={generatedToken}
        setGeneratedToken={setGeneratedToken}
        onSuccess={() => qc.invalidateQueries({ queryKey: ["admin-invitations", shopId] })}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------

function InviteDialog({ open, onClose, shopId, userId, isAdmin, generatedToken, setGeneratedToken, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("barber");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !role || !shopId) return;

    if (isAdmin && role === "owner") {
      return toast.error("Administradores não podem convidar novos donos.");
    }

    setLoading(true);
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      const { error } = await supabase
        .from("barbershop_invitations")
        .insert({
          barbershop_id: shopId,
          email: email.trim(),
          role,
          token,
          expires_at: expiresAt.toISOString(),
          invited_by: userId || null,
          status: "pending"
        });

      if (error) throw error;
      
      setGeneratedToken(token);
      onSuccess();
      toast.success("Convite gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar convite.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!generatedToken) return;
    const link = `${window.location.origin}/invite?token=${generatedToken}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência!");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader>
          <DialogTitle>{generatedToken ? "Convite Gerado!" : "Convidar Membro da Equipe"}</DialogTitle>
          <DialogDescription>
            {generatedToken 
              ? "O convite foi criado. Copie o link abaixo e envie para o novo membro." 
              : "Gere um link de convite para dar acesso ao painel da barbearia."}
          </DialogDescription>
        </DialogHeader>
        
        {generatedToken ? (
          <div className="space-y-4 py-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 text-emerald-600">
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">Link válido por 7 dias. O usuário precisará criar uma conta com o e-mail convidado.</p>
            </div>
            <div className="flex gap-2">
              <Input readOnly value={`${window.location.origin}/invite?token=${generatedToken}`} className="font-mono text-xs bg-muted/50" />
              <Button onClick={copyLink} className="shrink-0 bg-accent text-accent-foreground">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={onClose}>Fechar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="inv-email">E-mail do convidado <span className="text-destructive">*</span></Label>
              <Input 
                id="inv-email" 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="barbeiro@exemplo.com" 
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-role">Nível de Acesso <span className="text-destructive">*</span></Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="barber">Barbeiro / Profissional</SelectItem>
                  <SelectItem value="receptionist">Recepção / Atendimento</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  {!isAdmin && <SelectItem value="owner">Dono (Proprietário)</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border/40 mt-6">
              <Button type="button" variant="outline" className="h-11" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="h-11 bg-accent text-accent-foreground font-bold">
                {loading ? "Gerando..." : "Gerar Convite"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
