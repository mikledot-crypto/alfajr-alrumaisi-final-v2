import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate } from "@/lib/supabase-helpers";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/subscribers/")({
  component: SubscribersPage,
});

function SubscribersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_subscribers"],
    queryFn: async () => {
      const { data } = await supabase.from("subscribers").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("حذف المشترك؟")) return;
    const { error } = await supabase.from("subscribers").delete().eq("id", id);
    if (error) toast.error("تعذّر الحذف");
    else {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin_subscribers"] });
    }
  };

  const exportCsv = () => {
    if (!data) return;
    const csv = "email,created_at\n" + data.map((s) => `${s.email},${s.created_at}`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">المشتركون</h1>
          <p className="mt-1 text-muted-foreground">قائمة المشتركين في النشرة</p>
        </div>
        {data && data.length > 0 && (
          <button onClick={exportCsv} className="rounded-md border border-border px-3 py-1.5 text-sm hover:border-gold">تصدير CSV</button>
        )}
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">جارِ التحميل...</div>
        ) : data && data.length > 0 ? (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">البريد</th>
                <th className="p-4 font-medium">تاريخ الاشتراك</th>
                <th className="p-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {data.map((s) => (
                <tr key={s.id} className="border-b border-border/60 last:border-0">
                  <td className="p-4 font-mono text-sm">{s.email}</td>
                  <td className="p-4 text-xs text-muted-foreground">{formatArabicDate(s.created_at)}</td>
                  <td className="p-4">
                    <button onClick={() => remove(s.id)} className="rounded p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">لا يوجد مشتركون بعد.</div>
        )}
      </div>
    </div>
  );
}
