import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { clearSupabaseRedirectParams, finalizeSupabaseRedirect } from '@/lib/authRedirect';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function validateRecoverySession() {
      const redirectResult = await finalizeSupabaseRedirect(location.hash, location.search);
      if (cancelled) return;

      if (redirectResult.kind === 'error') {
        clearSupabaseRedirectParams();
        const msg = redirectResult.message ?? 'Your reset link is missing or expired.';
        toast.error(msg);
        setTimeout(() => { if (!cancelled) nav('/login', { replace: true }); }, 2000);
        return;
      }

      if (redirectResult.kind === 'recovery') {
        clearSupabaseRedirectParams();
        setNotice('Recovery link accepted. Choose a new password below.');
        setSessionReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!data.session) {
        toast.error('Reset link expired. Request a new one.');
        setTimeout(() => { if (!cancelled) nav('/login', { replace: true }); }, 2000);
        return;
      }
      setSessionReady(true);
    }
    void validateRecoverySession();
    return () => { cancelled = true; };
  }, [location.hash, location.search, nav]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) { setError('Use at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (updateError) { setError(updateError.message); toast.error(updateError.message); return; }
    await supabase.auth.signOut();
    toast.success('Password updated. Sign in with your new password.');
    nav('/login', { replace: true });
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
          <div className="auth-hero__eyebrow">Account Recovery</div>
          <h1 className="auth-hero__headline">
            Reset your<br />
            password and<br />
            <span className="auth-hero__headline--accent">get back in.</span>
          </h1>
          <p className="auth-hero__sub">
            Pick a new password to secure your account. Your profile, chat history, quests, and Igris access are all still waiting for you.
          </p>
          <div className="auth-features">
            {[
              'Same profile, same rooms, same momentum',
              'All your messages and quest history preserved',
              'Igris AI and unlocks stay intact',
              'Secure recovery — no data lost',
            ].map(f => (
              <div key={f} className="auth-feature">
                <span className="auth-feature__dot">+</span>
                <span className="auth-feature__text">{f}</span>
              </div>
            ))}
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
              <h1 className="auth-card__title">Set a new password</h1>
              <p className="auth-card__sub">Choose something strong you will remember.</p>
            </div>
          </div>

          {notice && (
            <div className="auth-notice">
              <CheckCircle2 size={15} />
              <span>{notice}</span>
            </div>
          )}

          {!sessionReady && !notice && (
            <div className="auth-notice" style={{ color: 'var(--pm-text-muted)', borderColor: 'var(--pm-border)', background: 'var(--pm-bg-elevated)' }}>
              <span className="pm-spinner" style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span>Validating your recovery link…</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">New password</label>
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
                  disabled={!sessionReady}
                />
                <button type="button" className="auth-eye" onClick={() => setShowPassword(v => !v)}>
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label">Confirm password</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                <input
                  className="auth-input"
                  type={showConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={!sessionReady}
                />
                <button type="button" className="auth-eye" onClick={() => setShowConfirm(v => !v)}>
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="auth-btn auth-btn--primary" disabled={busy || !sessionReady}>
              {busy ? <span className="pm-spinner" style={{ width: 16, height: 16 }} /> : null}
              {busy ? 'Saving…' : 'Save new password'}
            </button>
          </form>

          <p className="auth-switch">
            Remembered it? <Link to="/login">Back to sign in {'->'}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
