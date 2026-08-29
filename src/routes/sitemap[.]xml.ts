import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

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
        const now = new Date().toISOString();
        const entries: SitemapEntry[] = [
          { path: "/", lastmod: now, changefreq: "daily", priority: "1.0" },
          { path: "/barbearias", lastmod: now, changefreq: "daily", priority: "0.9" },
          { path: "/servicos", lastmod: now, changefreq: "weekly", priority: "0.8" },
          { path: "/agendar", lastmod: now, changefreq: "weekly", priority: "0.9" },
          { path: "/login", lastmod: now, changefreq: "monthly", priority: "0.5" },
          { path: "/cadastro", lastmod: now, changefreq: "monthly", priority: "0.5" },
          { path: "/para-barbearias", lastmod: now, changefreq: "weekly", priority: "0.8" },
          { path: "/ajuda", lastmod: now, changefreq: "monthly", priority: "0.5" },
          { path: "/privacidade", lastmod: now, changefreq: "monthly", priority: "0.3" },
          { path: "/termos", lastmod: now, changefreq: "monthly", priority: "0.3" },

        ];

        try {
          const { data: shops } = await supabase
            .from("barbershops")
            .select("slug, updated_at, created_at")
            .eq("active", true)
            .not("slug", "is", null);

          for (const shop of shops ?? []) {
            if (!shop.slug) continue;
            const lastmodDate = shop.updated_at || shop.created_at || now;
            entries.push({
              path: `/b/${shop.slug}`,
              lastmod: new Date(lastmodDate).toISOString(),
              changefreq: "weekly",
              priority: "0.8",
            });
          }
        } catch (err) {
          console.error("[sitemap] failed to load dynamic barbershops", err);
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
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        });
      },
    },
  },
});
