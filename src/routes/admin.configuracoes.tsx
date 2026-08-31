// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { useOnboardingStatus } from "@/hooks/use-onboarding";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  ShieldAlert, 
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Info,
  Instagram
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/configuracoes")({ component: ConfigPage });

function ConfigPage() {
  const { shopId, shop: currentShopContext } = useCurrentShop();
  const qc = useQueryClient();
  const isOwner = currentShopContext?.role === "owner";

  // Existing onboarding hook to share logic for the read-only checklist
  const { data: onboarding } = useOnboardingStatus(shopId);

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
    slug: "",
    description: "",
    logo_url: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    neighborhood: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: ""
  });

  useEffect(() => {
    if (barbershop) {
      const contacts = barbershop.contacts as any || {};
      const addr = barbershop.address as any || {};
      const social = barbershop.social as any || {};

      setFormData({
        name: barbershop.name || "",
        slug: barbershop.slug || "",
        description: barbershop.description || "",
        logo_url: barbershop.logo_url || "",
        address: addr.street || "",
        city: addr.city || "",
        state: addr.state || "",
        zip: addr.zip || "",
        neighborhood: addr.neighborhood || "",
        phone: contacts.phone || "",
        whatsapp: contacts.whatsapp || "",
        email: contacts.email || "",
        website: contacts.website || "",
        instagram: social.instagram || ""
      });
    }
  }, [barbershop]);

  const updateMut = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Uniqueness check for slug
      if (data.slug !== barbershop?.slug) {
        const { data: existing, error: checkErr } = await supabase
          .from("barbershops")
          .select("id")
          .eq("slug", data.slug)
          .neq("id", shopId!)
          .maybeSingle();
        
        if (checkErr) throw checkErr;
        if (existing) {
          throw new Error("SLUG_EXISTS");
        }
      }

      const { error } = await supabase
        .from("barbershops")
        .update({
          name: data.name,
          slug: data.slug,
          description: data.description,
          logo_url: data.logo_url || null,
          contacts: {
            ...(barbershop?.contacts as any || {}),
            phone: data.phone,
            whatsapp: data.whatsapp,
            email: data.email,
            website: data.website
          },
          address: {
            ...(barbershop?.address as any || {}),
            street: data.address,
            city: data.city,
            state: data.state,
            zip: data.zip,
            neighborhood: data.neighborhood
          },
          social: {
            ...(barbershop?.social as any || {}),
            instagram: data.instagram
          }
        })
        .eq("id", shopId!);
        
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-config", shopId] });
      qc.invalidateQueries({ queryKey: ["onboarding-status", shopId] });
      toast.success("Informações da barbearia atualizadas.");
    },
    onError: (err: any) => {
      if (err.message === "SLUG_EXISTS") {
        toast.error("Este link (slug) já está em uso por outra barbearia.");
      } else {
        toast.error("Não foi possível salvar as alterações. Tente novamente.");
        if (import.meta.env.DEV) {
          console.error("Save error:", err);
        }
      }
    }
  });

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("O nome da barbearia é obrigatório.");
    
    // Normalize slug safely
    const normalizedSlug = formData.slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (!normalizedSlug) return toast.error("O link (slug) é inválido.");

    const payload = { ...formData, slug: normalizedSlug };
    setFormData(payload); // Update UI with normalized version
    updateMut.mutate(payload);
  };

  if (!shopId) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center max-w-md mx-auto h-[60vh]">
        <AlertTriangle className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-bold font-serif mb-2 text-foreground">Não encontramos uma barbearia vinculada Ã  sua conta.</h2>
        <p className="text-muted-foreground text-sm">Conclua o cadastro da unidade ou procure o responsável pela conta.</p>
      </div>
    );
  }

  const hasSlug = Boolean(barbershop?.slug);
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/b/${barbershop?.slug || formData.slug}` : `/b/${barbershop?.slug || formData.slug}`;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-background/50">
      <ScrollArea className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-8 pb-12">
          
          <header className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-accent">CONFIGURAÇÕES DA UNIDADE</p>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Perfil da barbearia</h1>
            <p className="text-sm text-muted-foreground">Mantenha as informações da sua unidade atualizadas para uma presença pública mais clara.</p>
          </header>

          {/* PRESENÇA PÚBLICA STATUS */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Presença pública</h2>
            <Card className="p-4 sm:p-5 bg-card border-border/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className={`mt-0.5 sm:mt-0 p-2 rounded-full shrink-0 ${hasSlug ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                  {hasSlug ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-bold text-sm">
                    {hasSlug ? "Perfil público disponível" : "Seu perfil público ainda precisa de um endereço."}
                  </p>
                  {hasSlug && (
                    <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-accent truncate max-w-[200px] sm:max-w-xs inline-block">
                      {publicUrl}
                    </a>
                  )}
                </div>
              </div>
              <div className="shrink-0">
                {hasSlug ? (
                  <Button asChild variant="outline" size="sm" className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider border-accent/40 text-accent hover:bg-accent/10">
                    <Link to={`/b/${barbershop.slug}`} target="_blank">Ver perfil público</Link>
                  </Button>
                ) : (
                  <Button size="sm" className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider" onClick={() => {
                    document.getElementById('slug-input')?.focus();
                  }}>
                    Completar perfil
                  </Button>
                )}
              </div>
            </Card>
          </section>

          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-r-transparent" />
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              
              {/* 1. IDENTIDADE DA BARBEARIA */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Store className="h-4 w-4" /> Identidade da barbearia
                </h2>
                <Card className="p-4 sm:p-6 bg-card border-border/40 shadow-sm space-y-6">
                  
                  <div className="space-y-2">
                    <Label htmlFor="name-input">Nome da barbearia <span className="text-destructive">*</span></Label>
                    <Input id="name-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="h-11" required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug-input">Endereço do perfil (Slug) <span className="text-destructive">*</span></Label>
                    <div className="flex rounded-md border border-input bg-transparent overflow-hidden h-11 focus-within:ring-1 focus-within:ring-ring">
                      <div className="flex items-center justify-center px-3 bg-muted/30 border-r border-input text-muted-foreground text-xs sm:text-sm font-mono shrink-0 select-none">
                        barbeos.com/b/
                      </div>
                      <input 
                        id="slug-input"
                        value={formData.slug} 
                        onChange={e => setFormData({ ...formData, slug: e.target.value })} 
                        className="flex-1 bg-transparent px-3 py-1 text-sm font-mono shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                        required 
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">Apenas letras, números e hifens. Ex: barbearia-do-ze</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea 
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      rows={3} 
                      className="resize-none" 
                      placeholder="Conte um pouco sobre sua barbearia para os clientes..." 
                    />
                    <p className="text-[11px] text-muted-foreground text-right">{formData.description.length} caracteres</p>
                  </div>

                  <div className="space-y-2">
                    <Label>URL da Logo (Opcional)</Label>
                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                      <div className="h-14 w-14 shrink-0 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center overflow-hidden">
                        {formData.logo_url ? <img src={formData.logo_url} alt="Logo preview" className="h-full w-full object-cover" /> : <ImageIcon className="h-6 w-6 text-muted-foreground/50" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <Input value={formData.logo_url} onChange={e => setFormData({ ...formData, logo_url: e.target.value })} placeholder="https://exemplo.com/logo.png" className="h-11" />
                        <p className="text-[11px] text-muted-foreground">Insira o link direto de uma imagem pública para usar como logo.</p>
                      </div>
                    </div>
                  </div>

                </Card>
              </section>

              {/* 2. LOCALIZAÇão E CONTATO */}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Localização e contato
                </h2>
                <Card className="p-4 sm:p-6 bg-card border-border/40 shadow-sm space-y-6">
                  
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">Endereço</h3>
                    <div className="space-y-2">
                      <Label>Rua e Número</Label>
                      <Input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="h-11" placeholder="Ex: Av. Paulista, 1000" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Input value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} className="h-11" />
                      </div>
                      <div className="space-y-2">
                        <Label>Estado (UF)</Label>
                        <Input value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })} maxLength={2} className="h-11" placeholder="SP" />
                      </div>
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        <Input value={formData.zip} onChange={e => setFormData({ ...formData, zip: e.target.value })} className="h-11" placeholder="00000-000" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-border/40">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground mb-2">Contato e Redes Sociais</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Phone className="h-3 w-3" /> Telefone Fixo</Label>
                        <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="h-11" placeholder="(00) 0000-0000" />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Phone className="h-3 w-3 text-emerald-500" /> WhatsApp</Label>
                        <Input value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="h-11" placeholder="(00) 90000-0000" />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Instagram className="h-3 w-3 text-pink-500" /> Instagram</Label>
                        <Input value={formData.instagram} onChange={e => setFormData({ ...formData, instagram: e.target.value })} className="h-11" placeholder="@suabarbearia" />
                      </div>
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Globe className="h-3 w-3 text-blue-500" /> Website</Label>
                        <Input value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} className="h-11" placeholder="https://..." type="url" />
                      </div>
                    </div>
                  </div>

                </Card>
              </section>

              {/* SAVE BUTTON */}
              <div>
                <Button type="submit" className="w-full sm:w-auto h-11 bg-accent text-accent-foreground font-bold px-8 text-xs uppercase tracking-wider" disabled={updateMut.isPending}>
                  {updateMut.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </form>
          )}

          {/* 3. PERFIL VISÍVEL PARA CLIENTES */}
          {!isLoading && barbershop && (
            <section className="space-y-4 pt-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Perfil visível para clientes</h2>
              <Card className="p-4 sm:p-6 bg-muted/10 border-border/40 shadow-sm space-y-4">
                <p className="text-sm text-muted-foreground mb-4">Seu perfil público exibe as seguintes informações quando configuradas:</p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`h-4 w-4 ${barbershop.name ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span className={barbershop.name ? "text-foreground" : "text-muted-foreground"}>Nome da barbearia</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`h-4 w-4 ${formData.address || formData.city ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span className={formData.address || formData.city ? "text-foreground" : "text-muted-foreground"}>Endereço ou localização</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`h-4 w-4 ${onboarding?.isServicesComplete ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span className={onboarding?.isServicesComplete ? "text-foreground" : "text-muted-foreground"}>Serviços cadastrados</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`h-4 w-4 ${onboarding?.isProsComplete ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span className={onboarding?.isProsComplete ? "text-foreground" : "text-muted-foreground"}>Profissionais cadastrados</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className={`h-4 w-4 ${barbershop.description ? "text-emerald-500" : "text-muted-foreground/30"}`} />
                    <span className={barbershop.description ? "text-foreground" : "text-muted-foreground"}>Descrição</span>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t border-border/40">
                  <Button asChild variant="link" className="px-0 text-xs font-bold uppercase tracking-wider text-accent h-auto">
                    <Link to="/admin/onboarding">Ver primeiros passos <ArrowRight className="ml-1 h-3 w-3" /></Link>
                  </Button>
                </div>
              </Card>
            </section>
          )}

            {/* 4. HORÃRIOS DE FUNCIONAMENTO (EM BREVE) */}
            {!isLoading && barbershop && (
              <section className="space-y-4 pt-8">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Horários de funcionamento
                </h2>
                <Card className="p-6 bg-muted/10 border-dashed border-border/40 rounded-xl text-center flex flex-col items-center">
                  <Clock className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <h3 className="font-bold text-foreground">Horários de funcionamento em preparação</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-2 max-w-sm">Esta configuração estará disponível em breve. Enquanto isso, mantenha os serviços e a equipe atualizados.</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-1.5 rounded-md mt-2">
                    <Info className="h-3 w-3 shrink-0" />
                    <span>Esses horários representam o funcionamento da unidade e não alteram automaticamente os horários disponíveis para agendamento.</span>
                  </div>
                </Card>
              </section>
            )}

            {/* 5. DANGER ZONE */}
          {isOwner && !isLoading && barbershop && (
            <section className="space-y-4 pt-12 border-t border-border/20">
              <h2 className="text-sm font-bold uppercase tracking-wider text-destructive flex items-center gap-2">
                <ShieldAlert className="h-4 w-4" /> Zona de Perigo
              </h2>
              <Card className="p-4 sm:p-6 bg-destructive/5 border-destructive/20 rounded-xl shadow-sm">
                <h3 className="font-bold text-destructive">Visibilidade</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Ao desativar, sua barbearia deixará de aparecer para clientes e bloqueará novos agendamentos. Você poderá reativá-la solicitando ao suporte. Nenhum dado será excluído permanentemente nesta ação.
                </p>
                <Button variant="outline" className="w-full sm:w-auto text-xs font-bold uppercase tracking-wider border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => {
                  const check = prompt(`Digite "${barbershop.name}" para confirmar a desativação:`);
                  if (check === barbershop.name) deactivateMut.mutate();
                  else if (check !== null) toast.error("Nome incorreto. Ação cancelada.");
                }} disabled={deactivateMut.isPending}>
                  {deactivateMut.isPending ? "Desativando..." : "Desativar Operação"}
                </Button>
              </Card>
            </section>
          )}

        </div>
      </ScrollArea>
    </div>
  );
}



