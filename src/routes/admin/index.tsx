import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, FolderTree, Mail, Users2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  const { isAdmin } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["admin_overview"],
    queryFn: async () => {
      const [posts, cats, msgs, subs] = await Promise.all([
        supabase.from("posts").select("id,status", { count: "exact", head: false }),
        supabase.from("categories").select("id", { count: "exact", head: true }),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }),
        supabase.from("subscribers").select("id", { count: "exact", head: true }),
      ]);
      const published = posts.data?.filter((p) => p.status === "published").length ?? 0;
      const drafts = posts.data?.filter((p) => p.status === "draft").length ?? 0;
      return {
        postsTotal: posts.data?.length ?? 0,
        published,
        drafts,
        categories: cats.count ?? 0,
        messages: msgs.count ?? 0,
        subscribers: subs.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "إجمالي المقالات", value: stats?.postsTotal ?? "—", sub: `${stats?.published ?? 0} منشور · ${stats?.drafts ?? 0} مسودة`, icon: FileText },
    { label: "التصنيفات", value: stats?.categories ?? "—", sub: "تصنيف", icon: FolderTree },
    { label: "الرسائل", value: stats?.messages ?? "—", sub: "رسالة مستلمة", icon: Mail, hide: !isAdmin },
    { label: "المشتركون", value: stats?.subscribers ?? "—", sub: "في النشرة", icon: Users2, hide: !isAdmin },
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold">نظرة عامة</h1>
        <p className="mt-1 text-muted-foreground">ملخص حالة المدوّنة</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.filter((c) => !c.hide).map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <Icon className="h-4 w-4 text-gold" />
              </div>
              <div className="mt-3 font-display text-3xl font-bold text-foreground">{c.value}</div>
              <div className="mt-1 text-xs text-muted-foreground">{c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
