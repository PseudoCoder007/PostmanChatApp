import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Globe, Mail } from 'lucide-react';
import { AuthForm } from '@/components/ui/sign-in-1';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

const companyLogoSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80'%3E%3Crect width='80' height='80' rx='18' fill='%230a0a0a'/%3E%3Cpath d='M20 24h40v8H20zm0 16h40v8H20zm0 16h26v8H20z' fill='white'/%3E%3C/svg%3E";

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    setBusy(false);
    if (err) {
      setError(err.message);
      toast.error(err.message);
      return;
    }
    toast.success('Signed in');
    nav('/');
  }

  return (
    <motion.div className="auth-shell" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <div className="auth-backdrop-copy">
        <span className="auth-kicker">Postman Chat App</span>
        <h1>One place for friends, rooms, quests, and AI-powered conversation.</h1>
        <p>Chat in real time, build public or private groups, track levels and coins, and unlock Igris for support, jokes, and side quests.</p>
        <p>It keeps messaging simple for newcomers while still giving you progression, attachments, notifications, and a more engaging social loop than a basic inbox.</p>
      </div>
      <AuthForm
        logoSrc={companyLogoSrc}
        logoAlt="Postman Chat"
        title="Welcome back"
        description="Sign in to continue your chats, missions, and live rooms."
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
            No account? <Link to="/signup">Create one</Link>
          </>
        )}
      >
        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Password
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
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
