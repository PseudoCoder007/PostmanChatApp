import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SignupPage from './SignupPage';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({ error: null }),
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
    expect(screen.getByRole('heading', { name: /sign up/i })).toBeInTheDocument();
  });
});
