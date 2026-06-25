import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDesignDetail } from '../../hooks/useDesignDetail';
import { useToast } from '../../contexts/ToastContext';
import PhotoGallery from '../../components/designs/PhotoGallery';
import FolderCountField from '../../components/designs/FolderCountField';
import ShareFolderModal from '../../components/designs/ShareFolderModal';
import Modal from '../../components/ui/Modal';
import { formatDesignNo, formatRate, formatDate } from '../../utils/formatters';

// Client-side speed-bump password to prevent accidental/casual inventory edits.
// Real protection is Supabase auth + RLS; this just gates the UI.
// Configurable via VITE_INVENTORY_PASSWORD in your .env file.
const INVENTORY_PASSWORD = import.meta.env.VITE_INVENTORY_PASSWORD || 'sumiro@inventory';

const MetaRow = ({ label, value }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: '120px 1fr',
    alignItems: 'start',
    gap: '16px',
    padding: '14px 0',
    borderBottom: '1px solid var(--color-border-soft)',
  }}>
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A3A3A3', paddingTop: '2px' }}>
      {label}
    </span>
    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#0A0A0A', lineHeight: 1.5 }}>
      {value}
    </span>
  </div>
);

export default function DesignDetailPage() {
  const { id } = useParams();
  const { design, photos, loading, error, refetch, updateField, uploadAndAddPhotos, deletePhoto } = useDesignDetail(id);
  const { addToast } = useToast();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateValue, setRateValue] = useState('');
  
  // Photo management state
  const [editPhotosOpen, setEditPhotosOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  // Inventory edit lock
  const [inventoryUnlocked, setInventoryUnlocked] = useState(false);
  const [pwModalOpen, setPwModalOpen] = useState(false);
  const [pwInput, setPwInput] = useState('');
  const [pwError, setPwError] = useState('');

  const handleUnlockInventory = (e) => {
    e.preventDefault();
    if (pwInput === INVENTORY_PASSWORD) {
      setInventoryUnlocked(true);
      setPwModalOpen(false);
      setPwInput('');
      setPwError('');
      addToast({ type: 'success', message: 'Inventory editing unlocked' });
    } else {
      setPwError('Incorrect password. Please try again.');
    }
  };

  const handleDeletePhoto = async (photo) => {
    if (photos.length <= 1) {
      addToast({ type: 'error', message: 'A design must have at least one photo.' });
      return;
    }
    if (!window.confirm('Are you sure you want to delete this photo? This will also remove it from Cloudinary storage.')) return;
    
    setIsDeleting(prev => ({ ...prev, [photo.id]: true }));
    try {
      await deletePhoto(photo);
    } catch {
      // toast shown by hook
    } finally {
      setIsDeleting(prev => ({ ...prev, [photo.id]: false }));
    }
  };

  const handleUploadPhotos = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress({ current: 0, total: selectedFiles.length });
    try {
      await uploadAndAddPhotos(selectedFiles, (current, total) => {
        setUploadProgress({ current, total });
      });
    } catch {
      // toast shown by hook
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      e.target.value = ''; // Reset uploader input
    }
  };

  const handleStartEditRate = () => {
    setRateValue(String(design?.rate ?? ''));
    setIsEditingRate(true);
  };

  const handleSaveRate = async () => {
    const parsed = parseFloat(rateValue);
    if (isNaN(parsed) || parsed <= 0) {
      addToast({ type: 'error', message: 'Rate must be a positive number' });
      return;
    }
    setIsEditingRate(false);
    await updateField('rate', parsed);
  };

  const handleShareImage = async () => {
    if (!photos || photos.length === 0) { addToast({ type: 'error', message: 'No image to share' }); return; }
    const currentPhoto = photos[0];
    try {
      const response = await fetch(currentPhoto.secure_url);
      const blob = await response.blob();
      const file = new File([blob], 'design-image.jpg', { type: 'image/jpeg' });
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: design?.fabric_name, text: `Check out this design: ${design?.fabric_name}` });
        addToast({ type: 'success', message: 'Image shared successfully' });
      } else {
        navigator.clipboard.writeText(currentPhoto.secure_url);
        addToast({ type: 'success', message: 'Image URL copied to clipboard' });
      }
    } catch {
      navigator.clipboard.writeText(currentPhoto.secure_url);
      addToast({ type: 'success', message: 'Image URL copied to clipboard' });
    }
  };

  const handleShareSuccess = (foldersShared) => {
    updateField('extra_folder', design.extra_folder - foldersShared);
    refetch();
  };

  // ── Loading ──────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '44px', height: '44px', border: '2.5px solid #E5E0D8', borderTopColor: '#E8890C', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Loading design…</p>
      </div>
    </div>
  );

  // ── Error ────────────────────────────────────────────────
  if (error || !design) return (
    <div style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px' }}>
        <div style={{ color: '#EF4444', marginBottom: '14px' }}>
          <svg width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#DC2626', marginBottom: '20px' }}>{error || 'Design not found'}</p>
        <button onClick={refetch} className="btn-outline" style={{ padding: '10px 24px' }}>Retry</button>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 68px)', background: 'var(--color-bg-soft)' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Breadcrumb ───────────────────────────────── */}
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '36px' }}>
          <Link to="/app/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A3A3A3', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
            onMouseLeave={e => e.currentTarget.style.color = '#A3A3A3'}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ display: 'inline-block' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Dashboard
          </Link>
          <svg width="12" height="12" fill="none" stroke="#D4C9B5" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0A0A0A' }}>
            {design.design_no}
          </span>
        </div>

        {/* ── Main layout ──────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          alignItems: 'start',
        }}>

          {/* LEFT — Photo Gallery */}
          <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}>
              <PhotoGallery photos={photos} designNo={design.design_no} />
            </div>
          </div>

          {/* RIGHT — Details Panel */}
          <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px', animationDelay: '0.1s' }}>

            {/* Identity Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '28px 32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}>
              {/* Design No + Tag */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#A3A3A3' }}>
                  {formatDesignNo(design.design_no)}
                </span>
                {design.tag && (
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#E8890C', background: 'rgba(232,137,12,0.10)', border: '1px solid rgba(232,137,12,0.25)', padding: '4px 12px', borderRadius: '99px' }}>
                    {design.tag}
                  </span>
                )}
              </div>
              {/* Fabric Name */}
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 400, color: '#0A0A0A', lineHeight: 1.15, marginBottom: '6px' }}>
                {design.fabric_name}
              </h1>
              {/* Rate */}
              {isEditingRate ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', fontWeight: 700, color: '#E8890C' }}>₹</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={rateValue}
                    onChange={(e) => setRateValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRate();
                      if (e.key === 'Escape') setIsEditingRate(false);
                    }}
                    style={{
                      width: '100px',
                      background: 'var(--color-bg-soft)',
                      border: '1.5px solid #E8890C',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#E8890C',
                      outline: 'none',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveRate}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingRate(false)}
                    className="btn-outline"
                    style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '10px', 
                    marginTop: '10px',
                    cursor: 'pointer' 
                  }}
                  onClick={handleStartEditRate}
                  title="Click to edit rate"
                >
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '20px', color: '#E8890C', fontWeight: 700 }}>
                    {formatRate(design.rate)}
                  </span>
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#A3A3A3',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 0,
                    }}
                    aria-label="Edit rate"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="accent-line" style={{ marginTop: '20px' }} />

              {/* Meta rows */}
              <div style={{ marginTop: '4px' }}>
                {design.description && (
                  <MetaRow label="Description" value={design.description} />
                )}
                <MetaRow label="Added On" value={formatDate(design.created_at)} />
              </div>
            </div>

            {/* Folder Inventory Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '24px 32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(232,137,12,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8890C' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0A0A0A' }}>
                  Folder Inventory
                </h2>
                {inventoryUnlocked ? (
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#15803D', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '99px', padding: '3px 9px' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-9 4h10a2 2 0 012 2v5a2 2 0 01-2 2H7a2 2 0 01-2-2v-5a2 2 0 012-2z" /></svg>
                    Unlocked
                  </span>
                ) : (
                  <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A3A3A3', background: 'var(--color-bg-soft)', border: '1px solid var(--color-border)', borderRadius: '99px', padding: '3px 9px' }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Locked
                  </span>
                )}
              </div>
              {inventoryUnlocked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <FolderCountField label="Office Folder" value={design.office_folder} onSave={(v) => updateField('office_folder', v)} />
                  <FolderCountField label="Bag Folder" value={design.bag_folder} onSave={(v) => updateField('bag_folder', v)} />
                  <FolderCountField label="Extra Folder" value={design.extra_folder} onSave={(v) => updateField('extra_folder', v)} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { label: 'Office Folder', value: design.office_folder },
                    { label: 'Bag Folder', value: design.bag_folder },
                    { label: 'Extra Folder', value: design.extra_folder },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373', width: '128px', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>{value ?? 0}</span>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => { setPwError(''); setPwInput(''); setPwModalOpen(true); }}
                    className="btn-outline"
                    style={{ marginTop: '6px', padding: '9px 16px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Unlock to Edit
                  </button>
                </div>
              )}
            </div>

            {/* Actions Card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              padding: '24px 32px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
              display: 'flex', flexWrap: 'wrap', gap: '12px',
            }}>
              <button
                onClick={handleShareImage}
                className="btn-outline"
                style={{ padding: '11px 22px', gap: '8px', display: 'flex', alignItems: 'center', fontSize: '11px' }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                Share Image
              </button>
              <button
                onClick={() => setShareModalOpen(true)}
                className="btn-primary"
                style={{ padding: '11px 22px', gap: '8px', display: 'flex', alignItems: 'center', fontSize: '11px' }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Share Folder
              </button>
              <button
                onClick={() => setEditPhotosOpen(true)}
                className="btn-outline"
                style={{ padding: '11px 22px', gap: '8px', display: 'flex', alignItems: 'center', fontSize: '11px', borderColor: '#E8890C', color: '#E8890C' }}
              >
                <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002-2z" />
                </svg>
                Manage Photos
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Share Modal */}
      <Modal isOpen={shareModalOpen} onClose={() => setShareModalOpen(false)} title="Share Folder">
        <ShareFolderModal design={design} onClose={() => setShareModalOpen(false)} onSuccess={handleShareSuccess} />
      </Modal>

      {/* Inventory Unlock Modal */}
      <Modal isOpen={pwModalOpen} onClose={() => setPwModalOpen(false)} title="Unlock Inventory Editing">
        <form onSubmit={handleUnlockInventory} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', lineHeight: 1.6 }}>
            Enter the inventory password to enable editing of folder counts for this design.
          </p>
          <div>
            <label htmlFor="inventory-password" style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#3D3D3D', marginBottom: '7px' }}>
              Password
            </label>
            <input
              id="inventory-password"
              type="password"
              autoFocus
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(''); }}
              placeholder="Enter password"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: pwError ? '#FFF5F5' : 'var(--color-bg-soft)',
                border: `1.5px solid ${pwError ? '#FECACA' : 'var(--color-border)'}`,
                borderRadius: '8px', padding: '11px 14px',
                fontFamily: 'var(--font-sans)', fontSize: '14px',
                color: 'var(--color-text-primary)', outline: 'none',
              }}
            />
            {pwError && (
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#DC2626', marginTop: '5px' }}>
                {pwError}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={() => setPwModalOpen(false)} className="btn-outline" style={{ padding: '10px 20px', fontSize: '11px' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px', fontSize: '11px' }}>
              Unlock
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Photos Modal */}
      <Modal isOpen={editPhotosOpen} onClose={() => setEditPhotosOpen(false)} title="Manage Design Photos">
        <div style={{ padding: '4px 0 10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A3A3A3', marginBottom: '12px' }}>
              Current Photos ({photos.length})
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: '12px' }}>
              {photos.map((p) => (
                <div key={p.id} style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--color-border)', aspectRatio: '1', background: '#F7F5F1' }}>
                  <img src={p.secure_url} alt="Design thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    onClick={() => handleDeletePhoto(p)}
                    disabled={isDeleting[p.id] || isUploading}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(220, 38, 38, 0.9)',
                      color: '#FFFFFF',
                      border: 'none',
                      cursor: (isDeleting[p.id] || isUploading) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      transition: 'background 0.2s',
                    }}
                    title="Delete Photo"
                  >
                    {isDeleting[p.id] ? (
                      <div style={{ width: '10px', height: '10px', border: '1.5px solid #FFFFFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    ) : (
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--color-border-soft)', paddingTop: '20px' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#A3A3A3', marginBottom: '12px' }}>
              Upload New Photos
            </p>
            <div
              onClick={() => !isUploading && document.getElementById('edit-photo-input').click()}
              style={{
                border: '2px dashed #D4C9B5',
                borderRadius: '12px',
                background: 'var(--color-bg-soft)',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                opacity: isUploading ? 0.7 : 1,
                transition: 'border-color 0.2s, background 0.2s',
              }}
            >
              {isUploading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', border: '2.5px solid #E5E0D8', borderTopColor: '#E8890C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#3D3D3D' }}>
                    {uploadProgress ? `Uploading (${uploadProgress.current}/${uploadProgress.total})…` : 'Processing…'}
                  </p>
                </div>
              ) : (
                <>
                  <div style={{ color: '#D4C9B5', marginBottom: '8px' }}>
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: '#3D3D3D' }}>
                    Click to browse and add more photos
                  </p>
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: '#A3A3A3', marginTop: '2px' }}>
                    JPEG, PNG, WEBP · batches are concurrent-controlled
                  </p>
                </>
              )}
            </div>
            <input
              id="edit-photo-input"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleUploadPhotos}
              style={{ display: 'none' }}
              disabled={isUploading}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button
              onClick={() => setEditPhotosOpen(false)}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: '11px', borderRadius: '6px' }}
              disabled={isUploading}
            >
              Done
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
