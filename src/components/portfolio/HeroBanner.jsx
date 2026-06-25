import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../hooks/useSettings';

/* ── Animated count-up hook ─────────────────────────────── */
function useCountUp(target, duration = 1800, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const num = parseInt(target.replace(/\D/g, ''), 10);
    const suffix = target.replace(/[\d]/g, '');
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * num) + suffix);
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return count;
}

/* ── Stat item with count-up ────────────────────────────── */
function StatItem({ value, label, borderRight, started }) {
  const displayed = useCountUp(value, 1600, started);
  return (
    <div
      style={{
        padding: '0 40px',
        textAlign: 'center',
        borderRight: borderRight ? '1px solid #E5E0D8' : 'none',
        transition: 'transform 0.3s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
    >
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
        fontWeight: 400,
        color: '#E8890C',
        lineHeight: 1,
        marginBottom: '8px',
        letterSpacing: '-0.01em',
      }}>
        {started ? displayed : '0'}
      </div>
      <div style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '13px', fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: '#A3A3A3',
      }}>
        {label}
      </div>
    </div>
  );
}

export default function HeroBanner() {
  const { settings } = useSettings();
  const foundingYear = parseInt(settings.about_founding_year, 10) || 2003;
  const yearsOfHeritage = Math.max(1, new Date().getFullYear() - foundingYear);
  const statsRef = useRef(null);
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true); },
      { threshold: 0.4 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-label="Hero banner"
      style={{
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F7F5F1 60%, #F0EDE8 100%)',
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px 120px',
      }}
    >
      {/* Dot-grid background */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #D4C9B5 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        opacity: 0.35,
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)',
      }} />

      {/* Saffron glow decorations */}
      <div style={{
        position: 'absolute', top: '10%', right: '8%',
        width: '380px', height: '380px',
        background: 'radial-gradient(circle, rgba(232,137,12,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'pulse 4s ease-in-out infinite alternate',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '5%',
        width: '280px', height: '280px',
        background: 'radial-gradient(circle, rgba(232,137,12,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        animation: 'pulse 5s ease-in-out infinite alternate-reverse',
      }} />

      {/* Main content */}
      <div
        style={{ position: 'relative', zIndex: 1, maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}
        className="animate-fade-up"
      >
        {/* Pill label */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <span className="pill-label">
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#E8890C', animation: 'pulse 1.8s ease infinite alternate' }} />
            Est. {foundingYear} · Surat, India
          </span>
        </div>

        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '36px' }}>
          <img
            src="/The Sumiro Logo.png"
            alt="The Sumiro — Crafting Fabrics, Creating Futures"
            style={{
              height: 'clamp(80px, 14vw, 140px)', width: 'auto',
              transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1), filter 0.3s',
              filter: 'drop-shadow(0 4px 16px rgba(0,0,0,0.06))',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
              e.currentTarget.style.filter = 'drop-shadow(0 8px 24px rgba(232,137,12,0.18))';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.filter = 'drop-shadow(0 4px 16px rgba(0,0,0,0.06))';
            }}
          />
        </div>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 'clamp(2.2rem, 5.5vw, 4rem)',
          fontWeight: 400,
          color: '#0A0A0A',
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
          margin: '0 auto 20px',
          maxWidth: '720px',
        }}>
          Made with{' '}
          <span style={{ fontStyle: 'italic', color: '#E8890C' }}>Real Craft & Care</span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontFamily: 'var(--font-sans)',
          fontSize: 'clamp(14px, 2vw, 16px)',
          color: '#737373',
          maxWidth: '520px',
          margin: '0 auto 44px',
          lineHeight: 1.75,
        }}>
          We've been making quality fabrics in Surat since {foundingYear}. If you're looking for
          something that lasts, something your customers will love — you're in the right place.
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', justifyContent: 'center', marginBottom: '68px' }}>
          <a
            href={`https://wa.me/${settings.enquiry_phone.replace(/\D/g, '')}?text=Hello%20The%20Sumiro,%20I%20am%20interested%20in%20your%20fabrics%20and%20designs!`}
            target="_blank"
            rel="noopener noreferrer"
            id="hero-contact-cta"
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.012 2c-5.506 0-9.988 4.482-9.988 9.988 0 1.76.458 3.483 1.332 5.008l-1.354 4.947 5.068-1.33c1.468.802 3.123 1.225 4.81 1.225h.004c5.505 0 9.986-4.483 9.986-9.988 0-2.66-1.036-5.16-2.916-7.04C17.19 3.037 14.686 2 12.012 2zm6.657 14.153c-.274.773-1.36 1.41-1.879 1.503-.454.08-1.042.146-3.045-.688-2.56-1.066-4.152-3.7-4.28-3.87-.128-.173-1.04-1.383-1.04-2.637 0-1.254.656-1.872.888-2.122.233-.25.508-.312.678-.312.17 0 .34.003.488.01.15.007.35-.057.548.423.2.49.684 1.668.742 1.79.058.12.098.26.018.42-.08.16-.12.26-.24.4-.12.14-.25.312-.358.42-.12.12-.244.25-.102.494.143.243.635 1.04 1.362 1.687.936.83 1.725 1.088 1.97 1.21.243.12.385.1.53-.067.143-.17.625-.726.79-1.03.167-.306.33-.254.558-.17.228.086 1.45.683 1.7.807.25.124.417.186.478.293.06.107.06.62-.213 1.393z" />
            </svg>
            Inquire on WhatsApp
          </a>
          <Link to="/about" id="hero-about-cta" className="btn-outline">
            Our Story
          </Link>
        </div>

        {/* Stats — animated count-up */}
        <div
          ref={statsRef}
          style={{
            borderTop: '1px solid #E5E0D8',
            paddingTop: '40px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0',
          }}
        >
          {[
            { value: `${yearsOfHeritage}+`, label: 'Years Experience' },
            { value: '1000+', label: 'Design Patterns' },
            { value: '100%', label: 'Quality Assured' },
          ].map(({ value, label }, i) => (
            <StatItem
              key={label}
              value={value}
              label={label}
              borderRight={i < 2}
              started={statsStarted}
            />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        animation: 'fadeIn 2s ease 1.2s both',
      }}>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '9px', letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#B8B0A4',
        }}>
          Scroll
        </span>
        <div style={{
          width: '22px', height: '36px',
          borderRadius: '99px',
          border: '1.5px solid #D4C9B5',
          display: 'flex', justifyContent: 'center',
          paddingTop: '6px',
        }}>
          <div style={{
            width: '3px', height: '8px',
            borderRadius: '99px',
            background: '#E8890C',
            animation: 'scrollDot 1.8s cubic-bezier(0.45,0,0.55,1) infinite',
          }} />
        </div>
      </div>

      <style>{`
        @keyframes scrollDot {
          0%   { transform: translateY(0);   opacity: 1; }
          60%  { transform: translateY(12px); opacity: 0.3; }
          61%  { transform: translateY(0);   opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
      `}</style>
    </section>
  );
}
