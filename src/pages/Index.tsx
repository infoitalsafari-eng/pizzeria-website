import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getAppContext, AppContext } from '@/lib/device';
import LandingPage from '@/pages/LandingPage';

const Index = () => {
  const [context, setContext] = useState<AppContext>('desktop');

  useEffect(() => {
    setContext(getAppContext());
  }, []);

  // PWA installed → go straight to menu, no auth required
  if (context === 'pwa-installed') {
    return <Navigate to="/menu" replace />;
  }

  // Desktop or mobile browser → landing page
  return <LandingPage />;
};

export default Index;
