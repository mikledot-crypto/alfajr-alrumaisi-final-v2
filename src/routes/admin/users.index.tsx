import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Trash2, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { listUsers, createUser, setUserRole, deleteUser } from "@/server/users";

export const Route = createFileRoute("/admin/users/")({
  component: UsersPage,
});

function UsersPage() {
  const { user: me, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin_users"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return await listUsers({
        headers: { authorization: `Bearer ${session?.access_token}` },
      } as Parameters<typeof listUsers>[0]);
    },
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", role: "editor" as "admin" | "editor" | "none" });

  const authHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return { headers: { authorization: `Bearer ${session?.access_token}` } };
  };

  const onCreate = async () => {
    try {
      await createUser({ data: form, ...(await authHeaders()) } as Parameters<typeof createUser>[0]);
      toast.success("تم إنشاء المستخدم");
      setOpen(false);
      setForm({ email: "", password: "", role: "editor" });
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الإنشاء");
    }
  };

  const onChangeRole = async (userId: string, role: "admin" | "editor" | "none") => {
    try {
      await setUserRole({ data: { userId, role }, ...(await authHeaders()) } as Parameters<typeof setUserRole>[0]);
      toast.success("تم تحديث الدور");
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التحديث");
    }
  };

  const onDelete = async (userId: string) => {
    if (!confirm("حذف المستخدم نهائيًا؟")) return;
    try {
      await deleteUser({ data: { userId }, ...(await authHeaders()) } as Parameters<typeof deleteUser>[0]);
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["admin_users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر الحذف");
    }
  };

  if (!isAdmin) {
    return <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">للمسؤولين فقط.</div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">المستخدمون</h1>
          <p className="mt-1 text-muted-foreground">إدارة الحسابات والأدوار</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="ml-1 h-4 w-4" /> مستخدم جديد</Button></DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader><DialogTitle>إضافة مستخدم</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>البريد</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2" /></div>
              <div><Label>كلمة المرور</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 font-mono" /></div>
              <div>
                <Label>الدور</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as typeof form.role })}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مسؤول</SelectItem>
                    <SelectItem value="editor">محرر</SelectItem>
                    <SelectItem value="none">بدون</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
              <Button onClick={onCreate}>إنشاء</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">جارِ التحميل...</div>
        ) : users && users.length > 0 ? (
          <table className="w-full text-right text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-4 font-medium">البريد</th>
                <th className="p-4 font-medium">الدور</th>
                <th className="p-4 font-medium">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const currentRole: "admin" | "editor" | "none" = u.roles.includes("admin") ? "admin" : u.roles.includes("editor") ? "editor" : "none";
                const isMe = u.id === me?.id;
                return (
                  <tr key={u.id} className="border-b border-border/60 last:border-0">
                    <td className="p-4">
                      <div className="font-medium">{u.email}</div>
                      {isMe && <span className="text-xs text-gold flex items-center gap-1 mt-1"><Shield className="h-3 w-3" /> أنت</span>}
                    </td>
                    <td className="p-4">
                      <Select value={currentRole} onValueChange={(v) => onChangeRole(u.id, v as typeof currentRole)} disabled={isMe}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مسؤول</SelectItem>
                          <SelectItem value="editor">محرر</SelectItem>
                          <SelectItem value="none">بدون</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <button onClick={() => onDelete(u.id)} disabled={isMe} className="rounded p-2 text-destructive hover:bg-destructive/10 disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-muted-foreground">لا يوجد مستخدمون.</div>
        )}
      </div>
    </div>
  );
}
