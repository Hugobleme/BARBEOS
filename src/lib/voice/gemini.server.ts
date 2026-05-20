// Gemini API helpers — multimodal (audio in) + TTS.
// All calls hit Google's REST API with GEMINI_API_KEY (server-only).

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

// Main reasoning model with function calling + audio input.
const REASONING_MODEL = "gemini-2.0-flash";
// TTS model returning PCM audio inline.
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } }
  | { functionCall: { name: string; args: Record<string, unknown> } }
  | { functionResponse: { name: string; response: Record<string, unknown> } };

export interface GeminiContent {
  role: "user" | "model" | "function";
  parts: GeminiPart[];
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

export interface GeminiResponse {
  candidates?: Array<{
    content?: GeminiContent;
    finishReason?: string;
  }>;
  usageMetadata?: GeminiUsage;
  error?: { message: string };
}

interface GenerateOpts {
  systemInstruction: string;
  contents: GeminiContent[];
  functionDeclarations?: GeminiFunctionDeclaration[];
}

export async function geminiGenerate(opts: GenerateOpts): Promise<GeminiResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const body = {
    system_instruction: { parts: [{ text: opts.systemInstruction }] },
    contents: opts.contents,
    tools: opts.functionDeclarations
      ? [{ functionDeclarations: opts.functionDeclarations }]
      : undefined,
    generationConfig: {
      temperature: 0.6,
      maxOutputTokens: 800,
      responseModalities: ["TEXT"],
    },
  };

  const res = await fetch(
    `${API_BASE}/models/${REASONING_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const json = (await res.json()) as GeminiResponse;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message ?? `Gemini ${res.status}`);
  }
  return json;
}

export interface TtsResult {
  audioBase64: string;
  // PCM 24kHz mono signed 16-bit LE
  mimeType: string;
}

export async function geminiTts(
  text: string,
  voiceName: string = "Aoede",
): Promise<TtsResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !text.trim()) return null;

  const body = {
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } },
      },
    },
  };

  const res = await fetch(
    `${API_BASE}/models/${TTS_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) return null;
  const json = (await res.json()) as GeminiResponse;
  const part = json.candidates?.[0]?.content?.parts?.find(
    (p): p is { inlineData: { mimeType: string; data: string } } =>
      "inlineData" in p && !!p.inlineData?.data,
  );
  if (!part) return null;
  return {
    audioBase64: part.inlineData.data,
    mimeType: part.inlineData.mimeType || "audio/L16;codec=pcm;rate=24000",
  };
}

// Basic PII masking for transcripts before persisting.
export function maskPII(s: string): string {
  return s
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[CARTAO]");
}
