import { useEffect, useRef, useState } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  /* ── Track mobile viewport ─────────────────────────── */
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── ESC to close ──────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  /* ── Focus trap ────────────────────────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'select:not([disabled])', 'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');
    const getFocusable = () => Array.from(overlay.querySelectorAll(focusableSelectors));
    const focusable = getFocusable();
    if (focusable.length > 0) focusable[0].focus();
    const handleTrap = (e) => {
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) { if (document.activeElement === first) { e.preventDefault(); last.focus(); } }
      else { if (document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    overlay.addEventListener('keydown', handleTrap);
    return () => overlay.removeEventListener('keydown', handleTrap);
  }, [isOpen]);

  /* ── Body scroll lock ──────────────────────────────── */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(10, 10, 10, 0.42)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0' : '20px',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: isMobile ? '20px 20px 0 0' : '16px',
          boxShadow: isMobile
            ? '0 -8px 40px rgba(0,0,0,0.15)'
            : '0 20px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
          width: '100%',
          maxWidth: isMobile ? '100%' : '580px',
          maxHeight: isMobile ? '92vh' : '87vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: isMobile
            ? 'slideUpSheet 0.38s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: '40px', height: '4px', borderRadius: '99px', background: '#E5E0D8' }} />
          </div>
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: isMobile ? '12px 20px 16px' : '20px 24px',
          borderBottom: '1px solid var(--color-border-soft)',
          flexShrink: 0,
        }}>
          <h2
            id="modal-title"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: 400, color: '#0A0A0A', margin: 0,
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: '#A3A3A3', fontSize: '26px',
              cursor: 'pointer', padding: '0 4px',
              lineHeight: 1, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0A0A0A'}
            onMouseLeave={e => e.currentTarget.style.color = '#A3A3A3'}
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: isMobile ? '20px 16px 32px' : '24px',
          overflowY: 'auto', flex: 1,
          WebkitOverflowScrolling: 'touch',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
