import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatArabicDate } from "@/lib/supabase-helpers";
import { Trash2, Mail } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/messages/")({
  component: MessagesPage,
});

function MessagesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin_messages"],
    queryFn: async () => {
      const { data } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const remove = async (id: string) => {
    if (!confirm("حذف الرسالة؟")) return;
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);
    if (error) toast.error("تعذّر الحذف");
    else {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin_messages"] });
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">الرسائل</h1>
        <p className="mt-1 text-muted-foreground">رسائل الزوّار من نموذج التواصل</p>
      </header>

      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">جارِ التحميل...</div>
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((m) => (
            <article key={m.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-lg font-bold">{m.subject || "بدون موضوع"}</h3>
                  <div className="mt-1 text-sm text-muted-foreground">
                    من <span className="font-medium text-foreground">{m.name}</span> ·{" "}
                    <a href={`mailto:${m.email}`} className="text-gold hover:underline"><Mail className="inline h-3 w-3" /> {m.email}</a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{formatArabicDate(m.created_at)}</span>
                  <button onClick={() => remove(m.id)} className="rounded p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-4 whitespace-pre-wrap leading-7 text-foreground">{m.message}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-muted-foreground">لا توجد رسائل بعد.</div>
      )}
    </div>
  );
}
