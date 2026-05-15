import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { useState } from "react";
import { Search, Users } from "lucide-react";

export const Route = createFileRoute("/admin/clientes")({ component: Page });

function Page() {
  const shopId = useCurrentShopId();
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["customers", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("customers").select("*").eq("barbershop_id", shopId).order("created_at",{ascending:false})).data ?? [],
  });
  const filtered = (data ?? []).filter(c => !q || c.full_name.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q));
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
      <Card className="overflow-hidden p-0">
        {filtered.length === 0 ? (
          <div className="grid place-items-center gap-2 p-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground"/>
            <p className="text-sm text-muted-foreground">Nenhum cliente cadastrado ainda.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Nome</th><th className="px-4 py-3">Telefone</th><th className="px-4 py-3">E-mail</th><th className="px-4 py-3">Cliente desde</th></tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{c.full_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
