import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeHtml } from "@/lib/sanitize";

export const Route = createFileRoute("/_public/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "عن الموقع — معتز العلقمي" },
      { name: "description", content: "تعرّف على مدوّنة معتز العلقمي ورسالتها." },
    ],
  }),
});

function AboutPage() {
  const { data: page } = useQuery({
    queryKey: ["page", "about"],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("*").eq("slug", "about").maybeSingle();
      return data;
    },
  });

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 text-center">
        <div className="ornament mx-auto mb-4 max-w-xs">❖</div>
        <h1 className="font-display text-4xl font-bold md:text-5xl">{page?.title ?? "عن الموقع"}</h1>
      </header>
      <div className="article-content whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeHtml(page?.content ?? "") }} />
    </div>
  );
}
