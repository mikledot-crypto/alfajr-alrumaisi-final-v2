// Server-side Supabase Admin client. This file must only be imported by server code.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing server environment variable: ${name}`);
  }
  return value;
}

function createSupabaseAdminClient() {
  const SUPABASE_URL = required('SUPABASE_URL');
  const SUPABASE_SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY');

  return createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let supabaseAdminSingleton: ReturnType<typeof createSupabaseAdminClient> | undefined;

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createSupabaseAdminClient>, {
  get(_, prop, receiver) {
    if (!supabaseAdminSingleton) supabaseAdminSingleton = createSupabaseAdminClient();
    return Reflect.get(supabaseAdminSingleton, prop, receiver);
  },
});
