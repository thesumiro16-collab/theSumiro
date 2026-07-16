import { Link } from 'react-router-dom';
import PlaceholderImage from '../ui/PlaceholderImage';
import { formatRate, getOptimizedImageUrl } from '../../utils/formatters';

export default function DesignCard({ design, photos }) {
  const firstPhoto = photos && photos.length > 0 ? photos[0] : null;

  return (
    <Link
      to={`/app/design/${design.id}`}
      style={{
        display: 'block',
        background: '#FFFFFF',
        border: '1px solid var(--color-border-soft)',
        borderRadius: '12px',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'box-shadow 0.3s, transform 0.3s, border-color 0.3s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.09)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.03)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--color-border-soft)';
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', background: '#F7F5F1' }}>
        {firstPhoto ? (
          <img
            src={getOptimizedImageUrl(firstPhoto.secure_url, 400)}
            alt={design.fabric_name}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s cubic-bezier(0.16,1,0.3,1)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          />
        ) : (
          <PlaceholderImage style={{ width: '100%', height: '100%' }} />
        )}

        {/* View overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.3s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
        >
          <div style={{
            width: '44px', height: '44px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.25s, transform 0.25s',
            color: '#FFFFFF',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.95)';
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.color = '#E8890C';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0)';
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>

        {/* Tag badge top-right */}
        {design.tag && (
          <div style={{
            position: 'absolute', top: '10px', right: '10px',
            fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            background: 'rgba(255,255,255,0.92)',
            color: '#E8890C',
            padding: '4px 10px', borderRadius: '99px',
            backdropFilter: 'blur(8px)',
          }}>
            {design.tag}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div style={{ padding: '18px 20px', borderTop: '1px solid var(--color-border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#A3A3A3',
            background: 'var(--color-bg-soft)',
            padding: '3px 10px', borderRadius: '99px',
            border: '1px solid var(--color-border)',
          }}>
            {design.design_no}
          </span>
          <svg width="14" height="14" fill="none" stroke="#D4C9B5" strokeWidth="1.8" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <h3 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '16px', fontWeight: 400,
          color: 'var(--color-text-primary)',
          marginBottom: '6px', lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {design.fabric_name}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 700,
            color: '#E8890C',
          }}>
            {formatRate(design.rate)}
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px',
            color: '#A3A3A3', letterSpacing: '0.06em',
          }}>
            View Details →
          </span>
        </div>
      </div>
    </Link>
  );
}
