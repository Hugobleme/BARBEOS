import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORAGE_KEY = "barberos-pwa-install-dismissed";

export function PWAInstallPrompt({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifica se está rodando em ambiente navegador
    if (typeof window === "undefined") return;

    // Se já estiver instalado em modo standalone, não exibe
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Se o usuário dispensou recentemente (últimos 7 dias)
    const dismissedTimestamp = localStorage.getItem(STORAGE_KEY);
    if (dismissedTimestamp) {
      const daysSinceDismiss = (Date.now() - Number(dismissedTimestamp)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < 7) return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "dismissed") {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setIsVisible(false);
  }

  if (!isVisible || !deferredPrompt) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-md items-center justify-between gap-4 border border-border bg-card/95 p-4 shadow-2xl backdrop-blur-xl md:left-auto md:right-4",
        className
      )}
      role="banner"
      aria-label="Instalação do Aplicativo BarberOS"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center bg-accent text-accent-foreground font-serif font-bold text-lg">
          B
        </div>
        <div>
          <h4 className="font-serif font-bold text-sm text-foreground">Instalar o BarberOS</h4>
          <p className="text-xs text-muted-foreground">Acesse sua barbearia direto da tela inicial</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={handleInstall}
          className="rounded-none bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider hover:bg-foreground hover:text-background"
        >
          <Download className="mr-1.5 h-3.5 w-3.5" /> Instalar App
        </Button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
