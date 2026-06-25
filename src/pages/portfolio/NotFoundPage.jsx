import { Link } from 'react-router-dom';
import Seo from '../../components/ui/Seo';

export default function NotFoundPage() {
  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: 'clamp(48px, 10vw, 96px) 24px',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F7F5F1 100%)',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <Seo title="Page Not Found" description="The page you are looking for could not be found." path="/404" noindex />

      {/* Dot texture */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #D4C9B5 1px, transparent 1px)',
        backgroundSize: '28px 28px', opacity: 0.3,
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '560px' }}>
        <span className="pill-label" style={{ marginBottom: '24px', display: 'inline-flex' }}>
          Error 404
        </span>

        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(4rem, 16vw, 9rem)',
          fontWeight: 400, color: '#0A0A0A',
          lineHeight: 1, letterSpacing: '-0.03em', marginBottom: '8px',
        }}>
          4<span style={{ fontStyle: 'italic', color: '#E8890C' }}>0</span>4
        </h1>

        <div className="accent-line" style={{ margin: '0 auto 28px' }} />

        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(1.4rem, 4vw, 2rem)',
          fontWeight: 400, color: '#0A0A0A', marginBottom: '14px',
        }}>
          This page has come unravelled
        </h2>

        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '15px',
          color: '#737373', lineHeight: 1.7, marginBottom: '36px',
          maxWidth: '420px', margin: '0 auto 36px',
        }}>
          The page you are looking for may have been moved, renamed, or never existed.
          Let's get you back to the collection.
        </p>

        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            to="/"
            className="btn-primary"
            style={{ padding: '12px 28px', fontSize: '11px', textDecoration: 'none' }}
          >
            Back to Home
          </Link>
          <Link
            to="/contact"
            className="btn-outline"
            style={{ padding: '12px 28px', fontSize: '11px', textDecoration: 'none' }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
