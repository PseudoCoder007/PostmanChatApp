import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from './SignupPage';

const { signUp } = vi.hoisted(() => ({
  signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
}));

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

vi.mock('@/lib/supabase', () => ({
  authLoginRedirectUrl: 'https://postmanchat.live/login',
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
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^full name$/i), { target: { value: 'Demo User' } });
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'demo_user' } });
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'demo@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret123' } });

    await waitFor(() => {
      expect(screen.getByText(/username is available/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith(expect.objectContaining({
        email: 'demo@example.com',
        options: expect.objectContaining({
          data: expect.objectContaining({
            name: 'Demo User',
            username: 'demo_user',
          }),
          emailRedirectTo: 'https://postmanchat.live/login',
        }),
      }));
    });
  });

  it('shows a green availability message when the username is free', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ available: true }),
    });

    render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'free_name' } });

    await waitFor(() => {
      expect(screen.getByText(/username is available/i)).toHaveClass('auth-field-status-available');
    });
  });
});
afterEach(() => {
  cleanup();
  signUp.mockClear();
  fetchMock.mockReset();
});
