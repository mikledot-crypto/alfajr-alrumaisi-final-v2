import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Response(`Missing Supabase server environment variable: ${name}`, { status: 500 });
  return value;
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const request = getRequest();
  const authHeader = request?.headers?.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    throw new Response('Unauthorized', { status: 401 });
  }

  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) throw new Response('Unauthorized', { status: 401 });

  const supabase = createClient<Database>(required('SUPABASE_URL'), required('SUPABASE_PUBLISHABLE_KEY'), {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
    auth: {
      storage: undefined,
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.id) throw new Response('Unauthorized', { status: 401 });

  return next({
    context: {
      supabase,
      userId: data.user.id,
      user: data.user,
    },
  });
});
