import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate } from "@/lib/supabase-helpers";
import { NewsletterForm } from "@/components/site/NewsletterForm";
import { FeaturedSkeleton, PostCardSkeleton } from "@/components/site/Skeleton";
import { ArrowLeft, BookOpen, Feather, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_public/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "معتز العلقمي — مدوّنة عربية فاخرة في الفكر والأدب والتقنية" },
      { name: "description", content: "مساحة عربية أنيقة للكتابة المتأنّية: مقالات، قصص، اقتباسات، ثقافة، تقنية، صيدلة وطب." },
      { property: "og:title", content: "معتز العلقمي — مدوّنة عربية فاخرة" },
      { property: "og:description", content: "كلماتٌ تُكتب بِرَوِيّة، وتُقرأ بِرَوِيّة." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "معتز العلقمي" },
      { name: "twitter:description", content: "مدوّنة عربية للكتابة الهادئة والرأي المدروس." },
    ],
  }),
});

function HomePage() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["home_posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,title,slug,excerpt,cover_image,published_at,reading_minutes,categories(name_ar,slug)")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(7);
      return data ?? [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ["home_categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("categories")
        .select("name_ar,slug,description")
        .order("sort_order");
      return data ?? [];
    },
  });

  const featured = posts?.[0];
  const rest = posts?.slice(1) ?? [];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.6]"
          style={{
            background:
              "radial-gradient(circle at 80% 20%, color-mix(in oklab, var(--color-gold) 14%, transparent), transparent 55%), radial-gradient(circle at 15% 85%, color-mix(in oklab, var(--color-burgundy) 10%, transparent), transparent 50%)",
          }}
        />
        <div className="container relative mx-auto max-w-5xl px-4 py-20 text-center md:py-32">
          <div className="ornament mx-auto mb-7 max-w-xs text-sm">
            <span className="font-display text-xs uppercase tracking-[0.4em] text-gold-deep">مدوّنة أدبية</span>
          </div>
          <h1 className="font-display text-[2.5rem] font-bold leading-[1.15] text-foreground sm:text-5xl md:text-7xl">
            مدوّنة <span className="text-gradient-gold">معتز العلقمي</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-[2] text-muted-foreground md:text-lg md:leading-[2.1]">
            مساحةٌ عربية هادئة للكتابة المتأنّية في الفكر، الأدب، التقنية، والصيدلة.
            <br className="hidden md:block" />
            كلماتٌ تُكتب بِرَوِيّة، وتُقرأ بِرَوِيّة.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-all hover:translate-y-[-1px] hover:bg-primary/90"
              style={{ boxShadow: "var(--shadow-elegant)" }}
            >
              تصفّح المقالات <ArrowLeft className="h-4 w-4" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center rounded-md border border-border bg-background/60 px-7 py-3.5 text-sm font-semibold text-foreground backdrop-blur transition-all hover:border-gold hover:text-gold-deep"
            >
              عن الموقع
            </Link>
          </div>

          {/* Pillars */}
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-4 text-right sm:grid-cols-3">
            {[
              { icon: Feather, title: "كتابةٌ عربية", desc: "بأسلوب أدبي رصين" },
              { icon: BookOpen, title: "قراءةٌ متأنية", desc: "محتوى مُختار بعناية" },
              { icon: Sparkles, title: "هويةٌ فاخرة", desc: "تجربةٌ بصرية راقية" },
            ].map((p) => (
              <div key={p.title} className="rounded-lg border border-border/60 bg-card/60 p-4 backdrop-blur">
                <p.icon className="mb-2 h-5 w-5 text-gold-deep" />
                <h3 className="font-display text-base font-bold text-foreground">{p.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="container mx-auto max-w-6xl px-4 py-20">
        <div className="ornament mb-12">
          <span className="font-display text-xs uppercase tracking-[0.35em]">المقال المميّز</span>
        </div>

        {isLoading ? (
          <FeaturedSkeleton />
        ) : featured ? (
          <Link
            to="/post/$slug"
            params={{ slug: featured.slug }}
            className="group grid gap-10 md:grid-cols-2"
          >
            {featured.cover_image ? (
              <div className="aspect-[4/3] overflow-hidden rounded-xl bg-muted shadow-elegant" style={{ boxShadow: "var(--shadow-elegant)" }}>
                <img
                  src={featured.cover_image}
                  alt={featured.title}
                  loading="eager"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-gradient-to-bl from-accent via-muted to-accent/50" />
            )}
            <div className="flex flex-col justify-center">
              {featured.categories && (
                <span className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gold-deep">
                  {featured.categories.name_ar}
                </span>
              )}
              <h2 className="font-display text-3xl font-bold leading-[1.25] text-foreground transition-colors group-hover:text-gold-deep md:text-5xl">
                {featured.title}
              </h2>
              {featured.excerpt && (
                <p className="mt-5 text-base leading-[2] text-muted-foreground line-clamp-3 md:text-lg">
                  {featured.excerpt}
                </p>
              )}
              <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{formatArabicDate(featured.published_at)}</span>
                <span className="text-gold">•</span>
                <span>{featured.reading_minutes} دقائق قراءة</span>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted/20 p-16 text-center text-muted-foreground">
            لم تُنشَر مقالات بعد. عُد قريبًا.
          </div>
        )}
      </section>

      {/* Latest grid */}
      {(isLoading || rest.length > 0) && (
        <section className="container mx-auto max-w-6xl px-4 pb-20">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl font-bold md:text-4xl">أحدث المقالات</h2>
              <p className="mt-2 text-sm text-muted-foreground">جديد ما نُشر في المدوّنة</p>
            </div>
            <Link to="/articles" className="text-sm font-medium text-gold-deep hover:text-burgundy hover:underline">
              عرض الكل ←
            </Link>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <PostCardSkeleton key={i} />)
              : rest.map((p) => (
                  <Link
                    key={p.id}
                    to="/post/$slug"
                    params={{ slug: p.slug }}
                    className="group flex flex-col"
                  >
                    {p.cover_image ? (
                      <div className="aspect-[16/10] overflow-hidden rounded-lg bg-muted">
                        <img
                          src={p.cover_image}
                          alt={p.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] rounded-lg bg-gradient-to-bl from-accent to-muted" />
                    )}
                    {p.categories && (
                      <span className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">
                        {p.categories.name_ar}
                      </span>
                    )}
                    <h3 className="mt-2 font-display text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-gold-deep">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="mt-2 line-clamp-2 text-sm leading-7 text-muted-foreground">
                        {p.excerpt}
                      </p>
                    )}
                    <div className="mt-3 text-xs text-muted-foreground">
                      {formatArabicDate(p.published_at)} • {p.reading_minutes} دقائق
                    </div>
                  </Link>
                ))}
          </div>
        </section>
      )}

      {/* Categories */}
      {(categories?.length ?? 0) > 0 && (
        <section className="border-y border-border/60 bg-muted/30 py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <div className="ornament mb-12">
              <span className="font-display text-xs uppercase tracking-[0.35em]">التصنيفات</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {categories!.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="card-luxe group p-7"
                >
                  <h3 className="font-display text-xl font-bold text-foreground transition-colors group-hover:text-gold-deep">
                    {c.name_ar}
                  </h3>
                  {c.description && (
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{c.description}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gold-deep opacity-0 transition-opacity group-hover:opacity-100">
                    استكشف <ArrowLeft className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="ornament mb-6">❖</div>
        <h2 className="font-display text-3xl font-bold md:text-4xl">انضم إلى النشرة</h2>
        <p className="mx-auto mt-4 max-w-xl leading-8 text-muted-foreground">
          استلم آخر المقالات والاقتباسات في بريدك. لا رسائل مزعجة — فقط كلماتٌ مختارة.
        </p>
        <div className="mx-auto mt-10 max-w-md">
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
