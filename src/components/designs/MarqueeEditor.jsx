import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

const DEFAULT_MARQUEE = [
  'Silk Brocades',
  'Jacquard Weaves',
  'Zari Embroidery',
  'Digital Prints',
  'Heritage Motifs',
  'Screen Prints',
  'Velvet Textures',
  'Organza Fabrics'
];

export default function MarqueeEditor({ onSuccess }) {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadMarquee() {
      try {
        const { data, error } = await supabase
          .from('designs')
          .select('description')
          .eq('design_no', 'SYSTEM_MARQUEE')
          .maybeSingle();

        if (error) throw error;

        if (data?.description) {
          try {
            setTags(JSON.parse(data.description));
          } catch {
            setTags(DEFAULT_MARQUEE);
          }
        } else {
          setTags(DEFAULT_MARQUEE);
        }
      } catch {
        addToast({ type: 'error', message: 'Failed to load marquee tags. Using defaults.' });
        setTags(DEFAULT_MARQUEE);
      } finally {
        setLoading(false);
      }
    }
    loadMarquee();
  }, [addToast]);

  const handleAddTag = (e) => {
    e.preventDefault();
    const cleanTag = newTag.trim();
    if (!cleanTag) return;
    if (tags.some(t => t.toLowerCase() === cleanTag.toLowerCase())) {
      addToast({ type: 'error', message: 'Tag already exists!' });
      return;
    }
    setTags([...tags, cleanTag]);
    setNewTag('');
  };

  const handleRemoveTag = (indexToRemove) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  const handleReset = () => {
    if (window.confirm('Reset to default marquee items?')) {
      setTags(DEFAULT_MARQUEE);
    }
  };

  const handleSave = async () => {
    if (tags.length === 0) {
      addToast({ type: 'error', message: 'Please add at least one item to the marquee!' });
      return;
    }
    setSaving(true);
    try {
      const { data, error: checkError } = await supabase
        .from('designs')
        .select('id')
        .eq('design_no', 'SYSTEM_MARQUEE')
        .maybeSingle();

      if (checkError) throw checkError;

      if (data?.id) {
        // Update existing row
        const { error: updateError } = await supabase
          .from('designs')
          .update({ description: JSON.stringify(tags) })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert new system settings row
        const { error: insertError } = await supabase
          .from('designs')
          .insert({
            design_no: 'SYSTEM_MARQUEE',
            fabric_name: 'Marquee settings',
            description: JSON.stringify(tags),
            rate: 1.00,
            tag: 'system',
            office_folder: 0,
            bag_folder: 0,
            extra_folder: 0,
            is_public: true, // Needs to be public so public site can query it
            is_featured: false,
            created_by: user.id,
          });

        if (insertError) throw insertError;
      }

      addToast({ type: 'success', message: 'Marquee updated successfully!' });
      onSuccess?.();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save marquee' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid #E5E0D8',
          borderTopColor: '#E8890C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#666666', lineHeight: 1.6 }}>
        Manage the items shown in the scrolling marquee ticker on the home page.
      </p>

      {/* Ticker Preview */}
      <div style={{ 
        background: '#1A1208', 
        padding: '12px 16px', 
        borderRadius: '8px',
        overflow: 'hidden', 
        whiteSpace: 'nowrap',
        border: '1px solid #332211'
      }}>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          {tags.map((text, i) => (
            <span key={i} style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '12px',
              fontFamily: 'var(--font-sans)', 
              fontSize: '11px', 
              fontWeight: 700, 
              letterSpacing: '0.15em', 
              textTransform: 'uppercase', 
              color: i % 2 === 0 ? '#FFFFFF' : '#E8890C' 
            }}>
              {text}
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E8890C', flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>

      {/* Tags List */}
      <div>
        <label style={{
          display: 'block', fontFamily: 'var(--font-sans)',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase', color: '#3D3D3D', marginBottom: '8px',
        }}>
          Current Items ({tags.length})
        </label>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '8px', 
          background: 'var(--color-bg-soft)',
          border: '1.5px solid var(--color-border)',
          borderRadius: '10px',
          padding: '16px',
          maxHeight: '180px',
          overflowY: 'auto'
        }}>
          {tags.length === 0 ? (
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#A3A3A3' }}>No items in ticker</span>
          ) : (
            tags.map((tag, idx) => (
              <span key={idx} style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#FFFFFF',
                border: '1px solid #E5E0D8',
                borderRadius: '6px',
                padding: '6px 10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                color: '#333333',
              }}>
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(idx)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 700,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  aria-label={`Remove ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))
          )}
        </div>
      </div>

      {/* Add New Item */}
      <form onSubmit={handleAddTag} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          placeholder="Add ticker item (e.g. Linen Fabrics)..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          style={{
            flex: 1,
            background: 'var(--color-bg-soft)',
            border: '1.5px solid var(--color-border)',
            borderRadius: '8px',
            padding: '10px 14px',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            outline: 'none',
          }}
          onFocus={e => e.target.style.borderColor = '#E8890C'}
          onBlur={e => e.target.style.borderColor = 'var(--color-border)'}
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ padding: '0 20px', fontSize: '11px', flexShrink: 0 }}
        >
          Add Item
        </button>
      </form>

      {/* Footer Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border-soft)', paddingTop: '16px' }}>
        <button
          type="button"
          onClick={handleReset}
          className="btn-outline"
          style={{ padding: '10px 20px', fontSize: '11px' }}
        >
          Reset Defaults
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={handleSave}
          className="btn-primary"
          style={{ padding: '10px 24px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          {saving ? 'Saving...' : 'Save Ticker'}
        </button>
      </div>
    </div>
  );
}
