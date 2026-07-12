import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { DEFAULT_SETTINGS } from '../../hooks/useSettings';
import { uploadPhotosToCloudinary, uploadVideoToCloudinary } from '../../lib/cloudinary';

const miniInput = {
  width: '100%', boxSizing: 'border-box',
  background: '#FFFFFF',
  border: '1px solid var(--color-border)',
  borderRadius: '6px',
  padding: '6px 10px',
  fontFamily: 'var(--font-sans)',
  fontSize: '12px',
  color: 'var(--color-text-primary)',
  outline: 'none',
};

function SlideCard({ index, imgSrc, title, subtitle, tag, isNew, uploading, uploadText, onChangeTitle, onChangeSubtitle, onChangeTag, onRemove, disabled }) {
  return (
    <div style={{
      display: 'flex', gap: '12px', padding: '12px',
      border: isNew ? '1.5px dashed #E8890C' : '1px solid var(--color-border)',
      borderRadius: '10px',
      background: isNew ? '#FFF8EE' : 'var(--color-bg-soft)',
      alignItems: 'flex-start',
    }}>
      {/* Thumbnail */}
      <div style={{ flexShrink: 0, width: '76px', height: '76px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${isNew ? '#F5C97A' : 'var(--color-border)'}`, position: 'relative', background: '#F7F5F1' }}>
        <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', bottom: '3px', left: '3px', background: isNew ? 'rgba(232,137,12,0.85)' : 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px' }}>
          {isNew ? 'NEW' : index}
        </div>
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#E8890C' }}>
            {uploadText}
          </div>
        )}
      </div>

      {/* Editable fields */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <input
          type="text"
          placeholder="Tag (e.g. Signature Series)"
          value={tag}
          onChange={e => onChangeTag(e.target.value)}
          disabled={disabled}
          style={miniInput}
        />
        <input
          type="text"
          placeholder="Title (e.g. Silk Brocade Collection)"
          value={title}
          onChange={e => onChangeTitle(e.target.value)}
          disabled={disabled}
          style={{ ...miniInput, fontWeight: 600 }}
        />
        <input
          type="text"
          placeholder="Subtitle (e.g. Woven with gold & silver zari threads)"
          value={subtitle}
          onChange={e => onChangeSubtitle(e.target.value)}
          disabled={disabled}
          style={miniInput}
        />
      </div>

      {/* Remove */}
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          style={{ flexShrink: 0, width: '26px', height: '26px', borderRadius: '50%', background: '#FEE2E2', color: '#EF4444', border: '1px solid #FECACA', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', marginTop: '2px' }}
          aria-label="Remove slide"
        >
          ×
        </button>
      )}
    </div>
  );
}

