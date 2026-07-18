import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { validateDesignForm, validatePhoto } from '../../utils/validators';
import { uploadPhotosToCloudinary } from '../../lib/cloudinary';

const INITIAL_FORM = {
  design_no: '', fabric_name: '', description: '',
  rate: '', tag: '', office_folder: 1, bag_folder: 1, extra_folder: '0',
};

const FieldError = ({ msg }) => msg ? (
  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#EF4444', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {msg}
  </p>
) : null;

const Toggle = ({ on, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-pressed={on}
    style={{
      position: 'relative', width: '48px', height: '26px',
      borderRadius: '99px',
      background: on ? '#E8890C' : '#D4C9B5',
      border: 'none', cursor: 'pointer',
      transition: 'background 0.25s',
      flexShrink: 0
    }}
  >
    <span style={{
      position: 'absolute', top: '2px',
      left: on ? '24px' : '2px',
      width: '22px', height: '22px',
      borderRadius: '50%', background: '#FFFFFF',
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      transition: 'left 0.2s'
    }} />
  </button>
);

export default function DesignForm({ onSuccess }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [form, setForm] = useState(INITIAL_FORM);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total }

  // Drag-to-reorder state for preview grid
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const handlePreviewDragStart = (e, idx) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handlePreviewDragOver = (e, idx) => {
    e.preventDefault();
    if (idx !== draggedIdx) setDragOverIdx(idx);
  };
  const handlePreviewDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null); setDragOverIdx(null); return;
    }
    const newFiles = [...files];
    const newPreviews = [...previews];
    const [mFile] = newFiles.splice(draggedIdx, 1);
    const [mPrev] = newPreviews.splice(draggedIdx, 1);
    newFiles.splice(targetIdx, 0, mFile);
    newPreviews.splice(targetIdx, 0, mPrev);
    setFiles(newFiles);
    setPreviews(newPreviews);
    setDraggedIdx(null); setDragOverIdx(null);
  };
  const handlePreviewDragEnd = () => { setDraggedIdx(null); setDragOverIdx(null); };

  const NUMERIC_FIELDS = new Set(['rate', 'extra_folder', 'office_folder', 'bag_folder']);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const normalized = NUMERIC_FIELDS.has(name) ? value : value.toUpperCase();
    setForm(prev => ({ ...prev, [name]: normalized }));
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const addFiles = (selected) => {
    const newFiles = [...files, ...selected];
    setFiles(newFiles);
    const newPreviews = [...previews];
    selected.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push({ file, url: reader.result, name: file.name });
        setPreviews([...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
    setErrors(prev => ({ ...prev, photos: undefined }));
  };

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []).filter(f => f.type.startsWith('image/'));
    if (dropped.length) addFiles(dropped);
  };

  const removePhoto = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formErrors = validateDesignForm({ ...form, photos: files });
    const photoErrors = files.map(f => validatePhoto(f)).filter(Boolean);
    if (photoErrors.length > 0) formErrors.photos = photoErrors.join(' | ');
    if (Object.keys(formErrors).length > 0) { setErrors(formErrors); return; }

    setLoading(true);
    try {
      let uploadedPhotos;
      try {
        uploadedPhotos = await uploadPhotosToCloudinary(files, (current, total) => {
          setUploadProgress({ current, total });
        });
      } catch (uploadErr) {
        addToast({ type: 'error', message: uploadErr.message });
        setLoading(false);
        setUploadProgress(null);
        return;
      }

      const { data: designData, error: designError } = await supabase
        .from('designs')
        .insert({
          design_no: form.design_no.trim(),
          fabric_name: form.fabric_name.trim(),
          description: form.description.trim() || null,
          rate: parseFloat(form.rate),
          tag: form.tag.trim() || null,
          extra_folder: parseInt(form.extra_folder, 10),
          office_folder: parseInt(form.office_folder, 10),
          bag_folder: parseInt(form.bag_folder, 10),
          is_public: false, is_featured: false,
          created_by: user.id,
        }).select().single();

      if (designError) throw designError;

      const { error: photosError } = await supabase.from('design_photos').insert(
        uploadedPhotos.map((p, i) => ({
          design_id: designData.id, secure_url: p.secure_url,
          public_id: p.public_id, sort_order: i, created_by: user.id,
        }))
      );
      if (photosError) throw photosError;

      addToast({ type: 'success', message: 'Design saved successfully!' });
      setForm(INITIAL_FORM); setFiles([]); setPreviews([]); setErrors({});
      onSuccess?.();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save design' });
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">

      {/* ── Section: Basic Info ─────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--color-border-soft)', paddingBottom: '24px' }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--color-text-muted)', marginBottom: '16px',
        }}>
          Basic Information
        </p>
        <div className="grid design-form-grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label className="form-label">Design No. *</label>
            <input type="text" name="design_no" value={form.design_no} onChange={handleChange} placeholder="e.g. D-0001" className={`form-input ${errors.design_no ? 'border-destructive bg-destructive/5' : ''}`} />
            <FieldError msg={errors.design_no} />
          </div>
          <div>
            <label className="form-label">Tag</label>
            <input type="text" name="tag" value={form.tag} onChange={handleChange} placeholder="e.g. Silk, Jacquard" className="form-input" />
            <FieldError msg={errors.tag} />
          </div>
        </div>

        <div className="mb-4">
          <label className="form-label">Fabric Name *</label>
          <input type="text" name="fabric_name" value={form.fabric_name} onChange={handleChange} placeholder="e.g. Pure Banarasi Silk Brocade" className={`form-input ${errors.fabric_name ? 'border-destructive bg-destructive/5' : ''}`} />
          <FieldError msg={errors.fabric_name} />
        </div>

        <div className="grid design-form-grid-2" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label className="form-label">Rate (₹) *</label>
            <input type="number" name="rate" min="0.01" step="0.01" value={form.rate} onChange={handleChange} placeholder="0.00" className={`form-input ${errors.rate ? 'border-destructive bg-destructive/5' : ''}`} />
            <FieldError msg={errors.rate} />
          </div>
          <div>
            <label className="form-label">Extra Folder (0–99)</label>
            <input type="number" name="extra_folder" min="0" max="99" value={form.extra_folder} onChange={handleChange} className={`form-input ${errors.extra_folder ? 'border-destructive bg-destructive/5' : ''}`} />
            <FieldError msg={errors.extra_folder} />
          </div>
        </div>

        <div className="mt-4">
          <label className="form-label">Description</label>
          <textarea name="description" rows={3} value={form.description} onChange={handleChange} placeholder="Describe the fabric, weave, or special characteristics…" className={`form-input resize-none ${errors.description ? 'border-destructive bg-destructive/5' : ''}`} />
        </div>
      </div>

      {/* ── Section: Folders ────────────────────────── */}
      <div style={{ borderBottom: '1px solid var(--color-border-soft)', paddingBottom: '24px', marginBottom: '4px' }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--color-text-muted)', marginBottom: '16px',
        }}>
          Folder Settings
        </p>
        {[
          { key: 'office_folder', label: 'Office Folder', desc: 'Include in office folder set' },
          { key: 'bag_folder', label: 'Bag Folder', desc: 'Include in bag folder set' },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 18px',
            borderRadius: '10px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-soft)',
            marginBottom: '10px',
          }}>
            <div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{desc}</div>
            </div>
            <Toggle on={form[key] === 1} onToggle={() => setForm(prev => ({ ...prev, [key]: prev[key] === 1 ? 0 : 1 }))} />
          </div>
        ))}
      </div>

      {/* ── Section: Photos ─────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.16em', textTransform: 'uppercase',
          color: 'var(--color-text-muted)', marginBottom: '16px',
        }}>
          Photos *
        </p>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('design-photo-input').click()}
          style={{
            border: `2px dashed ${dragOver ? '#E8890C' : errors.photos ? '#EF4444' : '#E5E0D8'}`,
            borderRadius: '10px',
            padding: '32px 24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'rgba(232,137,12,0.04)' : errors.photos ? 'rgba(239,68,68,0.04)' : 'var(--color-bg-soft)',
            transition: 'border-color 0.2s, background 0.2s',
          }}
        >
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center', color: dragOver ? '#E8890C' : '#A3A3A3' }}>
            <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#0A0A0A', marginBottom: '4px' }}>
            {dragOver ? 'Drop to upload' : 'Drag & drop photos here'}
          </p>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
            or <span style={{ color: '#E8890C', fontWeight: 700 }}>browse files</span> · JPEG / PNG / WEBP · max 10 MB each
          </p>
        </div>
        <input id="design-photo-input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={handleFileChange} style={{ display: 'none' }} />
        <FieldError msg={errors.photos} />

        {/* Previews grid */}
        {previews.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {previews.length} photo{previews.length !== 1 ? 's' : ''} selected
              </p>
              {previews.length > 1 && (
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 9h8M8 12h8M8 15h8" /></svg>
                  Drag to reorder
                </p>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '10px' }}>
              {previews.map((preview, index) => (
                <div
                  key={index}
                  draggable
                  onDragStart={(e) => handlePreviewDragStart(e, index)}
                  onDragOver={(e) => handlePreviewDragOver(e, index)}
                  onDrop={(e) => handlePreviewDrop(e, index)}
                  onDragEnd={handlePreviewDragEnd}
                  style={{
                    position: 'relative',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: dragOverIdx === index
                      ? '2px dashed #E8890C'
                      : '1px solid var(--color-border)',
                    aspectRatio: '1/1',
                    opacity: draggedIdx === index ? 0.4 : 1,
                    transform: dragOverIdx === index ? 'scale(1.05)' : 'scale(1)',
                    transition: 'border-color 0.15s, opacity 0.15s, transform 0.15s',
                    cursor: 'grab',
                    boxShadow: dragOverIdx === index ? '0 4px 12px rgba(232,137,12,0.2)' : 'none',
                  }}
                >
                  <img src={preview.url} alt={`Preview ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }} />

                  {/* Position badge */}
                  {previews.length > 1 && draggedIdx === null && (
                    <div style={{
                      position: 'absolute', bottom: '3px', left: '3px',
                      background: 'rgba(0,0,0,0.55)', color: '#FFF',
                      borderRadius: '3px', padding: '1px 4px',
                      fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700,
                      pointerEvents: 'none',
                    }}>
                      {index + 1}
                    </div>
                  )}

                  {/* Drag handle */}
                  {previews.length > 1 && draggedIdx === null && (
                    <div style={{
                      position: 'absolute', top: '3px', left: '3px',
                      color: 'rgba(255,255,255,0.85)', pointerEvents: 'none',
                    }}>
                      <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 6a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm8-16a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4zm0 8a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </div>
                  )}

                  {/* Remove button */}
                  {draggedIdx === null && (
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      aria-label={`Remove ${preview.name}`}
                      style={{
                        position: 'absolute', top: '4px', right: '4px',
                        width: '20px', height: '20px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Submit ──────────────────────────────────── */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary"
        style={{ width: '100%', height: '44px', justifyContent: 'center' }}
      >
        {loading ? (
          <>
            <div style={{
              width: '16px', height: '16px',
              border: '2px solid rgba(255,255,255,0.35)',
              borderTopColor: '#FFFFFF',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              marginRight: '8px',
            }} />
            {uploadProgress ? `Uploading (${uploadProgress.current}/${uploadProgress.total})…` : 'Saving Design…'}
          </>
        ) : (
          <>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Save Design
          </>
        )}
      </button>
    </form>
  );
}
