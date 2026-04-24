import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = `${url.protocol}//${url.host}`;

        const [postsRes, catsRes] = await Promise.all([
          supabase
            .from("posts")
            .select("slug,updated_at,published_at")
            .eq("status", "published")
            .order("published_at", { ascending: false }),
          supabase.from("categories").select("slug,updated_at"),
        ]);

        const staticUrls = ["", "/articles", "/about", "/contact"].map(
          (p) => `<url><loc>${origin}${p}</loc><changefreq>weekly</changefreq><priority>${p === "" ? "1.0" : "0.7"}</priority></url>`,
        );

        const postUrls = (postsRes.data ?? []).map(
          (p) =>
            `<url><loc>${origin}/post/${encodeURIComponent(p.slug)}</loc><lastmod>${(p.updated_at ?? p.published_at ?? new Date().toISOString()).slice(0, 10)}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`,
        );

        const catUrls = (catsRes.data ?? []).map(
          (c) =>
            `<url><loc>${origin}/category/${encodeURIComponent(c.slug)}</loc><lastmod>${(c.updated_at ?? new Date().toISOString()).slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`,
        );

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...catUrls, ...postUrls].join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
