# End-to-end testing checklist

Apply the Supabase migration first, then test:

1. Supabase setup
- Run the SQL migration in `supabase/migrations/` on a fresh Supabase project.
- Confirm tables exist: categories, posts, pages, site_settings, subscribers, contact_messages, user_roles, profiles.
- Confirm RLS is enabled and seed rows exist.

2. Env variables
```env
VITE_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
VITE_SUPABASE_PROJECT_ID="YOUR_PROJECT_REF"
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY_DO_NOT_EXPOSE"
```

3. Bootstrap admin
- Set `site_settings.bootstrap_admin_email` to the admin email.
- Sign up with that email.
- Confirm `user_roles` contains role `admin` for that user.

Manual fallback:
```sql
insert into public.user_roles (user_id, role)
values ('USER_UUID_HERE', 'admin')
on conflict do nothing;
```

4. Roles
- Admin can see Users page.
- Admin can create an editor.
- Editor can manage posts/categories.
- Editor cannot access users/messages/subscribers/settings/pages.

5. Publishing
- Create draft: it must not appear publicly.
- Publish post: it must appear publicly.
- Edit/unpublish/delete must persist.

6. Forms
- Contact form saves messages.
- Newsletter saves subscribers and prevents duplicates.

7. Server user management
- `SUPABASE_SERVICE_ROLE_KEY` exists only server-side.
- Admin can list/create/delete users.
- Admin cannot delete himself.
