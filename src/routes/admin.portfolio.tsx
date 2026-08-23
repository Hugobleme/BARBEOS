import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentShop } from "@/hooks/use-current-shop";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CardGridSkeleton, EmptyState } from "@/components/site/LoadingState";
import { ImagePlus, Trash2, Upload, Scissors, Sparkles, Filter, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/portfolio")({
  head: () => ({ meta: [{ title: "Portfólio & Galeria de Cortes — BarberOS" }] }),
  component: PortfolioPage,
});

type Pro = { id: string; display_name: string };
type Item = {
  id: string;
  barbershop_id: string;
  professional_id: string | null;
  image_url: string;
  storage_path: string | null;
  caption: string | null;
  sort: number;
};

const CATEGORIES = [
  "Corte Fade / Degradê",
  "Corte Clássico",
  "Barba & Terapia",
  "Platinado / Coloração",
  "Desenho / Hair Art",
  "Tratamento & Hidratação",
  "Geral",
];

const MAX_BYTES = 5 * 1024 * 1024; // 5MB

function PortfolioPage() {
  const { shopId, shop } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin" || shop?.role === "barber" || shop?.role === "professional";

  const [filterPro, setFilterPro] = useState<string>("all");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Consulta: Profissionais
  const { data: pros = [] } = useQuery({
    enabled: !!shopId,
    queryKey: ["pf-pros", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("professionals")
        .select("id, display_name")
        .eq("barbershop_id", shopId!)
        .eq("active", true)
        .order("display_name");
      if (error) throw error;
      return (data ?? []) as Pro[];
    },
  });

  // Consulta: Itens do Portfólio
  const { data: items = [], isLoading, refetch } = useQuery({
    enabled: !!shopId,
    queryKey: ["pf-items", shopId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("portfolio_items")
        .select("*")
        .eq("barbershop_id", shopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });

  const filtered = useMemo(() => {
    return items.filter((i) => {
      const matchPro = filterPro === "all" || i.professional_id === filterPro;
      const matchCat = filterCat === "all" || (i.caption && i.caption.includes(filterCat));
      return matchPro && matchCat;
    });
  }, [items, filterPro, filterCat]);

  const nameOf = (id: string | null) => pros.find((p) => p.id === id)?.display_name ?? "Barbearia (Geral)";

  async function handleRemove(it: Item) {
    if (!confirm("Tem certeza que deseja remover esta foto do portfólio?")) return;

    try {
      if (it.storage_path) {
        await supabase.storage.from("portfolio").remove([it.storage_path]);
      }
      const { error } = await supabase.from("portfolio_items").delete().eq("id", it.id);
      if (error) throw error;
      toast.success("Foto removida com sucesso!");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Erro ao remover foto.");
    }
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Topo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Galeria & Portfólio</h1>
          <p className="text-muted-foreground">
            Fotos de cortes, barbas e transformações exibidas na página pública e vitrine da barbearia.
          </p>
        </div>

        <Button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
        >
          <ImagePlus className="mr-1.5 h-3.5 w-3.5" /> Adicionar Foto
        </Button>
      </div>

      {/* Barra de Filtros */}
      <Card className="rounded-none border border-border bg-card/40 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Barbeiro:</Label>
              <Select value={filterPro} onValueChange={setFilterPro}>
                <SelectTrigger className="w-[190px] rounded-none h-9 text-xs">
                  <SelectValue placeholder="Todos os barbeiros" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">Todos os profissionais</SelectItem>
                  {pros.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Categoria:</Label>
              <Select value={filterCat} onValueChange={setFilterCat}>
                <SelectTrigger className="w-[190px] rounded-none h-9 text-xs">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent className="rounded-none">
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Badge variant="outline" className="rounded-none text-xs font-mono text-accent">
            {filtered.length} {filtered.length === 1 ? "foto" : "fotos"}
          </Badge>
        </div>
      </Card>

      {/* Grid de Fotos */}
      {isLoading ? (
        <CardGridSkeleton count={4} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ImagePlus}
          title="Nenhuma foto cadastrada"
          description="Adicione fotos de alta resolução dos seus melhores cortes para atrair novos clientes."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((it) => (
            <Card
              key={it.id}
              className="group relative aspect-square w-full max-w-full overflow-hidden rounded-none border border-border bg-card/60 transition-all hover:border-accent shadow-md"
            >
              <img
                src={it.image_url}
                alt={it.caption || "Corte BarberOS"}
                loading="lazy"
                className="h-full w-full max-w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-4 flex flex-col justify-end">
                <div className="font-serif font-bold text-white text-sm leading-tight">
                  {nameOf(it.professional_id)}
                </div>
                {it.caption && (
                  <p className="mt-1 text-[11px] text-neutral-300 line-clamp-2 leading-tight">
                    {it.caption}
                  </p>
                )}
              </div>

              {/* Botão de Excluir */}
              {canManage && (
                <button
                  onClick={() => handleRemove(it)}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center bg-black/60 text-white backdrop-blur-md opacity-0 transition-all duration-300 hover:bg-destructive group-hover:opacity-100"
                  aria-label="Excluir foto"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Adicionar Foto */}
      <CreatePhotoModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        shopId={shopId!}
        pros={pros}
        onSuccess={() => {
          setCreateModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}

function CreatePhotoModal({
  open,
  onOpenChange,
  shopId,
  pros,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  shopId: string;
  pros: Pro[];
  onSuccess: () => void;
}) {
  const [proId, setProId] = useState<string>("none");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [mode, setMode] = useState<"file" | "url">("file");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSubmit(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Selecione um arquivo de imagem.");
    if (file.size > MAX_BYTES) return toast.error("A imagem deve ter no máximo 5MB.");

    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${shopId}/${crypto.randomUUID()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from("portfolio")
        .upload(path, file, { contentType: file.type, upsert: false });

      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("portfolio").getPublicUrl(path);

      const finalCaption = category !== "Geral" ? `[${category}] ${caption}`.trim() : caption.trim();

      const { error } = await supabase.from("portfolio_items").insert({
        barbershop_id: shopId,
        professional_id: proId === "none" ? null : proId,
        image_url: pub.publicUrl,
        storage_path: path,
        caption: finalCaption || null,
      });

      if (error) throw error;

      toast.success("Foto adicionada com sucesso!");
      setCaption("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Falha no upload da foto.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) return toast.error("Informe a URL da imagem.");

    setBusy(true);
    try {
      const finalCaption = category !== "Geral" ? `[${category}] ${caption}`.trim() : caption.trim();

      const { error } = await supabase.from("portfolio_items").insert({
        barbershop_id: shopId,
        professional_id: proId === "none" ? null : proId,
        image_url: imageUrl.trim(),
        storage_path: null,
        caption: finalCaption || null,
      });

      if (error) throw error;

      toast.success("Foto cadastrada com sucesso!");
      setImageUrl("");
      setCaption("");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar foto.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl">Adicionar Foto ao Portfólio</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 text-xs">
          {/* Alternância de Modo */}
          <div className="flex border border-border p-1 bg-card/40">
            <button
              type="button"
              onClick={() => setMode("file")}
              className={`flex-1 py-1.5 text-xs font-bold uppercase transition ${
                mode === "file" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Upload de Arquivo
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex-1 py-1.5 text-xs font-bold uppercase transition ${
                mode === "url" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Link / URL da Imagem
            </button>
          </div>

          <div className="space-y-1.5">
            <Label>Profissional Responsável</Label>
            <Select value={proId} onValueChange={setProId}>
              <SelectTrigger className="rounded-none">
                <SelectValue placeholder="Geral da barbearia" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                <SelectItem value="none">Geral da Barbearia</SelectItem>
                {pros.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Estilo / Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pf_caption">Legenda / Detalhes do Corte</Label>
            <Input
              id="pf_caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Ex.: Degradê navalhado com pigmentação e finalização fosca"
              className="rounded-none"
            />
          </div>

          {mode === "url" ? (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pf_url">URL Direta da Imagem *</Label>
                <Input
                  id="pf_url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/corte.jpg"
                  className="rounded-none"
                  required
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-none">
                  Cancelar
                </Button>
                <Button type="submit" disabled={busy} className="rounded-none bg-accent text-accent-foreground">
                  {busy ? "Salvando..." : "Salvar Foto"}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => e.target.files?.[0] && handleFileSubmit(e.target.files[0])}
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
                className="w-full rounded-none bg-accent text-accent-foreground h-12 text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background"
              >
                {busy ? <Upload className="mr-2 h-4 w-4 animate-bounce" /> : <Upload className="mr-2 h-4 w-4" />}
                {busy ? "Enviando Arquivo..." : "Escolher Imagem do Computador"}
              </Button>

              <p className="text-[10px] text-center text-muted-foreground">Formatos suportados: JPG, PNG, WEBP (Máx. 5MB)</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
