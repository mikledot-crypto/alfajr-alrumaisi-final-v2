import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings/")({
  component: SettingsPage,
});

const KEYS = [
  { key: "site_name", label: "اسم الموقع", textarea: false },
  { key: "site_description", label: "وصف الموقع", textarea: true },
  { key: "footer_text", label: "نص التذييل", textarea: false },
  { key: "social_telegram", label: "رابط تيليجرام", textarea: false },
  { key: "social_twitter", label: "رابط X / تويتر", textarea: false },
  { key: "social_instagram", label: "رابط إنستغرام", textarea: false },
  { key: "social_facebook", label: "رابط فيسبوك", textarea: false },
];

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key,value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r) => { if (r.value !== null) map[r.key] = r.value; });
      return map;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = async () => {
    setSaving(true);
    const rows = KEYS.map((k) => ({ key: k.key, value: form[k.key] ?? "" }));
    const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (error) toast.error("تعذّر الحفظ");
    else {
      toast.success("تم حفظ الإعدادات");
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      qc.invalidateQueries({ queryKey: ["admin_settings"] });
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">الإعدادات</h1>
        <p className="mt-1 text-muted-foreground">معلومات الموقع وروابط التواصل</p>
      </header>

      <div className="rounded-xl border border-border bg-card p-6 space-y-5 max-w-2xl">
        {KEYS.map((k) => (
          <div key={k.key}>
            <Label>{k.label}</Label>
            {k.textarea ? (
              <Textarea rows={3} value={form[k.key] ?? ""} onChange={(e) => setForm({ ...form, [k.key]: e.target.value })} className="mt-2" />
            ) : (
              <Input value={form[k.key] ?? ""} onChange={(e) => setForm({ ...form, [k.key]: e.target.value })} className="mt-2" />
            )}
          </div>
        ))}
        <div className="pt-2">
          <Button onClick={save} disabled={saving}>{saving ? "جارِ الحفظ..." : "حفظ التغييرات"}</Button>
        </div>
      </div>
    </div>
  );
}
