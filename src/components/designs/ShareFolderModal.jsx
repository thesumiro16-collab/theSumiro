import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const FieldError = ({ msg }) => msg ? (
  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#DC2626', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    {msg}
  </p>
) : null;

export default function ShareFolderModal({ design, onClose, onSuccess }) {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [form, setForm] = useState({
    party_name: '',
    city: '',
    folders_to_share: '',
    rate: '',
    sent_date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};

    if (!form.party_name.trim()) validationErrors.party_name = 'Party name is required';
    if (!form.city.trim()) validationErrors.city = 'City is required';

    const foldersToShare = parseInt(form.folders_to_share, 10);
    if (!form.folders_to_share || isNaN(foldersToShare) || foldersToShare <= 0) {
      validationErrors.folders_to_share = 'Must be a positive integer';
    } else if (foldersToShare > design.extra_folder) {
      validationErrors.folders_to_share = `Cannot exceed available extra folders (${design.extra_folder})`;
    }

    const rateValue = parseFloat(form.rate);
    if (!form.rate || isNaN(rateValue) || rateValue <= 0) {
      validationErrors.rate = 'Rate must be a positive number';
    }

    if (!form.sent_date) {
      validationErrors.sent_date = 'Sent date is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    const foldersShared = parseInt(form.folders_to_share, 10);

    try {
      const { error: insertError } = await supabase.from('shared_folders').insert({
        design_id: design.id,
        party_name: form.party_name.trim(),
        city: form.city.trim(),
        folders_shared: foldersShared,
        rate: rateValue,
        sent_date: form.sent_date,
        status: 'pending',
        created_by: user.id,
      });
      if (insertError) throw insertError;

      const { error: updateError } = await supabase
         .from('designs')
         .update({ extra_folder: design.extra_folder - foldersShared })
         .eq('id', design.id);
      if (updateError) throw updateError;

      addToast({ type: 'success', message: 'Share recorded successfully' });
      onSuccess?.(foldersShared);
      onClose();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to record share' });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (hasError) => ({
    width: '100%', boxSizing: 'border-box',
    background: hasError ? '#FFF5F5' : 'var(--color-bg-soft)',
    border: `1.5px solid ${hasError ? '#FECACA' : 'var(--color-border)'}`,
    borderRadius: '8px', padding: '11px 14px',
    fontFamily: 'var(--font-sans)', fontSize: '14px',
    color: 'var(--color-text-primary)', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  });

  const labelStyle = {
    display: 'block', fontFamily: 'var(--font-sans)',
    fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
    textTransform: 'uppercase', color: '#3D3D3D', marginBottom: '7px',
  };

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      
      {/* Party Name */}
      <div>
        <label style={labelStyle}>Party Name *</label>
        <input
          type="text"
          name="party_name"
          value={form.party_name}
          onChange={handleChange}
          placeholder="e.g. Ratan Fabrics"
          style={inputStyle(!!errors.party_name)}
          onFocus={e => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; e.target.style.background = '#FFFFFF'; }}
          onBlur={e => { e.target.style.borderColor = errors.party_name ? '#FECACA' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
        />
        <FieldError msg={errors.party_name} />
      </div>

      {/* City */}
      <div>
        <label style={labelStyle}>City *</label>
        <input
          type="text"
          name="city"
          value={form.city}
          onChange={handleChange}
          placeholder="e.g. Surat"
          style={inputStyle(!!errors.city)}
          onFocus={e => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; e.target.style.background = '#FFFFFF'; }}
          onBlur={e => { e.target.style.borderColor = errors.city ? '#FECACA' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
        />
        <FieldError msg={errors.city} />
      </div>

      {/* Folders to Share */}
      <div>
        <label style={labelStyle}>
          Folders to Share * (available: {design.extra_folder})
        </label>
        <input
          type="number"
          name="folders_to_share"
          min="1"
          max={design.extra_folder}
          value={form.folders_to_share}
          onChange={handleChange}
          placeholder="0"
          style={inputStyle(!!errors.folders_to_share)}
          onFocus={e => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; e.target.style.background = '#FFFFFF'; }}
          onBlur={e => { e.target.style.borderColor = errors.folders_to_share ? '#FECACA' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
        />
        <FieldError msg={errors.folders_to_share} />
      </div>

      {/* Rate */}
      <div>
        <label style={labelStyle}>Rate (₹) *</label>
        <input
          type="number"
          name="rate"
          min="0.01"
          step="0.01"
          value={form.rate}
          onChange={handleChange}
          placeholder={`e.g. ${design.rate ?? '1200'}`}
          style={inputStyle(!!errors.rate)}
          onFocus={e => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; e.target.style.background = '#FFFFFF'; }}
          onBlur={e => { e.target.style.borderColor = errors.rate ? '#FECACA' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
        />
        {design.rate && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', marginTop: '5px' }}>
            Design list rate: ₹{design.rate}
          </p>
        )}
        <FieldError msg={errors.rate} />
      </div>

      {/* Sent Date */}
      <div>
        <label style={labelStyle}>Sent Date *</label>
        <input
          type="date"
          name="sent_date"
          value={form.sent_date}
          onChange={handleChange}
          style={inputStyle(!!errors.sent_date)}
          onFocus={e => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; e.target.style.background = '#FFFFFF'; }}
          onBlur={e => { e.target.style.borderColor = errors.sent_date ? '#FECACA' : 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
        />
        <FieldError msg={errors.sent_date} />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="btn-outline"
          style={{ padding: '10px 20px', fontSize: '11px' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{ padding: '10px 24px', fontSize: '11px', gap: '8px', display: 'flex', alignItems: 'center', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <>
              <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Recording…
            </>
          ) : (
            <>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 10.742h.01m3.999 0h.01M9.605 18.065A15.932 15.932 0 0112 18c2.802 0 5.428-.72 7.721-1.993L21 21l-1.993-5.221A15.932 15.932 0 0021 12c0-4.418-4.03-8-9-8s-9 3.582-9 8a8.956 8.956 0 002.224 5.922L3 21l1.993-1.993c1.554.858 3.327 1.343 5.201 1.343c.138 0 .274-.002.411-.005z" />
              </svg>
              Record Share
            </>
          )}
        </button>
      </div>
    </form>
  );
}

