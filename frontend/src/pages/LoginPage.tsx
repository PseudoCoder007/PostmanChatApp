import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Mail } from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { AuthForm } from '@/components/ui/sign-in-1';
import { Button } from '@/components/ui/button';
import { clearSupabaseRedirectParams, finalizeSupabaseRedirect } from '@/lib/authRedirect';
import { authPasswordResetUrl, startSupabaseOAuth, supabase } from '@/lib/supabase';

const companyLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%230a0a0a'/%3E%3Cpath d='M20 24h40v8H20zm0 16h40v8H20zm0 16h26v8H20z' fill='white'/%3E%3C/svg%3E";

export default function LoginPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<'google' | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted && data.session) {
        nav('/', { replace: true });
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted || !session) {
        return;
      }
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        nav('/', { replace: true });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [nav]);

  useEffect(() => {
    let cancelled = false;

    async function handleAuthRedirect() {
      const result = await finalizeSupabaseRedirect(location.hash, location.search);
      if (cancelled || result.kind === 'none') {
        return;
      }

      clearSupabaseRedirectParams();
      if (result.kind === 'error') {
        setNotice(null);
        setError(result.message ?? 'Authentication could not be completed.');
        toast.error(result.message ?? 'Authentication could not be completed.');
        return;
      }
      if (result.kind === 'recovery') {
        nav('/reset-password', { replace: true });
        return;
      }
      if (result.kind === 'signup') {
        setError(null);
        setNotice(result.message ?? 'Email confirmed. You can sign in now.');
        toast.success(result.message ?? 'Email confirmed. You can sign in now.');
        return;
      }
      if (result.kind === 'session') {
        toast.success('Signed in successfully.');
        nav('/', { replace: true });
      }
    }

    void handleAuthRedirect();
    return () => {
      cancelled = true;
    };
  }, [location.hash, location.search, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    let email = identifier.trim().toLowerCase();
    if (!email.includes('@')) {
      const lookup = await fetch(`/api/public/auth/login-identifier?value=${encodeURIComponent(email)}`);
      if (!lookup.ok) {
        const message = 'We could not find an account for that email or username.';
        setBusy(false);
        setError(message);
        toast.error(message);
        return;
      }
      const body = await lookup.json() as { email?: string };
      email = body.email?.trim().toLowerCase() ?? '';
    }
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    toast.success('Signed in');
    nav('/');
  }

  async function onForgotPassword() {
    let normalizedEmail = identifier.trim().toLowerCase();
    if (!normalizedEmail) {
      const message = 'Enter your email or username first so we know where to send the reset link.';
      setError(message);
      toast.error(message);
      return;
    }

    if (!normalizedEmail.includes('@')) {
      const lookup = await fetch(`/api/public/auth/login-identifier?value=${encodeURIComponent(normalizedEmail)}`);
      if (!lookup.ok) {
        const message = 'We could not find an account for that email or username.';
        setError(message);
        toast.error(message);
        return;
      }
      const body = await lookup.json() as { email?: string };
      normalizedEmail = body.email?.trim().toLowerCase() ?? '';
    }

    setError(null);
    setResetBusy(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo: authPasswordResetUrl || undefined,
    });
    setResetBusy(false);

    if (resetError) {
      setError(resetError.message);
      toast.error(resetError.message);
      return;
    }

    toast.success('Password reset email sent. Check your inbox for the secure reset link.');
    setNotice(`Reset instructions sent to ${normalizedEmail}. Use the link in that email to choose a new password.`);
  }

  async function startOAuth(provider: 'google') {
    setError(null);
    setNotice(null);
    setOauthBusy(provider);
    const { error: oauthError } = await startSupabaseOAuth(provider);
    setOauthBusy(null);

    if (oauthError) {
      setError(oauthError.message);
      toast.error(oauthError.message);
    }
  }

  return (
    <motion.div className="auth-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="auth-backdrop-copy">
        <span className="auth-kicker">Postman Chat App</span>
        <h1>One place for friends, rooms, quests, and AI-powered conversation.</h1>
        <p>Chat in real time, build public or private groups, track levels and coins, and unlock Igris for support, jokes, and side quests.</p>
        <p>Use email sign-in or jump in with Google to get back into your rooms, quests, and daily conversations faster.</p>
      </div>
      <AuthForm
        logoSrc={companyLogoSrc}
        logoAlt="Postman Chat"
        title="Welcome back"
        description="Sign in to continue your chats, missions, and live rooms."
        secondaryActions={[
          {
            label: oauthBusy === 'google' ? 'Connecting Google...' : 'Continue with Google',
            icon: <GoogleIcon />,
            onClick: () => void startOAuth('google'),
          },
        ]}
        footerContent={(
          <>
            No account? <Link to="/signup">Create one</Link>
          </>
        )}
      >
        <form className="stack" onSubmit={onSubmit}>
          {notice ? <p className="auth-banner auth-banner-success"><CheckCircle2 size={16} />{notice}</p> : null}
          <label className="field">
            Email or username
            <input type="text" autoComplete="username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
          </label>
          <label className="field">
            <span className="auth-inline-label">
              <span>Password</span>
              <button type="button" className="auth-inline-link" onClick={() => void onForgotPassword()} disabled={resetBusy}>
                {resetBusy ? 'Sending reset...' : 'Forgot password?'}
              </button>
            </span>
            <div className="auth-password-wrap">
              <input className="auth-password-input" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>
          {error ? <p className="error">{error}</p> : null}
          <Button type="submit" className="auth-form-button" disabled={busy}>
            <Mail size={16} />
            {busy ? 'Signing in...' : 'Continue with email'}
          </Button>
        </form>
      </AuthForm>
    </motion.div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z" fill="#34A853" />
      <path d="M5.84 14.09A6.97 6.97 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84Z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z" fill="#EA4335" />
    </svg>
  );
}
