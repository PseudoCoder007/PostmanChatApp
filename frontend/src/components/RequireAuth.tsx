import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

function AppSkeleton() {
  return (
    <div className="pm-app">
      <div className="pm-skeleton-sidebar">
        <div className="pm-skeleton-block" style={{ width: 48, height: 48, borderRadius: '50%', marginBottom: 24 }} />
        {[1,2,3,4,5].map(i => (
          <div key={i} className="pm-skeleton-block" style={{ width: '80%', height: 14, marginBottom: 16, borderRadius: 6 }} />
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="pm-skeleton-topbar">
          <div className="pm-skeleton-block" style={{ width: 220, height: 32, borderRadius: 20 }} />
          <div style={{ flex: 1 }} />
          <div className="pm-skeleton-block" style={{ width: 80, height: 28, borderRadius: 20 }} />
          <div className="pm-skeleton-block" style={{ width: 60, height: 28, borderRadius: 20 }} />
          <div className="pm-skeleton-block" style={{ width: 32, height: 32, borderRadius: '50%' }} />
        </div>
        <div style={{ padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="pm-skeleton-block" style={{ width: '60%', height: 24, borderRadius: 8 }} />
          <div className="pm-skeleton-block" style={{ width: '100%', height: 80, borderRadius: 12 }} />
          <div className="pm-skeleton-block" style={{ width: '100%', height: 60, borderRadius: 12 }} />
          <div className="pm-skeleton-block" style={{ width: '75%', height: 60, borderRadius: 12 }} />
        </div>
      </div>
    </div>
  );
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return <AppSkeleton />;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
