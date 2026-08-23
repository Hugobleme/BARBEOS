import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BmPKwOzk.mjs";
import { h as useCurrentShop, B as Button, C as Card, L as Label, a as Badge, o as CardGridSkeleton, E as EmptyState, I as Input } from "./router-CQpyXUQj.mjs";
import { S as Select, a as SelectTrigger, b as SelectValue, c as SelectContent, d as SelectItem } from "./select-B2rhjM4v.mjs";
import { D as Dialog, b as DialogContent, c as DialogHeader, d as DialogTitle, e as DialogFooter } from "./dialog-iYf2tXSL.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { ak as ImagePlus, T as Trash2, al as Upload } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-select.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__react-presence.mjs";
const CATEGORIES = ["Corte Fade / Degradê", "Corte Clássico", "Barba & Terapia", "Platinado / Coloração", "Desenho / Hair Art", "Tratamento & Hidratação", "Geral"];
const MAX_BYTES = 5 * 1024 * 1024;
function PortfolioPage() {
  const {
    shopId,
    shop
  } = useCurrentShop();
  const canManage = shop?.role === "owner" || shop?.role === "admin" || shop?.role === "barber" || shop?.role === "professional";
  const [filterPro, setFilterPro] = reactExports.useState("all");
  const [filterCat, setFilterCat] = reactExports.useState("all");
  const [createModalOpen, setCreateModalOpen] = reactExports.useState(false);
  const {
    data: pros = []
  } = useQuery({
    enabled: !!shopId,
    queryKey: ["pf-pros", shopId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("professionals").select("id, display_name").eq("barbershop_id", shopId).eq("active", true).order("display_name");
      if (error) throw error;
      return data ?? [];
    }
  });
  const {
    data: items = [],
    isLoading,
    refetch
  } = useQuery({
    enabled: !!shopId,
    queryKey: ["pf-items", shopId],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("portfolio_items").select("*").eq("barbershop_id", shopId).order("created_at", {
        ascending: false
      });
      if (error) throw error;
      return data ?? [];
    }
  });
  const filtered = reactExports.useMemo(() => {
    return items.filter((i) => {
      const matchPro = filterPro === "all" || i.professional_id === filterPro;
      const matchCat = filterCat === "all" || i.caption && i.caption.includes(filterCat);
      return matchPro && matchCat;
    });
  }, [items, filterPro, filterCat]);
  const nameOf = (id) => pros.find((p) => p.id === id)?.display_name ?? "Barbearia (Geral)";
  async function handleRemove(it) {
    if (!confirm("Tem certeza que deseja remover esta foto do portfólio?")) return;
    try {
      if (it.storage_path) {
        await supabase.storage.from("portfolio").remove([it.storage_path]);
      }
      const {
        error
      } = await supabase.from("portfolio_items").delete().eq("id", it.id);
      if (error) throw error;
      toast.success("Foto removida com sucesso!");
      refetch();
    } catch (err) {
      toast.error(err.message || "Erro ao remover foto.");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8 pb-12", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Galeria & Portfólio" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "Fotos de cortes, barbas e transformações exibidas na página pública e vitrine da barbearia." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: () => setCreateModalOpen(true), className: "rounded-none bg-accent text-accent-foreground text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ImagePlus, { className: "mr-1.5 h-3.5 w-3.5" }),
        " Adicionar Foto"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "rounded-none border border-border bg-card/40 p-4 backdrop-blur-md", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Barbeiro:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterPro, onValueChange: setFilterPro, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[190px] rounded-none h-9 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Todos os barbeiros" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todos os profissionais" }),
              pros.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.display_name }, p.id))
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Categoria:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: filterCat, onValueChange: setFilterCat, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "w-[190px] rounded-none h-9 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Todas as categorias" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "all", children: "Todas as categorias" }),
              CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c))
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "outline", className: "rounded-none text-xs font-mono text-accent", children: [
        filtered.length,
        " ",
        filtered.length === 1 ? "foto" : "fotos"
      ] })
    ] }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(CardGridSkeleton, { count: 4 }) : filtered.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, { icon: ImagePlus, title: "Nenhuma foto cadastrada", description: "Adicione fotos de alta resolução dos seus melhores cortes para atrair novos clientes." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4", children: filtered.map((it) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "group relative aspect-square overflow-hidden rounded-none border border-border bg-card/60 transition-all hover:border-accent shadow-md", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: it.image_url, alt: it.caption || "Corte BarberOS", loading: "lazy", className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 p-4 flex flex-col justify-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-serif font-bold text-white text-sm leading-tight", children: nameOf(it.professional_id) }),
        it.caption && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-neutral-300 line-clamp-2 leading-tight", children: it.caption })
      ] }),
      canManage && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => handleRemove(it), className: "absolute right-2 top-2 grid h-8 w-8 place-items-center bg-black/60 text-white backdrop-blur-md opacity-0 transition-all duration-300 hover:bg-destructive group-hover:opacity-100", "aria-label": "Excluir foto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
    ] }, it.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CreatePhotoModal, { open: createModalOpen, onOpenChange: setCreateModalOpen, shopId, pros, onSuccess: () => {
      setCreateModalOpen(false);
      refetch();
    } })
  ] });
}
function CreatePhotoModal({
  open,
  onOpenChange,
  shopId,
  pros,
  onSuccess
}) {
  const [proId, setProId] = reactExports.useState("none");
  const [category, setCategory] = reactExports.useState(CATEGORIES[0]);
  const [caption, setCaption] = reactExports.useState("");
  const [imageUrl, setImageUrl] = reactExports.useState("");
  const [mode, setMode] = reactExports.useState("file");
  const [busy, setBusy] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  async function handleFileSubmit(file) {
    if (!file.type.startsWith("image/")) return toast.error("Selecione um arquivo de imagem.");
    if (file.size > MAX_BYTES) return toast.error("A imagem deve ter no máximo 5MB.");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${shopId}/${crypto.randomUUID()}.${ext}`;
      const {
        error: upErr
      } = await supabase.storage.from("portfolio").upload(path, file, {
        contentType: file.type,
        upsert: false
      });
      if (upErr) throw upErr;
      const {
        data: pub
      } = supabase.storage.from("portfolio").getPublicUrl(path);
      const finalCaption = category !== "Geral" ? `[${category}] ${caption}`.trim() : caption.trim();
      const {
        error
      } = await supabase.from("portfolio_items").insert({
        barbershop_id: shopId,
        professional_id: proId === "none" ? null : proId,
        image_url: pub.publicUrl,
        storage_path: path,
        caption: finalCaption || null
      });
      if (error) throw error;
      toast.success("Foto adicionada com sucesso!");
      setCaption("");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Falha no upload da foto.");
    } finally {
      setBusy(false);
    }
  }
  async function handleUrlSubmit(e) {
    e.preventDefault();
    if (!imageUrl.trim()) return toast.error("Informe a URL da imagem.");
    setBusy(true);
    try {
      const finalCaption = category !== "Geral" ? `[${category}] ${caption}`.trim() : caption.trim();
      const {
        error
      } = await supabase.from("portfolio_items").insert({
        barbershop_id: shopId,
        professional_id: proId === "none" ? null : proId,
        image_url: imageUrl.trim(),
        storage_path: null,
        caption: finalCaption || null
      });
      if (error) throw error;
      toast.success("Foto cadastrada com sucesso!");
      setImageUrl("");
      setCaption("");
      onSuccess();
    } catch (err) {
      toast.error(err.message || "Erro ao salvar foto.");
    } finally {
      setBusy(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "rounded-none border-border sm:max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { className: "font-serif text-2xl", children: "Adicionar Foto ao Portfólio" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 py-4 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex border border-border p-1 bg-card/40", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setMode("file"), className: `flex-1 py-1.5 text-xs font-bold uppercase transition ${mode === "file" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`, children: "Upload de Arquivo" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setMode("url"), className: `flex-1 py-1.5 text-xs font-bold uppercase transition ${mode === "url" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`, children: "Link / URL da Imagem" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Profissional Responsável" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: proId, onValueChange: setProId, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, { placeholder: "Geral da barbearia" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(SelectContent, { className: "rounded-none", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: "none", children: "Geral da Barbearia" }),
            pros.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: p.id, children: p.display_name }, p.id))
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { children: "Estilo / Categoria" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: category, onValueChange: setCategory, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "rounded-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { className: "rounded-none", children: CATEGORIES.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c, children: c }, c)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pf_caption", children: "Legenda / Detalhes do Corte" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pf_caption", value: caption, onChange: (e) => setCaption(e.target.value), placeholder: "Ex.: Degradê navalhado com pigmentação e finalização fosca", className: "rounded-none" })
      ] }),
      mode === "url" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleUrlSubmit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "pf_url", children: "URL Direta da Imagem *" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "pf_url", value: imageUrl, onChange: (e) => setImageUrl(e.target.value), placeholder: "https://exemplo.com/corte.jpg", className: "rounded-none", required: true })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { className: "gap-2 sm:gap-0 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: () => onOpenChange(false), className: "rounded-none", children: "Cancelar" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", disabled: busy, className: "rounded-none bg-accent text-accent-foreground", children: busy ? "Salvando..." : "Salvar Foto" })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", hidden: true, onChange: (e) => e.target.files?.[0] && handleFileSubmit(e.target.files[0]) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "button", onClick: () => fileInputRef.current?.click(), disabled: busy, className: "w-full rounded-none bg-accent text-accent-foreground h-12 text-xs uppercase font-bold tracking-wider hover:bg-foreground hover:text-background", children: [
          busy ? /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "mr-2 h-4 w-4 animate-bounce" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "mr-2 h-4 w-4" }),
          busy ? "Enviando Arquivo..." : "Escolher Imagem do Computador"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-center text-muted-foreground", children: "Formatos suportados: JPG, PNG, WEBP (Máx. 5MB)" })
      ] })
    ] })
  ] }) });
}
export {
  PortfolioPage as component
};
