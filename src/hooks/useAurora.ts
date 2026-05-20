import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "./useSpeechRecognition";

export type AuroraStatus = "idle" | "listening" | "thinking" | "speaking" | "error";

export interface AuroraMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface UseAuroraOpts {
  barbershopId: string;
  enabled: boolean;
  muted?: boolean;
}

function speak(text: string, onDone: () => void): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    onDone();
    return;
  }
  let settled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const finish = () => {
    if (settled) return;
    settled = true;
    if (timeoutId) clearTimeout(timeoutId);
    onDone();
  };
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "pt-BR";
    u.rate = 1.05;
    u.pitch = 1;
    // Prefer a Portuguese voice if available.
    const voices = window.speechSynthesis.getVoices();
    const pt = voices.find((v) => v.lang?.toLowerCase().startsWith("pt"));
    if (pt) u.voice = pt;
    u.onend = finish;
    u.onerror = finish;
    timeoutId = setTimeout(() => {
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* noop */
      }
      finish();
    }, Math.min(12000, Math.max(2500, text.length * 90)));
    window.speechSynthesis.speak(u);
  } catch {
    finish();
  }
}

export function useAurora({ barbershopId, enabled, muted = false }: UseAuroraOpts) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<AuroraStatus>("idle");
  const [messages, setMessages] = useState<AuroraMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const ensureSession = useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await fetch("/api/voice/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barbershop_id: barbershopId,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      }),
    });
    const data = (await res.json()) as { session_id?: string; error?: string };
    if (!res.ok || !data.session_id) throw new Error(data.error ?? "session error");
    setSessionId(data.session_id);
    return data.session_id;
  }, [sessionId, barbershopId]);

  const playTts = useCallback((text: string): Promise<void> => {
    if (!text.trim() || mutedRef.current) {
      setStatus("idle");
      return Promise.resolve();
    }
    setStatus("speaking");
    return new Promise<void>((resolve) => {
      speak(text, () => {
        setStatus("idle");
        resolve();
      });
    });
  }, []);

  const sendText = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      setError(null);
      const userMsg: AuroraMessage = { id: crypto.randomUUID(), role: "user", content: text };
      setMessages((m) => [...m, userMsg]);
      setStatus("thinking");
      try {
        const sid = await ensureSession();
        const res = await fetch("/api/voice/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sid, user_text: text }),
        });
        const data = (await res.json()) as { text?: string; error?: string };
        if (!res.ok || !data.text) throw new Error(data.error ?? "chat error");
        const aiMsg: AuroraMessage = { id: crypto.randomUUID(), role: "assistant", content: data.text };
        setMessages((m) => [...m, aiMsg]);
        await playTts(data.text);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "erro";
        setError(msg);
        setStatus("error");
      }
    },
    [ensureSession, playTts],
  );

  const speech = useSpeechRecognition({
    onFinal: (text) => {
      void sendText(text);
    },
  });

  useEffect(() => {
    if (speech.isRecording) {
      setStatus("listening");
      return;
    }
    setStatus((current) => (current === "listening" ? "idle" : current));
  }, [speech.isRecording]);

  useEffect(() => {
    if (speech.error) {
      setStatus((current) => (current === "listening" ? "idle" : current));
    }
  }, [speech.error]);

  const startListening = useCallback(() => {
    setError(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    speech.start();
  }, [speech]);

  const stopListening = useCallback(() => {
    speech.stop();
  }, [speech]);

  const endSession = useCallback(async () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    try {
      speech.stop();
    } catch {
      /* noop */
    }
    if (sessionId) {
      await fetch("/api/voice/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, outcome: "ended" }),
      }).catch(() => undefined);
    }
    setSessionId(null);
    setMessages([]);
    setStatus("idle");
  }, [sessionId, speech]);

  useEffect(() => {
    if (!enabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [enabled]);

  // Pseudo "level" for pulse animation while listening (no audio analyser).
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (!speech.isRecording) {
      setPulse(0);
      return;
    }
    const id = setInterval(() => setPulse(Math.random() * 0.6 + 0.2), 180);
    return () => clearInterval(id);
  }, [speech.isRecording]);

  return {
    status,
    messages,
    error,
    level: pulse,
    interim: speech.interim,
    isSupported: speech.isSupported,
    micError: speech.error,
    sendText,
    startListening,
    stopListening,
    endSession,
  };
}
