-- Full Supabase schema + RLS bootstrap for the Arabic CMS blog.
-- Safe to apply on a fresh Supabase project.
-- Backend stack: Supabase Auth + Postgres + RLS.

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'editor');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_slug_not_empty check (length(trim(slug)) > 0),
  constraint categories_name_not_empty check (length(trim(name_ar)) > 0)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  status text not null default 'draft',
  published_at timestamptz,
  reading_minutes integer not null default 1,
  author_name text not null default 'معتز العلقمي',
  category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_status_check check (status in ('draft', 'published')),
  constraint posts_title_not_empty check (length(trim(title)) > 0),
  constraint posts_slug_not_empty check (length(trim(slug)) > 0),
  constraint posts_content_not_empty check (length(trim(content)) > 0),
  constraint posts_reading_minutes_positive check (reading_minutes > 0)
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pages_slug_not_empty check (length(trim(slug)) > 0),
  constraint pages_title_not_empty check (length(trim(title)) > 0)
);

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now(),
  constraint site_settings_key_not_empty check (length(trim(key)) > 0)
);

create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  constraint subscribers_email_basic_check check (position('@' in email) > 1)
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  constraint contact_messages_email_basic_check check (position('@' in email) > 1),
  constraint contact_messages_name_not_empty check (length(trim(name)) > 0),
  constraint contact_messages_message_not_empty check (length(trim(message)) > 0)
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- Optional profile table for future UI expansion. Current UI reads users from Supabase Auth.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
create index if not exists idx_categories_sort_order on public.categories(sort_order);
create index if not exists idx_posts_status_published_at on public.posts(status, published_at desc);
create index if not exists idx_posts_category_id on public.posts(category_id);
create index if not exists idx_posts_updated_at on public.posts(updated_at desc);
create index if not exists idx_user_roles_user_id on public.user_roles(user_id);
create index if not exists idx_contact_messages_created_at on public.contact_messages(created_at desc);
create index if not exists idx_subscribers_created_at on public.subscribers(created_at desc);

-- -----------------------------------------------------------------------------
-- Updated-at trigger
-- -----------------------------------------------------------------------------
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
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists set_pages_updated_at on public.pages;
create trigger set_pages_updated_at
before update on public.pages
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.touch_site_setting_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.touch_site_setting_updated_at();

-- -----------------------------------------------------------------------------
-- Role helper functions
-- -----------------------------------------------------------------------------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
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

-- -----------------------------------------------------------------------------
-- Auth bootstrap trigger
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user_profile_and_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bootstrap_email text;
  existing_roles_count integer;
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email;

  select value into bootstrap_email
  from public.site_settings
  where key = 'bootstrap_admin_email';

  select count(*) into existing_roles_count
  from public.user_roles;

  -- First user OR configured bootstrap email becomes admin.
  -- Change site_settings.bootstrap_admin_email before the first signup if needed.
  if existing_roles_count = 0 or lower(new.email) = lower(coalesce(bootstrap_email, '')) then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin'::public.app_role)
    on conflict do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_profile_and_role on auth.users;
create trigger on_auth_user_created_assign_profile_and_role
after insert on auth.users
for each row execute function public.handle_new_user_profile_and_role();

-- -----------------------------------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.subscribers enable row level security;
alter table public.contact_messages enable row level security;
alter table public.user_roles enable row level security;
alter table public.profiles enable row level security;

-- -----------------------------------------------------------------------------
-- Policies: categories
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
using (true);

drop policy if exists "Editors can insert categories" on public.categories;
create policy "Editors can insert categories"
on public.categories for insert
to authenticated
with check (public.can_manage_content(auth.uid()));

drop policy if exists "Editors can update categories" on public.categories;
create policy "Editors can update categories"
on public.categories for update
to authenticated
using (public.can_manage_content(auth.uid()))
with check (public.can_manage_content(auth.uid()));

drop policy if exists "Editors can delete categories" on public.categories;
create policy "Editors can delete categories"
on public.categories for delete
to authenticated
using (public.can_manage_content(auth.uid()));

-- -----------------------------------------------------------------------------
-- Policies: posts
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read published posts" on public.posts;
create policy "Public can read published posts"
on public.posts for select
using (status = 'published' or public.can_manage_content(auth.uid()));

drop policy if exists "Editors can insert posts" on public.posts;
create policy "Editors can insert posts"
on public.posts for insert
to authenticated
with check (public.can_manage_content(auth.uid()));

drop policy if exists "Editors can update posts" on public.posts;
create policy "Editors can update posts"
on public.posts for update
to authenticated
using (public.can_manage_content(auth.uid()))
with check (public.can_manage_content(auth.uid()));

drop policy if exists "Editors can delete posts" on public.posts;
create policy "Editors can delete posts"
on public.posts for delete
to authenticated
using (public.can_manage_content(auth.uid()));

-- -----------------------------------------------------------------------------
-- Policies: pages (admin only for writes)
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read pages" on public.pages;
create policy "Public can read pages"
on public.pages for select
using (true);

