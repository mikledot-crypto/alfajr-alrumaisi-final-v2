import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const schema = z.object({
  email: z.string().trim().email({ message: "بريد إلكتروني غير صالح" }).max(255),
});

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("subscribers").insert({ email: parsed.data.email });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.error("هذا البريد مسجّل بالفعل في النشرة");
      } else {
        toast.error("تعذّر الاشتراك، حاول لاحقًا");
      }
      return;
    }
    setEmail("");
    toast.success("تم اشتراكك بنجاح، شكرًا لك ❖");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
      <Input
        type="email"
        placeholder="بريدك الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 flex-1 bg-background"
        required
      />
      <Button type="submit" disabled={loading} className="h-11 bg-primary px-6 text-primary-foreground hover:bg-primary/90">
        {loading ? "..." : "اشتراك"}
      </Button>
    </form>
  );
}
