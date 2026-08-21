import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { customerService, Customer, CustomerStats } from "@/services/customer.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { TableSkeleton, EmptyState } from "@/components/site/LoadingState";
import { brl } from "@/lib/format";
import { Search, Users, ShieldOff, ShieldCheck, History, Calendar, Scissors, Phone, Mail, DollarSign, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin/clientes")({ component: Page });

function Page() {
  const { shopId, shop } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin";

  const [search, setSearch] = useState("");
  const [filterBlocked, setFilterBlocked] = useState("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const { data: result, isLoading, refetch } = useQuery({
    queryKey: ["admin-customers", shopId, search, filterBlocked],
    enabled: !!shopId,
    queryFn: () =>
      customerService.getCustomers(shopId!, {
        q: search || undefined,
        blocked: filterBlocked === "blocked" ? true : filterBlocked === "active" ? false : undefined,
        limit: 100,
      }),
  });

  const customers = result?.data ?? [];

  // Query para obter detalhes e histórico do cliente selecionado
  const { data: customerHistory, isLoading: loadingHistory } = useQuery({
    queryKey: ["customer-history", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id,
    queryFn: () => customerService.getCustomerHistory(selectedCustomer!.id),
  });

  const { data: customerStats } = useQuery({
    queryKey: ["customer-stats", selectedCustomer?.id],
    enabled: !!selectedCustomer?.id,
    queryFn: () => customerService.getCustomerStats(selectedCustomer!.id),
  });

  async function handleToggleBlock(c: Customer, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (!canManage) {
      toast.error("Permissão insuficiente para alterar status de clientes.");
      return;
    }

    try {
      if (c.blocked) {
        await customerService.unblockCustomer(c.id);
        toast.success(`Cliente "${c.full_name}" desbloqueado com sucesso!`);
      } else {
        await customerService.blockCustomer(c.id);
        toast.warning(`Cliente "${c.full_name}" foi bloqueado.`);
      }
      refetch();
      if (selectedCustomer?.id === c.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, blocked: !prev.blocked } : null));
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar cliente.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Base de clientes e histórico detalhado de atendimentos.</p>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center gap-4 border border-border/60 bg-card/40 p-4 backdrop-blur-md">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-none border-border bg-background/50 pl-9 text-sm"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="w-[180px]">
          <Select value={filterBlocked} onValueChange={setFilterBlocked}>
            <SelectTrigger className="h-11 rounded-none border-border bg-background/50 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-none">
              <SelectItem value="all">Todos os clientes</SelectItem>
              <SelectItem value="active">Apenas ativos</SelectItem>
              <SelectItem value="blocked">Apenas bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Modal / Detalhes do Histórico do Cliente */}
      <Dialog open={!!selectedCustomer} onOpenChange={(open) => !open && setSelectedCustomer(null)}>
        <DialogContent className="max-w-2xl rounded-none border-border p-6">
          {selectedCustomer && (
            <div className="space-y-6">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="font-serif text-2xl font-bold">
                      {selectedCustomer.full_name}
                    </DialogTitle>
                    <DialogDescription className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {selectedCustomer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 text-accent" /> {selectedCustomer.phone}
                        </span>
                      )}
                      {selectedCustomer.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5 text-accent" /> {selectedCustomer.email}
                        </span>
                      )}
                    </DialogDescription>
                  </div>

                  <Badge
                    variant="outline"
                    className={`rounded-none font-bold uppercase text-[10px] ${
                      selectedCustomer.blocked
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                    }`}
                  >
                    {selectedCustomer.blocked ? "Bloqueado" : "Ativo"}
                  </Badge>
                </div>
              </DialogHeader>

              {/* Estatísticas Rápidas */}
              <div className="grid grid-cols-3 gap-3 border-y border-border/40 py-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Total Gasto
                  </span>
                  <div className="font-serif text-xl font-bold text-accent">
                    {brl(customerStats?.totalSpent ?? 0)}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Atendimentos
                  </span>
                  <div className="font-serif text-xl font-bold text-foreground">
                    {customerStats?.totalAppointments ?? 0}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Última Visita
                  </span>
                  <div className="text-xs font-semibold text-foreground">
                    {customerStats?.lastVisit
                      ? format(new Date(customerStats.lastVisit), "dd/MM/yyyy", { locale: ptBR })
                      : "Nunca"}
                  </div>
                </div>
              </div>

              {/* Lista de Atendimentos Anteriores */}
              <div className="space-y-3">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <History className="h-4 w-4 text-accent" /> Histórico de Agendamentos
                </h4>

                {loadingHistory ? (
                  <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
                    Carregando histórico...
                  </div>
                ) : !customerHistory || customerHistory.length === 0 ? (
                  <div className="border border-border/40 p-8 text-center text-xs text-muted-foreground">
                    Nenhum agendamento registrado para este cliente.
                  </div>
                ) : (
                  <div className="max-h-[300px] divide-y divide-border/20 overflow-y-auto border border-border/40">
                    {customerHistory.map((appt: any) => {
                      const serviceNames = (appt.services ?? [])
                        .map((s: any) => s.service?.name)
                        .filter(Boolean)
                        .join(", ") || "Atendimento";

                      return (
                        <div key={appt.id} className="flex items-center justify-between p-4 text-xs hover:bg-card/40">
                          <div className="space-y-1">
                            <div className="font-bold text-foreground">{serviceNames}</div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(appt.scheduled_start), "dd/MM/yyyy · HH:mm", { locale: ptBR })}
                              </span>
                              {appt.professional?.display_name && (
                                <span>Profissional: {appt.professional.display_name}</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-bold text-accent">{brl(Number(appt.total_amount || 0))}</div>
                            <Badge variant="outline" className="mt-1 rounded-none text-[9px] uppercase border-border/40">
                              {appt.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {canManage && (
                <div className="flex justify-end border-t border-border/40 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleBlock(selectedCustomer)}
                    className="rounded-none text-xs"
                  >
                    {selectedCustomer.blocked ? (
                      <>
                        <ShieldCheck className="mr-1.5 h-3.5 w-3.5 text-emerald-500" /> Desbloquear cliente
                      </>
                    ) : (
                      <>
                        <ShieldOff className="mr-1.5 h-3.5 w-3.5 text-destructive" /> Bloquear agendamentos
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tabela de Clientes */}
      {isLoading ? (
        <TableSkeleton />
      ) : customers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          description={
            search
              ? "Tente outro termo de busca."
              : "Os clientes são registrados automaticamente ao realizar agendamentos ou compras."
          }
        />
      ) : (
        <Card className="overflow-hidden rounded-none border border-border bg-card/40 backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/60 bg-background/60 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Nome do Cliente</th>
                  <th className="px-6 py-4">Telefone</th>
                  <th className="px-6 py-4">E-mail</th>
                  <th className="px-6 py-4">Faltas (No-Show)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className="cursor-pointer transition-colors hover:bg-card/80"
                  >
                    <td className="px-6 py-4">
                      <div className="font-serif font-bold text-foreground">{c.full_name}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{c.phone || "—"}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{c.email || "—"}</td>
                    <td className="px-6 py-4">
                      {Number(c.no_show_count ?? 0) > 0 ? (
                        <Badge variant="outline" className="rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold">
                          {c.no_show_count} {Number(c.no_show_count) === 1 ? "falta" : "faltas"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">0</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.blocked ? (
                        <Badge variant="outline" className="rounded-none border-destructive/30 bg-destructive/10 text-destructive text-[10px] font-bold uppercase">
                          Bloqueado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-none border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase">
                          Ativo
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomer(c);
                        }}
                        className="rounded-none text-xs hover:text-accent"
                      >
                        <History className="mr-1.5 h-3.5 w-3.5" /> Ver histórico
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
