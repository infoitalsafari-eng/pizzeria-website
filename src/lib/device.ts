export function isMobileDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
}

export function isPWAInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  const isStandalone = (navigator as any).standalone === true;
  const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches;
  return isStandalone || isDisplayStandalone;
}

export type AppContext = 'desktop' | 'mobile-browser' | 'pwa-installed';

export function getAppContext(): AppContext {
  if (isMobileDevice() && isPWAInstalled()) return 'pwa-installed';
  if (isMobileDevice()) return 'mobile-browser';
  return 'desktop';
}