drop policy if exists "Admins can insert pages" on public.pages;
create policy "Admins can insert pages"
on public.pages for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update pages" on public.pages;
create policy "Admins can update pages"
on public.pages for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete pages" on public.pages;
create policy "Admins can delete pages"
on public.pages for delete
to authenticated
using (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Policies: site_settings
-- -----------------------------------------------------------------------------
drop policy if exists "Public can read settings" on public.site_settings;
create policy "Public can read settings"
on public.site_settings for select
using (true);

drop policy if exists "Admins can upsert settings" on public.site_settings;
create policy "Admins can upsert settings"
on public.site_settings for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update settings" on public.site_settings;
create policy "Admins can update settings"
on public.site_settings for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete settings" on public.site_settings;
create policy "Admins can delete settings"
on public.site_settings for delete
to authenticated
using (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Policies: subscribers
-- -----------------------------------------------------------------------------
drop policy if exists "Anyone can subscribe" on public.subscribers;
create policy "Anyone can subscribe"
on public.subscribers for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read subscribers" on public.subscribers;
create policy "Admins can read subscribers"
on public.subscribers for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete subscribers" on public.subscribers;
create policy "Admins can delete subscribers"
on public.subscribers for delete
to authenticated
using (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Policies: contact_messages
-- -----------------------------------------------------------------------------
drop policy if exists "Anyone can send contact messages" on public.contact_messages;
create policy "Anyone can send contact messages"
on public.contact_messages for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read contact messages" on public.contact_messages;
create policy "Admins can read contact messages"
on public.contact_messages for select
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "Admins can update contact messages" on public.contact_messages;
create policy "Admins can update contact messages"
on public.contact_messages for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete contact messages" on public.contact_messages;
create policy "Admins can delete contact messages"
on public.contact_messages for delete
to authenticated
using (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Policies: user_roles
-- -----------------------------------------------------------------------------
drop policy if exists "Users can read own roles and admins can read all" on public.user_roles;
create policy "Users can read own roles and admins can read all"
on public.user_roles for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Admins can insert roles" on public.user_roles;
create policy "Admins can insert roles"
on public.user_roles for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can update roles" on public.user_roles;
create policy "Admins can update roles"
on public.user_roles for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "Admins can delete roles" on public.user_roles;
create policy "Admins can delete roles"
on public.user_roles for delete
to authenticated
using (public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Policies: profiles
-- -----------------------------------------------------------------------------
drop policy if exists "Users can read own profile and admins can read all" on public.profiles;
create policy "Users can read own profile and admins can read all"
on public.profiles for select
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "Users can update own profile and admins can update all" on public.profiles;
create policy "Users can update own profile and admins can update all"
on public.profiles for update
to authenticated
using (id = auth.uid() or public.is_admin(auth.uid()))
with check (id = auth.uid() or public.is_admin(auth.uid()));

-- -----------------------------------------------------------------------------
-- Grants
-- -----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.pages, public.site_settings to anon, authenticated;
grant select on public.posts to anon, authenticated;
grant insert on public.subscribers, public.contact_messages to anon, authenticated;
grant select, insert, update, delete on public.categories, public.posts to authenticated;
grant select, insert, update, delete on public.pages, public.site_settings, public.subscribers, public.contact_messages, public.user_roles, public.profiles to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_editor(uuid) to authenticated;
grant execute on function public.can_manage_content(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------------------------
insert into public.categories (name_ar, slug, description, sort_order) values
  ('مقالات', 'articles', 'مقالات متنوعة في الفكر والرأي', 1),
  ('اقتباسات', 'quotes', 'اقتباسات مختارة من قراءات وتأملات', 2),
  ('قصص', 'stories', 'قصص قصيرة ونصوص سردية', 3),
  ('ثقافة', 'culture', 'موضوعات ثقافية وأدبية', 4),
  ('تقنية', 'tech', 'مقالات في التقنية والبرمجيات', 5),
  ('صيدلة وطب', 'pharmacy-medicine', 'مواضيع علمية في الصيدلة والطب', 6)
on conflict (slug) do update set
  name_ar = excluded.name_ar,
  description = excluded.description,
  sort_order = excluded.sort_order;

insert into public.pages (slug, title, content) values
  ('about', 'عن الموقع', 'مرحبًا بك في مدونة معتز العلقمي — مساحة هادئة للكتابة في الفكر، الأدب، التقنية، والصيدلة. أؤمن بأن الكلمة الصادقة قادرة على إحداث فرق صغير في يوم القارئ، ومن هنا تنطلق هذه المدونة لتقدم محتوى عربي مدروس بلغة راقية وأسلوب مرتب.'),
  ('contact', 'اتصل بنا', 'يسعدني تواصلك معي في أي وقت. يمكنك مراسلتي عبر النموذج في هذه الصفحة، أو عبر تيليجرام على @M_A_De.')
on conflict (slug) do update set
  title = excluded.title,
  content = excluded.content;

insert into public.site_settings (key, value) values
  ('site_name', 'معتز العلقمي'),
  ('site_description', 'مدونة عربية في الفكر والأدب والتقنية والصيدلة'),
  ('footer_text', 'كل الكلمات هنا كُتبت بحب — © معتز العلقمي'),
  ('social_telegram', 'https://t.me/M_A_De'),
  ('social_twitter', 'https://twitter.com/moataz77549'),
  ('social_instagram', 'https://instagram.com/moataz77549'),
  ('social_facebook', 'https://facebook.com/moataz77549'),
  ('bootstrap_admin_email', 'Moataz77549@gmail.com')
on conflict (key) do update set
  value = excluded.value;
