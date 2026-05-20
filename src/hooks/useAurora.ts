import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceRecorder } from "./useVoiceRecorder";

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

export function useAurora({ barbershopId, enabled, muted = false }: UseAuroraOpts) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<AuroraStatus>("idle");
  const [messages, setMessages] = useState<AuroraMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  // Create session lazily
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

  const playTts = useCallback(async (text: string) => {
    if (mutedRef.current || !text) return;
    setStatus("speaking");
    const res = await fetch("/api/voice/synthesize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      setStatus("idle");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioRef.current = audio;
    await new Promise<void>((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
    setStatus("idle");
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

  const recorder = useVoiceRecorder({
    onAutoStop: async (blob) => {
      try {
        setStatus("thinking");
        const sid = await ensureSession();
        const form = new FormData();
        form.append("audio", blob, "audio.webm");
        form.append("session_id", sid);
        const tres = await fetch("/api/voice/transcribe", { method: "POST", body: form });
        const tdata = (await tres.json()) as { text?: string; error?: string };
        if (!tres.ok || !tdata.text) throw new Error(tdata.error ?? "transcribe error");
        await sendText(tdata.text);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "erro";
        setError(msg);
        setStatus("error");
      }
    },
  });

  // Reflect recorder state into status
  useEffect(() => {
    if (recorder.isRecording) setStatus("listening");
  }, [recorder.isRecording]);

  const startListening = useCallback(async () => {
    setError(null);
    audioRef.current?.pause();
    await recorder.start();
  }, [recorder]);

  const stopListening = useCallback(async () => {
    const blob = await recorder.stop();
    if (blob && blob.size > 1000) {
      // manually trigger the onAutoStop path via the recorder option
      // (already wired via onAutoStop, which is also called by VAD; manual stop just resolves blob without callback)
      try {
        setStatus("thinking");
        const sid = await ensureSession();
        const form = new FormData();
        form.append("audio", blob, "audio.webm");
        form.append("session_id", sid);
        const tres = await fetch("/api/voice/transcribe", { method: "POST", body: form });
        const tdata = (await tres.json()) as { text?: string; error?: string };
        if (!tres.ok || !tdata.text) throw new Error(tdata.error ?? "transcribe error");
        await sendText(tdata.text);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "erro";
        setError(msg);
        setStatus("error");
      }
    } else {
      setStatus("idle");
    }
  }, [recorder, ensureSession, sendText]);

  const endSession = useCallback(async () => {
    audioRef.current?.pause();
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
  }, [sessionId]);

  // Reset when disabled
  useEffect(() => {
    if (!enabled) {
      audioRef.current?.pause();
    }
  }, [enabled]);

  return {
    status,
    messages,
    error,
    level: recorder.level,
    isSupported: recorder.isSupported,
    micError: recorder.error,
    sendText,
    startListening,
    stopListening,
    endSession,
  };
}
