import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { authorInitials, formatArabicDate, makeExcerpt } from "@/lib/supabase-helpers";
import { PostCardSkeleton } from "@/components/site/Skeleton";

interface CategoryMeta {
  name_ar: string;
  description: string | null;
}

export const Route = createFileRoute("/_public/category/$slug")({
  component: CategoryPage,
  loader: async ({ params }): Promise<{ category: CategoryMeta | null }> => {
    const { data } = await supabase
      .from("categories")
      .select("name_ar,description")
      .eq("slug", params.slug)
      .maybeSingle();
    return { category: data };
  },
  head: ({ loaderData, params }) => {
    const c = loaderData?.category;
    if (!c) return { meta: [{ title: "تصنيف غير موجود — معتز العلقمي" }] };
    const title = `${c.name_ar} — معتز العلقمي`;
    const desc = c.description ?? `كل ما نُشر في تصنيف ${c.name_ar} على مدوّنة معتز العلقمي.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: c.name_ar },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:title", content: c.name_ar },
        { name: "twitter:description", content: desc },
        { name: "category-slug", content: params.slug },
      ],
    };
  },
});

function CategoryPage() {
  const { slug } = Route.useParams();

  const { data: category, isLoading: catLoading } = useQuery({
    queryKey: ["category", slug],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["category_posts", slug],
    enabled: !!category?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,title,slug,excerpt,content,cover_image,published_at,reading_minutes,author_name")
        .eq("status", "published")
        .eq("category_id", category!.id)
        .order("published_at", { ascending: false });
      return data ?? [];
    },
  });

  if (catLoading) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-16">
        <div className="mx-auto max-w-xl space-y-4 text-center">
          <div className="skeleton mx-auto h-3 w-24" />
          <div className="skeleton mx-auto h-10 w-2/3" />
          <div className="skeleton mx-auto h-3 w-3/4" />
        </div>
      </div>
    );
  }
  if (!category) throw notFound();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-16">
      <header className="mb-14 text-center">
        <div className="ornament mb-5 mx-auto max-w-xs">
          <span className="font-display text-xs uppercase tracking-[0.35em] text-gold-deep">تصنيف</span>
        </div>
        <h1 className="font-display text-4xl font-bold md:text-6xl">{category.name_ar}</h1>
        {category.description && (
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-muted-foreground">{category.description}</p>
        )}
      </header>

      {postsLoading ? (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)}
        </div>
      ) : posts && posts.length > 0 ? (
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <Link key={p.id} to="/post/$slug" params={{ slug: p.slug }} className="group flex flex-col">
              {p.cover_image ? (
                <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                  <img src={p.cover_image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              ) : (
                <div className="aspect-[16/10] rounded-lg bg-gradient-to-bl from-accent to-muted" />
              )}
              <h3 className="mt-4 font-display text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-gold-deep">
                {p.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">{p.excerpt || makeExcerpt(p.content || "")}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 font-bold text-gold-deep">{authorInitials(p.author_name)}</span><span>{p.author_name || "معتز العلقمي"}</span><span>•</span><span>{formatArabicDate(p.published_at)}</span><span>•</span><span>{p.reading_minutes} دقائق</span></div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-16 text-center text-muted-foreground">
          <p className="font-display text-lg">لا توجد مقالات في هذا التصنيف بعد.</p>
          <Link to="/articles" className="mt-3 inline-block text-sm text-gold-deep hover:underline">تصفّح كل المقالات ←</Link>
        </div>
      )}
    </div>
  );
}
