import { useState } from 'react';

const FieldError = ({ msg }) => msg ? (
  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#DC2626', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {msg}
  </p>
) : null;

export default function EditMetadataModal({ design, onClose, onSave }) {
  const [fabricName, setFabricName] = useState(design?.fabric_name || '');
  const [description, setDescription] = useState(design?.description || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fabricName.trim()) {
      setError('Fabric name is required');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        fabric_name: fabricName.trim(),
        description: description.trim() || null,
      });
      onClose();
    } catch {
      // error toast handled in parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Design Identification */}
      <div style={{
        padding: '12px 16px',
        background: 'var(--color-bg-soft)',
        borderRadius: '10px',
        border: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#737373' }}>
          Design Number
        </span>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 700, color: '#0A0A0A' }}>
          {design?.design_no}
        </span>
      </div>

      {/* Fabric Name */}
      <div>
        <label className="form-label">Fabric Name *</label>
        <input
          type="text"
          value={fabricName}
          onChange={(e) => {
            setFabricName(e.target.value);
            setError('');
          }}
          placeholder="e.g. Pure Banarasi Silk Brocade"
          className={`form-input ${error ? 'border-destructive bg-destructive/5' : ''}`}
          autoFocus
        />
        <FieldError msg={error} />
      </div>

      {/* Description */}
      <div>
        <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Description</span>
          <span style={{ fontSize: '10px', color: '#A3A3A3', fontWeight: 400 }}>Optional</span>
        </label>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the fabric weave, zari composition, craft technique…"
          className="form-input resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '12px',
        paddingTop: '12px',
        borderTop: '1px solid var(--color-border-soft)'
      }}>
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="btn-outline"
          style={{ padding: '10px 20px', fontSize: '12px' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
          style={{ padding: '10px 24px', fontSize: '12px', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
