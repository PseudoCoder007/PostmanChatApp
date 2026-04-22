import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { TutorialProvider } from './hooks/useTutorial';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppErrorBoundary>
          <TutorialProvider>
            <App />
          </TutorialProvider>
        </AppErrorBoundary>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
