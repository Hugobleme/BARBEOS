import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { useState } from "react";
import { Search, Users, ShieldOff, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/clientes")({ component: Page });

function Page() {
  const shopId = useCurrentShopId();
  const [q, setQ] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["customers", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("customers").select("*").eq("barbershop_id", shopId).order("created_at",{ascending:false})).data ?? [],
  });
  const filtered = (data ?? []).filter((c: any) => !q || c.full_name.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q));

  async function toggleBlock(c: any) {
    const { error } = await supabase.from("customers").update({ blocked: !c.blocked, ...(c.blocked ? { no_show_count: 0 } : {}) }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(c.blocked ? "Cliente desbloqueado" : "Cliente bloqueado");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Sua base de clientes.</p>
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"/>
        <Input className="pl-9" placeholder="Buscar por nome ou telefone..." value={q} onChange={e=>setQ(e.target.value)} />
      </div>
      {isLoading ? (
        <TableSkeleton />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={q ? "Tente outro termo de busca." : "Os clientes aparecem aqui automaticamente após o primeiro agendamento."}
        />
      ) : (
        <Card className="overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Faltas</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: any) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3">
                    {Number(c.no_show_count ?? 0) > 0 ? (
                      <Badge variant="outline" className="bg-destructive/15 text-destructive">{c.no_show_count}</Badge>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.blocked
                      ? <Badge className="bg-destructive/15 text-destructive" variant="outline">Bloqueado</Badge>
                      : <Badge variant="outline" className="bg-success/15 text-success">Ativo</Badge>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggleBlock(c)}>
                      {c.blocked ? <><ShieldCheck className="mr-1.5 h-4 w-4"/>Desbloquear</> : <><ShieldOff className="mr-1.5 h-4 w-4"/>Bloquear</>}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
