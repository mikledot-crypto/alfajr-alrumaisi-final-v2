import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Save, Send, Globe, Search, Upload, Loader2, ExternalLink } from "lucide-react";
import { RichEditor } from "@/components/admin/RichEditor";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  slugify,
  estimateReadingMinutes,
  makeExcerpt,
  uploadMediaFile,
} from "@/lib/supabase-helpers";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin/posts/$id")({
  component: PostEdit,
});

const schema = z.object({
  title: z.string().min(1, "العنوان مطلوب").max(255),
  slug: z.string().min(1, "الرابط مطلوب").max(255),
  excerpt: z.string().max(500).optional().or(z.literal("")),
  content: z.string().min(1, "المحتوى مطلوب"),
  cover_image: z.string().url("رابط غير صالح").or(z.literal("")).optional(),
  category_id: z.string().uuid().nullable(),
  status: z.enum(["draft", "published"]),
  seo_title: z.string().max(255).optional().or(z.literal("")),
  seo_description: z.string().max(500).optional().or(z.literal("")),
});

type PostPayload = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category_id: string | null;
  status: "draft" | "published";
  reading_minutes: number;
  published_at: string | null;
  author_id?: string;
  seo_title?: string | null;
  seo_description?: string | null;
};

function PostEdit() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    category_id: null as string | null,
    status: "draft" as "draft" | "published",
    seo_title: "",
    seo_description: "",
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const [excerptTouched, setExcerptTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const { data: existing, isLoading: loadingPost } = useQuery({
    queryKey: ["admin_post", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin_categories_list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name_ar").order("sort_order");
      return data ?? [];
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title || "",
        slug: existing.slug || "",
        excerpt: existing.excerpt || "",
        content: existing.content || "",
        cover_image: existing.cover_image || "",
        category_id: existing.category_id || null,
        status: existing.status as "draft" | "published",
        seo_title: existing.seo_title || "",
        seo_description: existing.seo_description || "",
      });
      setSlugTouched(true);
      setExcerptTouched(Boolean(existing.excerpt));
    }
  }, [existing]);

  useEffect(() => {
    if (isNew && !slugTouched && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, isNew, slugTouched]);

  useEffect(() => {
    if (!excerptTouched && form.content) {
      setForm((f) => ({ ...f, excerpt: makeExcerpt(f.content) }));
    }
  }, [form.content, excerptTouched]);

  const uploadCover = async (file?: File) => {
    if (!file) return;
    try {
      setUploadingCover(true);
      const url = await uploadMediaFile(file, "covers");
      setForm((f) => ({ ...f, cover_image: url }));
      toast.success("تم رفع صورة الغلاف");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر رفع صورة الغلاف");
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  };

  const persistPost = async (payload: PostPayload) => {
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== undefined),
    );

    if (isNew) {
      return await supabase.from("posts").insert(cleanPayload).select("id,slug,status").single();
    }
    return await supabase.from("posts").update(cleanPayload).eq("id", id).select("id,slug,status").single();
  };

  const save = async (statusOverride?: "draft" | "published") => {
    const finalStatus = statusOverride || form.status;
    const finalForm = { ...form, status: finalStatus, excerpt: form.excerpt || makeExcerpt(form.content) };

    const parsed = schema.safeParse(finalForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);

    const payload: PostPayload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt ? parsed.data.excerpt : makeExcerpt(parsed.data.content),
      content: parsed.data.content,
      cover_image: parsed.data.cover_image || null,
      category_id: parsed.data.category_id,
      status: finalStatus,
      reading_minutes: estimateReadingMinutes(parsed.data.content),
      published_at: finalStatus === "published" ? (existing?.published_at ?? new Date().toISOString()) : null,
      author_id: user?.id,
      seo_title: parsed.data.seo_title || null,
      seo_description: parsed.data.seo_description || null,
    };

    try {
      const res = await persistPost(payload);

      if (res.error) {
        toast.error(res.error.message);
        return;
      }

      const saved = res.data;
      toast.success(finalStatus === "published" ? "تم نشر المقال" : "تم حفظ المسودة");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin_posts"] }),
        qc.invalidateQueries({ queryKey: ["admin_post", id] }),
        qc.invalidateQueries({ queryKey: ["home_posts"] }),
        qc.invalidateQueries({ queryKey: ["all_posts"] }),
      ]);

      if (finalStatus === "published" && saved?.slug) {
        navigate({ to: "/post/$slug", params: { slug: saved.slug } });
      } else if (isNew && saved?.id) {
        navigate({ to: "/admin/posts/$id", params: { id: saved.id } });
      }
    } finally {
      setLoading(false);
    }
  };

  if (loadingPost) return <div className="p-8 text-center">جارِ التحميل...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/posts" className="rounded-full p-2 transition-colors hover:bg-accent">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold">{isNew ? "إنشاء مقال جديد" : "تعديل المقال"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">أضف محتوىً ملهماً لقرائك</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {!isNew && form.slug && (
            <Link to="/post/$slug" params={{ slug: form.slug }} className="inline-flex items-center gap-2 rounded-md border border-input px-4 py-2 text-sm hover:bg-accent">
              <ExternalLink className="h-4 w-4" /> معاينة
            </Link>
          )}
          <Button variant="outline" disabled={loading} onClick={() => void save("draft")} className="gap-2">
            <Save className="h-4 w-4" /> حفظ مسودة
          </Button>
          <Button disabled={loading} onClick={() => void save("published")} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {form.status === "published" ? "تحديث ونشر" : "نشر المقال"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="content" className="w-full" dir="rtl">
        <TabsList className="mb-8 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="content" className="gap-2">محتوى المقال</TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">إعدادات SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6 min-w-0">
              <div className="space-y-2">
                <Label className="text-base font-bold">عنوان المقال</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="أدخل عنواناً جذاباً..."
                  className="h-12 text-lg font-display"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-bold">المقتطف التلقائي</Label>
                <Textarea
                  rows={3}
                  value={form.excerpt}
                  onChange={(e) => {
                    setExcerptTouched(true);
                    setForm({ ...form, excerpt: e.target.value });
                  }}
                  placeholder="يُنشأ تلقائياً من بداية المقال إذا تركته فارغاً..."
                  className="resize-none leading-relaxed"
                />
                <p className="text-[11px] text-muted-foreground">يمكنك تركه فارغاً ليتم استخراجه من نص المقال تلقائياً.</p>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-bold">محتوى المقال</Label>
                <RichEditor
                  content={form.content}
                  onChange={(val) => setForm({ ...form, content: val })}
                />
              </div>
            </div>

            <aside className="space-y-6">
              <div className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="flex items-center gap-2 border-b border-border pb-4 font-display font-bold">
                  <Globe className="h-4 w-4 text-gold" /> إعدادات النشر
                </h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>التصنيف</Label>
                    <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                      <SelectTrigger><SelectValue placeholder="اختر تصنيفاً" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون تصنيف</SelectItem>
                        {(categories ?? []).map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>الرابط الدائم (Slug)</Label>
                    <Input
                      value={form.slug}
                      onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }}
                      className="dir-ltr text-left font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>صورة الغلاف</Label>
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void uploadCover(e.target.files?.[0])}
                    />
                    <div className="flex gap-2">
                      <Input
                        value={form.cover_image}
                        onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="dir-ltr text-left text-xs"
                      />
                      <Button type="button" variant="outline" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()}>
                        {uploadingCover ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">ارفع صورة من الهاتف أو ضع رابطاً خارجياً.</p>
                    {form.cover_image && (
                      <div className="mt-4 overflow-hidden rounded-lg border border-border">
                        <img src={form.cover_image} alt="Preview" className="aspect-video w-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </TabsContent>

        <TabsContent value="seo">
          <div className="max-w-3xl space-y-8 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-6">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">تحسين محركات البحث</h3>
                <p className="mt-1 text-sm text-muted-foreground">تحكم في كيفية ظهور مقالك في نتائج البحث وشبكات التواصل</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold">عنوان SEO</Label>
                <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} placeholder={form.title} />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">وصف SEO</Label>
                <Textarea rows={3} value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} placeholder={form.excerpt} />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
