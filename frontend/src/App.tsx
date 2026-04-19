import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { RequireAuth } from './components/RequireAuth';
import { getSupabaseRedirectPath } from './lib/authRedirect';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));

function getPageTitle(pathname: string) {
  if (pathname === '/login') return 'Sign In | PostmanChat';
  if (pathname === '/signup') return 'Create Account | PostmanChat';
  if (pathname === '/reset-password') return 'Reset Password | PostmanChat';
  return 'PostmanChat | Conversations that move work forward';
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const redirectPath = getSupabaseRedirectPath(location.hash, location.search);
    if (!redirectPath || location.pathname === redirectPath) {
      return;
    }
    navigate({ pathname: redirectPath, search: location.search, hash: location.hash }, { replace: true });
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    document.title = getPageTitle(location.pathname);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          className="page-transition"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Suspense fallback={<div className="panel route-loading">Loading...</div>}>
            <Routes location={location}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <ChatPage />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
