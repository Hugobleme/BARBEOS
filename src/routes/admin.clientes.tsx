import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { customerService, Customer, CustomerStats } from "@/services/customer.service";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { brl } from "@/lib/format";
import {
  Search,
  Users,
  ShieldOff,
  ShieldCheck,
  History,
  Calendar,
  Scissors,
  Phone,
  Mail,
  DollarSign,
  Clock,
  X,
  ChevronRight,
  UserPlus,
  StickyNote,
  Ban,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/clientes")({ component: Clientes });

function Clientes() {
  const { shopId } = useCurrentShop();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const {
    data: customersResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-customers", shopId, debouncedSearch],
    enabled: !!shopId,
    queryFn: () => customerService.getCustomers(shopId!, { q: debouncedSearch, limit: 100 }),
  });

  const customers = customersResponse?.data || [];

  const handleOpenForm = () => {
    setSelectedCustomer(null);
    setFormOpen(true);
  };

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center h-[60vh]">
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">
          Não encontramos uma barbearia vinculada à sua conta.
        </h2>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border/40 bg-card/40 p-4 sm:p-5 backdrop-blur-md shrink-0 gap-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Gerencie a base de clientes da barbearia
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11 bg-background"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setSearch("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button
            onClick={handleOpenForm}
            className="bg-accent text-accent-foreground shrink-0 h-11"
          >
            <UserPlus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Cadastrar</span>
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-4xl p-4 sm:p-6 pb-24">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-border/40 bg-muted/30"
                />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <span className="text-muted-foreground mb-4">Erro ao carregar clientes.</span>
              <Button onClick={() => refetch()} variant="outline">
                Tentar novamente
              </Button>
            </div>
          ) : !Array.isArray(customers) || customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-card/20 py-20 text-center">
              <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-serif text-lg font-bold text-foreground">
                {search ? "Nenhum cliente encontrado." : "Sua base de clientes está vazia."}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                {search
                  ? "Tente buscar com outros termos."
                  : "Cadastre o primeiro cliente para começar."}
              </p>
              {!search && (
                <Button
                  onClick={handleOpenForm}
                  className="mt-6 bg-accent text-accent-foreground font-bold"
                >
                  Cadastrar Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {customers.map((c) => (
                <Card
                  key={c.id}
                  className={`group flex items-center justify-between p-4 cursor-pointer rounded-xl border border-border/40 transition-colors hover:border-accent/50 ${c.blocked ? "bg-destructive/5 border-destructive/20 opacity-80" : "bg-card"}`}
                  onClick={() => setSelectedCustomer(c)}
                >
                  <div className="flex flex-col truncate pr-4">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-base truncate">
                        {c.full_name}
                      </h3>
                      {c.blocked && (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-destructive border-destructive/30 bg-destructive/10 uppercase"
                        >
                          Bloqueado
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1">
                      {c.phone ? (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 italic opacity-60">
                          <Phone className="h-3 w-3" /> Sem telefone
                        </span>
                      )}

                      {c.no_show_count > 0 && (
                        <span className="flex items-center gap-1 text-destructive font-medium">
                          <ShieldOff className="h-3 w-3" /> {c.no_show_count} faltas
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-accent transition-colors shrink-0" />
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <CustomerProfileDrawer
        customer={selectedCustomer}
        open={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onEdit={() => setFormOpen(true)}
      />

      <CustomerFormDialog
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          if (!selectedCustomer) setSelectedCustomer(null);
        }}
        shopId={shopId}
        customer={selectedCustomer}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["admin-customers", shopId] });
          setFormOpen(false);
          setSelectedCustomer(null);
        }}
      />
    </div>
  );
}

// -----------------------------------------------------------------------------
// PROFILE DRAWER
// -----------------------------------------------------------------------------

function CustomerProfileDrawer({ customer, open, onClose, onEdit }: any) {
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["customer-stats", customer?.id],
    enabled: !!customer?.id,
    queryFn: () => customerService.getCustomerStats(customer!.id),
  });

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ["customer-history", customer?.id],
    enabled: !!customer?.id,
    queryFn: () => customerService.getCustomerHistory(customer!.id),
  });

  const blockMut = useMutation({
    mutationFn: (id: string) => customerService.blockCustomer(id),
    onSuccess: () => {
      toast.success("Cliente bloqueado.");
      qc.invalidateQueries();
      onClose();
    },
  });

  const unblockMut = useMutation({
    mutationFn: (id: string) => customerService.unblockCustomer(id),
    onSuccess: () => {
      toast.success("Cliente desbloqueado.");
      qc.invalidateQueries();
      onClose();
    },
  });

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        {customer && (
          <div className="max-w-md mx-auto w-full flex flex-col h-full overflow-hidden">
            <DrawerHeader className="text-left border-b border-border/40 shrink-0">
              <div className="flex items-center justify-between">
                <DrawerTitle className="text-xl flex items-center gap-2">
                  {customer.full_name}
                  {customer.blocked && (
                    <Badge
                      variant="outline"
                      className="text-[10px] text-destructive border-destructive/30 bg-destructive/10 uppercase"
                    >
                      Bloqueado
                    </Badge>
                  )}
                </DrawerTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit()}
                  className="h-8 px-2 text-xs"
                >
                  Editar
                </Button>
              </div>
              <DrawerDescription className="flex flex-col gap-1 mt-1">
                {customer.phone && (
                  <span className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3" /> {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-1 text-sm">
                    <Mail className="h-3 w-3" /> {customer.email}
                  </span>
                )}
              </DrawerDescription>
            </DrawerHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* SUMMARY STATS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Total Gasto
                    </span>
                    {statsLoading ? (
                      <div className="h-5 bg-muted/50 rounded animate-pulse w-1/2" />
                    ) : (
                      <span className="font-mono font-bold text-accent text-lg">
                        {brl(stats?.totalSpent || 0)}
                      </span>
                    )}
                  </div>
                  <div className="p-3 bg-muted/20 border border-border/40 rounded-xl flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      Visitas
                    </span>
                    {statsLoading ? (
                      <div className="h-5 bg-muted/50 rounded animate-pulse w-1/3" />
                    ) : (
                      <span className="font-bold text-foreground text-lg">
                        {stats?.totalAppointments || 0}
                      </span>
                    )}
                  </div>
                </div>

                {/* NOTES */}
                {customer.notes && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <StickyNote className="h-4 w-4" /> Notas Internas
                    </h4>
                    <div className="p-3 bg-accent/5 border border-accent/20 text-accent-foreground/90 rounded-xl text-sm whitespace-pre-wrap italic">
                      {customer.notes}
                    </div>
                  </div>
                )}

                {/* HISTORY */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <History className="h-4 w-4" /> Histórico
                  </h4>
                  {historyLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 bg-muted/30 animate-pulse rounded-lg" />
                      ))}
                    </div>
                  ) : !history || history.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic bg-muted/20 p-4 rounded-xl text-center border border-dashed border-border/40">
                      Nenhum agendamento encontrado.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {history.slice(0, 10).map((appt: any) => {
                        const servicesStr = Array.isArray(appt.services)
                          ? appt.services
                              .map((s: any) => s.service?.name)
                              .filter(Boolean)
                              .join(", ")
                          : "Serviço";
                        const isPast = new Date(appt.scheduled_start) < new Date();

                        return (
                          <div
                            key={appt.id}
                            className="flex flex-col p-3 border border-border/40 rounded-lg bg-card text-sm"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {format(new Date(appt.scheduled_start), "dd/MM/yy 'às' HH:mm")}
                              </span>
                              <span className="font-mono text-accent font-bold">
                                {brl(Number(appt.total_amount || 0))}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                              <span className="truncate">{servicesStr}</span>
                              <span>Status: {appt.status}</span>
                            </div>
                          </div>
                        );
                      })}
                      {history.length > 10 && (
                        <p className="text-xs text-center text-muted-foreground pt-2">
                          Mostrando os últimos 10 de {history.length}.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>

            <DrawerFooter className="border-t border-border/40 pt-3 shrink-0 flex-row gap-2">
              {customer.blocked ? (
                <Button
                  variant="outline"
                  className="flex-1 bg-background"
                  onClick={() => {
                    if (confirm("Desbloquear este cliente?")) unblockMut.mutate(customer.id);
                  }}
                >
                  <ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" /> Desbloquear
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground border-destructive/20"
                  onClick={() => {
                    if (confirm("Bloquear cliente? Ele não poderá fazer agendamentos online."))
                      blockMut.mutate(customer.id);
                  }}
                >
                  <Ban className="h-4 w-4 mr-2" /> Bloquear Cliente
                </Button>
              )}
            </DrawerFooter>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

// -----------------------------------------------------------------------------
// CREATE / EDIT FORM
// -----------------------------------------------------------------------------

function CustomerFormDialog({ open, onClose, shopId, customer, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      if (customer) {
        setFormData({
          full_name: customer.full_name || "",
          phone: customer.phone || "",
          email: customer.email || "",
          notes: customer.notes || "",
        });
      } else {
        setFormData({ full_name: "", phone: "", email: "", notes: "" });
      }
    }
  }, [open, customer]);

  const normalizePhone = (phone: string) => {
    const nums = phone.replace(/\D/g, "");
    if (nums.length === 11)
      return `(${nums.substring(0, 2)}) ${nums.substring(2, 7)}-${nums.substring(7, 11)}`;
    if (nums.length === 10)
      return `(${nums.substring(0, 2)}) ${nums.substring(2, 6)}-${nums.substring(6, 10)}`;
    return phone;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setFormData({ ...formData, phone: normalizePhone(val) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return;

    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length < 10) {
      return toast.error("Telefone inválido.");
    }

    setLoading(true);
    try {
      if (customer) {
        await customerService.updateCustomer(customer.id, {
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          notes: formData.notes.trim() || null,
        });
        toast.success("Cliente atualizado!");
      } else {
        // Prevent duplicate creation by phone
        if (phoneDigits) {
          const { data: existing } = await supabase
            .from("customers")
            .select("id")
            .eq("barbershop_id", shopId)
            .eq("phone", formData.phone.trim())
            .maybeSingle();

          if (existing) {
            setLoading(false);
            return toast.error("Já existe um cliente com este telefone nesta barbearia.");
          }
        }

        const { error } = await supabase.from("customers").insert({
          barbershop_id: shopId,
          full_name: formData.full_name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          notes: formData.notes.trim() || null,
          status: "active",
        });
        if (error) throw error;
        toast.success("Cliente cadastrado com sucesso!");
      }
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md w-full rounded-xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-xl">
            {customer ? "Editar Cliente" : "Cadastrar Cliente"}
          </DialogTitle>
          <DialogDescription>
            {customer
              ? "Atualize os dados de contato do cliente."
              : "Adicione um novo cliente à base da barbearia."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="c-name">
              Nome Completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="c-name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              placeholder="Ex: João Silva"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-phone">
              WhatsApp / Telefone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="c-phone"
              type="tel"
              value={formData.phone}
              onChange={handlePhoneChange}
              required
              placeholder="(11) 99999-9999"
              className="h-11"
              maxLength={15}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-email">
              E-mail <span className="text-muted-foreground font-normal">(Opcional)</span>
            </Label>
            <Input
              id="c-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@exemplo.com"
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="c-notes">
              Anotações Internas{" "}
              <span className="text-muted-foreground font-normal">(Opcional)</span>
            </Label>
            <Textarea
              id="c-notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Preferências, detalhes do cabelo, etc..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-border/40 mt-6">
            <Button
              type="button"
              variant="outline"
              className="h-11"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 bg-accent text-accent-foreground font-bold"
            >
              {loading ? "Salvando..." : "Salvar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
