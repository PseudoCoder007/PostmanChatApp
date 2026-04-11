import { supabase } from './supabase';

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function getApiBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '');
}

export function resolveApiUrl(input: string) {
  if (/^(data|blob):/i.test(input)) {
    return input;
  }
  if (/^https?:\/\//i.test(input)) {
    return input;
  }
  const base = getApiBaseUrl();
  return base ? `${base}${input}` : input;
}

export function resolveAttachmentUrl(input: string) {
  if (!input) {
    return '';
  }
  if (/^(https?:\/\/|data:|blob:)/i.test(input)) {
    return input;
  }
  const normalized = input.startsWith('/') ? input : `/${input.replace(/^\/+/, '')}`;
  return resolveApiUrl(normalized);
}

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(resolveApiUrl(input), { ...init, headers });
}

export async function apiFetchForm(input: string, form: FormData, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(resolveApiUrl(input), { ...init, method: init.method ?? 'POST', body: form, headers });
}

export async function requestWsTicket(): Promise<string> {
  const res = await apiFetch('/api/auth/ws-ticket', { method: 'POST' });
  if (!res.ok) {
    throw new Error(`ws-ticket failed: ${res.status}`);
  }
  const body = (await res.json()) as { ticket: string };
  return body.ticket;
}
