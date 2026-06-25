import Seo from '../../components/ui/Seo';

export default function MaintenancePage() {
  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 'clamp(48px, 10vw, 96px) 24px',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F7F5F1 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Seo title="Under Maintenance" description="The Sumiro site is temporarily undergoing scheduled maintenance. Please check back shortly." path="/maintenance" noindex />

      {/* Dot texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #D4C9B5 1px, transparent 1px)',
        backgroundSize: '28px 28px', opacity: 0.3,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px' }}>
        <img
          src="/The Sumiro Logo.png"
          alt="The Sumiro"
          style={{ height: '56px', width: 'auto', marginBottom: '32px' }}
        />

        {/* Spinning loom-style mark */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '64px', height: '64px',
            border: '2px solid #E5E0D8', borderTopColor: '#E8890C',
            borderRadius: '50%', animation: 'spin 1.1s linear infinite',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" fill="none" stroke="#E8890C" strokeWidth="1.6" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
        </div>

        <span className="pill-label" style={{ marginBottom: '24px', display: 'inline-flex' }}>
          Scheduled Maintenance
        </span>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2rem, 6vw, 3.4rem)',
          fontWeight: 400, color: '#0A0A0A',
          lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '14px',
        }}>
          We're <span style={{ fontStyle: 'italic', color: '#E8890C' }}>weaving</span> something better
        </h1>

        <div className="accent-line" style={{ margin: '0 auto 28px' }} />

        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '15px',
          color: '#737373', lineHeight: 1.7,
          maxWidth: '440px', margin: '0 auto',
        }}>
          The Sumiro site is temporarily down for scheduled maintenance.
          We'll be back shortly with everything running smoothly. Thank you for your patience.
        </p>
      </div>
    </div>
  );
}
