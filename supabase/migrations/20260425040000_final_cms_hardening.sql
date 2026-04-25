-- Final CMS hardening patch for existing Supabase projects.
-- Safe: does not drop, truncate, reset, rename, or delete existing data.
-- Purpose: make the deployed CMS schema match the current frontend/admin code,
-- refresh PostgREST schema cache, and make publishing + media upload reliable.

create extension if not exists pgcrypto;

-- Roles enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'editor');
  end if;
end $$;

-- Core tables, created only if a project is fresh.
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text,
  slug text unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  category_id uuid,
  author_id uuid,
  status text not null default 'draft',
  published boolean not null default false,
  published_at timestamptz,
  reading_minutes integer not null default 1,
  author_name text not null default 'معتز العلقمي',
  author_avatar text,
  seo_title text,
  seo_description text,
  canonical_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Compatibility columns for existing deployments.
alter table if exists public.categories add column if not exists name_ar text;
alter table if exists public.categories add column if not exists slug text;
alter table if exists public.categories add column if not exists description text;
alter table if exists public.categories add column if not exists sort_order integer not null default 0;
alter table if exists public.categories add column if not exists created_at timestamptz not null default now();
alter table if exists public.categories add column if not exists updated_at timestamptz not null default now();

alter table if exists public.posts add column if not exists excerpt text;
alter table if exists public.posts add column if not exists cover_image text;
alter table if exists public.posts add column if not exists category_id uuid;
alter table if exists public.posts add column if not exists author_id uuid;
alter table if exists public.posts add column if not exists status text not null default 'draft';
alter table if exists public.posts add column if not exists published boolean not null default false;
alter table if exists public.posts add column if not exists published_at timestamptz;
alter table if exists public.posts add column if not exists reading_minutes integer not null default 1;
alter table if exists public.posts add column if not exists author_name text not null default 'معتز العلقمي';
alter table if exists public.posts add column if not exists author_avatar text;
alter table if exists public.posts add column if not exists seo_title text;
alter table if exists public.posts add column if not exists seo_description text;
alter table if exists public.posts add column if not exists canonical_url text;
alter table if exists public.posts add column if not exists created_at timestamptz not null default now();
alter table if exists public.posts add column if not exists updated_at timestamptz not null default now();

alter table if exists public.pages add column if not exists seo_title text;
alter table if exists public.pages add column if not exists seo_description text;
alter table if exists public.pages add column if not exists created_at timestamptz not null default now();
alter table if exists public.pages add column if not exists updated_at timestamptz not null default now();
alter table if exists public.profiles add column if not exists display_name text;
alter table if exists public.profiles add column if not exists email text;
alter table if exists public.profiles add column if not exists avatar_url text;
alter table if exists public.profiles add column if not exists created_at timestamptz not null default now();
alter table if exists public.profiles add column if not exists updated_at timestamptz not null default now();
alter table if exists public.contact_messages add column if not exists subject text;
alter table if exists public.contact_messages add column if not exists read boolean not null default false;
alter table if exists public.site_settings add column if not exists updated_at timestamptz not null default now();

-- Backfill categories from older schemas.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='categories' and column_name='name') then
    update public.categories
      set name_ar = coalesce(nullif(name_ar, ''), nullif(name::text, ''), slug, 'تصنيف')
      where name_ar is null or trim(name_ar) = '';
  else
    update public.categories
      set name_ar = coalesce(nullif(name_ar, ''), slug, 'تصنيف')
      where name_ar is null or trim(name_ar) = '';
  end if;
end $$;

-- Backfill old coverImage and published boolean if they exist.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='posts' and column_name='coverImage') then
    update public.posts set cover_image = coalesce(cover_image, "coverImage") where cover_image is null;
  end if;

  update public.posts
     set status = case when coalesce(published, false) then 'published' else coalesce(nullif(status, ''), 'draft') end
   where status is null or status not in ('draft','published');

  update public.posts
     set published = (status = 'published')
   where published is distinct from (status = 'published');

  update public.posts
     set published_at = coalesce(published_at, now())
   where status = 'published' and published_at is null;

  update public.posts
     set reading_minutes = greatest(1, coalesce(reading_minutes, 1));
end $$;

-- Foreign keys: add safely if missing.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_category_id_fkey') then
    alter table public.posts add constraint posts_category_id_fkey foreign key (category_id) references public.categories(id) on delete set null;
  end if;
exception when duplicate_object then null;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_author_id_fkey') then
    alter table public.posts add constraint posts_author_id_fkey foreign key (author_id) references auth.users(id) on delete set null;
  end if;
exception when duplicate_object then null;
end $$;

-- Basic constraints/indexes.
create unique index if not exists categories_slug_key on public.categories(slug);
create unique index if not exists posts_slug_key on public.posts(slug);
create index if not exists idx_posts_status_published_at on public.posts(status, published_at desc);
create index if not exists idx_posts_category_id on public.posts(category_id);
create index if not exists idx_posts_author_id on public.posts(author_id);
create index if not exists idx_categories_sort_order on public.categories(sort_order);

-- Updated-at triggers.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at before update on public.categories for each row execute function public.set_updated_at();
drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at before update on public.posts for each row execute function public.set_updated_at();
drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at before update on public.pages for each row execute function public.set_updated_at();
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- Keep status/published/published_at consistent even if the UI writes only one shape.
create or replace function public.normalize_post_publish_state()
returns trigger
language plpgsql
as $$
begin
  if new.status is null or new.status not in ('draft','published') then
    new.status := case when coalesce(new.published, false) then 'published' else 'draft' end;
  end if;

  new.published := (new.status = 'published');

  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;

  if new.status = 'draft' then
    new.published := false;
  end if;

  new.reading_minutes := greatest(1, coalesce(new.reading_minutes, 1));
  return new;
