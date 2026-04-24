import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate } from "@/lib/supabase-helpers";
import { ArticleRowSkeleton } from "@/components/site/Skeleton";

export const Route = createFileRoute("/_public/articles")({
  component: ArticlesPage,
  head: () => ({
    meta: [
      { title: "المقالات — معتز العلقمي" },
      { name: "description", content: "كل المقالات المنشورة في مدوّنة معتز العلقمي — في الأدب والثقافة والتقنية والصيدلة." },
      { property: "og:title", content: "المقالات — معتز العلقمي" },
      { property: "og:description", content: "أرشيف كامل لمقالات المدوّنة." },
      { name: "twitter:title", content: "المقالات — معتز العلقمي" },
      { name: "twitter:description", content: "أرشيف كامل لمقالات المدوّنة." },
    ],
  }),
});

function ArticlesPage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["all_posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,title,slug,excerpt,cover_image,published_at,reading_minutes,categories(name_ar,slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <header className="mb-14 text-center">
        <div className="ornament mb-5 mx-auto max-w-xs">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-gold-deep">المكتبة</span>
        </div>
        <h1 className="font-display text-4xl font-bold md:text-6xl">المقالات</h1>
        <p className="mt-4 text-muted-foreground">جميع ما نُشر في المدوّنة</p>
      </header>

      {isLoading ? (
        <div className="space-y-12">
          {Array.from({ length: 4 }).map((_, i) => <ArticleRowSkeleton key={i} />)}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="space-y-14">
          {posts.map((p) => (
            <article key={p.id} className="group grid gap-7 border-b border-border/60 pb-14 last:border-0 md:grid-cols-[1fr_2fr]">
              <Link to="/post/$slug" params={{ slug: p.slug }} className="block">
                {p.cover_image ? (
                  <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                    <img src={p.cover_image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : (
                  <div className="aspect-[4/3] rounded-lg bg-gradient-to-bl from-accent to-muted" />
                )}
              </Link>
              <div>
                {p.categories && (
                  <Link to="/category/$slug" params={{ slug: p.categories.slug }} className="text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep hover:text-burgundy hover:underline">
                    {p.categories.name_ar}
                  </Link>
                )}
                <Link to="/post/$slug" params={{ slug: p.slug }}>
                  <h2 className="mt-3 font-display text-2xl font-bold leading-snug text-foreground transition-colors group-hover:text-gold-deep md:text-3xl">
                    {p.title}
                  </h2>
                </Link>
                {p.excerpt && <p className="mt-3 line-clamp-3 leading-8 text-muted-foreground">{p.excerpt}</p>}
                <div className="mt-5 text-xs text-muted-foreground">
                  {formatArabicDate(p.published_at)} • {p.reading_minutes} دقائق قراءة
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-16 text-center text-muted-foreground">
          <p className="font-display text-lg">لا توجد مقالات منشورة بعد.</p>
          <p className="mt-2 text-sm">عُد قريبًا — المدوّنة على وشك الانطلاق.</p>
        </div>
      )}
    </div>
  );
}
