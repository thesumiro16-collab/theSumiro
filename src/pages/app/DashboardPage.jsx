import { useState } from 'react';
import { useDesigns } from '../../hooks/useDesigns';
import DesignCard from '../../components/designs/DesignCard';
import DesignForm from '../../components/designs/DesignForm';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { performVisualSearch } from '../../utils/visualSearch';

export default function DashboardPage() {
  const { designs, loading, error, page, totalPages, searchTerm, setPage, setSearchTerm, refetch } = useDesigns();
  const [modalOpen, setModalOpen] = useState(false);
  const { canWrite } = useAuth();
  const { addToast } = useToast();
  const isWritable = canWrite('dashboard');

  // Visual search state
  const [photoSearchModalOpen, setPhotoSearchModalOpen] = useState(false);
  const [searchFile, setSearchFile] = useState(null);
  const [searchPreview, setSearchPreview] = useState('');
  const [visualSearchResults, setVisualSearchResults] = useState(null);
  const [visualSearchLoading, setVisualSearchLoading] = useState(false);
  const [visualSearchProgress, setVisualSearchProgress] = useState(0);
  const [dragOverPhoto, setDragOverPhoto] = useState(false);
  const [visualSearchMinScore, setVisualSearchMinScore] = useState(0); // minimum match % filter

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast({ type: 'error', message: 'Please select an image file.' });
        return;
      }
      setSearchFile(file);
      setSearchPreview(URL.createObjectURL(file));
      handleRunVisualSearch(file);
    }
  };

  const handlePhotoDrop = (e) => {
    e.preventDefault();
    setDragOverPhoto(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSearchFile(file);
      setSearchPreview(URL.createObjectURL(file));
      handleRunVisualSearch(file);
    }
  };

  const handleRunVisualSearch = async (file) => {
    setVisualSearchLoading(true);
    setVisualSearchProgress(0);
    try {
      // 1. Fetch all designs (excluding system settings / announcement marquee rows)
      const { data: allDesigns, error: designErr } = await supabase
        .from('designs')
        .select('*')
        .not('design_no', 'like', 'SYSTEM_%');
      if (designErr) throw designErr;

      // 2. Fetch all design photos
      const { data: allPhotos, error: photoErr } = await supabase
        .from('design_photos')
        .select('design_id, secure_url');
      if (photoErr) throw photoErr;

      // 3. Compute signatures and compare
      const sortedResults = await performVisualSearch(file, allDesigns, allPhotos, (pct) => {
        setVisualSearchProgress(pct);
      });

      setVisualSearchResults(sortedResults);
      setPhotoSearchModalOpen(false);
      addToast({ type: 'success', message: `Visual search complete. Found ${sortedResults.length} matching designs.` });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Visual search failed: ' + err.message });
    } finally {
      setVisualSearchLoading(false);
      setVisualSearchProgress(0);
    }
  };

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
            {isWritable && (
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
            )}
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
              <button
                type="button"
                onClick={() => setPhotoSearchModalOpen(true)}
                title="Search by Photo"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#737373',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  transition: 'background 0.2s, color 0.2s',
                  flexShrink: 0
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-soft)'; e.currentTarget.style.color = '#E8890C'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#737373'; }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </button>
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
            {isWritable && (
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
            )}
          </div>
        )}

        {/* ── Design Grid / Visual Search Results ──────────────────────────────── */}
        {!loading && !error && (
          <>
            {/* Visual Search Clear Banner + Filter */}
            {visualSearchResults && (() => {
              const SCORE_OPTIONS = [
                { label: 'All', value: 0 },
                { label: '≥ 25%', value: 25 },
                { label: '≥ 50%', value: 50 },
                { label: '≥ 75%', value: 75 },
                { label: '≥ 90%', value: 90 },
              ];
              return (
                <div style={{
                  background: '#FFF8EE', border: '1.5px solid #F5C97A', borderRadius: '12px',
                  padding: '14px 20px', marginBottom: '24px', display: 'flex',
                  flexDirection: 'column', gap: '12px'
                }}>
                  {/* Top row: label + clear */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>📷</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#B45309', fontWeight: 600 }}>
                        Visual Search active — sorted by similarity
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setVisualSearchResults(null); setSearchFile(null); setSearchPreview(''); setVisualSearchMinScore(0); }}
                      style={{
                        background: 'transparent', border: 'none', color: '#B45309',
                        fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700,
                        textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.05em',
                        textDecoration: 'underline', padding: 0
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  {/* Filter pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#92400E', marginRight: '2px' }}>Min Match:</span>
                    {SCORE_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setVisualSearchMinScore(opt.value)}
                        style={{
                          fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700,
                          padding: '4px 12px', borderRadius: '20px', cursor: 'pointer',
                          border: '1.5px solid',
                          borderColor: visualSearchMinScore === opt.value ? '#E8890C' : '#F5C97A',
                          background: visualSearchMinScore === opt.value ? '#E8890C' : 'transparent',
                          color: visualSearchMinScore === opt.value ? '#FFFFFF' : '#B45309',
                          transition: 'all 0.15s',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Render results grid */}
            {(() => {
              const filteredVisual = visualSearchResults
                ? visualSearchResults.filter(d => d.similarityScore >= visualSearchMinScore)
                : null;
              const displayList = filteredVisual || designs;
              if (displayList.length === 0 && !visualSearchResults) return null;
              return (
              <>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '20px' }}>
                  {filteredVisual
                    ? `${filteredVisual.length} design${filteredVisual.length !== 1 ? 's' : ''} matched${visualSearchMinScore > 0 ? ` (≥${visualSearchMinScore}%)` : ''}`
                    : `${designs.length} design${designs.length !== 1 ? 's' : ''} ${searchTerm ? `matching "${searchTerm}"` : 'in archive'}`
                  }
                </p>

                <div className="stagger" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                  gap: '20px',
                }}>
                  {displayList.map((design) => (
                    <div key={design.id} style={{ position: 'relative' }}>
                      {design.similarityScore !== undefined && (
                        <div style={{
                          position: 'absolute', top: '12px', right: '12px', zIndex: 10,
                          background: design.similarityScore >= 75 ? 'rgba(22,163,74,0.93)' : design.similarityScore >= 50 ? 'rgba(232,137,12,0.95)' : 'rgba(100,100,120,0.85)',
                          color: '#FFFFFF',
                          fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700,
                          padding: '4px 10px', borderRadius: '20px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                          letterSpacing: '0.05em',
                        }}>
                          {design.similarityScore}% MATCH
                        </div>
                      )}
                      <DesignCard design={design} photos={design.photos || []} />
                    </div>
                  ))}
                </div>

                {/* Show pagination ONLY for standard list search */}
                {!visualSearchResults && (
                  <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                )}

                {/* Empty filtered results */}
                {filteredVisual && filteredVisual.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '48px 24px', gridColumn: '1/-1' }}>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373' }}>
                      No designs match ≥{visualSearchMinScore}%. Try a lower threshold.
                    </p>
                  </div>
                )}
              </>
              );
            })()}

            {/* Handle empty case for visual search specifically */}
            {visualSearchResults && visualSearchResults.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 24px' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373' }}>
                  No visual search matches found. Try uploading a different photo.
                </p>
              </div>
            )}
          </>
        )}

        {/* ── Add Design Modal ─────────────────────────── */}
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add New Design">
          <DesignForm onSuccess={() => { setModalOpen(false); refetch(); }} />
        </Modal>

        {/* ── Photo Search Modal ───────────────────────── */}
        <Modal isOpen={photoSearchModalOpen} onClose={() => setPhotoSearchModalOpen(false)} title="Search by Photo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
              Upload a swatch photo, fabric pattern, or color sample to search the private archive for visually similar designs.
            </p>

            <div
              onDragOver={e => { e.preventDefault(); setDragOverPhoto(true); }}
              onDragLeave={() => setDragOverPhoto(false)}
              onDrop={handlePhotoDrop}
              onClick={() => document.getElementById('photo-search-input').click()}
              style={{
                border: `2px dashed ${dragOverPhoto ? '#E8890C' : '#E5E0D8'}`,
                borderRadius: '12px', padding: '36px 20px', textAlign: 'center',
                cursor: 'pointer',
                background: dragOverPhoto ? 'rgba(232,137,12,0.04)' : 'var(--color-bg-soft)',
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              <div style={{ color: '#E8890C', display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#111827', margin: 0 }}>
                {dragOverPhoto ? 'Drop the photo here' : 'Drag & drop photo here or click to browse'}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>
                Supports PNG, JPEG, WEBP files
              </p>
              <input
                id="photo-search-input"
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        </Modal>

        {/* ── Visual Search Loading Modal ─────────────── */}
        <Modal isOpen={visualSearchLoading} onClose={() => {}} title="Analyzing Image...">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: '20px' }}>
            <div style={{
              width: '48px', height: '48px',
              border: '3px solid #E5E0D8',
              borderTopColor: '#E8890C',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                Comparing color and texture signatures...
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#737373', marginTop: '6px' }}>
                Analyzing archive: {visualSearchProgress}% complete
              </p>
            </div>
            <div style={{ width: '100%', height: '6px', background: '#E5E0D8', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ width: `${visualSearchProgress}%`, height: '100%', background: '#E8890C', transition: 'width 0.15s ease-out' }} />
            </div>
          </div>
        </Modal>

      </div>
    </div>
  );
}
