import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  const { data: settings } = useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((row) => {
        if (row.value !== null) map[row.key] = row.value;
      });
      return map;
    },
    staleTime: 60_000,
  });

  const s = settings ?? {};

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader siteName={s.site_name ?? "معتز العلقمي"} />
      <main className="flex-1">
        <Outlet />
      </main>
      <SiteFooter settings={s} />
    </div>
  );
}
