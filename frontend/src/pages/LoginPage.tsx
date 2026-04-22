import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { clearSupabaseRedirectParams, finalizeSupabaseRedirect } from '@/lib/authRedirect';
import { authPasswordResetUrl, startSupabaseOAuth, supabase } from '@/lib/supabase';

const HERO_SLIDES = [
  {
    eyebrow: 'Welcome back',
    headline: 'Conversations\nthat keep teams\nin motion.',
    accent: 'in motion.',
    sub: 'PostmanChat keeps people, context, and action aligned so you can return to the discussions that matter without losing momentum.',
  },
  {
    eyebrow: 'Built for active communities',
    headline: 'Reconnect.\nRespond.\nMove forward.',
    accent: 'Move forward.',
    sub: 'From quick updates to high-energy community threads, every space is designed to help teams stay aligned and act faster.',
  },
  {
    eyebrow: 'Designed for clarity',
    headline: 'One workspace.\nClear signals.\nStronger follow-through.',
    accent: 'Stronger follow-through.',
    sub: 'Bring messaging, accountability, and engagement together in a single experience that keeps work and community moving.',
  },
];

const FEATURES = [
  { icon: '+', text: 'Real-time rooms and direct chats for fast coordination' },
  { icon: '+', text: 'Progress systems that turn activity into visible momentum' },
  { icon: '+', text: 'Igris AI support when your community needs a smarter nudge' },
  { icon: '+', text: 'A focused brand experience built for engagement at scale' },
];

function getDailySlide() {
  return HERO_SLIDES[Math.floor(Date.now() / 86400000) % HERO_SLIDES.length];
}

export default function LoginPage() {
  const slide = getDailySlide();
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
      if (mounted && data.session) nav('/', { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (!mounted || !session) return;
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        nav('/', { replace: true });
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [nav]);

  useEffect(() => {
    let cancelled = false;
    async function handleAuthRedirect() {
      const result = await finalizeSupabaseRedirect(location.hash, location.search);
      if (cancelled || result.kind === 'none') return;
      clearSupabaseRedirectParams();
      if (result.kind === 'error') {
        setNotice(null);
        setError(result.message ?? 'Authentication could not be completed.');
        toast.error(result.message ?? 'Authentication could not be completed.');
        return;
      }
      if (result.kind === 'recovery') { nav('/reset-password', { replace: true }); return; }
      if (result.kind === 'signup') {
        setError(null);
        setNotice(result.message ?? 'Email confirmed. You can sign in now.');
        toast.success(result.message ?? 'Email confirmed. You can sign in now.');
        return;
      }
      if (result.kind === 'session') {
        toast.success('Signed in. Good to have you back.');
        nav('/', { replace: true });
      }
    }
    void handleAuthRedirect();
    return () => { cancelled = true; };
  }, [location.hash, location.search, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    let email = identifier.trim().toLowerCase();
    if (!email.includes('@')) {
      const lookup = await fetch(`/api/public/auth/login-identifier?value=${encodeURIComponent(email)}`);
      if (!lookup.ok) {
        const message = 'We could not find anyone with that email or username. Double-check and try again.';
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
    toast.success('Welcome back. Your workspace is ready.');
    nav('/');
  }

  async function onForgotPassword() {
    let normalizedEmail = identifier.trim().toLowerCase();
    if (!normalizedEmail) {
      const message = 'Enter your email or username above first so we know where to send the reset link.';
      setError(message);
      toast.error(message);
      return;
    }
    if (!normalizedEmail.includes('@')) {
      const lookup = await fetch(`/api/public/auth/login-identifier?value=${encodeURIComponent(normalizedEmail)}`);
      if (!lookup.ok) {
        const message = 'We could not find an account with that username. Try your email instead.';
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
    toast.success('Reset link sent. Check your inbox.');
    setNotice(`We sent a password reset link to ${normalizedEmail}. Check your inbox and spam folder if it does not show up right away.`);
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
    <div className="auth-shell">
      <div className="auth-hero">
        <div className="auth-hero__grid" />
        <div className="auth-hero__glow auth-hero__glow--top" />
        <div className="auth-hero__glow auth-hero__glow--bottom" />

        <div className="auth-hero__inner">
          <div className="auth-brand">
            <div className="auth-brand__icon">P</div>
            <span className="auth-brand__name">Postman<span>Chat</span></span>
          </div>

          <div className="auth-hero__eyebrow">{slide.eyebrow}</div>

          <h1 className="auth-hero__headline">
            {slide.headline.split('\n').map((line, i) => {
              const isAccent = line === slide.accent;
              return (
                <span key={i} className={isAccent ? 'auth-hero__headline--accent' : ''}>
                  {line}
                  <br />
                </span>
              );
            })}
          </h1>

          <p className="auth-hero__sub">{slide.sub}</p>

          <div className="auth-features">
            {FEATURES.map(f => (
              <div key={f.text} className="auth-feature">
                <span className="auth-feature__dot">{f.icon}</span>
                <span className="auth-feature__text">{f.text}</span>
              </div>
            ))}
          </div>

          <div className="auth-proof">
            <div className="auth-proof__avatars">
              {['K', 'S', 'N', 'V', 'D'].map((l, i) => (
                <div key={i} className="auth-proof__avatar" style={{ zIndex: 5 - i }}>{l}</div>
              ))}
            </div>
            <div className="auth-proof__text">
              <strong>Modern communities</strong> use PostmanChat to keep conversation and action connected
            </div>
          </div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <div className="auth-brand__icon" style={{ width: 36, height: 36, fontSize: 16 }}>P</div>
            <span className="auth-brand__name" style={{ fontSize: 17 }}>Postman<span>Chat</span></span>
          </div>
          <div className="auth-card__header">
            <div className="auth-card__icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </div>
            <div>
              <h1 className="auth-card__title">Welcome back to PostmanChat</h1>
              <p className="auth-card__sub">Sign in to continue the conversations, updates, and momentum your team relies on.</p>
            </div>
          </div>

          {notice && (
            <div className="auth-notice">
              <CheckCircle2 size={15} />
              <span>{notice}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email or username</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                <input
                  className="auth-input"
                  type="text"
                  autoComplete="username"
                  placeholder="you@email.com or @handle"
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() => void onForgotPassword()}
                  disabled={resetBusy}
                >
                  {resetBusy ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-btn auth-btn--primary" disabled={busy}>
              {busy ? <span className="pm-spinner" style={{ width: 16, height: 16 }} /> : null}
              {busy ? 'Signing you in...' : 'Sign in'}
            </button>
          </form>

          <div className="auth-divider"><span>or</span></div>

          <button
            className="auth-btn auth-btn--google"
            onClick={() => void startOAuth('google')}
            disabled={oauthBusy === 'google'}
            type="button"
          >
            {oauthBusy === 'google' ? <span className="pm-spinner" style={{ width: 16, height: 16 }} /> : <GoogleIcon />}
            Continue with Google
          </button>

          <p className="auth-switch">
            New here?{' '}
            <Link to="/signup">Create your workspace account {'->'}</Link>
          </p>
        </div>
      </div>
    </div>
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
