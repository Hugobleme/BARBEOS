// Server-only helper for calling Lovable AI Gateway (OpenAI-compatible).
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

function key() {
  const k = process.env.LOVABLE_API_KEY;
  if (!k) throw new Error("LOVABLE_API_KEY not configured");
  return k;
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
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: params.messages,
      tools: params.tools,
      tool_choice: params.tool_choice ?? (params.tools ? "auto" : undefined),
      temperature: 0.5,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("Limite de uso atingido. Tente novamente em instantes.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
    throw new Error(`AI gateway ${res.status}: ${body}`);
  }
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

// Mask common PII patterns (CPF, credit card) before persisting transcripts.
export function maskPII(text: string): string {
  if (!text) return text;
  return text
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "[CPF]")
    .replace(/\b(?:\d[ -]?){13,19}\b/g, "[CARTAO]");
}
