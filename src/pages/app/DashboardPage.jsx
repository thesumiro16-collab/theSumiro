import { useState } from 'react';
import { useDesigns } from '../../hooks/useDesigns';
import DesignCard from '../../components/designs/DesignCard';
import DesignForm from '../../components/designs/DesignForm';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';

export default function DashboardPage() {
  const { designs, loading, error, page, totalPages, searchTerm, setPage, setSearchTerm, refetch } = useDesigns();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--color-bg-soft)' }}>
      <div className="admin-page-inner">

        {/* ── Page Header ─────────────────────────────── */}
        <div
          className="animate-fade-up"
          style={{
            display: 'flex', flexWrap: 'wrap',
            alignItems: 'flex-start', justifyContent: 'space-between',
            gap: '20px', marginBottom: '36px',
          }}
        >
          <div>
            <span className="pill-label" style={{ marginBottom: '14px', display: 'inline-flex' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8890C', display: 'inline-block' }} />
              Private Archive
            </span>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 400, color: '#0A0A0A',
              lineHeight: 1.15, marginTop: '10px',
            }}>
              Design Archive
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', marginTop: '6px' }}>
              Manage and browse your private fabric catalog
            </p>
          </div>
        </div>

        {/* ── Section 2: Catalog Management ─────────────────────────── */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '24px' }}>
            <div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '24px',
                fontWeight: 400, color: '#0A0A0A',
              }}>
                Catalog Designs
              </h2>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', marginTop: '4px' }}>
                Search, add, and manage designs in your fabric archive
              </p>
            </div>
            <button
              id="dashboard-add-design-btn"
              onClick={() => setModalOpen(true)}
              className="btn-primary"
              style={{ padding: '11px 22px', gap: '8px', display: 'flex', alignItems: 'center', fontSize: '11px' }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Design
            </button>
          </div>

          {/* Search Bar */}
          <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: '12px',
              padding: '6px 6px 6px 18px',
              display: 'flex', alignItems: 'center', gap: '12px',
              maxWidth: '540px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
            }}>
              <svg width="16" height="16" fill="none" stroke="#A3A3A3" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="dashboard-search"
                type="search"
                placeholder="Search by design number or tag…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px',
                  color: '#0A0A0A',
                  background: 'transparent',
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  style={{
                    padding: '6px 14px',
                    background: 'var(--color-bg-soft)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#737373',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    flexShrink: 0,
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Loading ─────────────────────────────────── */}
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '96px 24px',
            background: '#FFFFFF',
            border: '1px solid var(--color-border-soft)',
            borderRadius: '16px',
          }}>
            <div style={{
              width: '44px', height: '44px',
              border: '2.5px solid #E5E0D8',
              borderTopColor: '#E8890C',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginBottom: '20px',
            }} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Loading archive…
            </p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {!loading && error && (
          <div style={{
            textAlign: 'center', padding: '64px 24px',
            background: '#FFF5F5',
            border: '1px solid #FECACA',
            borderRadius: '16px', maxWidth: '540px', margin: '0 auto',
          }}>
            <div style={{ color: '#EF4444', marginBottom: '14px' }}>
              <svg width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#DC2626', marginBottom: '24px', lineHeight: 1.6 }}>{error}</p>
            <button onClick={refetch} className="btn-outline" style={{ padding: '10px 24px' }}>Try Again</button>
          </div>
        )}

        {/* ── Empty State ──────────────────────────────── */}
        {!loading && !error && designs.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '96px 24px',
            background: '#FFFFFF',
            border: '1.5px dashed #D4C9B5',
            borderRadius: '16px',
            maxWidth: '560px', margin: '0 auto',
            animation: 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
          }}>
            <div style={{ color: '#D4C9B5', marginBottom: '20px' }}>
              <svg width="56" height="56" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 400, color: '#0A0A0A', marginBottom: '10px' }}>
              No designs yet
            </h3>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373', marginBottom: '32px', lineHeight: 1.7, maxWidth: '340px', margin: '0 auto 32px' }}>
              Your fabric catalog is empty. Upload your first design to get started.
            </p>
            <button
              id="dashboard-add-first-design-btn"
              onClick={() => setModalOpen(true)}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add First Design
            </button>
          </div>
        )}

        {/* ── Design Grid ──────────────────────────────── */}
        {!loading && !error && designs.length > 0 && (
          <>
            {/* Results count */}
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
              {designs.length} design{designs.length !== 1 ? 's' : ''} {searchTerm ? `matching "${searchTerm}"` : 'in archive'}
            </p>

            <div className="stagger" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px',
            }}>
              {designs.map((design) => (
                <DesignCard key={design.id} design={design} photos={design.photos || []} />
              ))}
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

        {/* ── Add Design Modal ─────────────────────────── */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Design">
          <DesignForm onSuccess={() => { setModalOpen(false); refetch(); }} />
        </Modal>

      </div>
    </div>
  );
}
