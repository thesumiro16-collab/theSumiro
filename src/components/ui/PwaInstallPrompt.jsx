import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, X, WifiOff, Share, PlusSquare, ShieldCheck } from 'lucide-react';

// Shared state so any in-app button (like the sidebar "Install App" button) can trigger prompt
let globalDeferredPrompt = null;
const promptListeners = new Set();

export function triggerAdminPwaInstall() {
  if (globalDeferredPrompt) {
    globalDeferredPrompt.prompt();
    globalDeferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        globalDeferredPrompt = null;
        promptListeners.forEach((fn) => fn(null));
      }
    });
    return true;
  }
  return false;
}

export function useCanInstallAdminPwa() {
  const [canInstall, setCanInstall] = useState(!!globalDeferredPrompt);

  useEffect(() => {
    const listener = (prompt) => setCanInstall(!!prompt);
    promptListeners.add(listener);
    return () => promptListeners.delete(listener);
  }, []);

  return canInstall;
}

export default function PwaInstallPrompt() {
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showOfflineNotice, setShowOfflineNotice] = useState(false);

  // STRICT REQUIREMENT: Only activate on backend / admin routes or admin subdomain
  const isAdminRoute =
    location.pathname.startsWith('/app') ||
    location.pathname === '/login' ||
    window.location.hostname.startsWith('admin.');

  useEffect(() => {
    // Check if already running in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) return;

    // Check recent dismissal for admin prompt
    const lastDismissed = localStorage.getItem('sumiro_admin_pwa_dismissed');
    const isDismissedRecently =
      lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 48 * 60 * 60 * 1000;

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      globalDeferredPrompt = e;
      setDeferredPrompt(e);
      promptListeners.forEach((fn) => fn(e));

      // Only show popup banner if on admin route and not dismissed recently
      if (isAdminRoute && !isDismissedRecently) {
        const timer = setTimeout(() => setShowPrompt(true), 2500);
        return () => clearTimeout(timer);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice && !isStandalone && isAdminRoute && !isDismissedRecently) {
      setIsIOS(true);
      const timer = setTimeout(() => setShowPrompt(true), 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    const handleAppInstalled = () => {
      setShowPrompt(false);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      promptListeners.forEach((fn) => fn(null));
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isAdminRoute]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      if (isAdminRoute) {
        setShowOfflineNotice(true);
        const timer = setTimeout(() => setShowOfflineNotice(false), 3000);
        return () => clearTimeout(timer);
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      if (isAdminRoute) {
        setShowOfflineNotice(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isAdminRoute]);

  // If not on an admin route, do NOT render any prompt or notice
  if (!isAdminRoute) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
      promptListeners.forEach((fn) => fn(null));
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSHint(false);
    localStorage.setItem('sumiro_admin_pwa_dismissed', Date.now().toString());
  };

  return (
    <>
      {/* Offline Status Toast — only on Admin portal */}
      {showOfflineNotice && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-full shadow-lg border text-xs font-medium tracking-wide transition-all duration-300"
          style={{
            background: isOffline ? '#1E1E24' : '#047857',
            borderColor: isOffline ? '#3D3D45' : '#059669',
            color: '#FFFFFF',
          }}
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin offline mode — cached catalog remains accessible</span>
            </>
          ) : (
            <span>Connection restored — online</span>
          )}
        </aside>
      )}

      {/* Admin Install Prompt Banner */}
      {showPrompt && (
        <aside
          role="dialog"
          aria-label="Install The Sumiro Admin Portal"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            maxWidth: '420px',
            width: 'calc(100vw - 48px)',
            zIndex: 60,
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E0D8',
            padding: '18px 20px',
            boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.16), 0 0 0 1px rgba(232, 137, 12, 0.12)',
            fontFamily: 'var(--font-sans)',
            animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            {/* App Icon */}
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#FAF7F1',
                border: '1px solid #E5E0D8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '6px',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <img
                src="/pwa-192x192.png"
                alt="Sumiro Admin"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              <span
                style={{
                  position: 'absolute',
                  bottom: '-3px',
                  right: '-3px',
                  background: '#E8890C',
                  color: '#FFFFFF',
                  padding: '2px',
                  borderRadius: '999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldCheck style={{ width: '10px', height: '10px' }} />
              </span>
            </div>

            {/* Information */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0A0A0A', letterSpacing: '-0.01em' }}>
                    The Sumiro Admin
                  </h3>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#FDF3E3',
                      color: '#C5720A',
                      border: '1px solid rgba(245, 201, 122, 0.5)',
                    }}
                  >
                    Portal
                  </span>
                </div>
                <button
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#A3A3A3',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label="Dismiss prompt"
                >
                  <X style={{ width: '16px', height: '16px' }} />
                </button>
              </div>

              <p style={{ margin: '0 0 14px 0', fontSize: '12px', color: '#737373', lineHeight: 1.5 }}>
                Install the admin portal for fast, full-screen desktop or mobile access to catalog and inquiries.
              </p>

              {/* iOS specific hint */}
              {showIOSHint ? (
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#FDF3E3',
                    border: '1px solid #F5C97A',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#3D3D3D',
                  }}
                >
                  <p style={{ margin: '0 0 6px 0', fontWeight: 600, color: '#C5720A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Share style={{ width: '13px', height: '13px' }} /> Install on iOS Safari:
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '16px', lineHeight: 1.6 }}>
                    <li>Tap <strong>Share</strong> in Safari</li>
                    <li>Select <strong>Add to Home Screen</strong> <PlusSquare style={{ width: '11px', height: '11px', display: 'inline', color: '#C5720A' }} /></li>
                    <li>Tap <strong>Add</strong></li>
                  </ol>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={handleInstallClick}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#FFFFFF',
                      background: '#E8890C',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#C5720A')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#E8890C')}
                  >
                    <Download style={{ width: '13px', height: '13px' }} />
                    {isIOS ? 'How to Install' : 'Install Admin App'}
                  </button>
                  <button
                    onClick={handleDismiss}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#737373',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0A')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#737373')}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
