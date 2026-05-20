import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { auroraTools, runTool } from "@/lib/voice/tools.server";
import { buildSystemPrompt } from "@/lib/voice/system-prompt";
import {
  geminiGenerate,
  geminiTts,
  maskPII,
  type GeminiContent,
} from "@/lib/voice/gemini.server";

const MAX_TOOL_HOPS = 6;

export const Route = createFileRoute("/api/voice/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as {
            session_id?: string;
            user_text?: string;
            audio_base64?: string;
            audio_mime?: string;
            mute?: boolean;
          };
          if (!body.session_id) {
            return Response.json({ error: "session_id required" }, { status: 400 });
          }
          if (!body.user_text && !body.audio_base64) {
            return Response.json({ error: "user_text or audio_base64 required" }, { status: 400 });
          }

          const { data: session, error: sErr } = await supabaseAdmin
            .from("voice_sessions")
            .select("id,barbershop_id,status,total_turns")
            .eq("id", body.session_id)
            .single();
          if (sErr || !session) return Response.json({ error: "session not found" }, { status: 404 });
          if (session.status !== "active") {
            return Response.json({ error: "session ended" }, { status: 410 });
          }

          const { data: shop } = await supabaseAdmin
            .from("barbershops")
            .select("name,settings")
            .eq("id", session.barbershop_id)
            .single();
          const settings = (shop?.settings as Record<string, unknown> | null) ?? {};
          const aurora = (settings.aurora as {
            welcome?: string;
            persona?: string;
            max_turns?: number;
            voice?: string;
            enabled?: boolean;
          } | undefined) ?? {};
          const maxTurns = aurora.max_turns ?? 15;
          if (session.total_turns >= maxTurns) {
            return Response.json({ error: "max turns reached" }, { status: 429 });
          }

          // Reconstruct conversation history (text only — audio not replayed to model)
          const { data: history } = await supabaseAdmin
            .from("voice_messages")
            .select("role,content,tool_name,tool_payload,tool_result")
            .eq("session_id", session.id)
            .order("created_at", { ascending: true });

          const isFirstTurn = (history?.length ?? 0) === 0;

          const systemPrompt = buildSystemPrompt({
            barbershopName: shop?.name ?? "barbearia",
            welcomeMessage: aurora.welcome,
            extraPersona: aurora.persona,
            nowIso: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            isFirstTurn,
          });

          const contents: GeminiContent[] = [];
          for (const m of history ?? []) {
            const row = m as {
              role: string;
              content: string | null;
              tool_name: string | null;
              tool_payload: unknown;
              tool_result: unknown;
            };
            if (row.role === "user") {
              contents.push({ role: "user", parts: [{ text: row.content ?? "" }] });
            } else if (row.role === "assistant") {
              contents.push({ role: "model", parts: [{ text: row.content ?? "" }] });
            } else if (row.role === "tool" && row.tool_name) {
              contents.push({
                role: "model",
                parts: [{
                  functionCall: {
                    name: row.tool_name,
                    args: (row.tool_payload as Record<string, unknown>) ?? {},
                  },
                }],
              });
              contents.push({
                role: "function",
                parts: [{
                  functionResponse: {
                    name: row.tool_name,
                    response: (row.tool_result as Record<string, unknown>) ?? {},
                  },
                }],
              });
            }
          }

          // Current user turn
          if (body.audio_base64) {
            contents.push({
              role: "user",
              parts: [
                { inlineData: { mimeType: body.audio_mime || "audio/webm", data: body.audio_base64 } },
              ],
            });
          } else {
            contents.push({ role: "user", parts: [{ text: body.user_text! }] });
          }

          // Tool calling loop
          let assistantText = "";
          let userTranscript = body.user_text ?? "";
          let totalIn = 0;
          let totalOut = 0;
          let toolUsed = false;

          for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
            const resp = await geminiGenerate({
              systemInstruction: systemPrompt,
              contents,
              functionDeclarations: auroraTools,
            });
            totalIn += resp.usageMetadata?.promptTokenCount ?? 0;
            totalOut += resp.usageMetadata?.candidatesTokenCount ?? 0;

            const parts = resp.candidates?.[0]?.content?.parts ?? [];
            const fnCalls = parts.filter(
              (p): p is { functionCall: { name: string; args: Record<string, unknown> } } =>
                "functionCall" in p && !!p.functionCall,
            );

            if (fnCalls.length > 0) {
              toolUsed = true;
              // Push model's tool-call turn
              contents.push({ role: "model", parts: fnCalls.map((p) => ({ functionCall: p.functionCall })) });
              const responseParts: Array<{ functionResponse: { name: string; response: Record<string, unknown> } }> = [];
              for (const call of fnCalls) {
                let result: unknown;
                try {
                  result = await runTool(call.functionCall.name, call.functionCall.args, session.barbershop_id);
                } catch (err) {
                  result = { error: err instanceof Error ? err.message : "tool failed" };
                }
                await supabaseAdmin.from("voice_messages").insert({
                  session_id: session.id,
                  role: "tool",
                  content: null,
                  tool_name: call.functionCall.name,
                  tool_payload: call.functionCall.args as never,
                  tool_result: result as never,
                });
                responseParts.push({
                  functionResponse: {
                    name: call.functionCall.name,
                    response: (result as Record<string, unknown>) ?? {},
                  },
                });

                if (
                  call.functionCall.name === "criar_agendamento" &&
                  result &&
                  typeof result === "object" &&
                  "appointment_id" in result
                ) {
                  await supabaseAdmin
                    .from("voice_sessions")
                    .update({
                      appointment_id: (result as { appointment_id: string }).appointment_id,
                      outcome: "booked",
                    })
                    .eq("id", session.id);
                }
              }
              contents.push({ role: "function", parts: responseParts });
              continue;
            }

            // Final text
            const textPart = parts.find((p): p is { text: string } => "text" in p && typeof p.text === "string");
            assistantText = textPart?.text?.trim() ?? "";
            break;
          }

          if (!assistantText) {
            assistantText = "Desculpa, não entendi. Pode repetir?";
          }

          // If audio input, try to extract a transcript from history we just sent.
          // Gemini doesn't return separate transcripts, so we ask it briefly via a no-tool follow-up only if needed.
          // For simplicity + cost, we skip a separate transcript call and use a placeholder.
          if (body.audio_base64 && !userTranscript) {
            userTranscript = "[áudio]";
          }

          // Persist user turn
          await supabaseAdmin.from("voice_messages").insert({
            session_id: session.id,
            role: "user",
            content: maskPII(userTranscript),
          });

          // Generate TTS (best-effort, fail-soft)
          let audioOut: { audioBase64: string; mimeType: string } | null = null;
          if (!body.mute) {
            try {
              audioOut = await geminiTts(assistantText, aurora.voice || "Aoede");
            } catch {
              audioOut = null;
            }
          }

          await supabaseAdmin.from("voice_messages").insert({
            session_id: session.id,
            role: "assistant",
            content: assistantText,
            tokens_in: totalIn,
            tokens_out: totalOut,
          });
          await supabaseAdmin
            .from("voice_sessions")
            .update({ total_turns: session.total_turns + 1 })
            .eq("id", session.id);

          return Response.json({
            text: assistantText,
            user_text: userTranscript,
            audio_base64: audioOut?.audioBase64 ?? null,
            audio_mime: audioOut?.mimeType ?? null,
            tool_used: toolUsed,
            tokens_in: totalIn,
            tokens_out: totalOut,
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          console.error("[voice/chat]", msg);
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
