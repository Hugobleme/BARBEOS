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
import { CardGridSkeleton, EmptyState } from "@/components/site/LoadingState";
import { brl, minutes } from "@/lib/format";
import { Plus, Pencil, Scissors } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/servicos")({ component: Page });

function Page() {
  const shopId = useCurrentShopId();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-services", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("services").select("*").eq("barbershop_id", shopId).order("sort")).data ?? [],
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

      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Nenhum serviço cadastrado"
          description="Crie seu primeiro serviço para começar a receber agendamentos."
          action={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4"/>Novo serviço</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(s => (
            <Card key={s.id} className="group relative flex flex-col gap-4 border-none bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md transition-all hover:bg-card/80">
              <div className="flex items-start justify-between">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent transition-transform group-hover:scale-110">
                  <Scissors className="h-6 w-6"/>
                </div>
                {!s.active && <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold uppercase">Inativo</Badge>}
              </div>
              <div className="flex-1 space-y-1">
                <div className="font-display text-xl font-bold tracking-tight text-foreground">{s.name}</div>
                {s.description && <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{s.description}</p>}
              </div>
              <div className="flex items-center justify-between border-t border-border/20 pt-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Duração</span>
                  <span className="text-sm font-bold text-foreground">{minutes(s.duration_min)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Preço</span>
                  <div className="font-display text-lg font-black text-accent">{brl(Number(s.price))}</div>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={()=>openEdit(s)} className="h-10 rounded-xl font-bold border-border/40 bg-background/40 hover:bg-accent/10 hover:text-accent">
                <Pencil className="mr-2 h-4 w-4"/>
                Editar serviço
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
