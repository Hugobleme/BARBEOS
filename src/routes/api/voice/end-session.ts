import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/voice/end-session")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json()) as { session_id?: string; outcome?: string };
        if (!body.session_id) return Response.json({ error: "session_id required" }, { status: 400 });
        await supabaseAdmin
          .from("voice_sessions")
          .update({
            status: "ended",
            ended_at: new Date().toISOString(),
            outcome: body.outcome ?? "ended",
          })
          .eq("id", body.session_id);
        return Response.json({ ok: true });
      },
    },
  },
});
