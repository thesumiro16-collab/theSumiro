export default function Toast({ type, message, onDismiss }) {
  const isSuccess = type === 'success';
  
  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        background: '#FFFFFF',
        border: '1px solid #EAE6DF',
        borderRadius: '12px',
        padding: '16px 20px',
        minWidth: '320px',
        maxWidth: '420px',
        boxShadow: '0 20px 48px rgba(106, 95, 75, 0.12), 0 4px 12px rgba(0, 0, 0, 0.02)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      }}
    >
      {/* Accent left border indicator */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '4px',
        background: isSuccess ? '#E8890C' : '#DC2626',
      }} />

      {/* Circular Icon Container */}
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        background: isSuccess ? '#FDF3E3' : '#FEE2E2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isSuccess ? '#E8890C' : '#DC2626',
        flexShrink: 0,
      }}>
        {isSuccess ? (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>

      {/* Message and Title */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '8px' }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isSuccess ? '#E8890C' : '#DC2626',
        }}>
          {isSuccess ? 'Success' : 'Notification'}
        </span>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: '#333333',
          lineHeight: '1.5',
          fontWeight: 400,
        }}>
          {message}
        </span>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#A3A3A3',
          cursor: 'pointer',
          padding: '4px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          marginLeft: 'auto',
          marginTop: '-2px',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
          e.currentTarget.style.color = '#333333';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'none';
          e.currentTarget.style.color = '#A3A3A3';
        }}
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Keyframe animation styling */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
