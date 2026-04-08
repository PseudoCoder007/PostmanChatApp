import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Globe, Mail, Sparkles } from 'lucide-react';
import { AuthForm } from '@/components/ui/sign-in-1';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const companyLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%230a0a0a'/%3E%3Cpath d='M23 22h34c4.4 0 8 3.6 8 8v20c0 4.4-3.6 8-8 8H40l-8 8v-8h-9c-4.4 0-8-3.6-8-8V30c0-4.4 3.6-8 8-8Z' fill='white'/%3E%3C/svg%3E";

export default function SignupPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error: err } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: { data: { name: displayName || normalizedEmail.split('@')[0] } },
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
    toast.success('Account created');
    nav('/');
  }

  return (
    <motion.div className="auth-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="auth-backdrop-copy">
        <span className="auth-kicker">Postman Chat App</span>
        <h1>Start chatting, collecting rewards, and building your own social space.</h1>
        <p>Create a profile, join rooms, send attachments, complete quests, and grow your level through daily conversations.</p>
        <p>The app is built to feel playful and modern without becoming overwhelming, so even first-time users can settle in quickly.</p>
      </div>
      <AuthForm
        logoSrc={companyLogoSrc}
        logoAlt="Postman Chat"
        title="Create account"
        description="Set up your profile and get into the chat experience."
        secondaryActions={[
          {
            label: 'Continue with Google',
            icon: <Mail size={16} />,
            onClick: () => toast.message('Google auth is not connected yet.'),
          },
          {
            label: 'Continue with GitHub',
            icon: <Globe size={16} />,
            onClick: () => toast.message('GitHub auth is not connected yet.'),
          },
        ]}
        footerContent={(
          <>
            Already have an account? <Link to="/login">Sign in</Link>
          </>
        )}
      >
        <form className="stack" onSubmit={onSubmit}>
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
