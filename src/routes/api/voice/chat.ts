import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { chatCompletion, maskPII, type ChatMessage } from "@/lib/voice/openai.server";
import { auroraTools, runTool } from "@/lib/voice/tools.server";
import { buildSystemPrompt } from "@/lib/voice/system-prompt";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const MAX_TOOL_HOPS = 5;

export const Route = createFileRoute("/api/voice/chat")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as {
            session_id?: string;
            user_text?: string;
          };
          if (!body.session_id || !body.user_text) {
            return Response.json({ error: "session_id and user_text required" }, { status: 400 });
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
          const aurora = (settings.aurora as { welcome?: string; persona?: string; max_turns?: number } | undefined) ?? {};
          const maxTurns = aurora.max_turns ?? 20;
          if (session.total_turns >= maxTurns) {
            return Response.json({ error: "max turns reached" }, { status: 429 });
          }

          // Persist user message (already may have been persisted by /transcribe; if not, do it now)
          const userMasked = maskPII(body.user_text);
          await supabaseAdmin.from("voice_messages").insert({
            session_id: session.id,
            role: "user",
            content: userMasked,
          });

          // Reconstruct conversation
          const { data: history } = await supabaseAdmin
            .from("voice_messages")
            .select("role,content,tool_name,tool_payload,tool_result")
            .eq("session_id", session.id)
            .order("created_at", { ascending: true });

          const systemMsg: ChatMessage = {
            role: "system",
            content: buildSystemPrompt({
              barbershopName: shop?.name ?? "barbearia",
              welcomeMessage: aurora.welcome,
              extraPersona: aurora.persona,
              nowIso: new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            }),
          };

          const messages: ChatMessage[] = [systemMsg];
          for (const m of history ?? []) {
            const row = m as { role: string; content: string | null; tool_name: string | null; tool_result: unknown };
            if (row.role === "user" || row.role === "assistant") {
              messages.push({ role: row.role, content: row.content ?? "" });
            } else if (row.role === "tool") {
              messages.push({
                role: "tool",
                content: JSON.stringify(row.tool_result ?? {}),
                tool_call_id: row.tool_name ?? "tool",
              });
            }
          }

          // Tool loop
          let assistantText = "";
          let totalIn = 0;
          let totalOut = 0;
          for (let hop = 0; hop < MAX_TOOL_HOPS; hop++) {
            const completion = await chatCompletion({
              messages,
              tools: auroraTools,
            });
            totalIn += completion.usage?.prompt_tokens ?? 0;
            totalOut += completion.usage?.completion_tokens ?? 0;
            const msg = completion.message;
            messages.push(msg);

            if (msg.tool_calls && msg.tool_calls.length > 0) {
              for (const call of msg.tool_calls) {
                let args: Record<string, unknown> = {};
                try {
                  args = JSON.parse(call.function.arguments || "{}");
                } catch {
                  args = {};
                }
                let result: unknown;
                try {
                  result = await runTool(call.function.name, args, session.barbershop_id);
                } catch (err) {
                  result = { error: err instanceof Error ? err.message : "tool failed" };
                }
                await supabaseAdmin.from("voice_messages").insert({
                  session_id: session.id,
                  role: "tool",
                  content: null,
                  tool_name: call.function.name,
                  tool_payload: args,
                  tool_result: result as never,
                });
                messages.push({
                  role: "tool",
                  content: JSON.stringify(result),
                  tool_call_id: call.id,
                });

                // Side effect: link appointment to session if created
                if (call.function.name === "criar_agendamento" && result && typeof result === "object" && "appointment_id" in result) {
                  await supabaseAdmin
                    .from("voice_sessions")
                    .update({
                      appointment_id: (result as { appointment_id: string }).appointment_id,
                      outcome: "booked",
                    })
                    .eq("id", session.id);
                }
              }
              continue;
            }
            assistantText = msg.content ?? "";
            break;
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

          return Response.json({ text: assistantText, tokens_in: totalIn, tokens_out: totalOut });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
