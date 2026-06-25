import { useState, useEffect } from 'react';
import { validateFolderCount } from '../../utils/validators';

export default function FolderCountField({ label, value, onSave }) {
  const [inputValue, setInputValue] = useState(String(value ?? 0));
  const [saving, setSaving] = useState(false);

  // Keep in sync when parent value changes
  useEffect(() => {
    setInputValue(String(value ?? 0));
  }, [value]);

  const handleBlur = async () => {
    const parsed = parseInt(inputValue, 10);
    if (!validateFolderCount(inputValue) || isNaN(parsed)) {
      // Revert to last good value
      setInputValue(String(value ?? 0));
      return;
    }
    if (parsed === value) return; // no change

    setSaving(true);
    try {
      await onSave(parsed);
    } catch {
      setInputValue(String(value ?? 0));
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    // Only allow digits
    if (/^\d*$/.test(raw)) {
      setInputValue(raw);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'Escape') {
      setInputValue(String(value ?? 0));
      e.target.blur();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 w-32 shrink-0">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={saving}
        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center
                   focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
                   disabled:opacity-50"
        aria-label={label}
      />
      {saving && (
        <span className="text-xs text-gray-400">Saving…</span>
      )}
    </div>
  );
}
