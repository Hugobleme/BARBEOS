import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { brl, minutes } from "@/lib/format";
import { Plus, Pencil, Scissors } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/servicos")({ component: Page });

function Page() {
  const shopId = useCurrentShopId();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-services", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("services").select("*").eq("barbershop_id").order("sort")).data ?? [],
  });

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [f, setF] = useState({ name:"", description:"", duration_min:30, price:0, active:true });

  function openNew() { setEdit(null); setF({name:"",description:"",duration_min:30,price:0,active:true}); setOpen(true); }
  function openEdit(s:any) { setEdit(s); setF({ name:s.name, description:s.description ?? "", duration_min:s.duration_min, price:Number(s.price), active:s.active }); setOpen(true); }

  async function save() {
    const payload = { ...f, barbershop_id: shopId };
    const op = edit ? supabase.from("services").update(payload).eq("id", edit.id) : supabase.from("services").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(edit ? "Serviço atualizado" : "Serviço criado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-services", shopId] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Catálogo oferecido pela barbearia.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-1 h-4 w-4"/>Novo serviço</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit?"Editar":"Novo"} serviço</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={f.name} onChange={e=>setF({...f,name:e.target.value})}/></div>
              <div><Label>Descrição</Label><Input value={f.description} onChange={e=>setF({...f,description:e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Duração (min)</Label><Input type="number" value={f.duration_min} onChange={e=>setF({...f,duration_min:Number(e.target.value)})}/></div>
                <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={f.price} onChange={e=>setF({...f,price:Number(e.target.value)})}/></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><Switch checked={f.active} onCheckedChange={v=>setF({...f,active:v})}/>Ativo</label>
              <Button className="w-full" onClick={save}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map(s => (
          <Card key={s.id} className="flex flex-col gap-3 p-5">
            <div className="flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-accent"><Scissors className="h-5 w-5"/></div>
              {!s.active && <Badge variant="secondary">Inativo</Badge>}
            </div>
            <div>
              <div className="font-display text-lg font-semibold">{s.name}</div>
              <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{minutes(s.duration_min)}</span>
              <span className="text-lg font-semibold">{brl(Number(s.price))}</span>
            </div>
            <Button size="sm" variant="outline" onClick={()=>openEdit(s)}><Pencil className="mr-1 h-3.5 w-3.5"/>Editar</Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
