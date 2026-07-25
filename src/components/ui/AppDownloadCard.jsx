import { useState, useEffect } from 'react';

export default function AppDownloadCard({ compact = false }) {
  const [deviceOS, setDeviceOS] = useState('desktop'); // 'android' | 'ios' | 'desktop'
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    if (/android/i.test(ua)) {
      setDeviceOS('android');
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      setDeviceOS('ios');
    } else {
      setDeviceOS('desktop');
    }

    // PWA install prompt handler
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    // Auto-dismiss full banner mode after 5 seconds
    let timer;
    if (!compact) {
      timer = setTimeout(() => {
        setVisible(false);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (timer) clearTimeout(timer);
    };
  }, [compact]);

  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert('To install on your home screen:\n\n1. Tap the Share or Options menu (⋮)\n2. Select "Add to Home Screen" or "Install App"');
    }
  };

  if (compact) {
    return (
      <div style={{
        marginTop: '12px',
        padding: '12px',
        background: '#FDF8F0',
        border: '1.5px solid #F5C97A',
        borderRadius: '10px',
        textAlign: 'left',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '14px' }}>
            {deviceOS === 'android' ? '🤖' : deviceOS === 'ios' ? '🍎' : '📱'}
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 800, color: '#E8890C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Admin Mobile App
          </span>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#736F66', lineHeight: 1.4, margin: '0 0 10px 0' }}>
          {deviceOS === 'android' ? 'Install native Android APK or PWA.' : deviceOS === 'ios' ? 'Add Sumiro Admin to your iPhone Home Screen.' : 'Manage site on mobile for Android & iOS.'}
        </p>

        {deviceOS === 'android' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={handlePwaInstall}
              style={{
                width: '100%', padding: '6px 10px', background: '#E8890C', color: '#FFFFFF',
                border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
                fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              📥 Install Android App
            </button>
          </div>
        )}

        {deviceOS === 'ios' && (
          <button
            onClick={handlePwaInstall}
            style={{
              width: '100%', padding: '6px 10px', background: '#0A0A0A', color: '#FFFFFF',
              border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
              fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
            }}
          >
            🍎 Add to iPhone Home Screen
          </button>
        )}

        {deviceOS === 'desktop' && (
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => alert('On your Android or iPhone device, visit admin.thesumiro.com to download or install the app in 1 tap.')}
              style={{
                flex: 1, padding: '6px 8px', background: '#E8890C', color: '#FFFFFF',
                border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                fontFamily: 'var(--font-sans)', cursor: 'pointer'
              }}
            >
              🤖 Android
            </button>
            <button
              onClick={() => alert('On your iPhone device, visit admin.thesumiro.com and tap "Add to Home Screen".')}
              style={{
                flex: 1, padding: '6px 8px', background: '#0A0A0A', color: '#FFFFFF',
                border: 'none', borderRadius: '6px', fontSize: '10px', fontWeight: 700,
                fontFamily: 'var(--font-sans)', cursor: 'pointer'
              }}
            >
              🍎 iOS
            </button>
          </div>
        )}
      </div>
    );
  }

  // Collapsed Pill Mode (shown after 5s or when dismissed)
  if (!visible) {
    return (
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={() => setVisible(true)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: '#FDF8F0', border: '1px solid #F5C97A',
            borderRadius: '99px', fontFamily: 'var(--font-sans)', fontSize: '11px',
            fontWeight: 700, color: '#E8890C', cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          📱 Download Mobile App
        </button>
      </div>
    );
  }

  // Full Banner Mode (shown for 5 seconds)
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FFFBF5 0%, #FDF6EC 100%)',
      border: '1.5px solid #F5C97A',
      borderRadius: '16px',
      padding: '20px 24px',
      marginBottom: '28px',
      boxShadow: '0 4px 16px rgba(232,137,12,0.06)',
      position: 'relative',
      transition: 'opacity 0.3s ease-out',
    }}>
      {/* Dismiss button */}
      <button
        onClick={() => setVisible(false)}
        title="Hide notification"
        style={{
          position: 'absolute', top: '12px', right: '14px',
          background: 'none', border: 'none', color: '#A3A3A3',
          cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'
        }}
      >
        ✕
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: '#FDF3E3', border: '1px solid #F5C97A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '22px', flexShrink: 0
          }}>
            {deviceOS === 'android' ? '🤖' : deviceOS === 'ios' ? '🍎' : '📱'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 500, color: '#0A0A0A', margin: 0 }}>
                Sumiro Admin Mobile App
              </h3>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 800,
                color: '#E8890C', background: '#FFF0D6', border: '1px solid #F5C97A',
                padding: '2px 8px', borderRadius: '99px', textTransform: 'uppercase'
              }}>
                {deviceOS === 'android' ? 'Android OS' : deviceOS === 'ios' ? 'iOS (iPhone)' : 'Desktop'}
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#736F66', margin: '4px 0 0 0', lineHeight: 1.4 }}>
              Manage fabric designs, upload reels, and answer client inquiries directly on your mobile device.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {deviceOS === 'android' && (
            <button
              onClick={handlePwaInstall}
              style={{
                padding: '8px 16px', background: '#E8890C', color: '#FFFFFF',
                border: 'none', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700,
                fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(232,137,12,0.25)'
              }}
            >
              🤖 Install Android App
            </button>
          )}

          {deviceOS === 'ios' && (
            <button
              onClick={handlePwaInstall}
              style={{
                padding: '8px 16px', background: '#0A0A0A', color: '#FFFFFF',
                border: 'none', borderRadius: '8px', fontSize: '11.5px', fontWeight: 700,
                fontFamily: 'var(--font-sans)', cursor: 'pointer', display: 'inline-flex',
                alignItems: 'center', gap: '6px'
              }}
            >
              🍎 Add to iPhone Home Screen
            </button>
          )}

          {deviceOS === 'desktop' && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => alert('Android Installation:\nOpen admin.thesumiro.com on your Android phone and tap "Add to Home Screen" or install the compiled APK.')}
                style={{
                  padding: '8px 14px', background: '#E8890C', color: '#FFFFFF',
                  border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--font-sans)', cursor: 'pointer'
                }}
              >
                🤖 Android
              </button>
              <button
                onClick={() => alert('iOS Installation:\nOpen admin.thesumiro.com on your iPhone Safari/Chrome and tap Share -> "Add to Home Screen".')}
                style={{
                  padding: '8px 14px', background: '#0A0A0A', color: '#FFFFFF',
                  border: 'none', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--font-sans)', cursor: 'pointer'
                }}
              >
                🍎 iOS
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
