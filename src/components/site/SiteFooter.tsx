import { Link } from "@tanstack/react-router";
import { Send } from "lucide-react";

interface Settings {
  site_name?: string;
  site_description?: string;
  footer_text?: string;
  social_telegram?: string;
  social_twitter?: string;
  social_instagram?: string;
  social_facebook?: string;
}

export function SiteFooter({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-24 border-t border-border/60 bg-muted/40">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-display text-xl font-bold">{settings.site_name ?? "معتز العلقمي"}</h3>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {settings.site_description ?? "مدونة عربية للكتابة الهادئة والرأي المدروس."}
          </p>
          <div className="mt-4 flex items-center gap-3">
            {settings.social_telegram && (
              <a
                href={settings.social_telegram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="تيليجرام"
                className="rounded-full border border-border bg-background p-2 text-foreground transition-colors hover:border-gold hover:text-gold"
              >
                <Send className="h-4 w-4" />
              </a>
            )}
            {settings.social_twitter && (
              <a href={settings.social_twitter} target="_blank" rel="noopener noreferrer" aria-label="X" className="rounded-full border border-border bg-background p-2 text-sm font-semibold text-foreground transition-colors hover:border-gold hover:text-gold">
                𝕏
              </a>
            )}
            {settings.social_instagram && (
              <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" aria-label="إنستغرام" className="rounded-full border border-border bg-background p-2 text-xs font-semibold text-foreground transition-colors hover:border-gold hover:text-gold">
                IG
              </a>
            )}
            {settings.social_facebook && (
              <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" className="rounded-full border border-border bg-background p-2 text-xs font-semibold text-foreground transition-colors hover:border-gold hover:text-gold">
                f
              </a>
            )}
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-gold">
            روابط سريعة
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/" className="text-muted-foreground hover:text-foreground">الرئيسية</Link></li>
            <li><Link to="/articles" className="text-muted-foreground hover:text-foreground">المقالات</Link></li>
            <li><Link to="/about" className="text-muted-foreground hover:text-foreground">عن الموقع</Link></li>
            <li><Link to="/contact" className="text-muted-foreground hover:text-foreground">اتصل بنا</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold uppercase tracking-wider text-gold">
            التصنيفات
          </h4>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/category/$slug" params={{ slug: "quotes" }} className="text-muted-foreground hover:text-foreground">اقتباسات</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "stories" }} className="text-muted-foreground hover:text-foreground">قصص</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "culture" }} className="text-muted-foreground hover:text-foreground">ثقافة</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "tech" }} className="text-muted-foreground hover:text-foreground">تقنية</Link></li>
            <li><Link to="/category/$slug" params={{ slug: "pharmacy-medicine" }} className="text-muted-foreground hover:text-foreground">صيدلة وطب</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        {settings.footer_text ?? `© ${year} ${settings.site_name ?? "معتز العلقمي"}`}
      </div>
    </footer>
  );
}
