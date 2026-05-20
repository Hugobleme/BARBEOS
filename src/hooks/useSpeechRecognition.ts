import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typing for browser SpeechRecognition (webkit-prefixed in most browsers).
type SRConstructor = new () => SpeechRecognitionInstance;
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

function getSR(): SRConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: SRConstructor; webkitSpeechRecognition?: SRConstructor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

interface Options {
  lang?: string;
  onFinal: (text: string) => void;
}

export function useSpeechRecognition({ lang = "pt-BR", onFinal }: Options) {
  const SR = typeof window !== "undefined" ? getSR() : null;
  const [isSupported] = useState(!!SR);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const finalRef = useRef("");
  const interimRef = useRef("");
  const safetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const clearSafety = () => {
    if (safetyTimerRef.current) {
      clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = null;
    }
  };

  const start = useCallback(() => {
    if (!SR) {
      setError("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    // If already running, ignore.
    if (recRef.current) {
      try {
        recRef.current.abort();
      } catch {
        /* noop */
      }
      recRef.current = null;
    }
    setError(null);
    setInterim("");
    finalRef.current = "";
    try {
      const rec = new SR();
      rec.lang = lang;
      // Single-utterance mode is dramatically more reliable across Chrome versions.
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => {
        setIsRecording(true);
        // Safety: if nothing happens in 15s, force-stop so UI doesn't hang.
        clearSafety();
        safetyTimerRef.current = setTimeout(() => {
          try {
            recRef.current?.stop();
          } catch {
            /* noop */
          }
        }, 15000);
      };
      rec.onresult = (e) => {
        let interimText = "";
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          const alt = res[0];
          if (res.isFinal) finalRef.current += alt.transcript;
          else interimText += alt.transcript;
        }
        interimRef.current = interimText;
        setInterim(interimText);
      };
      rec.onerror = (e) => {
        if (e.error === "aborted") return;
        if (e.error === "no-speech") {
          setError("Não ouvi nada. Toque no microfone e fale novamente.");
          return;
        }
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setError("Permissão de microfone negada. Habilite nas configurações do navegador.");
          return;
        }
        if (e.error === "audio-capture") {
          setError("Microfone não encontrado.");
          return;
        }
        if (e.error === "network") {
          setError("O reconhecimento de voz não funciona dentro do preview. Abra o app em uma aba nova para falar.");
          return;
        }
        setError(e.error);
      };
      rec.onend = () => {
        clearSafety();
        setIsRecording(false);
        setInterim("");
        recRef.current = null;
        // Fallback: if no final result arrived, use whatever interim we captured.
        const text = (finalRef.current.trim() || interimRef.current.trim()).trim();
        finalRef.current = "";
        interimRef.current = "";
        if (text) onFinalRef.current(text);
      };
      recRef.current = rec;
      rec.start();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao iniciar reconhecimento.");
      setIsRecording(false);
    }
  }, [SR, lang]);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* noop */
    }
  }, []);

  useEffect(
    () => () => {
      clearSafety();
      try {
        recRef.current?.abort();
      } catch {
        /* noop */
      }
    },
    [],
  );

  return { isSupported, isRecording, error, interim, start, stop };
}
