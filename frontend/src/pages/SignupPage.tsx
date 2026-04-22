import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { resolveApiUrl } from '@/lib/api';
import { authLoginRedirectUrl, supabase } from '@/lib/supabase';

const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

const HERO_SLIDES = [
  {
    eyebrow: 'Start your journey',
    headline: 'Bring your\ncommunity into\nmotion.',
    accent: 'motion.',
    sub: 'Create a PostmanChat account to launch conversations, recognition loops, and a more active community experience from day one.',
  },
  {
    eyebrow: 'Build momentum early',
    headline: 'First message.\nFirst signal.\nReal progress.',
    accent: 'Real progress.',
    sub: 'PostmanChat turns participation into visible movement so every update, reply, and return visit strengthens the community around you.',
  },
  {
    eyebrow: 'Designed to keep people engaged',
    headline: 'Create once.\nInvite your people.\nKeep things moving.',
    accent: 'Keep things moving.',
    sub: 'Set up your account, choose your identity, and step into a chat experience built for energy, clarity, and consistency.',
  },
];

const FEATURES = [
  { icon: '+', text: 'Free setup with room to grow as your community expands' },
  { icon: '+', text: 'Messaging, progress, and recognition in one place' },
  { icon: '+', text: 'Daily engagement loops that give people a reason to return' },
  { icon: '+', text: 'Igris AI support unlocked as your activity grows' },
];

function getDailySlide() {
  return HERO_SLIDES[Math.floor(Date.now() / 86400000) % HERO_SLIDES.length];
}

export default function SignupPage() {
  const slide = getDailySlide();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);

  useEffect(() => {
    const normalizedUsername = username.trim().toLowerCase();
    if (!normalizedUsername) {
      setUsernameStatus('idle');
      setUsernameMessage(null);
      return;
    }
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setUsernameStatus('invalid');
      setUsernameMessage('3-24 lowercase letters, numbers, or underscores only.');
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setUsernameStatus('checking');
      setUsernameMessage('Checking if that name is available...');
      try {
        const response = await fetch(
          resolveApiUrl(`/api/public/usernames/availability?username=${encodeURIComponent(normalizedUsername)}`),
          { signal: controller.signal, headers: { Accept: 'application/json' } },
        );
        if (!response.ok) {
          setUsernameStatus('error');
          setUsernameMessage('Could not verify right now. Try again.');
          return;
        }
        const availability = await response.json() as { available?: boolean };
        if (availability.available) {
          setUsernameStatus('available');
          setUsernameMessage('That name is available.');
          return;
        }
        setUsernameStatus('taken');
        setUsernameMessage('Someone already claimed that one. Try another.');
      } catch (availabilityError) {
        if (controller.signal.aborted) return;
        setUsernameStatus('error');
        setUsernameMessage('Could not verify right now. Try again.');
      }
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [username]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedFullName = fullName.trim();
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedFullName) {
      setBusy(false);
      setError('We need your name to get started.');
      return;
    }
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setBusy(false);
      setError('Username must be 3-24 lowercase characters, numbers, or underscores.');
      return;
    }
    if (usernameStatus === 'checking') {
      setBusy(false);
      setError('Still verifying your username. Give it a second.');
      return;
    }
    if (usernameStatus === 'taken') {
      setBusy(false);
      setError('That username is taken. Pick something uniquely yours.');
      return;
    }
    if (usernameStatus === 'error') {
      setBusy(false);
      setError('Username check failed. Try again.');
      return;
    }
    if (usernameStatus !== 'available') {
      setBusy(false);
      setError('Choose a username so we can check it first.');
      return;
    }

    const { data, error: err } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: normalizedFullName, username: normalizedUsername },
        emailRedirectTo: authLoginRedirectUrl || undefined,
      },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      setError('An account with that email already exists. Try signing in instead.');
      return;
    }
    if (data.session) {
      nav('/');
      return;
    }
    setNotice(`Almost there. We sent a confirmation link to ${normalizedEmail}. Open it to activate your account and start using PostmanChat.`);
  }

  const usernameStatusClass =
    usernameStatus === 'available' ? 'auth-username--ok'
      : usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'auth-username--err'
        : 'auth-username--loading';

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
              <strong>Teams and communities</strong> use PostmanChat to turn conversation into consistent momentum
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
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </div>
            <div>
              <h1 className="auth-card__title">Create your PostmanChat account</h1>
              <p className="auth-card__sub">Set up your identity and start building stronger conversations from message one.</p>
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
              <label className="auth-label">Full name</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Username / callsign</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon auth-input-icon--text">@</span>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="lowercase, numbers, underscore"
                  value={username}
                  onChange={e => setUsername(e.target.value.toLowerCase())}
                  required
                  minLength={3}
                  maxLength={24}
                />
              </div>
              {usernameMessage && (
                <div className={`auth-username-status ${usernameStatusClass}`}>{usernameMessage}</div>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label">Email address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                <input
                  className="auth-input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <input
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-btn auth-btn--primary" disabled={busy}>
              {busy ? <span className="pm-spinner" style={{ width: 16, height: 16 }} /> : null}
              {busy ? 'Creating your account...' : 'Create account - it is free'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login">Sign in {'->'}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
