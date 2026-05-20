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
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  const start = useCallback(() => {
    if (!SR) {
      setError("Reconhecimento de voz não suportado neste navegador.");
      return;
    }
    setError(null);
    setInterim("");
    finalRef.current = "";
    try {
      const rec = new SR();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.onstart = () => setIsRecording(true);
      rec.onresult = (e) => {
        let interimText = "";
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          const alt = res[0];
          if (res.isFinal) finalRef.current += alt.transcript;
          else interimText += alt.transcript;
        }
        setInterim(interimText);
      };
      rec.onerror = (e) => {
        if (e.error === "no-speech" || e.error === "aborted") return;
        setError(e.error === "not-allowed" ? "Permissão de microfone negada." : e.error);
      };
      rec.onend = () => {
        setIsRecording(false);
        setInterim("");
        const text = finalRef.current.trim();
        finalRef.current = "";
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
    recRef.current?.stop();
  }, []);

  useEffect(
    () => () => {
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
