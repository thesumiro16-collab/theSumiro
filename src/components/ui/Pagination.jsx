export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 3) {
      return [1, 2, 3, 4, '...', totalPages];
    }
    if (currentPage >= totalPages - 2) {
      return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  const pages = getPageNumbers();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      marginTop: '36px',
      paddingBottom: '16px',
    }}>
      {/* Floating Luxury Pagination Pill */}
      <nav
        aria-label="Pagination"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          background: '#FFFFFF',
          padding: '5px 8px',
          borderRadius: '9999px',
          border: '1px solid var(--color-border)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Prev Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: currentPage <= 1 ? '#D4D4D4' : '#171717',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (currentPage > 1) {
              e.currentTarget.style.background = 'rgba(232, 137, 12, 0.08)';
              e.currentTarget.style.color = '#E8890C';
            }
          }}
          onMouseLeave={e => {
            if (currentPage > 1) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#171717';
            }
          }}
          aria-label="Previous Page"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span>Prev</span>
        </button>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', background: 'var(--color-border-soft)', margin: '0 2px' }} />

        {/* Page Numbers */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
          {pages.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  style={{
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#A3A3A3',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    letterSpacing: '0.08em',
                  }}
                >
                  •••
                </span>
              );
            }

            const isActive = p === currentPage;
            return (
              <button
                type="button"
                key={p}
                onClick={() => onPageChange(p)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  background: isActive ? 'linear-gradient(135deg, #E8890C 0%, #D47705 100%)' : 'transparent',
                  color: isActive ? '#FFFFFF' : '#525252',
                  boxShadow: isActive ? '0 2px 8px rgba(232, 137, 12, 0.32)' : 'none',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(232, 137, 12, 0.08)';
                    e.currentTarget.style.color = '#E8890C';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#525252';
                  }
                }}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`Page ${p}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Divider */}
        <div style={{ width: '1px', height: '18px', background: 'var(--color-border-soft)', margin: '0 2px' }} />

        {/* Next Button */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '9999px',
            border: 'none',
            background: 'transparent',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.04em',
            color: currentPage >= totalPages ? '#D4D4D4' : '#171717',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = 'rgba(232, 137, 12, 0.08)';
              e.currentTarget.style.color = '#E8890C';
            }
          }}
          onMouseLeave={e => {
            if (currentPage < totalPages) {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#171717';
            }
          }}
          aria-label="Next Page"
        >
          <span>Next</span>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </nav>

      {/* Subtle Page Counter Badge */}
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '11px',
        fontWeight: 500,
        color: '#A3A3A3',
        letterSpacing: '0.06em',
      }}>
        Page <strong style={{ color: '#0A0A0A', fontWeight: 700 }}>{currentPage}</strong> of <strong style={{ color: '#0A0A0A', fontWeight: 700 }}>{totalPages}</strong>
      </span>
    </div>
  );
}
