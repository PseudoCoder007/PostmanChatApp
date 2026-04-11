import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Mail, Sparkles, ShieldCheck } from 'lucide-react';
import { AuthForm } from '@/components/ui/sign-in-1';
import { Button } from '@/components/ui/button';
import { authLoginRedirectUrl, startSupabaseOAuth, supabase } from '@/lib/supabase';

const companyLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%230a0a0a'/%3E%3Cpath d='M23 22h34c4.4 0 8 3.6 8 8v20c0 4.4-3.6 8-8 8H40l-8 8v-8h-9c-4.4 0-8-3.6-8-8V30c0-4.4 3.6-8 8-8Z' fill='white'/%3E%3C/svg%3E";

export default function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<'google' | 'facebook' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error: err } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: displayName || normalizedEmail.split('@')[0] },
        emailRedirectTo: authLoginRedirectUrl || undefined,
      },
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const duplicateMessage = 'An account with this email already exists. Please sign in instead.';
      setError(duplicateMessage);
      toast.error(duplicateMessage);
      return;
    }
    if (data.session) {
      toast.success('Account created');
      nav('/');
      return;
    }
    const successMessage = `Account created. Check ${normalizedEmail} and confirm your email to finish signing in on the deployed login page.`;
    setNotice(successMessage);
    toast.success('Account created. Check your email to confirm your account.');
  }

  async function startOAuth(provider: 'google' | 'facebook') {
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
        <h1>Start chatting, collecting rewards, and building your own social space.</h1>
        <p>Create a profile, join rooms, send attachments, complete quests, and grow your level through daily conversations.</p>
        <p>The app stays dark, cinematic, and easy to read while still giving you real email auth plus Google and Facebook sign-in through Supabase.</p>
      </div>
      <AuthForm
        logoSrc={companyLogoSrc}
        logoAlt="Postman Chat"
        title="Create account"
        description="Set up your profile and get into the chat experience."
        secondaryActions={[
          {
            label: oauthBusy === 'google' ? 'Connecting Google...' : 'Continue with Google',
            icon: <GoogleIcon />,
            onClick: () => void startOAuth('google'),
          },
          {
            label: oauthBusy === 'facebook' ? 'Connecting Facebook...' : 'Continue with Facebook',
            icon: <FacebookIcon />,
            onClick: () => void startOAuth('facebook'),
          },
        ]}
        footerContent={(
          <>
            Already have an account? <Link to="/login">Sign in</Link>
          </>
        )}
      >
        <form className="stack" onSubmit={onSubmit}>
          {notice ? <p className="auth-banner auth-banner-success"><CheckCircle2 size={16} />{notice}</p> : null}
          <p className="auth-helper-copy">
            <ShieldCheck size={14} />
            Confirmation emails route back to the deployed login page defined by `VITE_PUBLIC_SITE_URL`.
          </p>
          <label className="field">
            Display name
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" />
          </label>
          <label className="field">
            Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Password
            <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <Button type="submit" className="auth-form-button" disabled={busy}>
            <Sparkles size={16} />
            {busy ? 'Creating account...' : 'Create account'}
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

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 6.02 4.39 11 10.12 11.93v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.79-4.69 4.54-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.07 24 18.09 24 12.07Z" fill="#1877F2" />
      <path d="M16.67 15.56 17.2 12.07h-3.32V9.81c0-.95.46-1.88 1.95-1.88h1.51V4.97s-1.37-.24-2.68-.24c-2.75 0-4.54 1.67-4.54 4.69v2.66H7.08v3.49h3.04V24a12.3 12.3 0 0 0 3.76 0v-8.44h2.79Z" fill="#fff" />
    </svg>
  );
}