end;
$$;

drop trigger if exists normalize_post_publish_state_trigger on public.posts;
create trigger normalize_post_publish_state_trigger
before insert or update on public.posts
for each row execute function public.normalize_post_publish_state();

-- Role helpers.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, 'admin'::public.app_role);
$$;

create or replace function public.is_editor(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_role(_user_id, 'editor'::public.app_role) or public.has_role(_user_id, 'admin'::public.app_role);
$$;

create or replace function public.can_manage_content(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_editor(_user_id);
$$;

-- RLS policies.
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories" on public.categories for select using (true);
drop policy if exists "Editors can insert categories" on public.categories;
create policy "Editors can insert categories" on public.categories for insert to authenticated with check (public.can_manage_content(auth.uid()));
drop policy if exists "Editors can update categories" on public.categories;
create policy "Editors can update categories" on public.categories for update to authenticated using (public.can_manage_content(auth.uid())) with check (public.can_manage_content(auth.uid()));
drop policy if exists "Editors can delete categories" on public.categories;
create policy "Editors can delete categories" on public.categories for delete to authenticated using (public.can_manage_content(auth.uid()));

drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts" on public.posts for select using (status = 'published' or public.can_manage_content(auth.uid()));
drop policy if exists "Editors can insert posts" on public.posts;
create policy "Editors can insert posts" on public.posts for insert to authenticated with check (public.can_manage_content(auth.uid()));
drop policy if exists "Editors can update posts" on public.posts;
create policy "Editors can update posts" on public.posts for update to authenticated using (public.can_manage_content(auth.uid())) with check (public.can_manage_content(auth.uid()));
drop policy if exists "Editors can delete posts" on public.posts;
create policy "Editors can delete posts" on public.posts for delete to authenticated using (public.can_manage_content(auth.uid()));

drop policy if exists "Public can read pages" on public.pages;
create policy "Public can read pages" on public.pages for select using (true);
drop policy if exists "Admins can insert pages" on public.pages;
create policy "Admins can insert pages" on public.pages for insert to authenticated with check (public.is_admin(auth.uid()));
drop policy if exists "Admins can update pages" on public.pages;
create policy "Admins can update pages" on public.pages for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
drop policy if exists "Admins can delete pages" on public.pages;
create policy "Admins can delete pages" on public.pages for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "Public can read settings" on public.site_settings;
create policy "Public can read settings" on public.site_settings for select using (true);
drop policy if exists "Admins can upsert settings" on public.site_settings;
create policy "Admins can upsert settings" on public.site_settings for insert to authenticated with check (public.is_admin(auth.uid()));
drop policy if exists "Admins can update settings" on public.site_settings;
create policy "Admins can update settings" on public.site_settings for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe" on public.subscribers for insert to anon, authenticated with check (true);
drop policy if exists "Admins can read subscribers" on public.subscribers;
create policy "Admins can read subscribers" on public.subscribers for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "Anyone can send contact messages" on public.contact_messages;
create policy "Anyone can send contact messages" on public.contact_messages for insert to anon, authenticated with check (true);
drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages" on public.contact_messages for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own roles and admins can read all" on public.user_roles;
create policy "Users can read own roles and admins can read all" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
drop policy if exists "Admins can manage roles" on public.user_roles;
create policy "Admins can manage roles" on public.user_roles for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Public can read profiles" on public.profiles;
create policy "Public can read profiles" on public.profiles for select using (true);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin(auth.uid())) with check (id = auth.uid() or public.is_admin(auth.uid()));

-- Storage: public reads, authenticated editors/admins upload/update/delete.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 6291456, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = true,
    file_size_limit = 6291456,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

drop policy if exists "Public media read" on storage.objects;
create policy "Public media read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "Authenticated media upload" on storage.objects;
create policy "Authenticated media upload" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.can_manage_content(auth.uid()));
drop policy if exists "Authenticated media update" on storage.objects;
create policy "Authenticated media update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.can_manage_content(auth.uid())) with check (bucket_id = 'media' and public.can_manage_content(auth.uid()));
drop policy if exists "Authenticated media delete" on storage.objects;
create policy "Authenticated media delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.can_manage_content(auth.uid()));

-- Default settings and useful categories.
insert into public.site_settings (key, value) values
  ('site_name', 'معتز العلقمي'),
  ('site_description', 'مدونة عربية هادئة للكتابة المتأنية في الفكر والأدب والتقنية والصيدلة.'),
  ('footer_text', 'جميع الحقوق محفوظة — معتز العلقمي'),
  ('site_url', 'https://www.moatazalaqmi.online')
on conflict (key) do update set value = excluded.value;

insert into public.categories (name_ar, slug, sort_order) values
  ('مقالات', 'articles', 1),
  ('اقتباسات', 'quotes', 2),
  ('قصص', 'stories', 3),
  ('ثقافة', 'culture', 4),
  ('تقنية', 'technology', 5),
  ('صيدلة وطب', 'pharmacy-medicine', 6)
on conflict (slug) do update set name_ar = excluded.name_ar, sort_order = excluded.sort_order;

-- Grants.
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.pages, public.site_settings, public.profiles to anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert on public.subscribers, public.contact_messages to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_editor(uuid) to authenticated;
grant execute on function public.can_manage_content(uuid) to authenticated;

-- Force Supabase/PostgREST to reload schema cache immediately.
notify pgrst, 'reload schema';
