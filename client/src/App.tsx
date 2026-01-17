import { lazy, Suspense } from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const Home = lazy(() => import('@/pages/home'));
const Landing = lazy(() => import('@/pages/landing'));
const Dashboard = lazy(() => import('@/pages/dashboard'));
const NotFound = lazy(() => import('@/pages/not-found'));

function Router() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-black flex items-center justify-center'>
          <div className='w-8 h-8 border border-punk-neon animate-pulse' />
        </div>
      }
    >
      <Switch>
        <Route path='/' component={Home} />
        <Route path='/landing' component={Landing} />
        <Route path='/dashboard' component={Dashboard} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <SonnerToaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
