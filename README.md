# مدونة معتز العلقمي — Arabic Supabase CMS

مشروع مدونة عربية مبني بـ TanStack Start + React + Supabase + Vercel.

## ما الذي يحتويه المشروع؟

- واجهة عربية RTL.
- صفحات عامة: الرئيسية، المقالات، التصنيفات، المقال المفرد، عن الموقع، تواصل.
- لوحة تحكم: `/admin`.
- تسجيل دخول: `/auth`.
- إدارة المقالات مع محرر TipTap.
- إدارة التصنيفات والصفحات والرسائل والمشتركين والإعدادات.
- نظام أدوار: `admin` و `editor` عبر جدول `user_roles`.
- SEO أساسي: meta tags، Open Graph، Twitter cards، sitemap.xml، robots.txt، structured data للمقالات.
- تعقيم HTML قبل عرض المقالات.

## متغيرات البيئة المطلوبة في Vercel

أضف هذه المتغيرات في: Vercel → Project → Settings → Environment Variables

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

> مهم: `SUPABASE_SERVICE_ROLE_KEY` لا تضعه أبدًا مع prefix `VITE_`، لأنه مفتاح سري للعمليات السيرفرية فقط مثل إدارة المستخدمين.

## إعداد قاعدة البيانات

### لمشروع جديد
شغّل ملف:

```text
supabase/migrations/20260423153502_0e745aa8-0dff-4747-a991-b6f8a7ddff45.sql
```

ثم شغّل:

```text
supabase/migrations/20260425000000_cms_upgrade.sql
```

### لمشروع Supabase موجود سابقًا
شغّل ملف الترقيع الآمن:

```text
supabase/migrations/20260425010000_safe_existing_database_patch.sql
```

هذا الملف لا يحذف الجداول ولا يمسح البيانات. هو فقط يضيف الأعمدة والسياسات الناقصة حتى يطابق الكود النهائي.

## إنشاء أدمن

بعد إنشاء مستخدم من Supabase Authentication، انسخ UID ثم شغّل:

```sql
insert into public.user_roles (user_id, role)
values ('USER_ID_HERE', 'admin')
on conflict (user_id, role) do nothing;
```

## التشغيل المحلي

```bash
npm install
npm run dev
```

## النشر على Vercel

الإعدادات:

```text
Framework Preset: Other
Install Command: npm install
Build Command: npm run build
Output Directory: اتركه فارغًا
```

ملف `vercel.json` يضبط أمر التثبيت والبناء، وTanStack Start + Nitro يتولّيان إخراج النشر المناسب.

## الدخول والتحرير

- افتح `/auth` لتسجيل الدخول.
- بعد الدخول بحساب يحمل دور `admin` أو `editor` افتح `/admin`.
- من لوحة التحكم تستطيع إنشاء المقالات، حفظها كمسودة أو نشرها.
- المقالات التي حالتها `draft` لا تظهر للعامة.

## ملاحظات مهمة

- إذا كانت قاعدة البيانات أنشئت بسكيمة قديمة فيها `categories.name` أو `posts.published`، شغّل ملف `20260425010000_safe_existing_database_patch.sql`.
- إذا ظهرت مشكلة في صفحة المستخدمين، تأكد من إضافة `SUPABASE_SERVICE_ROLE_KEY` في Vercel.

## آخر تحسينات مهمة

تمت إضافة دعم رفع الصور مباشرة من الهاتف أو الكمبيوتر عبر Supabase Storage bucket باسم `media`، مع إبقاء خيار رابط الصورة الخارجي. إذا كانت قاعدة البيانات منشأة قبل هذه النسخة، شغّل هذا الملف في Supabase SQL Editor مرة واحدة فقط:

```text
supabase/migrations/20260425020000_media_and_author_patch.sql
```

هذا الملف آمن: لا يحذف الجداول ولا يعيد إنشاءها ولا يمس البيانات الموجودة. يضيف فقط bucket للصور وأعمدة اختيارية للكاتب والصورة الشخصية.

### إعدادات Vercel الصحيحة

- Framework Preset: Other
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: اتركه فارغاً

### متغيرات البيئة المطلوبة

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_REF
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
```
