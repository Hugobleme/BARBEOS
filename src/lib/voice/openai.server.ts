// Server-only helpers for calling OpenAI APIs (Whisper, Chat Completions, TTS).
const OPENAI_BASE = "https://api.openai.com/v1";

function key() {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY not configured");
  return k;
}

export async function transcribeAudio(audio: Blob, filename = "audio.webm"): Promise<{ text: string; duration_ms: number }> {
  const started = Date.now();
  const form = new FormData();
  form.append("file", audio, filename);
  form.append("model", "whisper-1");
  form.append("language", "pt");
  form.append("response_format", "json");

  const res = await fetch(`${OPENAI_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`Whisper error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { text: string };
  return { text: data.text, duration_ms: Date.now() - started };
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
  tool_call_id?: string;
  name?: string;
}

export interface ChatCompletionResult {
  message: ChatMessage;
  finish_reason: string;
  usage?: { prompt_tokens: number; completion_tokens: number };
}

export async function chatCompletion(params: {
  messages: ChatMessage[];
  tools?: unknown[];
  tool_choice?: "auto" | "none";
}): Promise<ChatCompletionResult> {
  const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: params.messages,
      tools: params.tools,
      tool_choice: params.tool_choice ?? (params.tools ? "auto" : undefined),
      temperature: 0.5,
    }),
  });
  if (!res.ok) throw new Error(`Chat error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as {
    choices: Array<{ message: ChatMessage; finish_reason: string }>;
    usage?: { prompt_tokens: number; completion_tokens: number };
  };
  return {
    message: data.choices[0].message,
    finish_reason: data.choices[0].finish_reason,
    usage: data.usage,
  };
}

export async function synthesizeSpeech(text: string, voice = "nova"): Promise<ArrayBuffer> {
  const res = await fetch(`${OPENAI_BASE}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice,
      input: text,
      response_format: "mp3",
      speed: 1.05,
    }),
  });
  if (!res.ok) throw new Error(`TTS error ${res.status}: ${await res.text()}`);
  return res.arrayBuffer();
}

// Mask common PII patterns (CPF, credit card) before persisting transcripts.
export function maskPII(text: string): string {
  if (!text) return text;
  return text
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[CARTAO]");
}
