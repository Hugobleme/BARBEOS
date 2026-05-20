import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { transcribeAudio, maskPII } from "@/lib/voice/openai.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/voice/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const form = await request.formData();
          const file = form.get("audio");
          const sessionId = form.get("session_id") as string | null;
          if (!(file instanceof Blob)) {
            return Response.json({ error: "audio (blob) required" }, { status: 400 });
          }
          if (file.size > 10 * 1024 * 1024) {
            return Response.json({ error: "audio too large" }, { status: 413 });
          }
          const { text, duration_ms } = await transcribeAudio(file);
          const masked = maskPII(text);

          if (sessionId && masked) {
            await supabaseAdmin.from("voice_messages").insert({
              session_id: sessionId,
              role: "user",
              content: masked,
              duration_ms,
            });
            await supabaseAdmin.rpc("tg_set_updated_at"); // noop; just trigger updated_at via update below
            await supabaseAdmin
              .from("voice_sessions")
              .update({ total_turns: (undefined as never) ?? undefined })
              .eq("id", sessionId)
              .select()
              .single()
              .then(() => undefined)
              .catch(() => undefined);
          }
          return Response.json({ text: masked, duration_ms });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