export default function EnquiryEditor({ onSuccess }) {
  const { user, canWrite } = useAuth();
  const { addToast } = useToast();
  const isWritable = canWrite ? canWrite('settings') : true;
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Home Page custom video and thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');
  
  const [dragOverThumbnail, setDragOverThumbnail] = useState(false);
  const [dragOverVideo, setDragOverVideo] = useState(false);
  
  // Collection slides state
  const [collectionImages, setCollectionImages] = useState([]); // existing Cloudinary URLs
  const [newCollectionFiles, setNewCollectionFiles] = useState([]);
  const [newCollectionPreviews, setNewCollectionPreviews] = useState([]);
  const [dragOverCollection, setDragOverCollection] = useState(false);
  const [collectionUploadProgress, setCollectionUploadProgress] = useState(null);
  
  // Progress states
  const [thumbnailProgress, setThumbnailProgress] = useState(null);
  const [videoProgress, setVideoProgress] = useState(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('designs')
          .select('description')
          .eq('design_no', 'SYSTEM_SETTINGS')
          .maybeSingle();

        if (error) throw error;

        if (data?.description) {
          try {
            const parsed = JSON.parse(data.description);
            const mergedSettings = {
              ...DEFAULT_SETTINGS,
              ...parsed,
            };
            setForm(mergedSettings);

            if (mergedSettings.home_video_thumbnail) {
              setThumbnailPreview(mergedSettings.home_video_thumbnail);
            }
            if (mergedSettings.home_video_url) {
              setVideoPreview(mergedSettings.home_video_url);
            }
            if (Array.isArray(mergedSettings.collection_slides)) {
              // Normalize: handle old string[] format and new object[] format
              const normalized = mergedSettings.collection_slides.map(item =>
                typeof item === 'string'
                  ? { image: item, title: '', subtitle: '', tag: '' }
                  : item
              );
              setCollectionImages(normalized);
            }
          } catch {
            setForm(DEFAULT_SETTINGS);
          }
        } else {
          setForm(DEFAULT_SETTINGS);
        }
      } catch {
        addToast({ type: 'error', message: 'Failed to load settings. Using defaults.' });
        setForm(DEFAULT_SETTINGS);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [addToast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        addToast({ type: 'error', message: 'Please select an image file for the thumbnail.' });
        return;
      }
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        addToast({ type: 'error', message: 'Please select a video file (MP4 or WebM).' });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview('');
    setForm(prev => ({ ...prev, home_video_thumbnail: '' }));
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview('');
    setForm(prev => ({ ...prev, home_video_url: '' }));
  };

  const addCollectionFiles = (files) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) return;
    setNewCollectionFiles(prev => [...prev, ...imageFiles]);
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCollectionPreviews(prev => [...prev, { file, url: reader.result, title: '', subtitle: '', tag: '' }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleCollectionFilesChange = (e) => {
    addCollectionFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const removeExistingCollectionImage = (idx) => {
    setCollectionImages(prev => prev.filter((_, i) => i !== idx));
  };

  const removeNewCollectionFile = (idx) => {
    setNewCollectionFiles(prev => prev.filter((_, i) => i !== idx));
    setNewCollectionPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const updateCollectionImageField = (idx, field, value) => {
    setCollectionImages(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const updateNewCollectionField = (idx, field, value) => {
    setNewCollectionPreviews(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleReset = () => {
    if (window.confirm('Reset to default contact details and clear custom home video?')) {
      setForm(DEFAULT_SETTINGS);
      setThumbnailFile(null);
      setThumbnailPreview('');
      setVideoFile(null);
      setVideoPreview('');
      setCollectionImages([]);
      setNewCollectionFiles([]);
      setNewCollectionPreviews([]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.enquiry_phone.trim()) {
      addToast({ type: 'error', message: 'Primary WhatsApp number is required!' });
      return;
    }
    if (!form.enquiry_email.trim()) {
      addToast({ type: 'error', message: 'Primary email address is required!' });
      return;
    }

    setSaving(true);
    try {
      // 1. Upload thumbnail image to Cloudinary if selected
      let finalThumbnailUrl = form.home_video_thumbnail;
      if (thumbnailFile) {
        setThumbnailProgress('Uploading...');
        try {
          const res = await uploadPhotosToCloudinary([thumbnailFile]);
          if (res && res.length > 0) {
            finalThumbnailUrl = res[0].secure_url;
          }
        } catch (uploadErr) {
          throw new Error(`Thumbnail upload failed: ${uploadErr.message}`, { cause: uploadErr });
        } finally {
          setThumbnailProgress(null);
        }
      }

      // 2. Upload video file if selected
      let finalVideoUrl = form.home_video_url;
      if (videoFile) {
        setVideoProgress(0);
        try {
          const res = await uploadVideoToCloudinary(videoFile, (percent) => {
            setVideoProgress(percent);
          });
          if (res && res.secure_url) {
            finalVideoUrl = res.secure_url;
          }
        } catch (uploadErr) {
          throw new Error(`Video upload failed: ${uploadErr.message}`, { cause: uploadErr });
        } finally {
          setVideoProgress(null);
        }
      }

      // 3. Upload new collection slide images to Cloudinary
      let finalCollectionImages = [...collectionImages];
      if (newCollectionFiles.length > 0) {
        setCollectionUploadProgress({ current: 0, total: newCollectionFiles.length });
        try {
          const uploaded = await uploadPhotosToCloudinary(newCollectionFiles, (current, total) => {
            setCollectionUploadProgress({ current, total });
          });
          finalCollectionImages = [
            ...finalCollectionImages,
            ...uploaded.map((u, i) => ({
              image: u.secure_url,
              title: newCollectionPreviews[i]?.title || '',
              subtitle: newCollectionPreviews[i]?.subtitle || '',
              tag: newCollectionPreviews[i]?.tag || '',
            })),
          ];
          setCollectionImages(finalCollectionImages);
          setNewCollectionFiles([]);
          setNewCollectionPreviews([]);
        } catch (uploadErr) {
          throw new Error(`Collection images upload failed: ${uploadErr.message}`, { cause: uploadErr });
        } finally {
          setCollectionUploadProgress(null);
        }
      }

      const { data, error: checkError } = await supabase
        .from('designs')
        .select('id')
        .eq('design_no', 'SYSTEM_SETTINGS')
        .maybeSingle();

      if (checkError) throw checkError;

      const settingsPayload = {
        ...form, // preserve any other settings (About story, etc.) we don't manage here
        enquiry_phone: form.enquiry_phone.trim(),
        alt_enquiry_phone: form.alt_enquiry_phone.trim(),
        enquiry_email: form.enquiry_email.trim(),
        home_video_url: finalVideoUrl,
        home_video_thumbnail: finalThumbnailUrl,
        collection_slides: finalCollectionImages,
        maintenance_mode: !!form.maintenance_mode,
      };

      if (data?.id) {
        const { error: updateError } = await supabase
          .from('designs')
          .update({ description: JSON.stringify(settingsPayload) })
          .eq('id', data.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('designs')
          .insert({
            design_no: 'SYSTEM_SETTINGS',
            fabric_name: 'System settings',
            description: JSON.stringify(settingsPayload),
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

      setForm(prev => ({
        ...prev,
        home_video_thumbnail: finalThumbnailUrl,
        home_video_url: finalVideoUrl,
      }));
      setThumbnailFile(null);
      setVideoFile(null);

      addToast({ type: 'success', message: 'Settings saved successfully!' });
      onSuccess?.();
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
        <div style={{
          width: '32px', height: '32px',
          border: '2px solid var(--color-border)',
          borderTopColor: 'var(--color-accent)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      
      {/* ── Section: Contacts & Enquiry ─────────────────── */}
      <div className="flex flex-col gap-5">
        <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-primary)' }}>
          Contact & Enquiry Directory
        </h4>
        
        {/* Primary WhatsApp / Enquiry Number */}
        <div className="space-y-2">
          <label htmlFor="settings-enquiry-phone" className="form-label">
            Primary WhatsApp / Enquiry Number *
          </label>
          <input
            id="settings-enquiry-phone"
            name="enquiry_phone"
            type="text"
            placeholder="e.g. +91 79908 63721"
            value={form.enquiry_phone}
            onChange={handleChange}
            disabled={!isWritable}
            className="form-input"
            required
          />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', marginTop: '6px' }}>
            This number is formatted for instant WhatsApp API click-to-chat integrations.
          </p>
        </div>

        {/* Alternative Phone Number */}
        <div className="space-y-2">
          <label htmlFor="settings-alt-phone" className="form-label">
            Alternative Helpline Number
          </label>
          <input
            id="settings-alt-phone"
            name="alt_enquiry_phone"
            type="text"
            placeholder="e.g. +91 99254 39839"
            value={form.alt_enquiry_phone}
            onChange={handleChange}
            disabled={!isWritable}
            className="form-input"
          />
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', marginTop: '6px' }}>
            Alternative helper number displayed on support headers and footers.
          </p>
        </div>

        {/* Enquiry Email */}
        <div className="space-y-2">
          <label htmlFor="settings-email" className="form-label">
            Primary Enquiry Email *
          </label>
          <input
            id="settings-email"
            name="enquiry_email"
            type="email"
            placeholder="e.g. info@sumiro.in"
            value={form.enquiry_email}
            onChange={handleChange}
            disabled={!isWritable}
            className="form-input"
            required
          />
        </div>
      </div>

      <hr style={{ borderTop: '1px solid var(--color-border-soft)', margin: '8px 0' }} />

      {/* ── Section: Campaign Video & Media ─────────────── */}
      <div className="flex flex-col gap-5">
        <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-primary)' }}>
          Campaign Video Showcase
        </h4>

        {/* Video Thumbnail (Poster) */}
        <div className="space-y-2">
          <label className="form-label">Video Thumbnail / Poster Cover</label>
          <div
            onDragOver={isWritable ? e => { e.preventDefault(); setDragOverThumbnail(true); } : undefined}
            onDragLeave={isWritable ? () => setDragOverThumbnail(false) : undefined}
            onDrop={isWritable ? (e) => {
              e.preventDefault();
              setDragOverThumbnail(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('image/')) {
                setThumbnailFile(file);
                setThumbnailPreview(URL.createObjectURL(file));
              }
            } : undefined}
            style={{
              border: `2px dashed ${dragOverThumbnail ? '#E8890C' : '#E5E0D8'}`,
              borderRadius: '10px', padding: '24px', textAlign: 'center',
              cursor: isWritable ? 'pointer' : 'default',
              background: dragOverThumbnail ? 'rgba(232,137,12,0.04)' : 'var(--color-bg-soft)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onClick={isWritable ? () => document.getElementById('thumbnail-file-input').click() : undefined}
          >
            {thumbnailPreview ? (
              <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <img
                  src={thumbnailPreview}
                  alt="Video Poster Preview"
                  style={{ maxHeight: '144px', borderRadius: '6px', border: '1px solid var(--color-border)', display: 'block', objectFit: 'contain' }}
                />
                {thumbnailProgress && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#E8890C' }}>
                    {thumbnailProgress}
                  </div>
                )}
                {isWritable && (
                  <button
                    type="button"
                    onClick={handleRemoveThumbnail}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#EF4444', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div style={{ color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'center' }}>
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Drag & drop cover image here
                </p>
                {isWritable ? (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    or <span style={{ color: '#E8890C', fontWeight: 700 }}>browse files</span> · JPEG / PNG / WEBP base formats
                  </p>
                ) : (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>
                    Read-only access
                  </p>
                )}
              </div>
            )}
            <input
              id="thumbnail-file-input"
              type="file"
              accept="image/*"
              onChange={handleThumbnailChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        {/* Video Showcase Asset Uploader */}
        <div className="space-y-2">
          <label className="form-label">Campaign Video File</label>
          <div
            onDragOver={isWritable ? e => { e.preventDefault(); setDragOverVideo(true); } : undefined}
            onDragLeave={isWritable ? () => setDragOverVideo(false) : undefined}
            onDrop={isWritable ? (e) => {
              e.preventDefault();
              setDragOverVideo(false);
              const file = e.dataTransfer.files?.[0];
              if (file && file.type.startsWith('video/')) {
                setVideoFile(file);
                setVideoPreview(URL.createObjectURL(file));
              }
            } : undefined}
            style={{
              border: `2px dashed ${dragOverVideo ? '#E8890C' : '#E5E0D8'}`,
              borderRadius: '10px', padding: '24px', textAlign: 'center',
              cursor: isWritable ? 'pointer' : 'default',
              background: dragOverVideo ? 'rgba(232,137,12,0.04)' : 'var(--color-bg-soft)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
            onClick={isWritable ? () => document.getElementById('video-file-input').click() : undefined}
          >
            {videoPreview ? (
              <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                <video
                  src={videoPreview}
                  controls
                  style={{ maxHeight: '144px', borderRadius: '6px', border: '1px solid var(--color-border)', display: 'block' }}
                />
                {videoProgress !== null && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '16px', fontSize: '10px', fontWeight: 700, color: '#E8890C' }}>
                    <div className="w-[100px] h-1.5 bg-[#EDE9E3] rounded-full overflow-hidden">
                      <div style={{ background: '#E8890C', height: '100%', transition: 'width 0.2s', width: `${videoProgress}%` }} />
                    </div>
                    <span>Uploading {videoProgress}%</span>
                  </div>
                )}
                {isWritable && (
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    style={{ position: 'absolute', top: '-8px', right: '-8px', width: '24px', height: '24px', borderRadius: '50%', background: '#EF4444', color: '#FFFFFF', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}
                  >
                    ×
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div style={{ color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'center' }}>
                  <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  Drag & drop video file here
                </p>
                {isWritable ? (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    or <span style={{ color: '#E8890C', fontWeight: 700 }}>browse files</span> · MP4 / WebM (max 50MB)
                  </p>
                ) : (
                  <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: '#DC2626', fontWeight: 600 }}>
                    Read-only access
                  </p>
                )}
              </div>
            )}
            <input
              id="video-file-input"
              type="file"
              accept="video/mp4,video/webm"
              onChange={handleVideoChange}
              style={{ display: 'none' }}
            />
          </div>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)' }}>
            Direct uploads will store the video securely on Cloudinary and host it locally on the homepage.
          </p>
        </div>
      </div>

      <hr style={{ borderTop: '1px solid var(--color-border-soft)', margin: '8px 0' }} />

      {/* ── Section: Collection Slide Images ─────────── */}
      <div className="flex flex-col gap-5">
        <div>
          <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
            Collection Slide Images
          </h4>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3' }}>
            Upload photos for the homepage slider. Edit the tag, title, and subtitle shown on each slide.
          </p>
        </div>

        {/* Slide cards — existing saved */}
        {collectionImages.map((slide, idx) => (
          <SlideCard
            key={`saved-${idx}`}
            index={idx + 1}
            imgSrc={slide.image}
            title={slide.title}
            subtitle={slide.subtitle}
            tag={slide.tag}
            isNew={false}
            uploading={false}
            disabled={!isWritable}
            onChangeTitle={v => updateCollectionImageField(idx, 'title', v)}
            onChangeSubtitle={v => updateCollectionImageField(idx, 'subtitle', v)}
            onChangeTag={v => updateCollectionImageField(idx, 'tag', v)}
            onRemove={() => removeExistingCollectionImage(idx)}
          />
        ))}

        {/* Slide cards — queued new uploads */}
        {newCollectionPreviews.map((p, idx) => (
          <SlideCard
            key={`new-${idx}`}
            index={collectionImages.length + idx + 1}
            imgSrc={p.url}
            title={p.title}
            subtitle={p.subtitle}
            tag={p.tag}
            isNew={true}
            uploading={!!collectionUploadProgress}
            uploadText={collectionUploadProgress ? `${collectionUploadProgress.current}/${collectionUploadProgress.total}` : ''}
            disabled={!isWritable}
            onChangeTitle={v => updateNewCollectionField(idx, 'title', v)}
            onChangeSubtitle={v => updateNewCollectionField(idx, 'subtitle', v)}
            onChangeTag={v => updateNewCollectionField(idx, 'tag', v)}
            onRemove={() => removeNewCollectionFile(idx)}
          />
        ))}

        {/* Drop zone */}
        {isWritable ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragOverCollection(true); }}
            onDragLeave={() => setDragOverCollection(false)}
            onDrop={e => {
              e.preventDefault();
              setDragOverCollection(false);
              addCollectionFiles(Array.from(e.dataTransfer.files || []));
            }}
            onClick={() => document.getElementById('collection-photos-input').click()}
            style={{
              border: `2px dashed ${dragOverCollection ? '#E8890C' : '#E5E0D8'}`,
              borderRadius: '10px', padding: '20px', textAlign: 'center',
              cursor: 'pointer',
              background: dragOverCollection ? 'rgba(232,137,12,0.04)' : 'var(--color-bg-soft)',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <div style={{ color: dragOverCollection ? '#E8890C' : 'var(--color-text-muted)', display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              {dragOverCollection ? 'Drop to add slides' : 'Add more collection photos'}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '3px' }}>
              or <span style={{ color: '#E8890C', fontWeight: 700 }}>browse files</span> · select multiple · JPEG / PNG / WEBP
            </p>
            <input
              id="collection-photos-input"
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCollectionFilesChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#B45309', background: '#FEF9EE', padding: '10px 14px', borderRadius: '8px', border: '1px solid #FDE68A' }}>
            Slide management is disabled in read-only mode.
          </p>
        )}
      </div>

      <hr style={{ borderTop: '1px solid var(--color-border-soft)', margin: '8px 0' }} />

      {/* ── Section: Maintenance Mode ────────────────── */}
      <div className="flex flex-col gap-3">
        <h4 style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-text-primary)' }}>
          Site Maintenance
        </h4>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', padding: '16px',
          border: `1.5px solid ${form.maintenance_mode ? '#F5C97A' : 'var(--color-border)'}`,
          borderRadius: '10px',
          background: form.maintenance_mode ? '#FFF8EE' : 'var(--color-bg-soft)',
          transition: 'background 0.2s, border-color 0.2s',
        }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Maintenance Mode {form.maintenance_mode ? '· ON' : '· OFF'}
            </p>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', marginTop: '3px', lineHeight: 1.5 }}>
              When ON, public visitors see the maintenance page. The admin panel stays accessible.
            </p>
          </div>

          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={!!form.maintenance_mode}
            onClick={isWritable ? () => setForm(prev => ({ ...prev, maintenance_mode: !prev.maintenance_mode })) : undefined}
            disabled={!isWritable}
            style={{
              flexShrink: 0,
              width: '48px', height: '28px',
              borderRadius: '99px',
              border: 'none',
              cursor: isWritable ? 'pointer' : 'not-allowed',
              background: form.maintenance_mode ? '#E8890C' : '#D4C9B5',
              position: 'relative',
              transition: 'background 0.25s',
              opacity: isWritable ? 1 : 0.6,
            }}
            aria-label="Toggle maintenance mode"
          >
            <span style={{
              position: 'absolute', top: '3px',
              left: form.maintenance_mode ? '23px' : '3px',
              width: '22px', height: '22px',
              borderRadius: '50%', background: '#FFFFFF',
              boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
              transition: 'left 0.25s',
            }} />
          </button>
        </div>
      </div>

      {isWritable && (
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
            type="submit"
            disabled={saving}
            className="btn-primary"
            style={{ padding: '10px 24px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}
    </form>
  );
}
