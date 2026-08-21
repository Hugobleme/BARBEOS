import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { barbershopService } from "@/services/barbershop.service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeaderSkeleton, CardGridSkeleton } from "@/components/site/LoadingState";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  ShieldAlert,
  Save,
  Trash2,
  PowerOff,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações da Barbearia — BarberOS" }] }),
  component: ConfiguracoesPage,
});

export function ConfiguracoesPage() {
  const navigate = useNavigate();
  const { shopId, shop } = useCurrentShop();
  const isOwner = shop?.role === "owner";
  const canManage = isOwner || shop?.role === "admin";

  const { data: barbershop, isLoading, refetch } = useQuery({
    queryKey: ["shop-settings-detail", shopId],
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase.from("barbershops").select("*").eq("id", shopId!).single();
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    email: "",
    phone: "",
    whatsapp: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zip_code: "",
    hours_weekdays: "09:00 - 20:00",
    hours_saturday: "08:00 - 19:00",
    hours_sunday: "Fechado",
  });

  const [policy, setPolicy] = useState({
    min_lead_hours: "1",
    cancel_lead_hours: "2",
    max_no_shows: "3",
    no_show_fee: "0",
  });

  const [saving, setSaving] = useState(false);
  const [dangerBusy, setDangerBusy] = useState(false);

  useEffect(() => {
    if (!barbershop) return;

    const addr = (barbershop.address as any) || {};
    const contacts = (barbershop.contacts as any) || {};
    const settings = (barbershop.settings as any) || {};
    const pol = settings.policy || {};
    const hours = settings.opening_hours || {};

    setForm({
      name: barbershop.name || "",
      description: barbershop.description || "",
      logo_url: barbershop.logo_url || "",
      email: contacts.email || "",
      phone: contacts.phone || "",
      whatsapp: contacts.whatsapp || "",
      street: addr.street || "",
      number: addr.number || "",
      neighborhood: addr.neighborhood || addr.district || "",
      city: addr.city || "",
      state: addr.state || "",
      zip_code: addr.zip_code || addr.postal_code || "",
      hours_weekdays: hours.weekdays || "09:00 - 20:00",
      hours_saturday: hours.saturday || "08:00 - 19:00",
      hours_sunday: hours.sunday || "Fechado",
    });

    setPolicy({
      min_lead_hours: pol.min_lead_hours != null ? String(pol.min_lead_hours) : "1",
      cancel_lead_hours: pol.cancel_lead_hours != null ? String(pol.cancel_lead_hours) : "2",
      max_no_shows: pol.max_no_shows != null ? String(pol.max_no_shows) : "3",
      no_show_fee: pol.no_show_fee != null ? String(pol.no_show_fee) : "0",
    });
  }, [barbershop]);

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return toast.error("Permissão insuficiente para alterar configurações.");
    if (!form.name.trim()) return toast.error("O nome da barbearia é obrigatório.");

    setSaving(true);
    try {
      const mergedSettings = {
        ...((barbershop?.settings as any) || {}),
        opening_hours: {
          weekdays: form.hours_weekdays,
          saturday: form.hours_saturday,
          sunday: form.hours_sunday,
        },
        policy: {
          min_lead_hours: Number(policy.min_lead_hours) || 0,
          cancel_lead_hours: Number(policy.cancel_lead_hours) || 0,
          max_no_shows: Number(policy.max_no_shows) || 0,
          no_show_fee: Number(policy.no_show_fee) || 0,
        },
      };

      await barbershopService.updateBarbershop(shopId!, {
        name: form.name.trim(),
        description: form.description.trim() || null,
        logo_url: form.logo_url.trim() || null,
        contacts: {
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          whatsapp: form.whatsapp.trim() || null,
        } as any,
        address: {
          street: form.street.trim() || null,
          number: form.number.trim() || null,
          neighborhood: form.neighborhood.trim() || null,
          city: form.city.trim() || null,
          state: form.state.trim().toUpperCase() || null,
          zip_code: form.zip_code.trim() || null,
        } as any,
        settings: mergedSettings,
      });

      toast.success("Configurações da barbearia salvas com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar configurações.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivateBarbershop() {
    if (!isOwner) return toast.error("Apenas o proprietário (dono) pode desativar a barbearia.");
    if (!confirm("Tem certeza que deseja desativar esta barbearia? Clientes não poderão agendar horários.")) return;

    setDangerBusy(true);
    try {
      await barbershopService.deleteBarbershop(shopId!);
      toast.success("Barbearia desativada.");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao desativar barbearia.");
    } finally {
      setDangerBusy(false);
    }
  }

  async function handleDeleteBarbershop() {
    if (!isOwner) return toast.error("Apenas o proprietário pode excluir permanentemente a barbearia.");
    const confirmName = prompt(`Digite "${barbershop?.name}" para confirmar a exclusão PERMANENTE:`);
    if (confirmName !== barbershop?.name) {
      return toast.error("Confirmação incorreta. Operação cancelada.");
    }

    setDangerBusy(true);
    try {
      const { error } = await supabase.from("barbershops").delete().eq("id", shopId!);
      if (error) throw error;
      toast.success("Barbearia excluída permanentemente.");
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir barbearia.");
    } finally {
      setDangerBusy(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <CardGridSkeleton count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Topo */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Configurações da Barbearia</h1>
          <p className="text-muted-foreground">
            Altere os dados comerciais, localização, horários de funcionamento e regras de agendamento.
          </p>
        </div>

        {!canManage && (
          <Badge variant="outline" className="rounded-none text-muted-foreground">
            <ShieldAlert className="mr-1.5 h-3.5 w-3.5" /> Modo Somente Leitura
          </Badge>
        )}
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Bloco 1: Informações Gerais & Identidade */}
        <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
          <div className="mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
            <Building2 className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl font-bold">Identidade & Dados Comerciais</h2>
          </div>

          <div className="grid gap-4 text-xs">
            <div className="space-y-1.5">
              <Label htmlFor="shop_name">Nome da Barbearia *</Label>
              <Input
                id="shop_name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex.: Barbearia Dom Corleone"
                className="rounded-none"
                disabled={!canManage}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shop_desc">Descrição / Apresentação</Label>
              <Textarea
                id="shop_desc"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Apresente sua barbearia para seus clientes..."
                className="rounded-none resize-none"
                rows={3}
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shop_logo">URL do Logotipo / Imagem de Capa</Label>
              <Input
                id="shop_logo"
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://exemplo.com/foto-barbearia.jpg"
                className="rounded-none"
                disabled={!canManage}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="shop_phone">Telefone Fixo</Label>
                <Input
                  id="shop_phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(11) 3333-0000"
                  className="rounded-none"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop_wpp">WhatsApp</Label>
                <Input
                  id="shop_wpp"
                  value={form.whatsapp}
                  onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                  placeholder="(11) 99999-0000"
                  className="rounded-none"
                  disabled={!canManage}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop_email">E-mail Comercial</Label>
                <Input
                  id="shop_email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="contato@barbearia.com"
                  className="rounded-none"
                  disabled={!canManage}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Bloco 2: Localização & Endereço */}
        <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
          <div className="mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
            <MapPin className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl font-bold">Endereço & Localização</h2>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-6">
            <div className="space-y-1.5 sm:col-span-4">
              <Label htmlFor="addr_street">Rua / Logradouro</Label>
              <Input
                id="addr_street"
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="Ex.: Rua Oscar Freire"
                className="rounded-none"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addr_num">Número</Label>
              <Input
                id="addr_num"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
                placeholder="1000"
                className="rounded-none"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addr_neigh">Bairro</Label>
              <Input
                id="addr_neigh"
                value={form.neighborhood}
                onChange={(e) => setForm({ ...form, neighborhood: e.target.value })}
                placeholder="Jardins"
                className="rounded-none"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="addr_city">Cidade</Label>
              <Input
                id="addr_city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="São Paulo"
                className="rounded-none"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="addr_state">Estado (UF)</Label>
              <Input
                id="addr_state"
                maxLength={2}
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value.toUpperCase() })}
                placeholder="SP"
                className="rounded-none uppercase font-mono"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="addr_zip">CEP</Label>
              <Input
                id="addr_zip"
                value={form.zip_code}
                onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                placeholder="01426-001"
                className="rounded-none font-mono"
                disabled={!canManage}
              />
            </div>
          </div>
        </Card>

        {/* Bloco 3: Horários de Funcionamento */}
        <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
          <div className="mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
            <Clock className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl font-bold">Horário de Atendimento</h2>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="h_weekdays">Segunda a Sexta</Label>
              <Input
                id="h_weekdays"
                value={form.hours_weekdays}
                onChange={(e) => setForm({ ...form, hours_weekdays: e.target.value })}
                placeholder="09:00 - 20:00"
                className="rounded-none font-mono"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="h_sat">Sábado</Label>
              <Input
                id="h_sat"
                value={form.hours_saturday}
                onChange={(e) => setForm({ ...form, hours_saturday: e.target.value })}
                placeholder="08:00 - 19:00"
                className="rounded-none font-mono"
                disabled={!canManage}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="h_sun">Domingo</Label>
              <Input
                id="h_sun"
                value={form.hours_sunday}
                onChange={(e) => setForm({ ...form, hours_sunday: e.target.value })}
                placeholder="Fechado"
                className="rounded-none font-mono"
                disabled={!canManage}
              />
            </div>
          </div>
        </Card>

        {/* Bloco 4: Políticas Anti No-Show */}
        <Card className="rounded-none border border-border bg-card/40 p-6 backdrop-blur-md">
          <div className="mb-6 flex items-center gap-2 border-b border-border/40 pb-3">
            <ShieldAlert className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl font-bold">Políticas de Agendamento & Cancelamento</h2>
          </div>

          <div className="grid gap-4 text-xs sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="pol_min_lead">Antecedência Mínima para Agendamento (horas)</Label>
              <Input
                id="pol_min_lead"
                type="number"
                min="0"
                value={policy.min_lead_hours}
                onChange={(e) => setPolicy({ ...policy, min_lead_hours: e.target.value })}
                placeholder="1"
                className="rounded-none"
                disabled={!canManage}
              />
              <p className="text-[10px] text-muted-foreground">Evita agendamentos de última hora sem preparação.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pol_cancel_lead">Antecedência Mínima para Cancelamento (horas)</Label>
              <Input
                id="pol_cancel_lead"
                type="number"
                min="0"
                value={policy.cancel_lead_hours}
                onChange={(e) => setPolicy({ ...policy, cancel_lead_hours: e.target.value })}
                placeholder="2"
                className="rounded-none"
                disabled={!canManage}
              />
              <p className="text-[10px] text-muted-foreground">Tempo limite para o cliente cancelar sem penalidade.</p>
            </div>
          </div>
        </Card>

        {/* Botão Salvar */}
        {canManage && (
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={saving}
              className="rounded-none bg-accent px-8 text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
            >
              <Save className="mr-1.5 h-3.5 w-3.5" /> {saving ? "Salvando..." : "Salvar Todas as Configurações"}
            </Button>
          </div>
        )}
      </form>

      {/* Bloco 5: Zona de Perigo */}
      {isOwner && (
        <Card className="rounded-none border border-destructive/40 bg-destructive/5 p-6 backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2 border-b border-destructive/20 pb-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="font-serif text-xl font-bold">Zona de Perigo (Ações Críticas)</h2>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Estas ações afetam a visibilidade pública da barbearia e seus registros. Apenas o proprietário pode realizá-las.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Button
              type="button"
              variant="outline"
              disabled={dangerBusy}
              onClick={handleDeactivateBarbershop}
              className="rounded-none border-destructive/60 text-destructive text-xs uppercase font-bold hover:bg-destructive hover:text-destructive-foreground"
            >
              <PowerOff className="mr-1.5 h-3.5 w-3.5" /> Desativar Barbearia
            </Button>

            <Button
              type="button"
              variant="destructive"
              disabled={dangerBusy}
              onClick={handleDeleteBarbershop}
              className="rounded-none text-xs uppercase font-bold"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Excluir Permanentemente
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
