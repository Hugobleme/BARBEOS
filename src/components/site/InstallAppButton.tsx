import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

function isInIframe() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export function InstallAppButton({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isInIframe()) return; // não oferecer no preview
    // Já instalado?
    if (window.matchMedia?.("(display-mode: standalone)").matches) return;
    // Dispensado recentemente?
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_DAYS * 86400_000) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!visible || !deferred) return null;

  async function handleInstall() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "dismissed") localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
    setVisible(false);
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  return (
    <div
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur-xl md:inset-x-auto md:right-4",
        className,
      )}
      role="dialog"
      aria-label="Instalar aplicativo"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-foreground">
          <Download className="h-4 w-4" />
        </div>
        <div className="text-sm">
          <div className="font-medium leading-tight">Instalar BarberOS</div>
          <div className="text-xs text-muted-foreground">Acesso rápido na tela inicial</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={handleDismiss}>
          Agora não
        </Button>
        <Button
          size="sm"
          onClick={handleInstall}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          Instalar
        </Button>
      </div>
    </div>
  );
}
