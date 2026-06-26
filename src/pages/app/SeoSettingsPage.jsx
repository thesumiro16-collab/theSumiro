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
  const { user } = useAuth();
  const { addToast } = useToast();
  const { refetch } = useSettings();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    seo_keywords: DEFAULT_SETTINGS.seo_keywords,
    seo_og_image: DEFAULT_SETTINGS.seo_og_image,
    seo_google_verification: DEFAULT_SETTINGS.seo_google_verification,
    seo_home_title: DEFAULT_SETTINGS.seo_home_title,
    seo_home_description: DEFAULT_SETTINGS.seo_home_description,
    seo_about_title: DEFAULT_SETTINGS.seo_about_title,
    seo_about_description: DEFAULT_SETTINGS.seo_about_description,
    seo_contact_title: DEFAULT_SETTINGS.seo_contact_title,
    seo_contact_description: DEFAULT_SETTINGS.seo_contact_description,
  });

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
      <div className="admin-page-inner">

        {/* Page Header */}
        <div className="animate-fade-up" style={{ marginBottom: '36px' }}>
          <span className="pill-label" style={{ marginBottom: '14px', display: 'inline-flex' }}>
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            SEO
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: '#0A0A0A', lineHeight: 1.15, marginTop: '10px' }}>
            SEO Settings
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', marginTop: '6px' }}>
            Manage title, description, keywords and social sharing tags for each page
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>

          {/* Global SEO */}
          <Section title="Global SEO" icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }>
            <Field label="Global Keywords" hint="Comma-separated keywords used across all pages. Include fabric types, materials, location.">
              <textarea value={form.seo_keywords} onChange={set('seo_keywords')} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
            </Field>
            <Field label="Default OG / Social Share Image URL" hint="Image shown when someone shares your site on WhatsApp, Instagram, LinkedIn. Recommended: 1200×630px. Upload to Cloudinary and paste the URL here.">
              <input type="url" value={form.seo_og_image} onChange={set('seo_og_image')} placeholder="https://res.cloudinary.com/thesumiro/..." style={inputStyle} onFocus={focus} onBlur={blur} />
              {form.seo_og_image && (
                <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', maxWidth: '300px' }}>
                  <img src={form.seo_og_image} alt="OG preview" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                </div>
              )}
            </Field>
            <Field label="Google Search Console Verification Code" hint="The content value from your Google site verification meta tag. Found in Google Search Console → Settings → Ownership verification.">
              <input type="text" value={form.seo_google_verification} onChange={set('seo_google_verification')} placeholder="N7yk9uw7RrScjpIep5..." style={inputStyle} onFocus={focus} onBlur={blur} />
            </Field>
          </Section>

          {/* Home Page */}
          <Section title="Home Page" icon={
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          }>
            <Field label="Page Title" hint="Shown in browser tab and Google search results. Keep under 60 characters.">
              <input type="text" value={form.seo_home_title} onChange={set('seo_home_title')} style={inputStyle} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_home_title.length > 60 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_home_title.length}/60 characters
              </p>
            </Field>
            <Field label="Meta Description" hint="Shown under your title in Google search results. Keep between 120–160 characters.">
              <textarea value={form.seo_home_description} onChange={set('seo_home_description')} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
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
              <input type="text" value={form.seo_about_title} onChange={set('seo_about_title')} style={inputStyle} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_about_title.length > 60 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_about_title.length}/60 characters
              </p>
            </Field>
            <Field label="Meta Description" hint="Keep between 120–160 characters.">
              <textarea value={form.seo_about_description} onChange={set('seo_about_description')} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
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
              <input type="text" value={form.seo_contact_title} onChange={set('seo_contact_title')} style={inputStyle} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_contact_title.length > 60 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_contact_title.length}/60 characters
              </p>
            </Field>
            <Field label="Meta Description" hint="Keep between 120–160 characters.">
              <textarea value={form.seo_contact_description} onChange={set('seo_contact_description')} style={taStyle} rows={3} onFocus={focus} onBlur={blur} />
              <p style={{ ...hintStyle, color: form.seo_contact_description.length > 160 ? '#DC2626' : '#A3A3A3' }}>
                {form.seo_contact_description.length}/160 characters
              </p>
            </Field>
          </Section>

          {/* Actions */}
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
        </form>
      </div>
    </div>
  );
}
