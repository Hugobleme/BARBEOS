import { useCallback, useEffect, useRef, useState } from "react";

export interface VoiceRecorderState {
  isRecording: boolean;
  level: number; // 0..1 amplitude indicator
  error: string | null;
  isSupported: boolean;
}

interface Opts {
  onRecorded: (audioBase64: string, mimeType: string) => void;
  onError?: (err: string) => void;
  silenceMs?: number; // auto-stop after this much silence
  maxMs?: number; // hard cap
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ];
  for (const m of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      /* noop */
    }
  }
  return "";
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function useVoiceRecorder(opts: Opts) {
  const [isRecording, setRecording] = useState(false);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setSupported] = useState(true);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelledRef = useRef(false);

  const optsRef = useRef(opts);
  optsRef.current = opts;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== "undefined";
    setSupported(ok);
  }, []);

  const cleanup = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    maxTimerRef.current = null;
    silenceStartRef.current = null;
    try { analyserRef.current?.disconnect(); } catch { /* noop */ }
    try { audioCtxRef.current?.close(); } catch { /* noop */ }
    analyserRef.current = null;
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setLevel(0);
  }, []);

  const stop = useCallback(() => {
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch { /* noop */ }
    } else {
      cleanup();
      setRecording(false);
    }
  }, [cleanup]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    stop();
  }, [stop]);

  const start = useCallback(async () => {
    setError(null);
    cancelledRef.current = false;
    chunksRef.current = [];
    const silenceMs = optsRef.current.silenceMs ?? 1500;
    const maxMs = optsRef.current.maxMs ?? 30000;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
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

      // VAD via amplitude
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
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

  useEffect(() => () => { cancelledRef.current = true; stop(); }, [stop]);

  return { isRecording, level, error, isSupported, start, stop, cancel };
}
