import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Settings, Image as ImageIcon, MapPin, Phone, Mail, Globe, Clock, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes")({ component: ConfigPage });

function ConfigPage() {
  const { shopId, shop } = useCurrentShop();
  const qc = useQueryClient();
  const isOwner = shop?.role === "owner";

  const { data: barbershop, isLoading } = useQuery({
    queryKey: ["admin-config", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase.from("barbershops").select("*").eq("id", shopId!).single();
      if (error) throw error;
      return data;
    }
  });

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    logo_url: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    slug: "",
    slot_interval: "30",
    min_advance: "0",
    max_advance: "30",
    auto_confirm: false,
    cancellation_policy: ""
  });

  useEffect(() => {
    if (barbershop) {
      const contacts = barbershop.contacts as any || {};
      const addr = barbershop.address as any || {};
      const setts = barbershop.settings as any || {};
      const booking = setts.booking_config || {};

      setFormData({
        name: barbershop.name || "",
        description: barbershop.description || "",
        phone: contacts.phone || "",
        email: contacts.email || "",
        logo_url: barbershop.logo_url || "",
        address: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        zip: addr.zip || "",
        slug: barbershop.slug || "",
        slot_interval: booking.slot_interval ? String(booking.slot_interval) : "30",
        min_advance: booking.min_advance_hours ? String(booking.min_advance_hours) : "0",
        max_advance: booking.max_advance_days ? String(booking.max_advance_days) : "30",
        auto_confirm: booking.auto_confirm === true,
        cancellation_policy: booking.cancellation_policy || ""
      });
    }
  }, [barbershop]);

  const updateMut = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("barbershops")
        .update({
          name: data.name,
          description: data.description,
          logo_url: data.logo_url || null,
          slug: data.slug,
          contacts: { phone: data.phone, email: data.email },
          address: { street: data.address, city: data.city, state: data.state, zip: data.zip },
          settings: {
            ...(barbershop?.settings as any || {}),
            booking_config: {
              slot_interval: parseInt(data.slot_interval, 10),
              min_advance_hours: parseInt(data.min_advance, 10),
              max_advance_days: parseInt(data.max_advance, 10),
              auto_confirm: data.auto_confirm,
              cancellation_policy: data.cancellation_policy
            }
          }
        })
        .eq("id", shopId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Configurações atualizadas!");
      qc.invalidateQueries({ queryKey: ["admin-config", shopId] });
      qc.invalidateQueries({ queryKey: ["current-shop", shopId] });
    },
    onError: (err: any) => toast.error(err.message || "Erro ao salvar configurações.")
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("O nome da barbearia é obrigatório.");
    if (!formData.slug.trim().match(/^[a-z0-9-]+$/)) return toast.error("O link (slug) deve conter apenas letras minúsculas, números e hífens.");
    updateMut.mutate(formData);
  };

  const deactivateMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("barbershops").update({ active: false }).eq("id", shopId!);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Barbearia desativada com sucesso.");
      window.location.href = "/";
    }
  });

  if (!shopId) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-background">
      
      {/* HEADER */}
      <div className="flex flex-col border-b border-border/40 p-4 sm:p-5 bg-card/40 backdrop-blur-md shrink-0">
        <h1 className="font-serif text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-accent" /> Configurações
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Gerencie os detalhes públicos e regras da barbearia</p>
      </div>

      <ScrollArea className="flex-1 bg-background/50">
        <div className="mx-auto max-w-3xl p-4 sm:p-6 pb-24 space-y-8">
          
          {isLoading ? (
            <div className="space-y-4">
              <Card className="h-48 animate-pulse rounded-xl border border-border/40 bg-muted/30" />
              <Card className="h-48 animate-pulse rounded-xl border border-border/40 bg-muted/30" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              
              {/* GERAL */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Globe className="h-4 w-4" /> Informações Gerais
                </h2>
                <Card className="p-4 sm:p-6 bg-card border-border/40 rounded-xl space-y-4">
                  <div className="space-y-2">
                    <Label>Nome da Barbearia <span className="text-destructive">*</span></Label>
                    <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="h-11" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Telefone / WhatsApp</Label>
                      <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail Público</Label>
                      <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="contato@exemplo.com" className="h-11" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição / Bio</Label>
                    <Textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="resize-none" placeholder="Conte sobre sua barbearia..." />
                  </div>

                  <div className="space-y-2">
                    <Label>URL da Logo (Opcional)</Label>
                    <div className="flex gap-3 items-center">
                      <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center overflow-hidden">
                        {formData.logo_url ? <img src={formData.logo_url} alt="Logo preview" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <Input value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://exemplo.com/logo.png" className="h-11 flex-1" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Link Público (Slug)</Label>
                    <Input value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase() })} className="h-11 font-mono text-sm" />
                    <p className="text-[10px] text-muted-foreground mt-1 text-amber-500 font-semibold">Aviso: Mudar o link quebra QR Codes e links antigos compartilhados.</p>
                  </div>
                </Card>
              </section>

              {/* ADDRESS */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Endereço Local
                </h2>
                <Card className="p-4 sm:p-6 bg-card border-border/40 rounded-xl space-y-4">
                  <div className="space-y-2">
                    <Label>Rua e Número</Label>
                    <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-11" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Estado (UF)</Label>
                      <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} maxLength={2} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>CEP</Label>
                      <Input value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} className="h-11" />
                    </div>
                  </div>
                </Card>
              </section>

              {/* BOOKING SETTINGS */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Configuração de Agendamento
                </h2>
                <Card className="p-4 sm:p-6 bg-card border-border/40 rounded-xl space-y-4">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Intervalo de Horários (Min)</Label>
                      <Input type="number" step="5" min="10" value={formData.slot_interval} onChange={e => setFormData({ ...formData, slot_interval: e.target.value })} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Antecedência Mínima (Horas)</Label>
                      <Input type="number" min="0" value={formData.min_advance} onChange={e => setFormData({ ...formData, min_advance: e.target.value })} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label>Antecedência Máx. (Dias)</Label>
                      <Input type="number" min="1" value={formData.max_advance} onChange={e => setFormData({ ...formData, max_advance: e.target.value })} className="h-11" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border border-border/40 rounded-lg mt-2">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Confirmação Automática</Label>
                      <p className="text-xs text-muted-foreground">Aprovar novos agendamentos online automaticamente</p>
                    </div>
                    <Switch checked={formData.auto_confirm} onCheckedChange={c => setFormData({ ...formData, auto_confirm: c })} />
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label>Política de Cancelamento</Label>
                    <Textarea value={formData.cancellation_policy} onChange={e => setFormData({ ...formData, cancellation_policy: e.target.value })} rows={2} className="resize-none" placeholder="Ex: Cancelamentos apenas com 2 horas de antecedência..." />
                  </div>
                </Card>
              </section>

              {/* OPENING HOURS FALLBACK */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Horários de Funcionamento
                </h2>
                <div className="p-6 bg-muted/20 border border-dashed border-border/40 rounded-xl text-center flex flex-col items-center">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-foreground font-semibold">Configuração de grade de horários flexível será disponibilizada em breve.</p>
                  <p className="text-xs text-muted-foreground mt-1">Sua agenda continua operando conforme os horários individuais dos profissionais.</p>
                </div>
              </section>

              <div className="pt-2">
                <Button type="submit" className="w-full sm:w-auto h-11 bg-accent text-accent-foreground font-bold px-8" disabled={updateMut.isPending}>
                  {updateMut.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </form>
          )}

          {/* DANGER ZONE */}
          {isOwner && !isLoading && barbershop && (
            <section className="space-y-4 pt-12 border-t border-border/20">
              <h2 className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Zona de Perigo
              </h2>
              <Card className="p-4 sm:p-6 bg-destructive/5 border-destructive/20 rounded-xl">
                <h3 className="font-bold text-destructive">Desativar Barbearia</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Ao desativar, sua barbearia deixará de aparecer para clientes e bloqueará novos agendamentos. Você poderá reativá-la solicitando ao suporte. Nenhum dado será excluído permanentemente nesta ação.
                </p>
                <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => {
                  const check = prompt(`Digite "${barbershop.name}" para confirmar a desativação:`);
                  if (check === barbershop.name) deactivateMut.mutate();
                  else if (check !== null) toast.error("Nome incorreto. Ação cancelada.");
                }}>
                  Desativar Operação
                </Button>
              </Card>
            </section>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
