import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/configuracoes")({ component: Page });

function Page() {
  const shopId = useCurrentShopId();
  const { data, refetch } = useQuery({
    queryKey: ["shop-cfg", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("barbershops").select("*").eq("id", shopId).single()).data,
  });
  const [f, setF] = useState({ name:"", description:"", phone:"", whatsapp:"", street:"", city:"", state:"" });
  const [policy, setPolicy] = useState({ min_lead_hours: "", cancel_lead_hours: "", max_no_shows: "", no_show_fee: "" });

  useEffect(() => {
    if (!data) return;
    const a = data.address as any || {}; const c = data.contacts as any || {};
    const p = (data.settings as any)?.policy ?? {};
    setF({
      name: data.name, description: data.description ?? "",
      phone: c.phone ?? "", whatsapp: c.whatsapp ?? "",
      street: a.street ?? "", city: a.city ?? "", state: a.state ?? "",
    });
    setPolicy({
      min_lead_hours: p.min_lead_hours != null ? String(p.min_lead_hours) : "",
      cancel_lead_hours: p.cancel_lead_hours != null ? String(p.cancel_lead_hours) : "",
      max_no_shows: p.max_no_shows != null ? String(p.max_no_shows) : "",
      no_show_fee: p.no_show_fee != null ? String(p.no_show_fee) : "",
    });
  }, [data]);

  async function save() {
    const { error } = await supabase.from("barbershops").update({
      name: f.name, description: f.description,
      contacts: { phone: f.phone, whatsapp: f.whatsapp },
      address: { street: f.street, city: f.city, state: f.state },
    }).eq("id", shopId);
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  }

  async function savePolicy() {
    const merged = { ...(data?.settings as any ?? {}), policy: {
      min_lead_hours: policy.min_lead_hours ? Number(policy.min_lead_hours) : 0,
      cancel_lead_hours: policy.cancel_lead_hours ? Number(policy.cancel_lead_hours) : 0,
      max_no_shows: policy.max_no_shows ? Number(policy.max_no_shows) : 0,
      no_show_fee: policy.no_show_fee ? Number(policy.no_show_fee) : 0,
    } };
    const { error } = await supabase.from("barbershops").update({ settings: merged }).eq("id", shopId);
    if (error) return toast.error(error.message);
    toast.success("Política salva");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Dados da sua barbearia e regras de atendimento.</p>
      </div>
      <Card className="space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold">Identidade</h2>
        <div><Label>Nome</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
        <div><Label>Descrição</Label><Textarea value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Telefone</Label><Input value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/></div>
          <div><Label>WhatsApp</Label><Input value={f.whatsapp} onChange={e=>setF({...f,whatsapp:e.target.value})}/></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2"><Label>Endereço</Label><Input value={f.street} onChange={e=>setF({...f,street:e.target.value})}/></div>
          <div><Label>Cidade</Label><Input value={f.city} onChange={e=>setF({...f,city:e.target.value})}/></div>
        </div>
        <Button onClick={save}>Salvar</Button>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="font-display text-lg font-semibold">Política anti no-show</h2>
          <p className="text-sm text-muted-foreground">Defina regras para reduzir faltas e cancelamentos de última hora. Use 0 para desativar.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Antecedência mínima para agendar (h)</Label>
            <Input type="number" min={0} value={policy.min_lead_hours} onChange={e=>setPolicy({...policy, min_lead_hours: e.target.value})} placeholder="Ex.: 2"/>
            <p className="mt-1 text-xs text-muted-foreground">Bloqueia agendamentos abaixo desse limite.</p>
          </div>
          <div>
            <Label>Antecedência mínima para cancelar (h)</Label>
            <Input type="number" min={0} value={policy.cancel_lead_hours} onChange={e=>setPolicy({...policy, cancel_lead_hours: e.target.value})} placeholder="Ex.: 4"/>
            <p className="mt-1 text-xs text-muted-foreground">Cancelamentos abaixo disso contam como falta.</p>
          </div>
          <div>
            <Label>Faltas para bloquear cliente</Label>
            <Input type="number" min={0} value={policy.max_no_shows} onChange={e=>setPolicy({...policy, max_no_shows: e.target.value})} placeholder="Ex.: 3"/>
            <p className="mt-1 text-xs text-muted-foreground">Bloqueia novos agendamentos ao atingir esse total.</p>
          </div>
          <div>
            <Label>Taxa por falta (R$)</Label>
            <Input type="number" min={0} step="0.01" value={policy.no_show_fee} onChange={e=>setPolicy({...policy, no_show_fee: e.target.value})} placeholder="Ex.: 20"/>
            <p className="mt-1 text-xs text-muted-foreground">Lançada no caixa quando a falta é registrada.</p>
          </div>
        </div>
        <Button onClick={savePolicy}>Salvar política</Button>
      </Card>
    </div>
  );
}
