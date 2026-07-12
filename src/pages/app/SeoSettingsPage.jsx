import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DEFAULT_SETTINGS } from '../../hooks/useSettings';
import { uploadPhotosToCloudinary } from '../../lib/cloudinary';

const labelStyle = {
  display: 'block', fontFamily: 'var(--font-sans)',
  fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: '#3D3D3D', marginBottom: '7px',
};
const hintStyle = {
  fontFamily: 'var(--font-sans)', fontSize: '11px',
  color: '#A3A3A3', marginTop: '5px', lineHeight: 1.5,
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
const taStyle = { ...inputStyle, resize: 'vertical', lineHeight: 1.6, minHeight: '80px' };
const focus = (e) => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; };
const blur  = (e) => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; };

function Section({ title, icon, children }) {
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '28px 32px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--color-border-soft)' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(232,137,12,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#E8890C', flexShrink: 0 }}>
          {icon}
        </div>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#0A0A0A', margin: 0 }}>
          {title}
        </h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  );
}

export default function SeoSettingsPage() {
  const { user, canWrite } = useAuth();
  const { addToast } = useToast();
  const { refetch } = useSettings();
  const isWritable = canWrite ? canWrite('seo') : true;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    seo_keywords: DEFAULT_SETTINGS.seo_keywords,
    seo_og_image: DEFAULT_SETTINGS.seo_og_image,
    seo_favicon_url: DEFAULT_SETTINGS.seo_favicon_url,
    seo_google_verification: DEFAULT_SETTINGS.seo_google_verification,
    seo_home_title: DEFAULT_SETTINGS.seo_home_title,
    seo_home_description: DEFAULT_SETTINGS.seo_home_description,
    seo_about_title: DEFAULT_SETTINGS.seo_about_title,
    seo_about_description: DEFAULT_SETTINGS.seo_about_description,
    seo_contact_title: DEFAULT_SETTINGS.seo_contact_title,
    seo_contact_description: DEFAULT_SETTINGS.seo_contact_description,
  });
  const [faviconUploading, setFaviconUploading] = useState(false);
  const [dragOverFavicon, setDragOverFavicon] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('designs')
          .select('description')
          .eq('design_no', 'SYSTEM_SETTINGS')
          .maybeSingle();
        const parsed = data?.description ? JSON.parse(data.description) : {};
        setForm(prev => ({ ...prev, ...Object.fromEntries(Object.keys(prev).map(k => [k, parsed[k] ?? DEFAULT_SETTINGS[k]])) }));
      } catch { /* use defaults */ } finally { setLoading(false); }
    }
    load();
  }, []);

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

  const handleFaviconUpload = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      addToast({ type: 'error', message: 'Please select an image file (PNG, JPG, SVG, ICO)' });
      return;
    }
    setFaviconUploading(true);
    try {
      const res = await uploadPhotosToCloudinary([file]);
      if (res && res.length > 0) {
        setForm(prev => ({ ...prev, seo_favicon_url: res[0].secure_url }));
        addToast({ type: 'success', message: 'Favicon uploaded — click Save to apply' });
      }
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Favicon upload failed' });
    } finally {
      setFaviconUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data, error: checkError } = await supabase
        .from('designs').select('id, description').eq('design_no', 'SYSTEM_SETTINGS').maybeSingle();
      if (checkError) throw checkError;

      const existing = data?.description ? JSON.parse(data.description) : {};
      const merged = { ...existing, ...form };

      if (data?.id) {
        const { error } = await supabase.from('designs').update({ description: JSON.stringify(merged) }).eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('designs').insert({
          design_no: 'SYSTEM_SETTINGS', fabric_name: 'System settings',
          description: JSON.stringify(merged), rate: 1.00, tag: 'system',
          office_folder: 0, bag_folder: 0, extra_folder: 0,
          is_public: true, is_featured: false, created_by: user.id,
        });
        if (error) throw error;
      }

      addToast({ type: 'success', message: 'SEO settings saved!' });
      refetch?.();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save SEO settings' });
    } finally { setSaving(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
        <div style={{ width: '36px', height: '36px', border: '2.5px solid #E5E0D8', borderTopColor: '#E8890C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--color-bg-soft)' }}>
      <div className="admin-page-inner" style={{ maxWidth: '800px' }}>
        
        {/* Page Header */}
        <div className="animate-fade-up" style={{ marginBottom: '36px' }}>
          <div>
            <span className="pill-label" style={{ marginBottom: '14px', display: 'inline-flex' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8890C', display: 'inline-block' }} />
              Metadata
            </span>
            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
              fontWeight: 400, color: '#0A0A0A',
              lineHeight: 1.15, marginTop: '10px',
            }}>
              SEO Settings
            </h1>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', marginTop: '6px' }}>
              Optimize page titles, descriptions, and keywords for search engine discovery
            </p>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSave} className="animate-fade-up flex flex-col gap-6">
          {!isWritable && (
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#B45309', background: '#FEF9EE', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A', margin: 0 }}>
              You have read-only access. You cannot edit the SEO settings.
            </p>
          )}

          {/* Global Configurations */}
          <Section title="Global Configurations" icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }>
            <Field label="Global Keywords" hint="Comma-separated tags (e.g. Surat textile, Brocades).">
              <textarea value={form.seo_keywords} onChange={set('seo_keywords')} disabled={!isWritable} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Open Graph / Shared Cover Image URL" hint="Asset displayed during WhatsApp/Social media link sharing.">
              <input type="url" value={form.seo_og_image} onChange={set('seo_og_image')} disabled={!isWritable} placeholder="https://res.cloudinary.com/thesumiro/..." style={inputStyle} onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Google Search Console verification key" hint="e.g. verification meta content value.">
              <input type="text" value={form.seo_google_verification} onChange={set('seo_google_verification')} disabled={!isWritable} placeholder="N7yk9uw7RrScjpIep5..." style={inputStyle} onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Website Favicon" hint="Upload custom favicon file.">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                {/* Current favicon preview */}
                <div style={{ flexShrink: 0 }}>
                  <p style={{ ...hintStyle, marginTop: 0, marginBottom: '6px' }}>Current</p>
                  <div style={{ width: '64px', height: '64px', borderRadius: '10px', border: '1.5px solid var(--color-border)', background: 'var(--color-bg-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img
                      src={form.seo_favicon_url || '/favicon.png'}
                      alt="Current favicon"
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                  </div>
                </div>

                {/* Upload zone */}
                {isWritable ? (
                  <div
                    onDragOver={e => { e.preventDefault(); setDragOverFavicon(true); }}
                    onDragLeave={() => setDragOverFavicon(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOverFavicon(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleFaviconUpload(file);
                    }}
                    onClick={() => document.getElementById('favicon-upload-input').click()}
                    style={{
                      flex: 1, minWidth: '200px',
                      border: `2px dashed ${dragOverFavicon ? '#E8890C' : 'var(--color-border)'}`,
                      borderRadius: '10px', padding: '20px', textAlign: 'center',
                      cursor: faviconUploading ? 'not-allowed' : 'pointer',
                      background: dragOverFavicon ? 'rgba(232,137,12,0.04)' : 'var(--color-bg-soft)',
                      transition: 'border-color 0.2s, background 0.2s',
                      opacity: faviconUploading ? 0.7 : 1,
                    }}
                  >
                    {faviconUploading ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <div style={{ width: '18px', height: '18px', border: '2px solid #E5E0D8', borderTopColor: '#E8890C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#737373' }}>Uploading…</span>
                      </div>
                    ) : (
                      <>
                        <div style={{ color: dragOverFavicon ? '#E8890C' : '#A3A3A3', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)', margin: 0 }}>
                          {dragOverFavicon ? 'Drop to upload' : 'Drag & drop or click to upload'}
                        </p>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: '#A3A3A3', marginTop: '3px' }}>
                          PNG · JPG · SVG · 512×512px recommended
                        </p>
                      </>
                    )}
                    <input
                      id="favicon-upload-input"
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/x-icon,image/webp"
                      onChange={e => { if (e.target.files?.[0]) handleFaviconUpload(e.target.files[0]); e.target.value = ''; }}
                      style={{ display: 'none' }}
                    />
                  </div>
                ) : (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#B45309', background: '#FEF9EE', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A', flex: 1 }}>
                    Favicon upload disabled in read-only mode.
                  </p>
                )}

                {/* Remove button */}
                {form.seo_favicon_url && isWritable && (
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, seo_favicon_url: '' }))}
                    style={{ padding: '8px 14px', border: '1px solid #FECACA', borderRadius: '8px', background: '#FEF2F2', color: '#EF4444', fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            </Field>
          </Section>

          {/* Homepage */}
          <Section title="Homepage" icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }>
            <Field label="Page Title" hint="Keep under 60 characters.">
              <input type="text" value={form.seo_home_title} onChange={set('seo_home_title')} disabled={!isWritable} style={inputStyle} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_home_title.length > 60 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_home_title.length}/60 characters
              </p>
            </Field>
            <Field label="Meta Description" hint="Keep between 120–160 characters.">
              <textarea value={form.seo_home_description} onChange={set('seo_home_description')} disabled={!isWritable} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_home_description.length > 160 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_home_description.length}/160 characters
              </p>
            </Field>
          </Section>

          {/* About Page */}
          <Section title="About Page" icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }>
            <Field label="Page Title" hint="Keep under 60 characters.">
              <input type="text" value={form.seo_about_title} onChange={set('seo_about_title')} disabled={!isWritable} style={inputStyle} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_about_title.length > 60 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_about_title.length}/60 characters
              </p>
            </Field>
            <Field label="Meta Description" hint="Keep between 120–160 characters.">
              <textarea value={form.seo_about_description} onChange={set('seo_about_description')} disabled={!isWritable} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_about_description.length > 160 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_about_description.length}/160 characters
              </p>
            </Field>
          </Section>

          {/* Contact Page */}
          <Section title="Contact Page" icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }>
            <Field label="Page Title" hint="Keep under 60 characters.">
              <input type="text" value={form.seo_contact_title} onChange={set('seo_contact_title')} disabled={!isWritable} style={inputStyle} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_contact_title.length > 60 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_contact_title.length}/60 characters
              </p>
            </Field>
            <Field label="Meta Description" hint="Keep between 120–160 characters.">
              <textarea value={form.seo_contact_description} onChange={set('seo_contact_description')} disabled={!isWritable} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_contact_description.length > 160 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_contact_description.length}/160 characters
              </p>
            </Field>
          </Section>

          {/* Actions */}
          {isWritable ? (
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: '40px' }}>
              <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 32px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {saving ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#FFFFFF', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    Saving…
                  </>
                ) : 'Save SEO Settings'}
              </button>
            </div>
          ) : (
            <div style={{ paddingBottom: '40px' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#B45309', background: '#FEF9EE', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A', margin: 0 }}>
                You have read-only access. You cannot modify SEO settings.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
