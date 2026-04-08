import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

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
      <motion.div className="card stack" style={{ maxWidth: 420 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
        <h1>Sign up</h1>
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
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </motion.div>
    </motion.div>
  );
}
