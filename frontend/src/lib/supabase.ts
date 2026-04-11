import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL ?? '').trim().replace(/\/+$/, '');
const browserOrigin = typeof window !== 'undefined' ? window.location.origin : '';

export const authBaseUrl = publicSiteUrl || browserOrigin;
export const authLoginRedirectUrl = authBaseUrl ? `${authBaseUrl}/login` : '';
export const authPasswordResetUrl = authBaseUrl ? `${authBaseUrl}/reset-password` : '';

if (!url || !anon) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing - set them in frontend/.env');
}

export const supabase = createClient(url ?? '', anon ?? '');

export async function startSupabaseOAuth(provider: 'google' | 'facebook') {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: authLoginRedirectUrl || undefined,
      ...(provider === 'google'
        ? { queryParams: { access_type: 'offline', prompt: 'consent' } }
        : {}),
    },
  });
}
