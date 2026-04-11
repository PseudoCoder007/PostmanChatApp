import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

describe('resolveAttachmentUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('keeps absolute urls unchanged', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com');
    const { resolveAttachmentUrl } = await import('./api');
    expect(resolveAttachmentUrl('https://cdn.example.com/file.pdf')).toBe('https://cdn.example.com/file.pdf');
  });

  it('prefixes backend uploads with the api base url', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/');
    const { resolveAttachmentUrl } = await import('./api');
    expect(resolveAttachmentUrl('/uploads/demo.png')).toBe('https://api.example.com/uploads/demo.png');
    expect(resolveAttachmentUrl('uploads/demo.png')).toBe('https://api.example.com/uploads/demo.png');
  });
});
