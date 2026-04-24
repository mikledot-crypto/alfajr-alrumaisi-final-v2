import { Outlet, createFileRoute, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, FileText, FolderTree, FilePlus, Mail, Users2, UsersRound, Settings, LogOut, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
  head: () => ({ meta: [{ title: "لوحة التحكم — معتز العلقمي" }] }),
});

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact: boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  { to: "/admin", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { to: "/admin/posts", label: "المقالات", icon: FileText, exact: false },
  { to: "/admin/categories", label: "التصنيفات", icon: FolderTree, exact: false },
  { to: "/admin/pages", label: "الصفحات", icon: FilePlus, exact: false },
  { to: "/admin/messages", label: "الرسائل", icon: Mail, exact: false, adminOnly: true },
  { to: "/admin/subscribers", label: "المشتركون", icon: Users2, exact: false, adminOnly: true },
  { to: "/admin/users", label: "المستخدمون", icon: UsersRound, exact: false, adminOnly: true },
  { to: "/admin/settings", label: "الإعدادات", icon: Settings, exact: false, adminOnly: true },
];

function AdminLayout() {
  const { user, loading, isAdmin, isEditor, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!loading && user && !isEditor && !isAdmin) {
      // logged in but no role
    }
  }, [loading, user, isEditor, isAdmin]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">جارِ التحميل...</div>;
  }
  if (!user) return null;

  if (!isAdmin && !isEditor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-2xl font-bold">حسابك بدون صلاحيات</h1>
          <p className="mt-3 text-muted-foreground">تواصل مع المسؤول لمنحك دور تحرير أو إدارة.</p>
          <Button onClick={signOut} variant="outline" className="mt-6">تسجيل الخروج</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <aside className="hidden w-64 flex-col border-l border-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border p-5">
          <Link to="/" className="font-display text-xl font-bold text-sidebar-foreground">معتز العلقمي</Link>
          <div className="mt-1 text-xs text-muted-foreground">لوحة التحكم</div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
            const active = n.exact
              ? location.pathname === n.to
              : location.pathname === n.to || location.pathname.startsWith(n.to + "/");
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-semibold text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-3 space-y-1">
          <Link to="/" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60">
            <Globe className="h-4 w-4" /> عرض الموقع
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
          >
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </button>
          <div className="mt-3 px-3 pt-3 text-xs text-muted-foreground border-t border-sidebar-border">
            <div className="truncate">{user.email}</div>
            <div className="mt-1">{isAdmin ? "مسؤول" : "محرر"}</div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
        <Link to="/admin" className="font-display text-lg font-bold">معتز العلقمي</Link>
        <button onClick={signOut} className="text-sm text-muted-foreground">خروج</button>
      </div>

      <main className="flex-1 lg:mr-0 mr-0">
        <div className="mt-14 lg:mt-0">
          {/* Mobile bottom nav */}
          <nav className="sticky top-14 z-20 flex gap-1 overflow-x-auto border-b border-border bg-card p-2 lg:hidden">
            {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
              const active = n.exact ? location.pathname === n.to : location.pathname === n.to || location.pathname.startsWith(n.to + "/");
              return (
                <Link key={n.to} to={n.to} className={cn("whitespace-nowrap rounded-md px-3 py-1.5 text-xs", active ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
