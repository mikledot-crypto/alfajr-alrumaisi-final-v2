import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "الرئيسية" },
  { to: "/articles", label: "مقالات", search: { category: undefined as string | undefined } },
  { to: "/category/quotes", label: "اقتباسات" },
  { to: "/category/stories", label: "قصص" },
  { to: "/category/culture", label: "ثقافة" },
  { to: "/category/tech", label: "تقنية" },
  { to: "/category/pharmacy-medicine", label: "صيدلة وطب" },
  { to: "/about", label: "عن الموقع" },
  { to: "/contact", label: "اتصل بنا" },
] as const;

export function SiteHeader({ siteName }: { siteName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/65">
      <div className="container mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4">
        <Link to="/" className="group flex items-center gap-2.5">
          <span aria-hidden className="text-gold transition-transform duration-700 group-hover:rotate-180">❖</span>
          <span className="font-display text-2xl font-bold tracking-tight text-foreground">
            {siteName}
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className="rounded-md p-2 text-foreground hover:bg-accent lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="القائمة"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "overflow-hidden border-t border-border/60 bg-background transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-[500px]" : "max-h-0",
        )}
      >
        <nav className="container mx-auto flex max-w-6xl flex-col px-4 py-2">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="border-b border-border/40 py-3 text-sm text-muted-foreground hover:text-foreground"
              activeProps={{ className: "text-foreground font-semibold" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
