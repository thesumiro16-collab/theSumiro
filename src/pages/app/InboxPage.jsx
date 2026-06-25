import InboxModal from '../../components/designs/InboxModal';

export default function InboxPage() {
  return (
    <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--color-bg-soft)' }}>
      <div className="admin-page-inner">
        
        {/* Page Header */}
        <div className="animate-fade-up" style={{ marginBottom: '36px' }}>
          <div>
            <span className="pill-label" style={{ marginBottom: '14px', display: 'inline-flex' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8890C', display: 'inline-block' }} />
              Client Inquiries
            </span>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 400, color: '#0A0A0A',
              lineHeight: 1.15, marginTop: '10px',
            }}>
              Inquiries Inbox
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', marginTop: '6px' }}>
              Manage inbound client inquiries and communication messages
            </p>
          </div>
        </div>

        {/* Content Box */}
        <div
          className="animate-fade-up admin-content-card"
          style={{
            background: '#FFFFFF',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
          }}
        >
          <InboxModal />
        </div>
      </div>
    </div>
  );
}
