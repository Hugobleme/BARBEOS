import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/voice/session")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        const body = (await request.json()) as {
          barbershop_id?: string;
          profile_id?: string | null;
          customer_id?: string | null;
          user_agent?: string | null;
        };
        if (!body.barbershop_id) {
          return Response.json({ error: "barbershop_id required" }, { status: 400 });
        }
        const { data: shop, error: sErr } = await supabaseAdmin
          .from("barbershops")
          .select("id,active")
          .eq("id", body.barbershop_id)
          .single();
        if (sErr || !shop || !shop.active) {
          return Response.json({ error: "barbershop not found" }, { status: 404 });
        }

        const { data, error } = await supabaseAdmin
          .from("voice_sessions")
          .insert({
            barbershop_id: body.barbershop_id,
            profile_id: body.profile_id ?? null,
            customer_id: body.customer_id ?? null,
            user_agent: body.user_agent ?? null,
            status: "active",
          })
          .select("id")
          .single();
        if (error) return Response.json({ error: error.message }, { status: 500 });
        return Response.json({ session_id: data.id });
      },
    },
  },
});
