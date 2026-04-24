import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { formatArabicDate } from "@/lib/supabase-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/posts/")({
  component: PostsList,
});

function PostsList() {
  const qc = useQueryClient();
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin_posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id,title,slug,status,published_at,updated_at,categories(name_ar)")
        .order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const togglePublish = async (id: string, current: string) => {
    const newStatus = current === "published" ? "draft" : "published";
    const patch: { status: string; published_at?: string | null } = { status: newStatus };
    if (newStatus === "published") patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("posts").update(patch).eq("id", id);
    if (error) toast.error("تعذّر التحديث");
    else {
      toast.success(newStatus === "published" ? "تم النشر" : "أصبح مسودة");
      qc.invalidateQueries({ queryKey: ["admin_posts"] });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف المقال نهائيًا؟")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) toast.error("تعذّر الحذف");
    else {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin_posts"] });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">المقالات</h1>
          <p className="mt-1 text-muted-foreground">إدارة كل ما يُنشر في المدوّنة</p>
        </div>
        <Link to="/admin/posts/new">
          <Button><Plus className="ml-1 h-4 w-4" /> مقال جديد</Button>
        </Link>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">جارِ التحميل...</div>
        ) : posts && posts.length > 0 ? (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">العنوان</th>
                <th className="p-4 font-medium">التصنيف</th>
                <th className="p-4 font-medium">الحالة</th>
                <th className="p-4 font-medium">آخر تعديل</th>
                <th className="p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4 text-muted-foreground">{p.categories?.name_ar ?? "—"}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ${p.status === "published" ? "bg-gold/15 text-gold" : "bg-muted text-muted-foreground"}`}>
                      {p.status === "published" ? "منشور" : "مسودة"}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-muted-foreground">{formatArabicDate(p.updated_at)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => togglePublish(p.id, p.status)} title={p.status === "published" ? "إلغاء النشر" : "نشر"} className="rounded p-2 hover:bg-accent">
                        {p.status === "published" ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <Link to="/admin/posts/$id" params={{ id: p.id }} className="rounded p-2 hover:bg-accent" title="تعديل">
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => remove(p.id)} title="حذف" className="rounded p-2 text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">
            لا توجد مقالات بعد.
            <div className="mt-4">
              <Link to="/admin/posts/new"><Button>إنشاء أول مقال</Button></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
