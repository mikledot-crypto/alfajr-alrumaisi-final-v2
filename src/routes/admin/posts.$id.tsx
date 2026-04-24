import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichEditor } from "@/components/admin/RichEditor";
import { slugify, estimateReadingMinutes } from "@/lib/supabase-helpers";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/admin/posts/$id")({
  component: PostEditor,
});

const schema = z.object({
  title: z.string().trim().min(2, "عنوان قصير").max(200),
  slug: z.string().trim().min(1).max(200),
  excerpt: z.string().trim().max(500).optional().or(z.literal("")),
  content: z.string().min(1, "المحتوى فارغ"),
  cover_image: z.string().trim().url("رابط صورة غير صالح").optional().or(z.literal("")),
  category_id: z.string().uuid().nullable(),
  status: z.enum(["draft", "published"]),
});

interface Form {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category_id: string | null;
  status: "draft" | "published";
}

function PostEditor() {
  const { id } = useParams({ from: "/admin/posts/$id" });
  const isNew = id === "new";
  const navigate = useNavigate();
  const [form, setForm] = useState<Form>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image: "",
    category_id: null,
    status: "draft",
  });
  const [loading, setLoading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ["admin_cats_select"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name_ar").order("sort_order");
      return data ?? [];
    },
  });

  const { data: existing } = useQuery({
    queryKey: ["admin_post", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt ?? "",
        content: existing.content,
        cover_image: existing.cover_image ?? "",
        category_id: existing.category_id,
        status: existing.status as "draft" | "published",
      });
      setSlugTouched(true);
    }
  }, [existing]);

  useEffect(() => {
    if (!slugTouched && form.title) {
      setForm((f) => ({ ...f, slug: slugify(f.title) }));
    }
  }, [form.title, slugTouched]);

  const save = async (statusOverride?: "draft" | "published") => {
    const finalForm = { ...form, status: statusOverride ?? form.status };
    const parsed = schema.safeParse(finalForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const payload = {
      title: parsed.data.title,
      slug: parsed.data.slug,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content,
      cover_image: parsed.data.cover_image || null,
      category_id: parsed.data.category_id,
      status: parsed.data.status,
      reading_minutes: estimateReadingMinutes(parsed.data.content),
      published_at:
        parsed.data.status === "published"
          ? existing?.published_at ?? new Date().toISOString()
          : null,
    };

    let error;
    if (isNew) {
      const res = await supabase.from("posts").insert(payload).select("id").single();
      error = res.error;
      if (!error && res.data) {
        toast.success(parsed.data.status === "published" ? "تم النشر" : "تم حفظ المسودة");
        navigate({ to: "/admin/posts/$id", params: { id: res.data.id } });
      }
    } else {
      const res = await supabase.from("posts").update(payload).eq("id", id);
      error = res.error;
      if (!error) toast.success("تم الحفظ");
    }
    setLoading(false);
    if (error) toast.error(error.message);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/posts" className="rounded p-2 hover:bg-accent" aria-label="رجوع">
            <ArrowRight className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-2xl font-bold md:text-3xl">{isNew ? "مقال جديد" : "تعديل المقال"}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loading} onClick={() => save("draft")}>حفظ كمسودة</Button>
          <Button disabled={loading} onClick={() => save("published")}>{form.status === "published" ? "تحديث ونشر" : "نشر"}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <div>
            <Label>العنوان</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2 font-display text-lg" />
          </div>
          <div>
            <Label>المقتطف (اختياري)</Label>
            <Textarea rows={3} value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="mt-2" />
          </div>
          <div>
            <Label>المحتوى</Label>
            <div className="mt-2">
              <RichEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-sm font-bold">الإعدادات</h3>
            <div className="mt-4 space-y-4">
              <div>
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "draft" | "published" })}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="published">منشور</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>التصنيف</Label>
                <Select value={form.category_id ?? "none"} onValueChange={(v) => setForm({ ...form, category_id: v === "none" ? null : v })}>
                  <SelectTrigger className="mt-2"><SelectValue placeholder="بدون" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون —</SelectItem>
                    {(categories ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الـ slug (الرابط)</Label>
                <Input value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: e.target.value }); }} className="mt-2 font-mono text-sm" />
              </div>
              <div>
                <Label>صورة الغلاف (URL)</Label>
                <Input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })} placeholder="https://..." className="mt-2 text-sm" />
                {form.cover_image && (
                  <img src={form.cover_image} alt="" className="mt-3 aspect-video w-full rounded object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
