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
  const { data } = useQuery({
    queryKey: ["shop-cfg", shopId], enabled: !!shopId,,
    queryFn: async () => (await supabase.from("barbershops").select("*").eq("id").single()).data,
  });
  const [f, setF] = useState({ name:"", description:"", phone:"", whatsapp:"", street:"", city:"", state:"" });
  useEffect(() => {
    if (!data) return;
    const a = data.address as any || {}; const c = data.contacts as any || {};
    setF({
      name: data.name, description: data.description ?? "",
      phone: c.phone ?? "", whatsapp: c.whatsapp ?? "",
      street: a.street ?? "", city: a.city ?? "", state: a.state ?? "",
    });
  }, [data]);

  async function save() {
    const { error } = await supabase.from("barbershops").update({
      name: f.name, description: f.description,
      contacts: { phone: f.phone, whatsapp: f.whatsapp },
      address: { street: f.street, city: f.city, state: f.state },
    }).eq("id");
    if (error) return toast.error(error.message);
    toast.success("Configurações salvas");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Dados da sua barbearia.</p>
      </div>
      <Card className="space-y-4 p-6">
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
    </div>
  );
}
