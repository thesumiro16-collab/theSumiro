import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DEFAULT_SETTINGS } from '../../hooks/useSettings';
import { uploadVideoToCloudinary } from '../../lib/cloudinary';

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

  const [uploadProgress, setUploadProgress] = useState({
    reel1: 0,
    reel2: 0,
    reel3: 0,
  });
  const [uploading, setUploading] = useState({
    reel1: false,
    reel2: false,
    reel3: false,
  });

  const handleVideoUpload = async (e, fieldName, progressKey) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      addToast({ type: 'error', message: 'Please select a valid video file (.mp4, etc.)' });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      addToast({ type: 'error', message: 'Reel files should be under 20MB for fast streaming.' });
      return;
    }

    setUploading(prev => ({ ...prev, [progressKey]: true }));
    setUploadProgress(prev => ({ ...prev, [progressKey]: 0 }));

    try {
      const result = await uploadVideoToCloudinary(file, (percent) => {
        setUploadProgress(prev => ({ ...prev, [progressKey]: percent }));
      });
      setForm(prev => ({ ...prev, [fieldName]: result.secure_url }));
      addToast({ type: 'success', message: 'Video uploaded successfully to Cloudinary!' });
    } catch (err) {
      console.error('Failed to upload video:', err);
      addToast({ type: 'error', message: err.message || 'Upload failed' });
    } finally {
      setUploading(prev => ({ ...prev, [progressKey]: false }));
    }
  };

  const [form, setForm] = useState({
    about_founding_year: '',
    about_story_title: '',
    about_story_p1: '',
    about_story_p2: '',
    craft_section_subtitle: '',
    craft_section_title: '',
    craft_manufacture_desc: '',
    craft_process_desc: '',
    craft_promise_desc: '',
    craft_manufacture_list: [],
    craft_process_list: [],
    craft_promise_list: [],
    instagram_reel_1: '',
    instagram_reel_2: '',
    instagram_reel_3: '',
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
          craft_section_subtitle: parsed.craft_section_subtitle ?? DEFAULT_SETTINGS.craft_section_subtitle,
          craft_section_title: parsed.craft_section_title ?? DEFAULT_SETTINGS.craft_section_title,
          craft_manufacture_desc: parsed.craft_manufacture_desc ?? DEFAULT_SETTINGS.craft_manufacture_desc,
          craft_process_desc: parsed.craft_process_desc ?? DEFAULT_SETTINGS.craft_process_desc,
          craft_promise_desc: parsed.craft_promise_desc ?? DEFAULT_SETTINGS.craft_promise_desc,
          craft_manufacture_list: parsed.craft_manufacture_list ?? DEFAULT_SETTINGS.craft_manufacture_list,
          craft_process_list: parsed.craft_process_list ?? DEFAULT_SETTINGS.craft_process_list,
          craft_promise_list: parsed.craft_promise_list ?? DEFAULT_SETTINGS.craft_promise_list,
          instagram_reel_1: parsed.instagram_reel_1 ?? DEFAULT_SETTINGS.instagram_reel_1,
          instagram_reel_2: parsed.instagram_reel_2 ?? DEFAULT_SETTINGS.instagram_reel_2,
          instagram_reel_3: parsed.instagram_reel_3 ?? DEFAULT_SETTINGS.instagram_reel_3,
        });
      } catch {
        setForm({
          about_founding_year: DEFAULT_SETTINGS.about_founding_year,
          about_story_title: DEFAULT_SETTINGS.about_story_title,
          about_story_p1: DEFAULT_SETTINGS.about_story_p1,
          about_story_p2: DEFAULT_SETTINGS.about_story_p2,
          craft_section_subtitle: DEFAULT_SETTINGS.craft_section_subtitle,
          craft_section_title: DEFAULT_SETTINGS.craft_section_title,
          craft_manufacture_desc: DEFAULT_SETTINGS.craft_manufacture_desc,
          craft_process_desc: DEFAULT_SETTINGS.craft_process_desc,
          craft_promise_desc: DEFAULT_SETTINGS.craft_promise_desc,
          craft_manufacture_list: DEFAULT_SETTINGS.craft_manufacture_list,
          craft_process_list: DEFAULT_SETTINGS.craft_process_list,
          craft_promise_list: DEFAULT_SETTINGS.craft_promise_list,
          instagram_reel_1: DEFAULT_SETTINGS.instagram_reel_1,
          instagram_reel_2: DEFAULT_SETTINGS.instagram_reel_2,
          instagram_reel_3: DEFAULT_SETTINGS.instagram_reel_3,
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
        craft_section_subtitle: DEFAULT_SETTINGS.craft_section_subtitle,
        craft_section_title: DEFAULT_SETTINGS.craft_section_title,
        craft_manufacture_desc: DEFAULT_SETTINGS.craft_manufacture_desc,
        craft_process_desc: DEFAULT_SETTINGS.craft_process_desc,
        craft_promise_desc: DEFAULT_SETTINGS.craft_promise_desc,
        craft_manufacture_list: DEFAULT_SETTINGS.craft_manufacture_list,
        craft_process_list: DEFAULT_SETTINGS.craft_process_list,
        craft_promise_list: DEFAULT_SETTINGS.craft_promise_list,
        instagram_reel_1: DEFAULT_SETTINGS.instagram_reel_1,
        instagram_reel_2: DEFAULT_SETTINGS.instagram_reel_2,
        instagram_reel_3: DEFAULT_SETTINGS.instagram_reel_3,
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
        craft_section_subtitle: form.craft_section_subtitle.trim(),
        craft_section_title: form.craft_section_title.trim(),
        craft_manufacture_desc: form.craft_manufacture_desc.trim(),
        craft_process_desc: form.craft_process_desc.trim(),
        craft_promise_desc: form.craft_promise_desc.trim(),
        craft_manufacture_list: form.craft_manufacture_list,
        craft_process_list: form.craft_process_list,
        craft_promise_list: form.craft_promise_list,
        instagram_reel_1: form.instagram_reel_1.trim(),
        instagram_reel_2: form.instagram_reel_2.trim(),
        instagram_reel_3: form.instagram_reel_3.trim(),
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full">
      {/* Left Column: Form Editor */}
      <form onSubmit={handleSave} className="lg:col-span-6 flex flex-col gap-6 order-2 lg:order-1">
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
            rows={6}
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
            rows={6}
            value={form.about_story_p2}
            onChange={handleChange}
            disabled={!isWritable}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        {/* Divider: Craft & Process Section */}
        <div style={{ marginTop: '16px', borderTop: '1.5px solid var(--color-border)', paddingTop: '20px', marginBottom: '4px' }}>
          <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 800, color: '#E8890C', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Our Craft & Process (Home Page Section)
          </h4>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', marginTop: '4px', marginBottom: 0 }}>
            Edit the section header and tabbed overview descriptions shown on the main landing page.
          </p>
        </div>

        {/* Craft Section Subtitle */}
        <div>
          <label htmlFor="craft_section_subtitle" style={labelStyle}>Section Subtitle</label>
          <input
            id="craft_section_subtitle"
            name="craft_section_subtitle"
            type="text"
            value={form.craft_section_subtitle}
            onChange={handleChange}
            disabled={!isWritable}
            placeholder="e.g. Our Craft & Process"
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        {/* Craft Section Title */}
        <div>
          <label htmlFor="craft_section_title" style={labelStyle}>Section Main Title</label>
          <input
            id="craft_section_title"
            name="craft_section_title"
            type="text"
            value={form.craft_section_title}
            onChange={handleChange}
            disabled={!isWritable}
            placeholder="e.g. Woven with Intention, Crafted to Inspire"
            style={inputStyle}
            onFocus={focus}
            onBlur={blur}
          />
        </div>

        {/* Craft Manufacture Tab Description */}
        <div>
          <label htmlFor="craft_manufacture_desc" style={labelStyle}>"What We Manufacture" Description</label>
          <textarea
            id="craft_manufacture_desc"
            name="craft_manufacture_desc"
            rows={3}
            value={form.craft_manufacture_desc}
            onChange={handleChange}
            disabled={!isWritable}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={focus}
            onBlur={blur}
          />
          <ListEditor
            label="What We Manufacture — Points List"
            items={form.craft_manufacture_list}
            onChange={(val) => setForm(prev => ({ ...prev, craft_manufacture_list: val }))}
            isWritable={isWritable}
          />
        </div>

        {/* Craft Process Tab Description */}
        <div>
          <label htmlFor="craft_process_desc" style={labelStyle}>"Our Process" Description</label>
          <textarea
            id="craft_process_desc"
            name="craft_process_desc"
            rows={3}
            value={form.craft_process_desc}
            onChange={handleChange}
            disabled={!isWritable}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={focus}
            onBlur={blur}
          />
          <ListEditor
            label="Our Process — Points List"
            items={form.craft_process_list}
            onChange={(val) => setForm(prev => ({ ...prev, craft_process_list: val }))}
            isWritable={isWritable}
          />
        </div>

        {/* Craft Promise Tab Description */}
        <div>
          <label htmlFor="craft_promise_desc" style={labelStyle}>"Our Promise" Description</label>
          <textarea
            id="craft_promise_desc"
            name="craft_promise_desc"
            rows={3}
            value={form.craft_promise_desc}
            onChange={handleChange}
            disabled={!isWritable}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
            onFocus={focus}
            onBlur={blur}
          />
          <ListEditor
            label="Our Promise — Points List"
            items={form.craft_promise_list}
            onChange={(val) => setForm(prev => ({ ...prev, craft_promise_list: val }))}
            isWritable={isWritable}
          />
        </div>

        {/* Divider: Instagram Reels */}
        <div style={{ marginTop: '16px', borderTop: '1.5px solid var(--color-border)', paddingTop: '20px', marginBottom: '4px' }}>
          <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 800, color: '#E8890C', textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>
            Instagram Reels (Home Page Showcase)
          </h4>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', marginTop: '4px', marginBottom: 0 }}>
            Paste direct vertical video loops (.mp4 format) for the three Instagram Reels cards.
          </p>
        </div>

        {/* Reel 1 URL & Uploader */}
        <div>
          <label htmlFor="instagram_reel_1" style={labelStyle}>Reel 1 - Video Showcase</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <textarea
                id="instagram_reel_1"
                name="instagram_reel_1"
                rows={2}
                value={form.instagram_reel_1}
                onChange={handleChange}
                disabled={!isWritable || uploading.reel1}
                placeholder="Paste direct video URL, or raw Instagram embed blockquote code"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '42px', lineHeight: '1.4' }}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
            {isWritable && (
              <label style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 16px', background: '#FDF3E3', border: '1.5px solid #F5C97A',
                borderRadius: '8px', color: '#E8890C', fontWeight: 600,
                fontSize: '11.5px', cursor: uploading.reel1 ? 'not-allowed' : 'pointer',
                height: '42px', boxSizing: 'border-box', flexShrink: 0,
                transition: 'opacity 0.2s', opacity: uploading.reel1 ? 0.7 : 1
              }}>
                {uploading.reel1 ? 'Uploading...' : 'Upload MP4'}
                <input
                  type="file"
                  accept="video/*"
                  disabled={uploading.reel1}
                  onChange={(e) => handleVideoUpload(e, 'instagram_reel_1', 'reel1')}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          
          {/* Upload Progress Bar */}
          {uploading.reel1 && (
            <div style={{ marginTop: '8px', background: '#EAE6DF', borderRadius: '99px', height: '6px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${uploadProgress.reel1}%`, height: '100%',
                background: '#E8890C', borderRadius: '99px',
                transition: 'width 0.2s ease-out'
              }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, color: '#E8890C', position: 'absolute', right: 0, top: '-14px' }}>
                {uploadProgress.reel1}%
              </span>
            </div>
          )}

          {/* Quick Preview Link */}
          {form.instagram_reel_1 && (
            <div style={{ marginTop: '6px' }}>
              <a
                href={form.instagram_reel_1}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#E8890C',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}
              >
                📹 Preview Reel 1 Loop
              </a>
            </div>
          )}
        </div>

        {/* Reel 2 URL & Uploader */}
        <div style={{ marginTop: '20px' }}>
          <label htmlFor="instagram_reel_2" style={labelStyle}>Reel 2 - Video Showcase</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <textarea
                id="instagram_reel_2"
                name="instagram_reel_2"
                rows={2}
                value={form.instagram_reel_2}
                onChange={handleChange}
                disabled={!isWritable || uploading.reel2}
                placeholder="Paste direct video URL, or raw Instagram embed blockquote code"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '42px', lineHeight: '1.4' }}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
            {isWritable && (
              <label style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 16px', background: '#FDF3E3', border: '1.5px solid #F5C97A',
                borderRadius: '8px', color: '#E8890C', fontWeight: 600,
                fontSize: '11.5px', cursor: uploading.reel2 ? 'not-allowed' : 'pointer',
                height: '42px', boxSizing: 'border-box', flexShrink: 0,
                transition: 'opacity 0.2s', opacity: uploading.reel2 ? 0.7 : 1
              }}>
                {uploading.reel2 ? 'Uploading...' : 'Upload MP4'}
                <input
                  type="file"
                  accept="video/*"
                  disabled={uploading.reel2}
                  onChange={(e) => handleVideoUpload(e, 'instagram_reel_2', 'reel2')}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          
          {/* Upload Progress Bar */}
          {uploading.reel2 && (
            <div style={{ marginTop: '8px', background: '#EAE6DF', borderRadius: '99px', height: '6px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${uploadProgress.reel2}%`, height: '100%',
                background: '#E8890C', borderRadius: '99px',
                transition: 'width 0.2s ease-out'
              }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, color: '#E8890C', position: 'absolute', right: 0, top: '-14px' }}>
                {uploadProgress.reel2}%
              </span>
            </div>
          )}

          {/* Quick Preview Link */}
          {form.instagram_reel_2 && (
            <div style={{ marginTop: '6px' }}>
              <a
                href={form.instagram_reel_2}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#E8890C',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}
              >
                📹 Preview Reel 2 Loop
              </a>
            </div>
          )}
        </div>

        {/* Reel 3 URL & Uploader */}
        <div style={{ marginTop: '20px' }}>
          <label htmlFor="instagram_reel_3" style={labelStyle}>Reel 3 - Video Showcase</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <textarea
                id="instagram_reel_3"
                name="instagram_reel_3"
                rows={2}
                value={form.instagram_reel_3}
                onChange={handleChange}
                disabled={!isWritable || uploading.reel3}
                placeholder="Paste direct video URL, or raw Instagram embed blockquote code"
                style={{ ...inputStyle, resize: 'vertical', minHeight: '42px', lineHeight: '1.4' }}
                onFocus={focus}
                onBlur={blur}
              />
            </div>
            {isWritable && (
              <label style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: '10px 16px', background: '#FDF3E3', border: '1.5px solid #F5C97A',
                borderRadius: '8px', color: '#E8890C', fontWeight: 600,
                fontSize: '11.5px', cursor: uploading.reel3 ? 'not-allowed' : 'pointer',
                height: '42px', boxSizing: 'border-box', flexShrink: 0,
                transition: 'opacity 0.2s', opacity: uploading.reel3 ? 0.7 : 1
              }}>
                {uploading.reel3 ? 'Uploading...' : 'Upload MP4'}
                <input
                  type="file"
                  accept="video/*"
                  disabled={uploading.reel3}
                  onChange={(e) => handleVideoUpload(e, 'instagram_reel_3', 'reel3')}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>
          
          {/* Upload Progress Bar */}
          {uploading.reel3 && (
            <div style={{ marginTop: '8px', background: '#EAE6DF', borderRadius: '99px', height: '6px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${uploadProgress.reel3}%`, height: '100%',
                background: '#E8890C', borderRadius: '99px',
                transition: 'width 0.2s ease-out'
              }} />
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, color: '#E8890C', position: 'absolute', right: 0, top: '-14px' }}>
                {uploadProgress.reel3}%
              </span>
            </div>
          )}

          {/* Quick Preview Link */}
          {form.instagram_reel_3 && (
            <div style={{ marginTop: '6px' }}>
              <a
                href={form.instagram_reel_3}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#E8890C',
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px'
                }}
              >
                📹 Preview Reel 3 Loop
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        {isWritable && (
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '8px', borderTop: '1px solid var(--color-border-soft)', paddingTop: '16px' }}>
            <button type="button" onClick={handleReset} className="btn-outline" style={{ padding: '10px 20px', fontSize: '11px' }} disabled={saving || uploading.reel1 || uploading.reel2 || uploading.reel3}>
              Reset Defaults
            </button>
            <button type="submit" disabled={saving || uploading.reel1 || uploading.reel2 || uploading.reel3} className="btn-primary" style={{ padding: '10px 24px', fontSize: '11px' }}>
              {saving ? 'Saving...' : (uploading.reel1 || uploading.reel2 || uploading.reel3) ? 'Uploading Video...' : 'Save Story'}
            </button>
          </div>
        )}
      </form>

      {/* Right Column: Sticky Live Preview Panel */}
      <div className="lg:col-span-6 order-1 lg:order-2 lg:sticky lg:top-6" style={{ width: '100%' }}>
        <div style={{
          background: '#FFFFFF',
          border: '1.5px solid var(--color-border)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 4px 20px rgba(10,10,10,0.03)',
        }}>
          {/* Header Tag */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--color-border-soft)', paddingBottom: '14px' }}>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#E8890C',
              background: '#FDF3E3',
              border: '1px solid #F5C97A',
              padding: '3px 10px',
              borderRadius: '99px',
            }}>
              Live Preview
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3' }}>
              Matches Public About Page
            </span>
          </div>

          {/* Hero Section Title Sample */}
          <div style={{ textAlign: 'center', padding: '20px 10px', background: '#F7F5F1', borderRadius: '12px', marginBottom: '24px', border: '1px solid #EDE9E3' }}>
            <span className="pill-label" style={{ fontSize: '9px', marginBottom: '8px', display: 'inline-block' }}>Company Hero Block</span>
            <h3 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '20px',
              fontWeight: 400,
              color: '#0A0A0A',
              margin: 0,
            }}>
              Crafting Fabrics <span style={{ fontStyle: 'italic', color: '#E8890C' }}>Since {form.about_founding_year || '…'}</span>
            </h3>
          </div>

          {/* Body Story Sample */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
            <span className="pill-label" style={{ fontSize: '9px', alignSelf: 'flex-start' }}>Our Story Content</span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '22px',
              fontWeight: 400,
              color: '#0A0A0A',
              margin: 0,
              lineHeight: 1.25,
            }}>
              {form.about_story_title || "Rooted in Surat's Textile Heritage"}
            </h2>
            <div className="accent-line" style={{ width: '40px', height: '2px', background: '#E8890C', margin: '0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '4px' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#3D3D3D', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                {form.about_story_p1 || "Paragraph 1 story content will display here..."}
              </p>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>
                {form.about_story_p2 || "Paragraph 2 story content will display here..."}
              </p>
            </div>
          </div>

          {/* Home Page Craft Showcase Preview */}
          <div style={{ marginTop: '28px', borderTop: '1.5px dashed var(--color-border-soft)', paddingTop: '20px', textAlign: 'left' }}>
            <span className="pill-label" style={{ fontSize: '9px', marginBottom: '10px', display: 'inline-block' }}>Craft & Process (Home Page)</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, color: '#E8890C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {form.craft_section_subtitle || 'Our Craft & Process'}
              </span>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 400, color: '#0A0A0A', margin: 0, lineHeight: 1.25 }}>
                {form.craft_section_title || 'Woven with Intention, Crafted to Inspire'}
              </h4>

              {/* Sample Tab Preview Display */}
              <div style={{
                background: '#F7F5F1',
                border: '1.5px solid #E5E0D8',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #EDEAE4', paddingBottom: '6px' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, color: '#E8890C', textTransform: 'uppercase' }}>
                    📖 Manufacture Overview
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#736F66', lineHeight: 1.6, margin: 0 }}>
                  {form.craft_manufacture_desc || 'What We Manufacture description text...'}
                </p>
                {form.craft_manufacture_list && form.craft_manufacture_list.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                    {form.craft_manufacture_list.map((item, idx) => (
                      <span key={idx} style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#3D3D3D' }}>
                        — {item}
                      </span>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #EDEAE4', paddingBottom: '6px', marginTop: '4px' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, color: '#E8890C', textTransform: 'uppercase' }}>
                    ⚙️ Process Overview
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#736F66', lineHeight: 1.6, margin: 0 }}>
                  {form.craft_process_desc || 'Our Process timeline description text...'}
                </p>
                {form.craft_process_list && form.craft_process_list.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                    {form.craft_process_list.map((item, idx) => (
                      <span key={idx} style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#3D3D3D' }}>
                        {idx + 1}. {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ListEditor({ label, items, onChange, isWritable }) {
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (!newItem.trim()) return;
    onChange([...(items || []), newItem.trim()]);
    setNewItem('');
  };

  const handleRemove = (index) => {
    const next = (items || []).filter((_, idx) => idx !== index);
    onChange(next);
  };

  const handleItemChange = (index, value) => {
    const next = [...(items || [])];
    next[index] = value;
    onChange(next);
  };

  const move = (index, direction) => {
    const currentItems = items || [];
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === currentItems.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...currentItems];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onChange(next);
  };

  const currentItems = items || [];

  return (
    <div style={{ marginTop: '14px', background: '#FDFBF7', border: '1.5px solid #EDE9E3', borderRadius: '10px', padding: '16px' }}>
      <label style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 850, color: '#3D3D3D', letterSpacing: '0.08em', marginBottom: '12px', textTransform: 'uppercase' }}>
        {label}
      </label>
      
      {/* Existing Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {currentItems.map((item, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', width: '18px', flexShrink: 0 }}>
              {index + 1}.
            </span>
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(index, e.target.value)}
              disabled={!isWritable}
              style={{
                flex: 1,
                background: '#FFFFFF',
                border: '1.5px solid #EDE9E3',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
              }}
            />
            {isWritable && (
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => move(index, 'up')}
                  disabled={index === 0}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #EDE9E3', background: '#FFFFFF', fontSize: '10px', cursor: index === 0 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === 0 ? 0.4 : 1 }}
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 'down')}
                  disabled={index === currentItems.length - 1}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid #EDE9E3', background: '#FFFFFF', fontSize: '10px', cursor: index === currentItems.length - 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: index === currentItems.length - 1 ? 0.4 : 1 }}
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', border: '1px solid rgba(220,38,38,0.2)', background: 'rgba(220,38,38,0.05)', color: '#DC2626', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}
        {currentItems.length === 0 && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#8C8C8C', fontStyle: 'italic', margin: '4px 0' }}>
            No points added yet. Click "+ Add" below to insert your first item.
          </p>
        )}
      </div>

      {/* Add New Item */}
      {isWritable && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px', borderTop: '1px dashed #EDE9E3', paddingTop: '12px' }}>
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add new point..."
            style={{
              flex: 1,
              background: '#FFFFFF',
              border: '1.5px solid #EDE9E3',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12.5px',
              fontFamily: 'var(--font-sans)',
              outline: 'none',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAdd}
            style={{
              padding: '0 16px',
              background: '#E8890C',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}
