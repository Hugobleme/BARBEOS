import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShopId } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/portfolio")({ component: Portfolio });

type Pro = { id: string; display_name: string };
type Item = {
  id: string; barbershop_id: string; professional_id: string | null;
  image_url: string; storage_path: string | null; caption: string | null; sort: number;
};

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function Portfolio() {
  const shopId = useCurrentShopId();
  const [filterPro, setFilterPro] = useState<string>("all");

  const { data: pros = [] } = useQuery({
    enabled: !!shopId,
    queryKey: ["pf-pros", shopId],
    queryFn: async () =>
      ((await supabase.from("professionals").select("id, display_name")
        .eq("barbershop_id", shopId).order("display_name")).data ?? []) as Pro[],
  });

  const { data: items = [], refetch } = useQuery({
    enabled: !!shopId,
    queryKey: ["pf-items", shopId],
    queryFn: async () =>
      ((await supabase.from("portfolio_items").select("*")
        .eq("barbershop_id", shopId)
        .order("created_at", { ascending: false })).data ?? []) as Item[],
  });

  const filtered = useMemo(
    () => filterPro === "all" ? items : items.filter(i => i.professional_id === filterPro),
    [items, filterPro],
  );

  const nameOf = (id: string | null) => pros.find(p => p.id === id)?.display_name ?? "Geral";

  async function remove(it: Item) {
    if (!confirm("Remover esta foto?")) return;
    if (it.storage_path) {
      await supabase.storage.from("portfolio").remove([it.storage_path]);
    }
    const { error } = await supabase.from("portfolio_items").delete().eq("id", it.id);
    if (error) return toast.error(error.message);
    toast.success("Foto removida");
    refetch();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-bold tracking-tight">Portfólio</h1>
          <p className="text-sm font-medium text-muted-foreground">
            Fotos de cortes e atendimentos exibidas na página pública da barbearia.
          </p>
        </div>
        <UploadCard shopId={shopId} pros={pros} onUploaded={refetch} />
      </div>

      <Card className="overflow-hidden border-none bg-card/50 p-4 shadow-xl shadow-black/5 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-3">
            <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">Filtrar:</Label>
            <Select value={filterPro} onValueChange={setFilterPro}>
              <SelectTrigger className="h-10 w-[240px] rounded-xl border-border/40 bg-background/40 font-bold">
                <SelectValue/>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-border/40">
                <SelectItem value="all">Todos os trabalhos</SelectItem>
                {pros.map(p => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Badge variant="outline" className="ml-auto bg-accent/10 border-accent/20 text-accent font-bold">
            {filtered.length} {filtered.length === 1 ? 'foto' : 'fotos'}
          </Badge>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">
          <ImagePlus className="mx-auto mb-3 h-8 w-8 opacity-40" />
          Nenhuma foto ainda. Use o botão acima para adicionar.
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map(it => (
            <Card key={it.id} className="group relative overflow-hidden p-0">
              <img src={it.image_url} alt={it.caption ?? ""} loading="lazy"
                className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[11px] text-white">
                <div className="truncate">{nameOf(it.professional_id)}</div>
                {it.caption && <div className="truncate opacity-80">{it.caption}</div>}
              </div>
              <button
                onClick={() => remove(it)}
                className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                aria-label="Remover">
                <Trash2 className="h-4 w-4" />
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UploadCard({
  shopId, pros, onUploaded,
}: { shopId: string | null; pros: Pro[]; onUploaded: () => void }) {
  const [proId, setProId] = useState<string>("none");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!shopId) return;
    if (!file.type.startsWith("image/")) return toast.error("Selecione uma imagem");
    if (file.size > MAX_BYTES) return toast.error("Imagem maior que 5MB");

    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("portfolio")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("portfolio").getPublicUrl(path);
      const { error } = await supabase.from("portfolio_items").insert({
        barbershop_id: shopId,
        professional_id: proId === "none" ? null : proId,
        image_url: pub.publicUrl,
        storage_path: path,
        caption: caption.trim() || null,
      });
      if (error) throw error;
      toast.success("Foto adicionada!");
      setCaption("");
      if (inputRef.current) inputRef.current.value = "";
      onUploaded();
    } catch (e: any) {
      toast.error(e.message ?? "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-wrap items-end gap-3 p-3">
      <div className="grid gap-1">
        <Label className="text-xs">Profissional</Label>
        <Select value={proId} onValueChange={setProId}>
          <SelectTrigger className="h-9 w-[180px]"><SelectValue/></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Geral (sem profissional)</SelectItem>
            {pros.map(p => <SelectItem key={p.id} value={p.id}>{p.display_name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <Label className="text-xs">Legenda (opcional)</Label>
        <Input
          value={caption}
          onChange={e => setCaption(e.target.value)}
          className="h-9 w-[220px]"
          placeholder="Ex: fade clássico"
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <Button onClick={() => inputRef.current?.click()} disabled={busy}>
        <Upload className="mr-2 h-4 w-4" />
        {busy ? "Enviando…" : "Enviar foto"}
      </Button>
    </Card>
  );
}
