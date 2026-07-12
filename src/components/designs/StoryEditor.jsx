import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DEFAULT_SETTINGS } from '../../hooks/useSettings';

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-sans)',
  fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: '#3D3D3D', marginBottom: '7px',
};

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--color-bg-soft)',
  border: '1.5px solid var(--color-border)',
  borderRadius: '8px', padding: '11px 14px',
  fontFamily: 'var(--font-sans)', fontSize: '14px',
  color: 'var(--color-text-primary)', outline: 'none',
  transition: 'border-color 0.2s, box-shadow 0.2s',
};

export default function StoryEditor() {
  const { user, canWrite } = useAuth();
  const { addToast } = useToast();
  const { refetch } = useSettings();
  const isWritable = canWrite ? canWrite('about_editor') : true;

  const [form, setForm] = useState({
    about_founding_year: '',
    about_story_title: '',
    about_story_p1: '',
    about_story_p2: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('designs')
          .select('description')
          .eq('design_no', 'SYSTEM_SETTINGS')
          .maybeSingle();
        if (error) throw error;

        const parsed = data?.description ? JSON.parse(data.description) : {};
        setForm({
          about_founding_year: parsed.about_founding_year ?? DEFAULT_SETTINGS.about_founding_year,
          about_story_title: parsed.about_story_title ?? DEFAULT_SETTINGS.about_story_title,
          about_story_p1: parsed.about_story_p1 ?? DEFAULT_SETTINGS.about_story_p1,
          about_story_p2: parsed.about_story_p2 ?? DEFAULT_SETTINGS.about_story_p2,
        });
      } catch {
        setForm({
          about_founding_year: DEFAULT_SETTINGS.about_founding_year,
          about_story_title: DEFAULT_SETTINGS.about_story_title,
          about_story_p1: DEFAULT_SETTINGS.about_story_p1,
          about_story_p2: DEFAULT_SETTINGS.about_story_p2,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    if (window.confirm('Reset the Our Story content to defaults?')) {
      setForm({
        about_founding_year: DEFAULT_SETTINGS.about_founding_year,
        about_story_title: DEFAULT_SETTINGS.about_story_title,
        about_story_p1: DEFAULT_SETTINGS.about_story_p1,
        about_story_p2: DEFAULT_SETTINGS.about_story_p2,
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.about_founding_year.trim()) {
      addToast({ type: 'error', message: 'Founding year is required!' });
      return;
    }

    setSaving(true);
    try {
      // Read-merge-write so we never clobber other settings (contact, video, etc.)
      const { data, error: checkError } = await supabase
        .from('designs')
        .select('id, description')
        .eq('design_no', 'SYSTEM_SETTINGS')
        .maybeSingle();
      if (checkError) throw checkError;

      const existing = data?.description ? JSON.parse(data.description) : {};
      const merged = {
        ...existing,
        about_founding_year: form.about_founding_year.trim(),
        about_story_title: form.about_story_title.trim(),
        about_story_p1: form.about_story_p1.trim(),
        about_story_p2: form.about_story_p2.trim(),
      };

      if (data?.id) {
        const { error: updateError } = await supabase
          .from('designs')
          .update({ description: JSON.stringify(merged) })
          .eq('id', data.id);
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('designs')
          .insert({
            design_no: 'SYSTEM_SETTINGS',
            fabric_name: 'System settings',
            description: JSON.stringify(merged),
            rate: 1.00,
            tag: 'system',
            office_folder: 0,
            bag_folder: 0,
            extra_folder: 0,
            is_public: true,
            is_featured: false,
            created_by: user.id,
          });
        if (insertError) throw insertError;
      }

      addToast({ type: 'success', message: 'Our Story content saved!' });
      refetch?.();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save story content' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid var(--color-border)', borderTopColor: 'var(--color-accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  const focus = (e) => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; };
  const blur = (e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {!isWritable && (
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#B45309', background: '#FEF9EE', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A', margin: 0 }}>
          You have read-only access. You cannot edit the "Our Story" settings.
        </p>
      )}

      {/* Founding year */}
      <div>
        <label htmlFor="about_founding_year" style={labelStyle}>Company Founding Year</label>
        <input
          id="about_founding_year"
          name="about_founding_year"
          type="text"
          inputMode="numeric"
          value={form.about_founding_year}
          onChange={handleChange}
          disabled={!isWritable}
          placeholder="e.g. 2003"
          style={{ ...inputStyle, maxWidth: '180px' }}
          onFocus={focus}
          onBlur={blur}
        />
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', marginTop: '6px' }}>
          Shown on the About page hero ("Crafting Fabrics Since {form.about_founding_year || '…'}").
        </p>
      </div>

      {/* Story title */}
      <div>
        <label htmlFor="about_story_title" style={labelStyle}>Our Story — Heading</label>
        <input
          id="about_story_title"
          name="about_story_title"
          type="text"
          value={form.about_story_title}
          onChange={handleChange}
          disabled={!isWritable}
          placeholder="e.g. Rooted in Surat's Textile Heritage"
          style={inputStyle}
          onFocus={focus}
          onBlur={blur}
        />
      </div>

      {/* Paragraph 1 */}
      <div>
        <label htmlFor="about_story_p1" style={labelStyle}>Our Story — Paragraph 1</label>
        <textarea
          id="about_story_p1"
          name="about_story_p1"
          rows={4}
          value={form.about_story_p1}
          onChange={handleChange}
          disabled={!isWritable}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={focus}
          onBlur={blur}
        />
      </div>

      {/* Paragraph 2 */}
      <div>
        <label htmlFor="about_story_p2" style={labelStyle}>Our Story — Paragraph 2</label>
        <textarea
          id="about_story_p2"
          name="about_story_p2"
          rows={4}
          value={form.about_story_p2}
          onChange={handleChange}
          disabled={!isWritable}
          style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={focus}
          onBlur={blur}
        />
      </div>

      {/* Actions */}
      {isWritable && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--color-border-soft)', paddingTop: '16px' }}>
          <button type="button" onClick={handleReset} className="btn-outline" style={{ padding: '10px 20px', fontSize: '11px' }}>
            Reset Defaults
          </button>
          <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '10px 24px', fontSize: '11px' }}>
            {saving ? 'Saving...' : 'Save Story'}
          </button>
        </div>
      )}
    </form>
  );
}
