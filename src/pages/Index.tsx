import { useState, useEffect } from 'react';
import { getAppContext, AppContext } from '@/lib/device';
import LandingPage from '@/pages/LandingPage';
import PWAApp from '@/components/PWAApp';

const Index = () => {
  const [context, setContext] = useState<AppContext>('desktop');

  useEffect(() => {
    setContext(getAppContext());
  }, []);

  // PWA installed → show app directly
  if (context === 'pwa-installed') {
    return <PWAApp />;
  }

  // Desktop or mobile browser → landing page
  return <LandingPage />;
};

export default Index;
