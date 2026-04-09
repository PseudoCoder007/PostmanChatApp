import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from './SignupPage';

const { signUp } = vi.hoisted(() => ({
  signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
}));

vi.mock('@/lib/supabase', () => ({
  publicSiteUrl: 'http://13.201.50.166',
  supabase: {
    auth: {
      signUp,
    },
  },
}));

describe('SignupPage', () => {
  it('renders sign up heading', () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument();
  });

  it('uses the public site URL for email confirmation redirects', async () => {
    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
        email: 'demo@example.com',
        options: expect.objectContaining({
          emailRedirectTo: 'http://13.201.50.166',
        }),
      }));
    });
  });
});
afterEach(() => {
  cleanup();
  signUp.mockClear();
});
