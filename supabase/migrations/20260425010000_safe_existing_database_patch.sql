-- Safe compatibility patch for existing Supabase projects.
-- This patch DOES NOT drop, truncate, recreate, or rename tables.
-- It only adds missing columns/functions/policies required by the final CMS frontend.

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'editor');
  end if;
end $$;

-- Categories: support both older `name` schema and final `name_ar` schema.
alter table if exists public.categories add column if not exists name_ar text;
alter table if exists public.categories add column if not exists sort_order integer not null default 0;
alter table if exists public.categories add column if not exists description text;
alter table if exists public.categories add column if not exists created_at timestamptz not null default now();
alter table if exists public.categories add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'categories' and column_name = 'name'
  ) then
    update public.categories
    set name_ar = coalesce(nullif(name_ar, ''), nullif(name::text, ''), slug)
    where name_ar is null or trim(name_ar) = '';
  else
    update public.categories
    set name_ar = coalesce(nullif(name_ar, ''), slug)
    where name_ar is null or trim(name_ar) = '';
  end if;
end $$;

-- Posts: support older `published boolean` schema and final `status text` schema.
alter table if exists public.posts add column if not exists status text not null default 'draft';
alter table if exists public.posts add column if not exists reading_minutes integer not null default 1;
alter table if exists public.posts add column if not exists author_name text not null default 'معتز العلقمي';
alter table if exists public.posts add column if not exists seo_title text;
alter table if exists public.posts add column if not exists seo_description text;
alter table if exists public.posts add column if not exists canonical_url text;
alter table if exists public.posts add column if not exists published_at timestamptz;
alter table if exists public.posts add column if not exists cover_image text;
alter table if exists public.posts add column if not exists excerpt text;
alter table if exists public.posts add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'published'
  ) then
    update public.posts
    set status = case when published then 'published' else 'draft' end
    where status is null or status not in ('draft', 'published');
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'posts' and column_name = 'coverImage'
  ) then
    update public.posts
    set cover_image = coalesce(cover_image, "coverImage")
    where cover_image is null;
  end if;
end $$;

-- Pages
alter table if exists public.pages add column if not exists seo_title text;
alter table if exists public.pages add column if not exists seo_description text;
alter table if exists public.pages add column if not exists created_at timestamptz not null default now();
alter table if exists public.pages add column if not exists updated_at timestamptz not null default now();

-- Contact messages
alter table if exists public.contact_messages add column if not exists subject text;
alter table if exists public.contact_messages add column if not exists read boolean not null default false;

-- Site settings
alter table if exists public.site_settings add column if not exists updated_at timestamptz not null default now();

-- Profiles / roles if missing
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
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

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
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
  select public.has_role(_user_id, 'editor'::public.app_role)
      or public.has_role(_user_id, 'admin'::public.app_role);
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

alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;

-- Policies are idempotently recreated for the final frontend shape.
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

drop policy if exists "Admins can delete subscribers" on public.subscribers;
create policy "Admins can delete subscribers" on public.subscribers for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "Anyone can send contact messages" on public.contact_messages;
create policy "Anyone can send contact messages" on public.contact_messages for insert to anon, authenticated with check (true);

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages" on public.contact_messages for select to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages" on public.contact_messages for delete to authenticated using (public.is_admin(auth.uid()));

drop policy if exists "Users can read own roles and admins can read all" on public.user_roles;
create policy "Users can read own roles and admins can read all" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert roles" on public.user_roles;
create policy "Admins can insert roles" on public.user_roles for insert to authenticated with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update roles" on public.user_roles;
create policy "Admins can update roles" on public.user_roles for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete roles" on public.user_roles;
create policy "Admins can delete roles" on public.user_roles for delete to authenticated using (public.is_admin(auth.uid()));

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.pages, public.site_settings to anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert on public.subscribers, public.contact_messages to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_editor(uuid) to authenticated;
grant execute on function public.can_manage_content(uuid) to authenticated;

insert into public.site_settings (key, value) values
  ('site_name', 'معتز العلقمي'),
  ('site_description', 'مدونة عربية في الفكر والأدب والتقنية والصيدلة'),
  ('footer_text', 'كل الكلمات هنا كُتبت بحب — © معتز العلقمي')
on conflict (key) do nothing;
