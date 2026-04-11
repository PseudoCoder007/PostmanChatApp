import { supabase } from './supabase';

type RedirectKind = 'none' | 'error' | 'recovery' | 'signup' | 'session';

export interface AuthRedirectResult {
  kind: RedirectKind;
  message?: string;
}

function readAuthParams(hash: string, search: string) {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  const searchParams = new URLSearchParams(search);
  const code = searchParams.get('code');
  const type = hashParams.get('type') ?? searchParams.get('type');
  const errorDescription = hashParams.get('error_description') ?? searchParams.get('error_description');
  const errorCode = hashParams.get('error') ?? searchParams.get('error');
  const accessToken = hashParams.get('access_token');
  const refreshToken = hashParams.get('refresh_token');
  const hasAccessToken = Boolean(accessToken || refreshToken);

  return {
    code,
    type,
    hasAccessToken,
    accessToken,
    refreshToken,
    errorDescription,
    errorCode,
  };
}

export function getSupabaseRedirectPath(hash: string, search: string) {
  const { code, type, hasAccessToken, errorCode, errorDescription } = readAuthParams(hash, search);
  if (!code && !type && !hasAccessToken && !errorCode && !errorDescription) {
    return null;
  }
  return type === 'recovery' ? '/reset-password' : '/login';
}

export async function finalizeSupabaseRedirect(hash: string, search: string): Promise<AuthRedirectResult> {
  const { code, type, hasAccessToken, accessToken, refreshToken, errorCode, errorDescription } = readAuthParams(hash, search);
  if (!code && !type && !hasAccessToken && !errorCode && !errorDescription) {
    return { kind: 'none' };
  }

  if (errorDescription || errorCode) {
    return { kind: 'error', message: decodeURIComponent((errorDescription || errorCode || '').replace(/\+/g, ' ')) };
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { kind: 'error', message: error.message };
    }
  }

  if (hasAccessToken && accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return { kind: 'error', message: error.message };
    }
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return { kind: 'error', message: error.message };
  }

  if (type === 'recovery') {
    return data.session
      ? { kind: 'recovery' }
      : { kind: 'error', message: 'Your reset link is missing or expired. Request a fresh password reset email.' };
  }

  if (type === 'signup') {
    if (data.session) {
      await supabase.auth.signOut();
    }
    return { kind: 'signup', message: 'Email confirmed. You can sign in now.' };
  }

  if (data.session) {
    return { kind: 'session' };
  }

  return { kind: 'none' };
}

export function clearSupabaseRedirectParams() {
  if (typeof window === 'undefined') {
    return;
  }
  const url = new URL(window.location.href);
  url.hash = '';
  url.searchParams.delete('code');
  url.searchParams.delete('error');
  url.searchParams.delete('error_code');
  url.searchParams.delete('error_description');
  url.searchParams.delete('type');
  window.history.replaceState({}, document.title, `${url.pathname}${url.search}`);
}
