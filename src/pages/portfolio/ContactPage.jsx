import { useState } from 'react';
import { validateContactForm } from '../../utils/validators';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import Seo from '../../components/ui/Seo';

export default function ContactPage() {
  const { settings } = useSettings();
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateContactForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setLoading(true);
    try {
      // Wrap in a timeout so the form never hangs forever
      const insertPromise = supabase
        .from('contact_messages')
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim()
        });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please check your connection and try again.')), 15000)
      );

      const { error } = await Promise.race([insertPromise, timeoutPromise]);

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      addToast({ type: 'success', message: "Message sent! We'll get back to you soon." });
      setForm({ name: '', email: '', phone: '', message: '' });
      setErrors({});
    } catch (err) {
      console.error('Contact form submission failed:', err);
      addToast({ type: 'error', message: err.message || 'Failed to send message. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <Seo
        title={settings.seo_contact_title || 'Contact Us'}
        description={settings.seo_contact_description}
        path="/contact"
        image={settings.seo_og_image || undefined}
      />

      {/* Page Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F7F5F1 100%)',
        padding: 'clamp(64px, 10vw, 100px) 24px',
        borderBottom: '1px solid #E5E0D8',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #D4C9B5 1px, transparent 1px)',
          backgroundSize: '28px 28px', opacity: 0.3,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <span className="pill-label">Get in Touch</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.4rem, 6vw, 4rem)',
            fontWeight: 400, color: '#0A0A0A',
            lineHeight: 1.1, letterSpacing: '-0.02em',
            marginBottom: '16px',
          }}>
            Let's <span style={{ fontStyle: 'italic', color: '#E8890C' }}>Connect</span>
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px', color: '#737373', lineHeight: 1.7,
          }}>
            Discuss custom designs, bulk purchases, or request access to our exclusive catalogue.
          </p>
        </div>
      </section>

      {/* Contact Body */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '72px 24px 96px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}>

          {/* Contact Info Panel */}
          <div style={{
            background: '#F7F5F1',
            border: '1px solid #E5E0D8',
            borderRadius: '12px',
            padding: '40px 36px',
          }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '22px', fontWeight: 500, color: '#0A0A0A',
              marginBottom: '8px',
            }}>
              Headquarters
            </h2>
            <div className="accent-line" style={{ marginBottom: '24px' }} />
            <address style={{ fontStyle: 'normal', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373', lineHeight: 1.8, marginBottom: '32px' }}>
              <strong style={{ color: '#0A0A0A', display: 'block', marginBottom: '4px' }}>Sumiro Fabric Design Factory</strong>
              34-40, HARI OM INDUSTRIAL ESTATE, SAROLI,<br />
              Kumbharia Gam, Surat, Gujarat — 395010
            </address>

            <div style={{ borderTop: '1px solid #E5E0D8', paddingTop: '28px' }}>
              <h3 style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px', fontWeight: 700,
                letterSpacing: '0.14em', textTransform: 'uppercase',
                color: '#0A0A0A', marginBottom: '18px',
              }}>
                Inquiries
              </h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '34px', height: '34px', flexShrink: 0,
                    background: '#FDF3E3', border: '1px solid #F5C97A',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#E8890C',
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <a href={`tel:${settings.enquiry_phone.replace(/[^\d+]/g, '')}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#0A0A0A', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                    onMouseLeave={e => e.currentTarget.style.color = '#0A0A0A'}
                  >{settings.enquiry_phone}</a>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '34px', height: '34px', flexShrink: 0,
                    background: '#FDF3E3', border: '1px solid #F5C97A',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#E8890C',
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <a href={`tel:${settings.alt_enquiry_phone.replace(/[^\d+]/g, '')}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#0A0A0A', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                    onMouseLeave={e => e.currentTarget.style.color = '#0A0A0A'}
                  >{settings.alt_enquiry_phone}</a>
                </li>
                <li style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{
                    width: '34px', height: '34px', flexShrink: 0,
                    background: '#FDF3E3', border: '1px solid #F5C97A',
                    borderRadius: '6px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#E8890C',
                  }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <a href={`mailto:${settings.enquiry_email}`} style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#0A0A0A', fontWeight: 500, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                    onMouseLeave={e => e.currentTarget.style.color = '#0A0A0A'}
                  >{settings.enquiry_email}</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <form
            id="contact-form"
            onSubmit={handleSubmit}
            noValidate
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E0D8',
              borderRadius: '12px',
              padding: '40px 36px',
              display: 'flex', flexDirection: 'column', gap: '20px',
            }}
          >
            <div>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px', fontWeight: 500, color: '#0A0A0A',
                marginBottom: '8px',
              }}>
                Send a Message
              </h2>
              <div className="accent-line" />
            </div>

            {/* Name */}
            <div>
              <label htmlFor="contact-name" className="form-label">Full Name *</label>
              <input
                id="contact-name"
                type="text" name="name"
                maxLength={100}
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="form-input"
                style={{ borderColor: errors.name ? '#EF4444' : undefined }}
              />
              {errors.name && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#EF4444', marginTop: '5px' }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="contact-email" className="form-label">Email Address *</label>
              <input
                id="contact-email"
                type="email" name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="form-input"
                style={{ borderColor: errors.email ? '#EF4444' : undefined }}
              />
              {errors.email && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#EF4444', marginTop: '5px' }}>{errors.email}</p>}
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="contact-phone" className="form-label">Mobile Number *</label>
              <input
                id="contact-phone"
                type="tel" name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="e.g. +91 98765 43210"
                className="form-input"
                style={{ borderColor: errors.phone ? '#EF4444' : undefined }}
              />
              {errors.phone && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#EF4444', marginTop: '5px' }}>{errors.phone}</p>}
            </div>

            {/* Message */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '7px' }}>
                <label htmlFor="contact-message" className="form-label" style={{ marginBottom: 0 }}>Message *</label>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3' }}>{form.message.length}/1000</span>
              </div>
              <textarea
                id="contact-message"
                name="message"
                rows={5} maxLength={1000}
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us about your project, requirements, or any questions..."
                className="form-input"
                style={{ resize: 'none', borderColor: errors.message ? '#EF4444' : undefined }}
              />
              {errors.message && <p style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#EF4444', marginTop: '5px' }}>{errors.message}</p>}
            </div>

            <button
              id="contact-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading ? (
                <>
                  <span style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Sending…
                </>
              ) : 'Send Message'}
            </button>
          </form>
        </div>
      </section>

      {/* Map Section */}
      <section style={{ width: '100%', borderTop: '1px solid #E5E0D8', background: '#F7F5F1', padding: '0 24px 72px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '24px', fontWeight: 500, color: '#0A0A0A',
              marginTop: '56px',
              marginBottom: '8px',
            }}>
              Find Us on the Map
            </h2>
            <div className="accent-line" style={{ width: '40px', height: '2px', background: '#E8890C', margin: '0 auto' }} />
          </div>
          <div style={{
            position: 'relative',
            width: '100%',
            height: '450px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid #E5E0D8',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}>
            <iframe
              title="Google Map"
              width="100%"
              height="100%"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              loading="lazy"
              src="https://maps.google.com/maps?q=34-40,%20HARI%20OM%20INDUSTRIAL%20ESTATE,%20SAROLI,%20Kumbharia%20Gam,%20Surat,%20Gujarat%20395010&t=&z=15&ie=UTF8&iwloc=&output=embed"
              style={{ border: 0 }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
