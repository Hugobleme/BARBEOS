import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// TODO: substituir pela URL final do projeto (custom domain) quando definida.
const BASE_URL = "";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/servicos", changefreq: "weekly", priority: "0.8" },
          { path: "/profissionais", changefreq: "weekly", priority: "0.8" },
          { path: "/agendar", changefreq: "weekly", priority: "0.9" },
          { path: "/barbearias", changefreq: "weekly", priority: "0.7" },
        ];

        try {
          const { data: shops } = await supabaseAdmin
            .from("barbershops")
            .select("slug, updated_at")
            .not("slug", "is", null);

          for (const shop of shops ?? []) {
            if (!shop.slug) continue;
            entries.push({
              path: `/b/${shop.slug}`,
              lastmod: shop.updated_at
                ? new Date(shop.updated_at).toISOString()
                : undefined,
              changefreq: "weekly",
              priority: "0.6",
            });
          }
        } catch (err) {
          console.error("[sitemap] failed to load barbershops", err);
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${BASE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
