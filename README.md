# مدونة معتز العلقمي — Arabic CMS Blog

مدونة عربية مبنية على React/Vite/TanStack Start مع Supabase Auth + Database + RLS.

## التقنية

- React + Vite
- TanStack Router / Start
- Supabase Database + Auth
- Supabase RLS
- Tiptap rich text editor
- Tailwind / shadcn UI
- Arabic RTL UI

## المتغيرات المطلوبة

انسخ `.env.example` إلى `.env` محليًا، وأضف القيم نفسها في الاستضافة:

```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
VITE_SUPABASE_PROJECT_ID="YOUR_PROJECT_REF"
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY_DO_NOT_EXPOSE"
```

لا ترفع ملف `.env` إلى GitHub. ارفع `.env.example` فقط.

## إعداد Supabase جديد

1. أنشئ مشروع Supabase جديدًا.
2. افتح SQL Editor.
3. نفذ ملف migration الموجود في `supabase/migrations/`.
4. عدّل `bootstrap_admin_email` في جدول `site_settings` إلى بريد الأدمن.
5. سجّل حسابًا بهذا البريد؛ سيأخذ دور admin تلقائيًا.

## تشغيل محلي

```bash
npm install
npm run dev
```

## البناء

```bash
npm run build
```

## اختبار كامل

راجع `docs/TESTING.md`.
