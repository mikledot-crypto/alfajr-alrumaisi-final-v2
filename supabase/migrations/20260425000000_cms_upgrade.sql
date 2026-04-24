-- -----------------------------------------------------------------------------
-- CMS Upgrade Migration
-- -----------------------------------------------------------------------------

-- Ensure proper roles exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'editor');
    END IF;
END $$;

-- Update posts table with extra SEO fields if not exist
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Update pages table with SEO fields
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Ensure RLS is active and robust
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Additional site settings for SEO
INSERT INTO public.site_settings (key, value) VALUES
  ('og_image', ''),
  ('twitter_handle', '@moatazalalkami'),
  ('google_analytics_id', ''),
  ('site_language', 'ar')
ON CONFLICT (key) DO NOTHING;

-- Refresh permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
