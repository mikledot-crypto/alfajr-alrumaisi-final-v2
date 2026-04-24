import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
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
import { ArrowRight, Save, Send, Globe, Search } from "lucide-react";
import { RichEditor } from "@/components/admin/RichEditor";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { slugify, estimateReadingMinutes } from "@/lib/supabase-helpers";

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
  canonical_url: z.string().url().or(z.literal("")).optional(),
});

function PostEdit() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

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
    canonical_url: "",
  });

  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(false);

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
        canonical_url: existing.canonical_url || "",
      });
      setSlugTouched(true);
    }
  }, [existing]);

  useEffect(() => {
    if (isNew && !slugTouched && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, isNew, slugTouched]);

  const save = async (statusOverride?: "draft" | "published") => {
    const finalStatus = statusOverride || form.status;
    const finalForm = { ...form, status: finalStatus };
    
    const parsed = schema.safeParse(finalForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setLoading(true);
    const payload = {
      ...parsed.data,
      reading_minutes: estimateReadingMinutes(parsed.data.content),
      published_at: finalStatus === "published" 
        ? (existing?.published_at ?? new Date().toISOString()) 
        : null,
    };

    let error;
    if (isNew) {
      const res = await supabase.from("posts").insert(payload).select("id").single();
      error = res.error;
      if (!error && res.data) {
        toast.success("تم الحفظ بنجاح");
        navigate({ to: "/admin/posts/$id", params: { id: res.data.id } });
      }
    } else {
      const res = await supabase.from("posts").update(payload).eq("id", id);
      error = res.error;
      if (!error) {
        toast.success("تم التحديث بنجاح");
        qc.invalidateQueries({ queryKey: ["admin_post", id] });
      }
    }
    setLoading(false);
    if (error) toast.error(error.message);
  };

  if (loadingPost) return <div className="p-8 text-center">جارِ التحميل...</div>;

  return (
    <div className="space-y-8 pb-20">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Link to="/admin/posts" className="rounded-full p-2 hover:bg-accent transition-colors">
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-3xl font-bold">{isNew ? "إنشاء مقال جديد" : "تعديل المقال"}</h1>
            <p className="text-sm text-muted-foreground mt-1">أضف محتوىً ملهماً لقرائك</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={loading} onClick={() => save("draft")} className="gap-2">
            <Save className="h-4 w-4" /> حفظ مسودة
          </Button>
          <Button disabled={loading} onClick={() => save("published")} className="gap-2">
            <Send className="h-4 w-4" /> {form.status === "published" ? "تحديث ونشر" : "نشر المقال"}
          </Button>
        </div>
      </header>

      <Tabs defaultValue="content" className="w-full" dir="rtl">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="content" className="gap-2">محتوى المقال</TabsTrigger>
          <TabsTrigger value="seo" className="gap-2">إعدادات SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="content" className="space-y-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
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
                <Label className="text-base font-bold">المقتطف (Excerpt)</Label>
                <Textarea 
                  rows={3} 
                  value={form.excerpt} 
                  onChange={(e) => setForm({ ...form, excerpt: e.target.value })} 
                  placeholder="وصف قصير يظهر في الصفحة الرئيسية..."
                  className="resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-base font-bold">محتوى المقال</Label>
                <RichEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6">
                <h3 className="font-display font-bold flex items-center gap-2 border-b border-border pb-4">
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
                      onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value }); }} 
                      className="font-mono text-xs dir-ltr text-left"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>صورة الغلاف (URL)</Label>
                    <Input 
                      value={form.cover_image} 
                      onChange={(e) => setForm({ ...form, cover_image: e.target.value })} 
                      placeholder="https://example.com/image.jpg"
                      className="text-xs dir-ltr text-left"
                    />
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
          <div className="max-w-3xl space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
            <div className="flex items-center gap-3 border-b border-border pb-6">
              <div className="p-3 rounded-full bg-primary/10 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-display text-xl font-bold">تحسين محركات البحث</h3>
                <p className="text-sm text-muted-foreground mt-1">تحكم في كيفية ظهور مقالك في نتائج البحث وشبكات التواصل</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="font-bold">عنوان SEO (Meta Title)</Label>
                <Input 
                  value={form.seo_title} 
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })} 
                  placeholder={form.title}
                />
                <p className="text-[10px] text-muted-foreground">يفضل أن يكون بين 50-60 حرفاً.</p>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">وصف SEO (Meta Description)</Label>
                <Textarea 
                  rows={3}
                  value={form.seo_description} 
                  onChange={(e) => setForm({ ...form, seo_description: e.target.value })} 
                  placeholder={form.excerpt}
                />
                <p className="text-[10px] text-muted-foreground">يفضل أن يكون بين 150-160 حرفاً لجذب الزوار.</p>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">الرابط الأصلي (Canonical URL)</Label>
                <Input 
                  value={form.canonical_url} 
                  onChange={(e) => setForm({ ...form, canonical_url: e.target.value })} 
                  placeholder="https://..."
                  className="dir-ltr text-left"
                />
              </div>
            </div>

            <div className="rounded-xl bg-muted/50 p-6 border border-border/50">
              <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" /> معاينة محرك البحث
              </h4>
              <div className="space-y-1">
                <div className="text-[#1a0dab] text-xl hover:underline cursor-pointer truncate">
                  {form.seo_title || form.title || "عنوان المقال يظهر هنا"}
                </div>
                <div className="text-[#006621] text-sm truncate dir-ltr text-right">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/post/{form.slug || "link-sample"}
                </div>
                <div className="text-[#4d5156] text-sm line-clamp-2">
                  {form.seo_description || form.excerpt || "وصف المقال الذي سيظهر في نتائج البحث لجذب القراء..."}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
