import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { slugify } from "@/lib/supabase-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/categories/")({
  component: CategoriesPage,
});

interface Cat {
  id: string;
  name_ar: string;
  slug: string;
  description: string | null;
  sort_order: number;
}

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: cats, isLoading } = useQuery({
    queryKey: ["admin_categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("sort_order");
      return (data ?? []) as Cat[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cat | null>(null);
  const [form, setForm] = useState({ name_ar: "", slug: "", description: "", sort_order: 0 });

  const openNew = () => {
    setEditing(null);
    setForm({ name_ar: "", slug: "", description: "", sort_order: (cats?.length ?? 0) + 1 });
    setOpen(true);
  };
  const openEdit = (c: Cat) => {
    setEditing(c);
    setForm({ name_ar: c.name_ar, slug: c.slug, description: c.description ?? "", sort_order: c.sort_order });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name_ar.trim()) return toast.error("الاسم مطلوب");
    const payload = {
      name_ar: form.name_ar.trim(),
      slug: (form.slug || slugify(form.name_ar)).trim(),
      description: form.description.trim() || null,
      sort_order: form.sort_order,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("categories").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("categories").insert(payload));
    }
    if (error) {
      toast.error(error.code === "23505" ? "الـ slug مستخدم بالفعل" : "تعذّر الحفظ");
      return;
    }
    toast.success("تم الحفظ");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin_categories"] });
  };

  const remove = async (id: string) => {
    if (!confirm("حذف التصنيف؟ المقالات المرتبطة ستبقى دون تصنيف.")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error("تعذّر الحذف");
    else {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin_categories"] });
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">التصنيفات</h1>
          <p className="mt-1 text-muted-foreground">إدارة تصنيفات المقالات</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="ml-1 h-4 w-4" /> تصنيف جديد</Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>{editing ? "تعديل تصنيف" : "تصنيف جديد"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>الاسم</Label>
                <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>الـ slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-2 font-mono text-sm" placeholder="يُولّد تلقائيًا" />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2" rows={2} />
              </div>
              <div>
                <Label>الترتيب</Label>
                <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} className="mt-2" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={save}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">جارِ التحميل...</div>
        ) : cats && cats.length > 0 ? (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">الاسم</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">الوصف</th>
                <th className="p-4 font-medium">الترتيب</th>
                <th className="p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id} className="border-b border-border/60 last:border-0">
                  <td className="p-4 font-medium">{c.name_ar}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{c.slug}</td>
                  <td className="p-4 text-xs text-muted-foreground line-clamp-1">{c.description}</td>
                  <td className="p-4 text-xs">{c.sort_order}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="rounded p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => remove(c.id)} className="rounded p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">لا توجد تصنيفات بعد.</div>
        )}
      </div>
    </div>
  );
}
