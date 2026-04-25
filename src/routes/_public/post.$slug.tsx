import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { authorInitials, formatArabicDate } from "@/lib/supabase-helpers";
import { sanitizeHtml } from "@/lib/sanitize";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";

interface PostMeta {
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  author_name: string | null;
  published_at: string | null;
  category_name: string | null;
  seo_title: string | null;
  seo_description: string | null;
  canonical_url: string | null;
}

export const Route = createFileRoute("/_public/post/$slug")({
  component: PostPage,
  loader: async ({ params }): Promise<{ meta: PostMeta | null }> => {
    const { data } = await supabase
      .from("posts")
      .select("title,excerpt,cover_image,published_at,categories(name_ar),seo_title,seo_description,profiles(display_name)")
      .eq("slug", params.slug)
      .eq("status", "published")
      .maybeSingle();
    
    if (!data) return { meta: null };
    
    const authorName = (data.profiles as any)?.display_name || "معتز العلقمي";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://alfajr-alrumaisi.com";
    const canonicalUrl = `${origin}/post/${params.slug}`;

    return {
      meta: {
        title: data.title,
        excerpt: data.excerpt,
        cover_image: data.cover_image,
        author_name: authorName,
        published_at: data.published_at,
        category_name: (data.categories as any)?.name_ar ?? null,
        seo_title: data.seo_title,
        seo_description: data.seo_description,
        canonical_url: canonicalUrl,
      },
    };
  },
  head: ({ loaderData }) => {
    const m = loaderData?.meta;
    if (!m) {
      return { meta: [{ title: "مقال غير موجود — معتز العلقمي" }] };
    }
    
    const title = m.seo_title || `${m.title} — معتز العلقمي`;
    const desc = m.seo_description || m.excerpt || `مقال بقلم ${m.author_name} في مدوّنة معتز العلقمي.`;
    
    // Structured Data (Schema.org Article)
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": m.title,
      "description": desc,
      "image": m.cover_image || "",
      "author": {
        "@type": "Person",
        "name": m.author_name || "معتز العلقمي"
      },
      "datePublished": m.published_at,
      "publisher": {
        "@type": "Organization",
        "name": "معتز العلقمي",
        "logo": {
          "@type": "ImageObject",
          "url": ""
        }
      }
    };

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
      ...(m.canonical_url ? [{ rel: "canonical", href: m.canonical_url }] : []),
    ];

    return { 
      meta,
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd)
        }
      ]
    };
  },
});

function PostPage() {
  const { slug } = Route.useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["post", slug],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("*,categories(name_ar,slug),profiles(display_name)")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-20 animate-pulse">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-3 w-24 rounded bg-muted" />
          <div className="mx-auto h-10 w-3/4 rounded bg-muted" />
          <div className="mx-auto h-3 w-40 rounded bg-muted" />
        </div>
        <div className="mt-10 aspect-[16/9] w-full rounded-xl bg-muted" />
        <div className="mt-10 space-y-4">
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-full rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!post) {
    throw notFound();
  }

  const safeContent = sanitizeHtml(post.content);
  const authorName = (post.profiles as any)?.display_name || "معتز العلقمي";

  return (
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <header className="mb-12 text-center">
        {post.categories && (
          <Link
            to="/category/$slug"
            params={{ slug: (post.categories as any).slug }}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold-deep hover:text-burgundy transition-colors"
          >
            <Tag className="h-3 w-3" />
            {(post.categories as any).name_ar}
          </Link>
        )}
        <h1 className="mt-6 font-display text-4xl font-bold leading-[1.3] text-foreground md:text-6xl">
          {post.title}
        </h1>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground border-y border-border/40 py-4">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-bold text-gold-deep">{authorInitials(authorName)}</span>
            <span>{authorName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gold" />
            <span>{formatArabicDate(post.published_at)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gold" />
            <span>{post.reading_minutes} دقائق قراءة</span>
          </div>
        </div>
      </header>

      {post.cover_image && (
        <div className="mb-12 overflow-hidden rounded-2xl shadow-2xl">
          <img 
            src={post.cover_image} 
            alt={post.title} 
            className="w-full transition-transform duration-700 hover:scale-105" 
            loading="eager" 
          />
        </div>
      )}

      {post.excerpt && (
        <div className="mb-12 relative">
          <div className="absolute right-0 top-0 h-full w-1 bg-gold rounded-full" />
          <p className="pr-6 font-serif text-xl leading-10 italic text-muted-foreground/90">
            {post.excerpt}
          </p>
        </div>
      )}

      <div
        className="article-content prose prose-gold max-w-none"
        dangerouslySetInnerHTML={{ __html: safeContent }}
      />

      <footer className="mt-20 border-t border-border/60 pt-10">
        <div className="flex flex-col items-center gap-6">
          <div className="text-gold">❖ ❖ ❖</div>
          <Link 
            to="/articles" 
            className="group inline-flex items-center gap-3 rounded-full bg-muted/50 px-6 py-3 text-sm font-bold transition-all hover:bg-gold hover:text-white"
          >
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            عودة إلى كل المقالات
          </Link>
        </div>
      </footer>
    </article>
  );
}
