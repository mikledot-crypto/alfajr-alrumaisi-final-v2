import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  FolderTree,
  FilePlus,
  Mail,
  Users2,
  UsersRound,
  Settings,
  Globe,
  LogOut,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gold border-t-transparent" />
          <p className="font-display text-lg">جارِ التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  if (!isAdmin && !isEditor) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center" dir="rtl">
        <div className="max-w-md space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted text-gold">
            <UsersRound className="h-10 w-10" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">حسابك بدون صلاحيات</h1>
            <p className="mt-3 text-muted-foreground leading-7">
              تم تسجيل دخولك بنجاح، ولكن ليس لديك صلاحيات الوصول للوحة التحكم. 
              تواصل مع المسؤول لمنحك دور محرر أو إدارة.
            </p>
          </div>
          <Button onClick={signOut} variant="outline" className="w-full max-w-xs">
            تسجيل الخروج
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 right-0 hidden w-64 flex-col border-l border-border bg-card lg:flex">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="text-gold group-hover:rotate-180 transition-transform duration-500">❖</span>
            <span className="font-display text-xl font-bold tracking-tight">لوحة التحكم</span>
          </Link>
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
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
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 transition-colors", active ? "text-primary-foreground" : "group-hover:text-gold")} />
                  <span className="font-medium">{n.label}</span>
                </div>
                {active && <ChevronRight className="h-3 w-3 opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border p-4 space-y-2 bg-muted/20">
          <Link 
            to="/" 
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>عرض الموقع</span>
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>تسجيل الخروج</span>
          </button>
          
          <div className="mt-4 flex items-center gap-3 px-3 py-2 border-t border-border/50 pt-4">
            <div className="h-8 w-8 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-xs">
              {user.email?.[0].toUpperCase()}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-xs font-semibold">{user.email}</div>
              <div className="text-[10px] text-muted-foreground">{isAdmin ? "مسؤول النظام" : "محرر محتوى"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pr-64">
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
          <Link to="/admin" className="font-display text-lg font-bold">لوحة التحكم</Link>
          <div className="flex items-center gap-2">
            <Link to="/" className="p-2 text-muted-foreground hover:text-foreground">
              <Globe className="h-5 w-5" />
            </Link>
            <button onClick={signOut} className="p-2 text-destructive">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Mobile Sub-Nav */}
        <nav className="sticky top-16 z-20 flex gap-1 overflow-x-auto border-b border-border bg-card p-2 lg:hidden no-scrollbar">
          {NAV.filter((n) => !n.adminOnly || isAdmin).map((n) => {
            const active = n.exact 
              ? location.pathname === n.to 
              : location.pathname === n.to || location.pathname.startsWith(n.to + "/");
            return (
              <Link 
                key={n.to} 
                to={n.to} 
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors", 
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent"
                )}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>

        {/* Page Content */}
        <main className="p-4 md:p-8 lg:p-10">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
