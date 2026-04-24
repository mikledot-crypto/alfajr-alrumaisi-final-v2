-- Safe media/author patch. Does not drop, reset, rename, truncate, or delete data.

-- Optional author support for richer public article cards.
alter table if exists public.posts add column if not exists author_id uuid references auth.users(id) on delete set null;
alter table if exists public.profiles add column if not exists avatar_url text;
alter table if exists public.profiles add column if not exists display_name text;

create index if not exists idx_posts_author_id on public.posts(author_id);

-- Public media bucket for cover/editor images.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  6291456,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = true,
  file_size_limit = 6291456,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies: public reads, authenticated content managers upload/update/delete.
drop policy if exists "Public can read media" on storage.objects;
create policy "Public can read media"
on storage.objects for select
using (bucket_id = 'media');

drop policy if exists "Editors can upload media" on storage.objects;
create policy "Editors can upload media"
on storage.objects for insert to authenticated
with check (bucket_id = 'media' and public.can_manage_content(auth.uid()));

drop policy if exists "Editors can update media" on storage.objects;
create policy "Editors can update media"
on storage.objects for update to authenticated
using (bucket_id = 'media' and public.can_manage_content(auth.uid()))
with check (bucket_id = 'media' and public.can_manage_content(auth.uid()));

drop policy if exists "Editors can delete media" on storage.objects;
create policy "Editors can delete media"
on storage.objects for delete to authenticated
using (bucket_id = 'media' and public.can_manage_content(auth.uid()));
