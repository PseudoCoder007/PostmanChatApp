import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/ui/sign-in-1';
import { Button } from '@/components/ui/button';
import { resolveApiUrl } from '@/lib/api';
import { authLoginRedirectUrl, supabase } from '@/lib/supabase';

const companyLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%230a0a0a'/%3E%3Cpath d='M23 22h34c4.4 0 8 3.6 8 8v20c0 4.4-3.6 8-8 8H40l-8 8v-8h-9c-4.4 0-8-3.6-8-8V30c0-4.4 3.6-8 8-8Z' fill='white'/%3E%3C/svg%3E";
const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;
type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'error';

export default function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setUsernameMessage('Use 3-24 lowercase letters, numbers, or underscore.');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setUsernameStatus('checking');
      setUsernameMessage('Checking username availability...');

      try {
        const response = await fetch(
          resolveApiUrl(`/api/public/usernames/availability?username=${encodeURIComponent(normalizedUsername)}`),
          {
            signal: controller.signal,
            headers: { Accept: 'application/json' },
          },
        );

        if (!response.ok) {
          setUsernameStatus('error');
          setUsernameMessage('Username check is unavailable right now. Try again in a moment.');
          return;
        }

        const availability = await response.json() as { available?: boolean };
        if (availability.available) {
          setUsernameStatus('available');
          setUsernameMessage('Username is available.');
          return;
        }

        setUsernameStatus('taken');
        setUsernameMessage('That username is already taken.');
      } catch (availabilityError) {
        if (controller.signal.aborted) {
          return;
        }
        setUsernameStatus('error');
        setUsernameMessage('Username check is unavailable right now. Try again in a moment.');
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
      const message = 'Full name is required.';
      setError(message);
      toast.error(message);
      return;
    }

    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      setBusy(false);
      const message = 'Username must be 3-24 characters using lowercase letters, numbers, or underscore.';
      setError(message);
      toast.error(message);
      return;
    }

    if (usernameStatus === 'checking') {
      setBusy(false);
      const message = 'Still checking that username. Give it a second and try again.';
      setError(message);
      toast.error(message);
      return;
    }

    if (usernameStatus === 'taken') {
      setBusy(false);
      const message = 'That username is already taken. Please choose another one.';
      setError(message);
      toast.error(message);
      return;
    }

    if (usernameStatus === 'error') {
      setBusy(false);
      const message = 'Could not verify username availability right now. Please try again.';
      setError(message);
      toast.error(message);
      return;
    }

    if (usernameStatus !== 'available') {
      setBusy(false);
      const message = 'Choose a valid username first so we can verify it is available.';
      setError(message);
      toast.error(message);
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
      toast.error(err.message);
      return;
    }
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const duplicateMessage = 'An account with this email already exists. Sign in with Google if you used Google before, or use Forgot password to set an email password.';
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

  return (
    <motion.div className="auth-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="auth-backdrop-copy">
        <span className="auth-kicker">Postman Chat App</span>
        <h1>Start chatting, collecting rewards, and building your own social space.</h1>
        <p>Create a profile, join rooms, send attachments, complete quests, and grow your level through daily conversations.</p>
        <p>Create your account with email, full name, and a unique username, then sign in later with email or Google.</p>
      </div>
      <AuthForm
        logoSrc={companyLogoSrc}
        logoAlt="Postman Chat"
        title="Create account"
        description="Set up your profile and get into the chat experience."
        footerContent={(
          <>
            Already have an account? <Link to="/login">Sign in</Link>
          </>
        )}
      >
        <form className="stack" onSubmit={onSubmit}>
          {notice ? <p className="auth-banner auth-banner-success"><CheckCircle2 size={16} />{notice}</p> : null}
          <label className="field">
            Full name
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="field">
            Username
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} required minLength={3} maxLength={24} placeholder="lowercase letters, numbers, underscore" />
            {usernameMessage ? <span className={`auth-field-status auth-field-status-${usernameStatus}`}>{usernameMessage}</span> : null}
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
