import { useCallback, useEffect, useRef, useState } from "react";

interface UseVoiceRecorderOptions {
  silenceMs?: number; // VAD silence threshold to auto-stop
  silenceThreshold?: number; // RMS amplitude below which counts as silence (0-1)
  maxDurationMs?: number;
  onAutoStop?: (blob: Blob) => void;
}

interface VoiceRecorderState {
  isRecording: boolean;
  isSupported: boolean;
  level: number; // 0..1 current input level for visualization
  error: string | null;
}

export function useVoiceRecorder(opts: UseVoiceRecorderOptions = {}) {
  const { silenceMs = 1500, silenceThreshold = 0.025, maxDurationMs = 60_000, onAutoStop } = opts;
  const [state, setState] = useState<VoiceRecorderState>({
    isRecording: false,
    isSupported: typeof navigator !== "undefined" && !!navigator.mediaDevices,
    level: 0,
    error: null,
  });

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const startedAtRef = useRef<number>(0);
  const stopResolverRef = useRef<((blob: Blob) => void) | null>(null);
  const autoStopRef = useRef(onAutoStop);
  autoStopRef.current = onAutoStop;

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => undefined);
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    silenceStartRef.current = null;
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    const rec = recorderRef.current;
    if (!rec || rec.state === "inactive") {
      cleanup();
      setState((s) => ({ ...s, isRecording: false, level: 0 }));
      return Promise.resolve(null);
    }
    return new Promise<Blob | null>((resolve) => {
      stopResolverRef.current = (blob) => resolve(blob);
      rec.stop();
    });
  }, [cleanup]);

  const start = useCallback(async () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") return;
    setState((s) => ({ ...s, error: null }));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;

      // VAD setup
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AC();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      source.connect(analyser);
      analyserRef.current = analyser;

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime || "audio/webm" });
        cleanup();
        setState((s) => ({ ...s, isRecording: false, level: 0 }));
        const resolver = stopResolverRef.current;
        stopResolverRef.current = null;
        resolver?.(blob);
      };

      recorder.start(250);
      setState((s) => ({ ...s, isRecording: true }));

      // VAD loop
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setState((s) => (Math.abs(s.level - rms) > 0.01 ? { ...s, level: Math.min(1, rms * 4) } : s));

        const now = Date.now();
        if (now - startedAtRef.current > maxDurationMs) {
          // hard cap
          stop().then((b) => {
            if (b) autoStopRef.current?.(b);
          });
          return;
        }
        if (rms < silenceThreshold) {
          if (silenceStartRef.current == null) silenceStartRef.current = now;
          else if (now - silenceStartRef.current > silenceMs && now - startedAtRef.current > 1000) {
            // require at least 1s of speech before auto-stopping
            stop().then((b) => {
              if (b) autoStopRef.current?.(b);
            });
            return;
          }
        } else {
          silenceStartRef.current = null;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone error";
      setState((s) => ({ ...s, error: msg, isRecording: false }));
      cleanup();
    }
  }, [cleanup, maxDurationMs, silenceMs, silenceThreshold, stop]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { ...state, start, stop };
}
