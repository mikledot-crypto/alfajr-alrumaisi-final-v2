import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate } from "@/lib/supabase-helpers";
import { sanitizeHtml } from "@/lib/sanitize";
import { ArrowRight } from "lucide-react";

interface PostMeta {
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  author_name: string;
  published_at: string | null;
  category_name: string | null;
}

export const Route = createFileRoute("/_public/post/$slug")({
  component: PostPage,
  loader: async ({ params }): Promise<{ meta: PostMeta | null }> => {
    const { data } = await supabase
      .from("posts")
      .select("title,excerpt,cover_image,author_name,published_at,categories(name_ar)")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    if (!data) return { meta: null };
    return {
      meta: {
        title: data.title,
        excerpt: data.excerpt,
        cover_image: data.cover_image,
        author_name: data.author_name,
        published_at: data.published_at,
        category_name: data.categories?.name_ar ?? null,
      },
    };
  },
  head: ({ loaderData }) => {
    const m = loaderData?.meta;
    if (!m) {
      return { meta: [{ title: "مقال غير موجود — معتز العلقمي" }] };
    }
    const title = `${m.title} — معتز العلقمي`;
    const desc = m.excerpt ?? `مقال بقلم ${m.author_name} في مدوّنة معتز العلقمي.`;
    const meta = [
      { title },
      { name: "description", content: desc },
      { property: "og:title", content: m.title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "article" },
      { property: "article:author", content: m.author_name },
      ...(m.published_at ? [{ property: "article:published_time", content: m.published_at }] : []),
      ...(m.category_name ? [{ property: "article:section", content: m.category_name }] : []),
      { name: "twitter:title", content: m.title },
      { name: "twitter:description", content: desc },
      { name: "twitter:card", content: m.cover_image ? "summary_large_image" : "summary" },
      ...(m.cover_image
        ? [
            { property: "og:image", content: m.cover_image },
            { name: "twitter:image", content: m.cover_image },
          ]
        : []),
    ];
    return { meta };
  },
});

function PostPage() {
  const { slug } = Route.useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*,categories(name_ar,slug)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20">
        <div className="space-y-4 text-center">
          <div className="skeleton mx-auto h-3 w-24" />
          <div className="skeleton mx-auto h-10 w-3/4" />
          <div className="skeleton mx-auto h-3 w-40" />
        </div>
        <div className="skeleton mt-10 aspect-[16/9] w-full" />
        <div className="mt-10 space-y-3">
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-2/3" />
        </div>
      </div>
    );
  }
  if (!post) {
    throw notFound();
  }

  const safeContent = sanitizeHtml(post.content);

  return (
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <header className="mb-12 text-center">
        {post.categories && (
          <Link
            to="/category/$slug"
            params={{ slug: post.categories.slug }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep hover:text-burgundy hover:underline"
          >
            {post.categories.name_ar}
          </Link>
        )}
        <h1 className="mt-4 font-display text-3xl font-bold leading-[1.2] text-foreground md:text-5xl">
          {post.title}
        </h1>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
          <span>{post.author_name}</span>
          <span className="text-gold">•</span>
          <span>{formatArabicDate(post.published_at)}</span>
          <span className="text-gold">•</span>
          <span>{post.reading_minutes} دقائق قراءة</span>
        </div>
      </header>

      {post.cover_image && (
        <div className="mb-12 overflow-hidden rounded-xl shadow-elegant" style={{ boxShadow: "var(--shadow-luxe)" }}>
          <img src={post.cover_image} alt={post.title} className="w-full" loading="eager" />
        </div>
      )}

      {post.excerpt && (
        <p className="mb-12 border-r-4 border-gold pr-5 font-serif text-lg leading-9 italic text-muted-foreground">
          {post.excerpt}
        </p>
      )}

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />

      <div className="mt-20 border-t border-border/60 pt-8 text-center">
        <Link to="/articles" className="inline-flex items-center gap-2 text-sm font-medium text-gold-deep hover:text-burgundy hover:underline">
          <ArrowRight className="h-4 w-4" />
          عودة إلى كل المقالات
        </Link>
      </div>
    </article>
  );
}
