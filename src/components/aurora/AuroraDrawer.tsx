import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Volume2, VolumeX, X, Loader2 } from "lucide-react";
import { useAurora, type AuroraStatus } from "@/hooks/useAurora";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barbershopId: string;
  barbershopName?: string;
}

const statusLabel: Record<AuroraStatus, string> = {
  idle: "Toque no microfone para falar",
  listening: "Ouvindo…",
  thinking: "Pensando…",
  speaking: "Falando…",
  error: "Algo deu errado",
};

export function AuroraDrawer({ open, onOpenChange, barbershopId, barbershopName }: Props) {
  const [muted, setMuted] = useState(false);
  const [text, setText] = useState("");
  const aurora = useAurora({ barbershopId, enabled: open, muted });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [aurora.messages.length, aurora.status]);

  useEffect(() => {
    if (!open) aurora.endSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleMicTap = () => {
    if (aurora.status === "listening") {
      aurora.stopListening();
    } else if (aurora.status === "idle" || aurora.status === "error") {
      aurora.startListening();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    aurora.sendText(text.trim());
    setText("");
  };

  const pulseScale = 1 + aurora.level * 0.4;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col gap-0 p-0 bg-gradient-to-b from-background to-background/95">
        <SheetHeader className="px-5 py-4 border-b border-border/40 flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-background font-bold">
              A
              {(aurora.status === "listening" || aurora.status === "speaking") && (
                <span className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
              )}
            </div>
            <div>
              <SheetTitle className="text-base">Aurora</SheetTitle>
              <SheetDescription className="text-xs">
                {barbershopName ? `Assistente de ${barbershopName}` : "Assistente de voz"}
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setMuted((m) => !m)} aria-label={muted ? "Ativar voz" : "Silenciar"}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Fechar">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {aurora.messages.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-12">
              <p className="mb-2">Olá! Eu sou a Aurora.</p>
              <p>Posso agendar seu corte agora mesmo. É só falar comigo.</p>
            </div>
          )}
          {aurora.messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm",
                )}
              >
                {m.content}
              </div>
            </div>
          ))}
          {aurora.status === "thinking" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl px-4 py-3 rounded-bl-sm">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          {aurora.error && (
            <p className="text-xs text-destructive text-center">{aurora.error}</p>
          )}
          {!aurora.isSupported && (
            <p className="text-xs text-destructive text-center">Seu navegador não suporta gravação de áudio.</p>
          )}
          {aurora.micError && (
            <p className="text-xs text-destructive text-center">Sem acesso ao microfone: {aurora.micError}</p>
          )}
        </div>

        <div className="border-t border-border/40 px-5 py-4 space-y-3 bg-background/50 backdrop-blur">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleMicTap}
              disabled={aurora.status === "thinking" || aurora.status === "speaking"}
              className={cn(
                "relative h-20 w-20 rounded-full flex items-center justify-center transition-all",
                "bg-gradient-to-br from-amber-300 to-amber-600 text-background shadow-lg shadow-amber-500/30",
                "disabled:opacity-40 disabled:cursor-not-allowed",
                aurora.status === "listening" && "ring-4 ring-amber-400/60",
              )}
              style={aurora.status === "listening" ? { transform: `scale(${pulseScale})` } : undefined}
              aria-label={aurora.status === "listening" ? "Parar gravação" : "Falar com a Aurora"}
            >
              {aurora.status === "thinking" || aurora.status === "speaking" ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : aurora.status === "listening" ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </button>
            <p className="text-xs text-muted-foreground">{statusLabel[aurora.status]}</p>
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ou digite sua mensagem…"
              className="flex-1"
              disabled={aurora.status === "thinking" || aurora.status === "speaking"}
            />
            <Button type="submit" size="icon" variant="secondary" disabled={!text.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-[10px] text-center text-muted-foreground/70">
            Sua conversa pode ser registrada para melhorar o atendimento. Não compartilhe dados sensíveis.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
