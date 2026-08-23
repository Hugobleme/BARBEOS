import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { S as Sheet, b as SheetContent, c as SheetHeader, d as SheetTitle, e as SheetDescription } from "./sheet-CYhR-3Ru.mjs";
import { B as Button, e as cn, I as Input } from "./router-CU6k9yR1.mjs";
import "../_libs/sonner.mjs";
import { aD as VolumeX, aE as Volume2, X, ap as LoaderCircle, aF as MicOff, ae as Mic, ax as Send } from "../_libs/lucide-react.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "tslib";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tailwind-merge.mjs";
import "./client-BKVQGVvU.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/zod.mjs";
function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus"
  ];
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
    }
  }
  return "";
}
async function blobToBase64(blob) {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 32768;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}
function useVoiceRecorder(opts) {
  const [isRecording, setRecording] = reactExports.useState(false);
  const [level, setLevel] = reactExports.useState(0);
  const [error, setError] = reactExports.useState(null);
  const [isSupported, setSupported] = reactExports.useState(true);
  const recorderRef = reactExports.useRef(null);
  const streamRef = reactExports.useRef(null);
  const chunksRef = reactExports.useRef([]);
  const audioCtxRef = reactExports.useRef(null);
  const analyserRef = reactExports.useRef(null);
  const rafRef = reactExports.useRef(null);
  const silenceStartRef = reactExports.useRef(null);
  const maxTimerRef = reactExports.useRef(null);
  const cancelledRef = reactExports.useRef(false);
  const optsRef = reactExports.useRef(opts);
  optsRef.current = opts;
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
    setSupported(ok);
  }, []);
  const cleanup = reactExports.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    maxTimerRef.current = null;
    silenceStartRef.current = null;
    try {
      analyserRef.current?.disconnect();
    } catch {
    }
    try {
      audioCtxRef.current?.close();
    } catch {
    }
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLevel(0);
  }, []);
  const stop = reactExports.useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try {
        rec.stop();
      } catch {
      }
    } else {
      cleanup();
      setRecording(false);
    }
  }, [cleanup]);
  const cancel = reactExports.useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);
  const start = reactExports.useCallback(async () => {
    setError(null);
    cancelledRef.current = false;
    chunksRef.current = [];
    const silenceMs = optsRef.current.silenceMs ?? 1500;
    const maxMs = optsRef.current.maxMs ?? 3e4;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : void 0);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        const finalMime = rec.mimeType || mime || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: finalMime });
        cleanup();
        setRecording(false);
        if (cancelledRef.current) return;
        if (blob.size < 800) {
          optsRef.current.onError?.("Áudio muito curto");
          return;
        }
        try {
          const b64 = await blobToBase64(blob);
          optsRef.current.onRecorded(b64, finalMime);
        } catch (e) {
          optsRef.current.onError?.(e instanceof Error ? e.message : "erro de áudio");
        }
      };
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyserRef.current = analyser;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const startedAt = performance.now();
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setLevel(Math.min(1, rms * 4));
        const now = performance.now();
        const elapsed = now - startedAt;
        const speaking = rms > 0.04;
        if (speaking) {
          silenceStartRef.current = null;
        } else if (elapsed > 800) {
          if (silenceStartRef.current == null) silenceStartRef.current = now;
          else if (now - silenceStartRef.current > silenceMs) {
            stop();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rec.start(250);
      setRecording(true);
      rafRef.current = requestAnimationFrame(tick);
      maxTimerRef.current = setTimeout(() => stop(), maxMs);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Permissão negada";
      setError(msg);
      optsRef.current.onError?.(msg);
      cleanup();
      setRecording(false);
    }
  }, [cleanup, stop]);
  reactExports.useEffect(() => () => {
    cancelledRef.current = true;
    stop();
  }, [stop]);
  return { isRecording, level, error, isSupported, start, stop, cancel };
}
function parseRate(mime) {
  const m = mime.match(/rate=(\d+)/i);
  return m ? parseInt(m[1], 10) : 24e3;
}
async function playPcmBase64(base64, mime) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const pcm = new Int16Array(bytes.buffer, bytes.byteOffset, Math.floor(bytes.byteLength / 2));
  const rate = parseRate(mime);
  const AC = window.AudioContext || window.webkitAudioContext;
  const ctx = new AC({ sampleRate: rate });
  const buf = ctx.createBuffer(1, pcm.length, rate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
  return new Promise((resolve) => {
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.onended = () => {
      ctx.close().catch(() => void 0);
      resolve();
    };
    src.start();
  });
}
function fallbackSpeak(text) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "pt-BR";
      const v = window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith("pt"));
      if (v) u.voice = v;
      let done = false;
      const finish = () => {
        if (!done) {
          done = true;
          resolve();
        }
      };
      u.onend = finish;
      u.onerror = finish;
      window.speechSynthesis.speak(u);
      setTimeout(finish, Math.min(15e3, Math.max(2500, text.length * 90)));
    } catch {
      resolve();
    }
  });
}
function useAurora({ barbershopId, enabled, muted = false }) {
  const [sessionId, setSessionId] = reactExports.useState(null);
  const [status, setStatus] = reactExports.useState("idle");
  const [messages, setMessages] = reactExports.useState([]);
  const [error, setError] = reactExports.useState(null);
  const mutedRef = reactExports.useRef(muted);
  mutedRef.current = muted;
  const ensureSession = reactExports.useCallback(async () => {
    if (sessionId) return sessionId;
    const res = await fetch("/api/voice/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        barbershop_id: barbershopId,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null
      })
    });
    const data = await res.json();
    if (!res.ok || !data.session_id) throw new Error(data.error ?? "session error");
    setSessionId(data.session_id);
    return data.session_id;
  }, [sessionId, barbershopId]);
  const sendTurn = reactExports.useCallback(
    async (payload) => {
      setError(null);
      setStatus("thinking");
      try {
        const sid = await ensureSession();
        const res = await fetch("/api/voice/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session_id: sid, mute: mutedRef.current, ...payload })
        });
        const data = await res.json();
        if (!res.ok || !data.text) throw new Error(data.error ?? "erro na resposta");
        const userText = (payload.user_text ?? data.user_text ?? "").trim();
        const newMessages = [];
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
            await fallbackSpeak(data.text).catch(() => void 0);
          }
        }
        setStatus("idle");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "erro";
        setError(msg);
        setStatus("error");
        setTimeout(() => setStatus((s) => s === "error" ? "idle" : s), 1500);
      }
    },
    [ensureSession]
  );
  const recorder = useVoiceRecorder({
    onRecorded: (b64, mime) => {
      void sendTurn({ audio_base64: b64, audio_mime: mime });
    },
    onError: (msg) => {
      setError(msg);
      setStatus("idle");
    }
  });
  reactExports.useEffect(() => {
    if (recorder.isRecording) setStatus("listening");
    else setStatus((cur) => cur === "listening" ? "idle" : cur);
  }, [recorder.isRecording]);
  const sendText = reactExports.useCallback((text) => {
    if (!text.trim()) return;
    void sendTurn({ user_text: text.trim() });
  }, [sendTurn]);
  const startListening = reactExports.useCallback(() => {
    setError(null);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
      }
    }
    void recorder.start();
  }, [recorder]);
  const stopListening = reactExports.useCallback(() => {
    recorder.stop();
  }, [recorder]);
  const endSession = reactExports.useCallback(async () => {
    recorder.cancel();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
      }
    }
    if (sessionId) {
      await fetch("/api/voice/end-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, outcome: "ended" })
      }).catch(() => void 0);
    }
    setSessionId(null);
    setMessages([]);
    setStatus("idle");
    setError(null);
  }, [sessionId, recorder]);
  reactExports.useEffect(() => {
    if (!enabled && typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
      }
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
    endSession
  };
}
const statusLabel = {
  idle: "Toque no microfone para falar",
  listening: "Ouvindo…",
  thinking: "Pensando…",
  speaking: "Falando…",
  error: "Algo deu errado"
};
function AuroraDrawer({ open, onOpenChange, barbershopId, barbershopName }) {
  const [muted, setMuted] = reactExports.useState(false);
  const [text, setText] = reactExports.useState("");
  const aurora = useAurora({ barbershopId, enabled: open, muted });
  const scrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [aurora.messages.length, aurora.status]);
  reactExports.useEffect(() => {
    if (!open) aurora.endSession();
  }, [open]);
  const handleMicTap = () => {
    if (aurora.status === "listening") {
      aurora.stopListening();
    } else if (aurora.status === "idle" || aurora.status === "error") {
      aurora.startListening();
    }
  };
  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    aurora.sendText(text.trim());
    setText("");
  };
  const pulseScale = 1 + aurora.level * 0.4;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Sheet, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetContent, { side: "bottom", className: "h-[90vh] flex flex-col gap-0 p-0 bg-gradient-to-b from-background to-background/95", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(SheetHeader, { className: "px-5 py-4 border-b border-border/40 flex-row items-center justify-between space-y-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-10 w-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center text-background font-bold", children: [
          "A",
          (aurora.status === "listening" || aurora.status === "speaking") && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 rounded-full bg-amber-400/40 animate-ping" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetTitle, { className: "text-base", children: "Aurora" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SheetDescription, { className: "text-xs", children: barbershopName ? `Assistente de ${barbershopName}` : "Assistente de voz" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => setMuted((m) => !m), "aria-label": muted ? "Ativar voz" : "Silenciar", children: muted ? /* @__PURE__ */ jsxRuntimeExports.jsx(VolumeX, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Volume2, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "icon", onClick: () => onOpenChange(false), "aria-label": "Fechar", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: scrollRef, className: "flex-1 overflow-y-auto px-5 py-4 space-y-3", children: [
      aurora.messages.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center text-sm text-muted-foreground py-12", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-2", children: "Olá! Eu sou a Aurora." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Posso agendar seu corte agora mesmo. É só falar comigo." })
      ] }),
      aurora.messages.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex", m.role === "user" ? "justify-end" : "justify-start"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: cn(
            "max-w-[80%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap",
            m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"
          ),
          children: m.content
        }
      ) }, m.id)),
      aurora.status === "thinking" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-start", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-muted rounded-2xl px-4 py-3 rounded-bl-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin text-muted-foreground" }) }) }),
      aurora.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive text-center", children: aurora.error }),
      !aurora.isSupported && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-destructive text-center", children: "Seu navegador não suporta gravação de áudio." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border/40 px-5 py-4 space-y-3 bg-background/50 backdrop-blur", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleMicTap,
            disabled: aurora.status === "thinking" || aurora.status === "speaking",
            className: cn(
              "relative h-20 w-20 rounded-full flex items-center justify-center transition-all",
              "bg-gradient-to-br from-amber-300 to-amber-600 text-background shadow-lg shadow-amber-500/30",
              "disabled:opacity-40 disabled:cursor-not-allowed",
              aurora.status === "listening" && "ring-4 ring-amber-400/60"
            ),
            style: aurora.status === "listening" ? { transform: `scale(${pulseScale})` } : void 0,
            "aria-label": aurora.status === "listening" ? "Parar gravação" : "Falar com a Aurora",
            children: aurora.status === "thinking" || aurora.status === "speaking" ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin" }) : aurora.status === "listening" ? /* @__PURE__ */ jsxRuntimeExports.jsx(MicOff, { className: "h-8 w-8" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Mic, { className: "h-8 w-8" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: statusLabel[aurora.status] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSend, className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Input,
          {
            value: text,
            onChange: (e) => setText(e.target.value),
            placeholder: "Ou digite sua mensagem…",
            className: "flex-1",
            disabled: aurora.status === "thinking" || aurora.status === "speaking"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", size: "icon", variant: "secondary", disabled: !text.trim(), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-center text-muted-foreground/70", children: "Sua conversa pode ser registrada para melhorar o atendimento. Não compartilhe dados sensíveis." })
    ] })
  ] }) });
}
export {
  AuroraDrawer
};
