import { useState, useEffect } from 'react';
import { validateFolderCount } from '../../utils/validators';

export default function FolderCountField({ label, value, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(String(value ?? 0));
  const [saving, setSaving] = useState(false);

  // Keep in sync when parent value changes
  useEffect(() => {
    setInputValue(String(value ?? 0));
  }, [value]);

  const handleSave = async () => {
    const parsed = parseInt(inputValue, 10);
    if (!validateFolderCount(inputValue) || isNaN(parsed)) {
      setInputValue(String(value ?? 0));
      return;
    }
    if (parsed === value) {
      setIsEditing(false);
      return;
    }

    setSaving(true);
    try {
      await onSave(parsed);
      setIsEditing(false);
    } catch {
      setInputValue(String(value ?? 0));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (/^\d*$/.test(raw)) {
      setInputValue(raw);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setInputValue(String(value ?? 0));
      setIsEditing(false);
    }
  };

  const startEdit = () => {
    setInputValue(String(value ?? 0));
    setIsEditing(true);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minHeight: '38px' }}>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373', width: '128px', flexShrink: 0 }}>
        {label}
      </span>

      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            disabled={saving}
            style={{
              width: '64px',
              background: '#FFFFFF',
              border: '1.5px solid #E8890C',
              borderRadius: '6px',
              padding: '4px 8px',
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              fontWeight: 600,
              color: '#0A0A0A',
              textAlign: 'center',
              outline: 'none',
            }}
            autoFocus
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ padding: '6px 12px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer' }}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            disabled={saving}
            className="btn-outline"
            style={{ padding: '6px 12px', fontSize: '10px', borderRadius: '6px', cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <div
          onClick={startEdit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#F9F6F2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          title="Click to edit"
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>
            {value ?? 0}
          </span>
          <span style={{ color: '#A3A3A3', display: 'flex', alignItems: 'center' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </span>
        </div>
      )}
    </div>
  );
}
