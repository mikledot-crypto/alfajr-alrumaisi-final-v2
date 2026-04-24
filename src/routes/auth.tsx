import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [{ title: "تسجيل الدخول — معتز العلقمي" }],
  }),
});

const schema = z.object({
  email: z.string().trim().email("بريد غير صالح").max(255),
  password: z.string().min(6, "كلمة المرور قصيرة جدًا").max(128),
});

function AuthPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/admin" });
    }
  }, [loading, user, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    const fn = tab === "signin" ? signIn : signUp;
    const { error } = await fn(parsed.data.email, parsed.data.password);
    setBusy(false);
    if (error) {
      toast.error(error);
      return;
    }
    if (tab === "signup") toast.success("تم إنشاء الحساب");
    else toast.success("مرحبًا بك");
    navigate({ to: "/admin" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-bl from-accent/40 via-background to-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 text-center">
          <Link to="/" className="font-display text-2xl font-bold">معتز العلقمي</Link>
          <p className="mt-2 text-sm text-muted-foreground">لوحة التحكم</p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="password">كلمة المرور</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "..." : "دخول"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup" className="mt-6">
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label htmlFor="email2">البريد الإلكتروني</Label>
                <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="password2">كلمة المرور</Label>
                <Input id="password2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2" />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "..." : "إنشاء الحساب"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                الحسابات الجديدة بدون صلاحيات حتى يمنحها المسؤول.
              </p>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">← العودة للموقع</Link>
        </div>
      </div>
    </div>
  );
}
