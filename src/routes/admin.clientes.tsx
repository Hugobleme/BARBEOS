import { createFileRoute } from "@tanstack/react-router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { useState, useRef, useEffect } from "react";
import { Search, Users, ShieldOff, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";

export const Route = createFileRoute("/admin/clientes")({ component: Page });

const PAGE_SIZE = 20;

function Page() {
  const shopId = useCurrentShopId();
  const [q, setQ] = useState("");
  const parentRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["customers", shopId, q],
    enabled: !!shopId,
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from("customers")
        .select("*", { count: "exact" })
        .eq("barbershop_id", shopId)
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      if (q) {
        query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
      }

      const { data, count } = await query;
      return {
        data: data ?? [],
        nextPage: (data?.length ?? 0) === PAGE_SIZE ? pageParam + 1 : undefined,
        totalCount: count ?? 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  const allRows = data?.pages.flatMap((page) => page.data) ?? [];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.getVirtualItems()].reverse();
    if (
      lastItem &&
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [
    hasNextPage,
    fetchNextPage,
    allRows.length,
    isFetchingNextPage,
    rowVirtualizer.getVirtualItems(),
  ]);

  async function toggleBlock(c: any) {
    const { error } = await supabase
      .from("customers")
      .update({ blocked: !c.blocked, ...(c.blocked ? { no_show_count: 0 } : {}) })
      .eq("id", c.id);
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
      ) : allRows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={q ? "Tente outro termo de busca." : "Os clientes aparecem aqui automaticamente após o primeiro agendamento."}
        />
      ) : (
        <Card className="overflow-hidden border-none bg-card/50 shadow-xl shadow-black/5 backdrop-blur-md">
          <div 
            ref={parentRef}
            className="h-[600px] overflow-auto scrollbar-thin scrollbar-thumb-muted-foreground/20"
          >
            <div
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 border-b border-border/40 bg-background/80 backdrop-blur-md text-left text-xs uppercase tracking-widest text-muted-foreground/60">
                  <tr>
                    <th className="px-6 py-4 font-bold">Nome</th>
                    <th className="px-6 py-4 font-bold">Telefone</th>
                    <th className="px-6 py-4 font-bold">E-mail</th>
                    <th className="px-6 py-4 font-bold">Faltas</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 text-right font-bold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const isLoaderRow = virtualRow.index > allRows.length - 1;
                    const c = allRows[virtualRow.index];

                    if (isLoaderRow) {
                      return (
                        <tr 
                          key="loader"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                        >
                          <td colSpan={6} className="py-4 text-center">
                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr 
                        key={c.id} 
                        className="transition-colors hover:bg-black/5"
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="font-bold text-foreground">{c.full_name}</div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-medium">{c.phone}</td>
                        <td className="px-6 py-4 text-muted-foreground font-medium">{c.email}</td>
                        <td className="px-6 py-4">
                          {Number(c.no_show_count ?? 0) > 0 ? (
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-bold">
                              {c.no_show_count} {Number(c.no_show_count) === 1 ? 'falta' : 'faltas'}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/40 font-medium">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {c.blocked
                            ? <Badge className="bg-destructive/10 text-destructive border-destructive/20 font-bold" variant="outline">Bloqueado</Badge>
                            : <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-bold">Ativo</Badge>}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="ghost" onClick={() => toggleBlock(c)} className="rounded-lg hover:bg-muted/50">
                            {c.blocked ? <><ShieldCheck className="mr-2 h-4 w-4 text-success"/>Desbloquear</> : <><ShieldOff className="mr-2 h-4 w-4 text-destructive"/>Bloquear</>}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

    </div>
  );
}
