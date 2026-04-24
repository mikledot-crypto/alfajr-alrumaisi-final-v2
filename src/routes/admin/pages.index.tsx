import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { RichEditor } from "@/components/admin/RichEditor";
import { Pencil, Plus } from "lucide-react";
import { slugify } from "@/lib/supabase-helpers";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/pages/")({
  component: PagesPage,
});

interface Page { id: string; slug: string; title: string; content: string; updated_at: string; }

function PagesPage() {
  const qc = useQueryClient();
  const { data: pages, isLoading } = useQuery({
    queryKey: ["admin_pages"],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("*").order("title");
      return (data ?? []) as Page[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Page | null>(null);
  const [form, setForm] = useState({ slug: "", title: "", content: "" });

  useEffect(() => {
    if (editing) setForm({ slug: editing.slug, title: editing.title, content: editing.content });
    else setForm({ slug: "", title: "", content: "" });
  }, [editing]);

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (p: Page) => { setEditing(p); setOpen(true); };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error("العنوان والمحتوى مطلوبان");
    const payload = {
      title: form.title.trim(),
      slug: (form.slug || slugify(form.title)).trim(),
      content: form.content,
    };
    let error;
    if (editing) {
      ({ error } = await supabase.from("pages").update(payload).eq("id", editing.id));
    } else {
      ({ error } = await supabase.from("pages").insert(payload));
    }
    if (error) {
      toast.error(error.code === "23505" ? "الـ slug مستخدم" : "تعذّر الحفظ");
      return;
    }
    toast.success("تم الحفظ");
    setOpen(false);
    qc.invalidateQueries({ queryKey: ["admin_pages"] });
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">الصفحات</h1>
          <p className="mt-1 text-muted-foreground">إدارة الصفحات الثابتة (عن الموقع، اتصل بنا، إلخ)</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew}><Plus className="ml-1 h-4 w-4" /> صفحة جديدة</Button></DialogTrigger>
          <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? "تعديل صفحة" : "صفحة جديدة"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>العنوان</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-2" />
              </div>
              <div>
                <Label>الـ slug</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-2 font-mono text-sm" placeholder="about, contact, ..." />
              </div>
              <div>
                <Label>المحتوى</Label>
                <div className="mt-2"><RichEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} /></div>
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
        ) : pages && pages.length > 0 ? (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">العنوان</th>
                <th className="p-4 font-medium">Slug</th>
                <th className="p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => (
                <tr key={p.id} className="border-b border-border/60 last:border-0">
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{p.slug}</td>
                  <td className="p-4">
                    <button onClick={() => openEdit(p)} className="rounded p-2 hover:bg-accent"><Pencil className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">لا توجد صفحات بعد.</div>
        )}
      </div>
    </div>
  );
}
