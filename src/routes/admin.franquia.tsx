import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useAuth } from "@/hooks/use-auth";
import { barbershopService, Barbershop } from "@/services/barbershop.service";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { brl } from "@/lib/format";
import { startOfMonth, endOfMonth, format, subDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  ArrowRight,
  Plus,
  MapPin,
  Phone,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { KPISkeleton, CardGridSkeleton } from "@/components/site/LoadingState";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/franquia")({
  head: () => ({ meta: [{ title: "Franquia & Múltiplas Unidades — BarberOS" }] }),
  component: FranquiaPage,
});

type ShopStats = {
  id: string;
  name: string;
  slug: string;
  role: string;
  active: boolean;
  address?: any;
  phone?: string;
  monthRevenue: number;
  monthCount: number;
  avgTicket: number;
  customers: number;
};

const SERIES_COLORS = [
  "hsl(var(--accent))",
  "hsl(var(--primary))",
  "#3b82f6",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
];

function FranquiaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { shopId: currentShopId, setShopId } = useCurrentShop();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Consulta: Todas as Barbearias do Dono
  const { data: ownedShops, isLoading: loadingShops, refetch: refetchOwned } = useQuery({
    queryKey: ["admin-owned-barbershops", user?.id],
    enabled: !!user?.id,
    queryFn: () => barbershopService.getBarbershopsByOwner(user!.id),
  });

  const shopIds = useMemo(() => (ownedShops ?? []).map((s) => s.id), [ownedShops]);

  // Consulta de Estatísticas por Unidade
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["franquia-shop-stats", shopIds.join(",")],
    enabled: shopIds.length > 0,
    queryFn: async (): Promise<ShopStats[]> => {
      const now = new Date();
      const monthStart = startOfMonth(now).toISOString();
      const monthEnd = endOfMonth(now).toISOString();

      return Promise.all(
        (ownedShops ?? []).map(async (s) => {
          const [apptsRes, customersRes] = await Promise.all([
            supabase
              .from("appointments")
              .select("total_amount, status")
              .eq("barbershop_id", s.id)
              .gte("scheduled_start", monthStart)
              .lte("scheduled_start", monthEnd),
            supabase
              .from("customers")
              .select("id", { count: "exact", head: true })
              .eq("barbershop_id", s.id),
          ]);

          const completed = (apptsRes.data ?? []).filter((a: any) => a.status === "completed");
          const monthRevenue = completed.reduce((acc: number, a: any) => acc + Number(a.total_amount || 0), 0);
          const monthCount = completed.length;
          const avgTicket = monthCount > 0 ? monthRevenue / monthCount : 0;
          const contacts = (s.contacts as any) || {};

          return {
            id: s.id,
            name: s.name,
            slug: s.slug,
            role: "owner",
            active: s.active,
            address: s.address,
            phone: contacts.phone || contacts.whatsapp || "",
            monthRevenue,
            monthCount,
            avgTicket,
            customers: customersRes.count ?? 0,
          };
        })
      );
    },
  });

  // Métricas Consolidadas Totais
  const totals = useMemo(() => {
    return (stats ?? []).reduce(
      (acc, s) => ({
        revenue: acc.revenue + s.monthRevenue,
        count: acc.count + s.monthCount,
        customers: acc.customers + s.customers,
      }),
      { revenue: 0, count: 0, customers: 0 }
    );
  }, [stats]);

  const bestUnit = useMemo(() => {
    if (!stats || !stats.length) return null;
    return [...stats].sort((a, b) => b.monthRevenue - a.monthRevenue)[0];
  }, [stats]);

  function handleSelectShop(id: string) {
    setShopId(id);
    toast.success("Unidade ativa alterada!");
    navigate({ to: "/admin" });
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Painel da Franquia</h1>
          <p className="text-muted-foreground">
            Gerencie todas as suas filiais e barbearias em um único lugar com visão consolidada.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova Unidade
        </Button>
      </div>

      {/* Resumo Consolidado (se houver mais de 1 unidade) */}
      {(ownedShops?.length ?? 0) > 1 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Faturamento da Rede (Mês)
                </span>
                <DollarSign className="h-4 w-4 text-accent" />
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-accent">{brl(totals.revenue)}</div>
              <p className="mt-1 text-[10px] text-muted-foreground">{ownedShops?.length} unidades ativas</p>
            </Card>

            <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Atendimentos Concluídos
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">{totals.count}</div>
              <p className="mt-1 text-[10px] text-muted-foreground">Volume total no mês corrente</p>
            </Card>

            <Card className="rounded-none border border-border bg-card/40 p-5 backdrop-blur-md">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Base Total de Clientes
                </span>
                <Users className="h-4 w-4 text-blue-400" />
              </div>
              <div className="mt-2 font-serif text-3xl font-bold text-foreground">{totals.customers}</div>
              <p className="mt-1 text-[10px] text-muted-foreground">Cadastros somados de todas as lojas</p>
            </Card>
          </div>

          {bestUnit && bestUnit.monthRevenue > 0 && (
            <Card className="flex flex-col gap-3 rounded-none border border-accent/40 bg-accent/5 p-5 backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center bg-accent text-accent-foreground font-serif font-bold text-lg">
                  🏆
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-accent font-bold">
                    Unidade Destaque do Mês
                  </div>
                  <div className="font-serif text-xl font-bold text-foreground">{bestUnit.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-serif text-2xl font-bold text-accent">{brl(bestUnit.monthRevenue)}</div>
                <div className="text-xs text-muted-foreground">{bestUnit.monthCount} atendimentos realizados</div>
              </div>
            </Card>
          )}
        </>
      )}

      {/* Grid de Unidades */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <h2 className="font-serif text-2xl font-bold">Suas Unidades Cadastradas</h2>
          <Badge variant="outline" className="rounded-none text-xs font-mono text-accent">
            {ownedShops?.length ?? 0} {ownedShops?.length === 1 ? "unidade" : "unidades"}
          </Badge>
        </div>

        {loadingShops || loadingStats ? (
          <CardGridSkeleton count={3} />
        ) : !stats || stats.length === 0 ? (
          <Card className="p-12 text-center rounded-none border border-border">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-serif text-lg font-bold">Nenhuma unidade cadastrada</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Clique em "Nova Unidade" para cadastrar sua barbearia ou adicionar uma nova filial à sua rede.
            </p>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((s) => {
              const isCurrent = s.id === currentShopId;
              const addr = s.address || {};
              const cityState = [addr.neighborhood || addr.district, addr.city, addr.state].filter(Boolean).join(" · ");

              return (
                <Card
                  key={s.id}
                  className={`flex flex-col justify-between rounded-none border p-6 backdrop-blur-md transition-all ${
                    isCurrent ? "border-accent bg-card shadow-lg shadow-accent/5" : "border-border bg-card/40 hover:border-border/80"
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-foreground">{s.name}</h3>
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3.5 w-3.5 text-accent shrink-0" />
                          {cityState || "Endereço não configurado"}
                        </p>
                        {s.phone && (
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            {s.phone}
                          </p>
                        )}
                      </div>

                      {isCurrent ? (
                        <Badge className="rounded-none bg-accent text-accent-foreground text-[10px] font-bold uppercase">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-none text-[10px] uppercase border-border/60">
                          Filial
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 border-y border-border/40 py-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">Faturamento (Mês)</span>
                        <div className="font-serif text-lg font-bold text-accent">{brl(s.monthRevenue)}</div>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-muted-foreground">Atendimentos</span>
                        <div className="font-serif text-lg font-bold text-foreground">{s.monthCount}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleSelectShop(s.id)}
                      className={`w-full rounded-none text-xs uppercase font-bold tracking-wider ${
                        isCurrent
                          ? "bg-accent text-accent-foreground hover:bg-foreground hover:text-background"
                          : "bg-card border border-border hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      {isCurrent ? "Painel Aberto" : "Gerenciar Unidade"}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Nova Unidade */}
      <CreateShopModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        ownerId={user?.id || ""}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetchOwned();
        }}
      />
    </div>
  );
}

function CreateShopModal({
  open,
  onOpenChange,
  ownerId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  ownerId: string;
  onSuccess: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [street, setStreet] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [busy, setBusy] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Informe o nome da unidade.");

    setBusy(true);
    try {
      await barbershopService.createBarbershop({
        name: name.trim(),
        ownerId,
        phone: phone.trim() || undefined,
        address: {
          street: street.trim() || null,
          neighborhood: neighborhood.trim() || null,
          city: city.trim() || null,
          state: state.trim().toUpperCase() || "SP",
        },
      });

      toast.success("Nova unidade criada com sucesso!");
      setName("");
      setPhone("");
      setStreet("");
      setNeighborhood("");
      setCity("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar nova unidade.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Cadastrar Nova Unidade</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="sh_name">Nome da Unidade / Filial *</Label>
              <Input
                id="sh_name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: BarberOS — Unidade Jardins"
                className="rounded-none"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sh_phone">Telefone / WhatsApp</Label>
              <Input
                id="sh_phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-0000"
                className="rounded-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="sh_street">Rua / Endereço</Label>
                <Input
                  id="sh_street"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua Oscar Freire"
                  className="rounded-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sh_neigh">Bairro</Label>
                <Input
                  id="sh_neigh"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Jardins"
                  className="rounded-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="sh_city">Cidade</Label>
                <Input
                  id="sh_city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="São Paulo"
                  className="rounded-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sh_uf">UF</Label>
                <Input
                  id="sh_uf"
                  maxLength={2}
                  value={state}
                  onChange={(e) => setState(e.target.value.toUpperCase())}
                  placeholder="SP"
                  className="rounded-none uppercase font-mono"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
              Cancelar
            </Button>
            <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
              {busy ? "Criando..." : "Criar Unidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
