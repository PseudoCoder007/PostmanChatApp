import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AuthForm } from '@/components/ui/sign-in-1';
import { Button } from '@/components/ui/button';
import { clearSupabaseRedirectParams, finalizeSupabaseRedirect } from '@/lib/authRedirect';
import { supabase } from '@/lib/supabase';

const companyLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%230a0a0a'/%3E%3Cpath d='M18 24h44v10H18zm8 18h28v10H26z' fill='white'/%3E%3C/svg%3E";

export default function ResetPasswordPage() {
  const nav = useNavigate();
  const location = useLocation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>('Use the secure recovery link from your email to set a new password.');

  useEffect(() => {
    let cancelled = false;

    async function validateRecoverySession() {
      const redirectResult = await finalizeSupabaseRedirect(location.hash, location.search);
      if (cancelled) {
        return;
      }
      if (redirectResult.kind === 'error') {
        clearSupabaseRedirectParams();
        setError(redirectResult.message ?? 'Your reset link is missing or expired. Request a fresh password reset email.');
        setNotice(null);
        return;
      }
      if (redirectResult.kind === 'recovery') {
        clearSupabaseRedirectParams();
        setError(null);
        setNotice('Recovery link accepted. Choose a new password below.');
      }

      const { data } = await supabase.auth.getSession();
      if (cancelled) {
        return;
      }
      if (!data.session) {
        setNotice(null);
        setError('Your reset link is missing or expired. Request a fresh password reset email.');
      }
    }

    void validateRecoverySession();
    return () => {
      cancelled = true;
    };
  }, [location.hash]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Use at least 6 characters for your new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }

    setBusy(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      toast.error(updateError.message);
      return;
    }

    await supabase.auth.signOut();
    toast.success('Password updated. Sign in with your new password.');
    nav('/login', { replace: true });
  }

  return (
    <motion.div className="auth-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="auth-backdrop-copy">
        <span className="auth-kicker">Postman Chat App</span>
        <h1>Reset your password and get back to the conversation fast.</h1>
        <p>Pick a stronger password, lock your account back in, and jump back into rooms, quests, and Igris without losing momentum.</p>
        <p>This recovery flow stays inside the app so your reset feels clean, branded, and way less confusing than a raw token page.</p>
      </div>

      <AuthForm
        logoSrc={companyLogoSrc}
        logoAlt="Postman Chat"
        title="Reset password"
        description="Choose a new password for your account."
        footerContent={(
          <>
            Remembered it? <Link to="/login">Return to login</Link>
          </>
        )}
      >
        <form className="stack" onSubmit={onSubmit}>
          {notice ? <p className="auth-banner auth-banner-success"><CheckCircle2 size={16} />{notice}</p> : null}
          <label className="field">
            New password
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          <label className="field">
            Confirm password
            <input
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <Button type="submit" className="auth-form-button" disabled={busy}>
            <Lock size={16} />
            {busy ? 'Saving password...' : 'Save new password'}
          </Button>
          <p className="auth-helper-copy">
            <Sparkles size={14} />
            Fresh password, same profile, same chat history.
          </p>
        </form>
      </AuthForm>
    </motion.div>
  );
}
