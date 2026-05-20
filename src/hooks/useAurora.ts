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

// Decode PCM 16-bit LE from Gemini TTS (mime like "audio/L16;codec=pcm;rate=24000")
function parseRate(mime: string): number {
  const m = mime.match(/rate=(\d+)/i);
  return m ? parseInt(m[1], 10) : 24000;
}

async function playPcmBase64(base64: string, mime: string): Promise<void> {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const rate = parseRate(mime);
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new AC({ sampleRate: rate });
  const buf = ctx.createBuffer(1, pcm.length, rate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
  return new Promise((resolve) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => { ctx.close().catch(() => undefined); resolve(); };
    src.start();
  });
}

function fallbackSpeak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      const v = window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith("pt"));
      if (v) u.voice = v;
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      u.onend = finish; u.onerror = finish;
      window.speechSynthesis.speak(u);
      setTimeout(finish, Math.min(15000, Math.max(2500, text.length * 90)));
    } catch { resolve(); }
  });
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

  const sendTurn = useCallback(
    async (payload: { user_text?: string; audio_base64?: string; audio_mime?: string }) => {
      setError(null);
      setStatus("thinking");
      try {
        const sid = await ensureSession();
        const res = await fetch("/api/voice/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sid, mute: mutedRef.current, ...payload }),
        });
        const data = (await res.json()) as {
          text?: string;
          user_text?: string;
          audio_base64?: string | null;
          audio_mime?: string | null;
          error?: string;
        };
        if (!res.ok || !data.text) throw new Error(data.error ?? "erro na resposta");

        const userText = (payload.user_text ?? data.user_text ?? "").trim();
        const newMessages: AuroraMessage[] = [];
        if (userText) newMessages.push({ id: crypto.randomUUID(), role: "user", content: userText });
        newMessages.push({ id: crypto.randomUUID(), role: "assistant", content: data.text });
        setMessages((m) => [...m, ...newMessages]);

        if (!mutedRef.current) {
          setStatus("speaking");
          try {
            if (data.audio_base64 && data.audio_mime) {
              await playPcmBase64(data.audio_base64, data.audio_mime);
            } else {
              await fallbackSpeak(data.text);
            }
          } catch {
            await fallbackSpeak(data.text).catch(() => undefined);
          }
        }
        setStatus("idle");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "erro";
        setError(msg);
        setStatus("error");
        setTimeout(() => setStatus((s) => (s === "error" ? "idle" : s)), 1500);
      }
    },
    [ensureSession],
  );

  const recorder = useVoiceRecorder({
    onRecorded: (b64, mime) => { void sendTurn({ audio_base64: b64, audio_mime: mime }); },
    onError: (msg) => { setError(msg); setStatus("idle"); },
  });

  useEffect(() => {
    if (recorder.isRecording) setStatus("listening");
    else setStatus((cur) => (cur === "listening" ? "idle" : cur));
  }, [recorder.isRecording]);

  const sendText = useCallback((text: string) => {
    if (!text.trim()) return;
    void sendTurn({ user_text: text.trim() });
  }, [sendTurn]);

  const startListening = useCallback(() => {
    setError(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    }
    void recorder.start();
  }, [recorder]);

  const stopListening = useCallback(() => { recorder.stop(); }, [recorder]);

  const endSession = useCallback(async () => {
    recorder.cancel();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
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
    setError(null);
  }, [sessionId, recorder]);

  useEffect(() => {
    if (!enabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      try { window.speechSynthesis.cancel(); } catch { /* noop */ }
    }
  }, [enabled]);

  return {
    status,
    messages,
    error,
    level: recorder.level,
    interim: "",
    isSupported: recorder.isSupported,
    micError: recorder.error,
    sendText,
    startListening,
    stopListening,
    endSession,
  };
}
