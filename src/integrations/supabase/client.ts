// Browser/SSR-safe Supabase client.
// Public keys only: never place SUPABASE_SERVICE_ROLE_KEY here.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

declare const process: { env?: Record<string, string | undefined> } | undefined;

function getEnv(name: string): string | undefined {
  const viteEnv = import.meta.env as Record<string, string | undefined>;
  if (viteEnv[name]) return viteEnv[name];
  if (typeof process !== 'undefined' && process?.env?.[name]) return process.env[name];
  return undefined;
}

function createSupabaseClient() {
  const SUPABASE_URL =
    getEnv('VITE_SUPABASE_URL') ??
    getEnv('SUPABASE_URL');

  const SUPABASE_PUBLISHABLE_KEY =
    getEnv('VITE_SUPABASE_PUBLISHABLE_KEY') ??
    getEnv('VITE_SUPABASE_ANON_KEY') ??
    getEnv('SUPABASE_PUBLISHABLE_KEY') ??
    getEnv('SUPABASE_ANON_KEY');

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing Supabase environment variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY) in Vercel.',
    );
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

let supabaseSingleton: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!supabaseSingleton) supabaseSingleton = createSupabaseClient();
    return Reflect.get(supabaseSingleton, prop, receiver);
  },
});
