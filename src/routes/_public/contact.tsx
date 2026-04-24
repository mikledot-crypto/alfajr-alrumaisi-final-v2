import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Send } from "lucide-react";

export const Route = createFileRoute("/_public/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "اتصل بنا — معتز العلقمي" },
    ],
  }),
});

const schema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "الرسالة قصيرة جدًا").max(2000),
});

function ContactPage() {
  const { data: page } = useQuery({
    queryKey: ["page", "contact"],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("*").eq("slug", "contact").maybeSingle();
      return data;
    },
  });
  const { data: settings } = useQuery({
    queryKey: ["site_settings_contact"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("key,value").eq("key", "social_telegram").maybeSingle();
      return data?.value ?? null;
    },
  });

  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject || null,
      message: parsed.data.message,
    });
    setLoading(false);
    if (error) {
      toast.error("تعذّر إرسال الرسالة، حاول لاحقًا");
      return;
    }
    setForm({ name: "", email: "", subject: "", message: "" });
    toast.success("تم استلام رسالتك، سنعود إليك قريبًا ❖");
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16">
      <header className="mb-10 text-center">
        <div className="ornament mx-auto mb-4 max-w-xs">❖</div>
        <h1 className="font-display text-4xl font-bold md:text-5xl">{page?.title ?? "اتصل بنا"}</h1>
        {page?.content && <p className="mx-auto mt-4 max-w-xl leading-8 text-muted-foreground">{page.content}</p>}
        {settings && (
          <a href={settings} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:underline">
            <Send className="h-4 w-4" /> تواصل عبر تيليجرام
          </a>
        )}
      </header>

      <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-border bg-card p-6 md:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">الاسم</Label>
            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-2" />
          </div>
          <div>
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-2" />
          </div>
        </div>
        <div>
          <Label htmlFor="subject">الموضوع (اختياري)</Label>
          <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-2" />
        </div>
        <div>
          <Label htmlFor="message">الرسالة</Label>
          <Textarea id="message" rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required className="mt-2" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? "جارِ الإرسال..." : "إرسال الرسالة"}
        </Button>
      </form>
    </div>
  );
}
