import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { synthesizeSpeech } from "@/lib/voice/openai.server";

export const Route = createFileRoute("/api/voice/synthesize")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as { text?: string; voice?: string };
          if (!body.text || body.text.length === 0) {
            return Response.json({ error: "text required" }, { status: 400 });
          }
          if (body.text.length > 1000) {
            return Response.json({ error: "text too long" }, { status: 413 });
          }
          const audio = await synthesizeSpeech(body.text, body.voice ?? "nova");
          return new Response(audio, {
            status: 200,
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "no-store",
            },
          });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "unknown";
          return Response.json({ error: msg }, { status: 500 });
        }
      },
    },
  },
});
