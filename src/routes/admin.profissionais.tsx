import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CardGridSkeleton, EmptyState } from "@/components/site/LoadingState";
import { Plus, Pencil, UserCog } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/profissionais")({ component: Page });

function slugify(s: string) { return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""); }

function Page() {
  const shopId = useCurrentShopId();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pros", shopId], enabled: !!shopId,
    queryFn: async () => (await supabase.from("professionals").select("*").eq("barbershop_id", shopId).order("display_name")).data ?? [],
  });
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [f, setF] = useState({ display_name:"", bio:"", specialties:"", active:true });

  function openNew() { setEdit(null); setF({display_name:"",bio:"",specialties:"",active:true}); setOpen(true); }
  function openEdit(p:any) { setEdit(p); setF({display_name:p.display_name, bio:p.bio??"", specialties:(p.specialties??[]).join(", "), active:p.active}); setOpen(true); }

  async function save() {
    const payload: any = {
      display_name: f.display_name, bio: f.bio, active: f.active,
      specialties: f.specialties.split(",").map(s=>s.trim()).filter(Boolean),
      barbershop_id: shopId, slug: slugify(f.display_name) || crypto.randomUUID().slice(0,8),
    };
    const op = edit ? supabase.from("professionals").update(payload).eq("id", edit.id) : supabase.from("professionals").insert(payload);
    const { error } = await op;
    if (error) return toast.error(error.message);
    toast.success(edit?"Atualizado":"Criado");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin-pros", shopId] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Profissionais</h1>
          <p className="text-muted-foreground">Equipe da barbearia.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="mr-1 h-4 w-4"/>Novo profissional</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{edit?"Editar":"Novo"} profissional</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={f.display_name} onChange={e=>setF({...f,display_name:e.target.value})}/></div>
              <div><Label>Bio</Label><Input value={f.bio} onChange={e=>setF({...f,bio:e.target.value})}/></div>
              <div><Label>Especialidades (separadas por vírgula)</Label><Input value={f.specialties} onChange={e=>setF({...f,specialties:e.target.value})}/></div>
              <Button className="w-full" onClick={save}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <CardGridSkeleton count={3} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Nenhum profissional cadastrado"
          description="Adicione barbeiros para que eles apareçam no agendamento online."
          action={<Button onClick={openNew}><Plus className="mr-1 h-4 w-4"/>Novo profissional</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(p => (
            <Card key={p.id} className="group relative flex flex-col gap-5 border-none bg-card/50 p-6 shadow-xl shadow-black/5 backdrop-blur-md transition-all hover:bg-card/80">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 rounded-2xl border-2 border-accent/20">
                  <AvatarFallback className="bg-accent/10 font-display text-lg font-bold text-accent">
                    {p.display_name.split(" ").map(n=>n[0]).slice(0,2).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg font-bold tracking-tight text-foreground truncate">{p.display_name}</div>
                  {!p.active && <Badge variant="secondary" className="bg-muted/50 text-[10px] font-bold uppercase mt-1">Inativo</Badge>}
                </div>
              </div>
              
              <div className="flex-1 space-y-4">
                {p.bio && <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{p.bio}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {p.specialties?.map(s => (
                    <Badge key={s} variant="outline" className="bg-muted/30 border-border/40 text-[10px] font-bold uppercase tracking-tight text-foreground/70">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button size="sm" variant="outline" onClick={()=>openEdit(p)} className="h-10 rounded-xl font-bold border-border/40 bg-background/40 hover:bg-accent/10 hover:text-accent mt-2">
                <Pencil className="mr-2 h-3.5 w-3.5"/>
                Editar profissional
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
