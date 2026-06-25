import { Link } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings';

const socialLinks = [
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@thesumiro',
    href: 'https://www.instagram.com/thesumiro',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'facebook',
    label: 'Facebook',
    handle: 'The Sumiro',
    href: 'https://www.facebook.com/thesumiro',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
];

function SocialIconBtn({ link }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={link.label}
      id={`footer-social-${link.id}`}
      style={{
        width: '40px', height: '40px',
        borderRadius: '50%',
        border: '1.5px solid var(--color-border)',
        background: '#FFFFFF',
        color: 'var(--color-text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.25s, color 0.25s, border-color 0.25s, transform 0.2s',
        textDecoration: 'none',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = '#E8890C';
        e.currentTarget.style.color = '#FFFFFF';
        e.currentTarget.style.borderColor = '#E8890C';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = '#FFFFFF';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
        e.currentTarget.style.borderColor = 'var(--color-border)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {link.icon}
    </a>
  );
}

export default function Footer() {
  const { settings } = useSettings();
  const year = new Date().getFullYear();

  return (
    <footer
      role="contentinfo"
      style={{
        background: 'var(--color-bg-soft)',
        color: 'var(--color-text-secondary)',
        borderTop: '1px solid var(--color-border)',
        marginTop: 'auto',
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '72px 24px 40px' }}>

        {/* Top grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '48px',
          marginBottom: '56px',
        }}>

          {/* Brand */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link to="/" aria-label="The Sumiro">
              <img
                src="/The Sumiro Logo.png"
                alt="The Sumiro"
                style={{ height: '48px', width: 'auto', opacity: 0.9 }}
              />
            </Link>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', lineHeight: 1.7, color: 'var(--color-text-secondary)', maxWidth: '220px' }}>
              Crafting exceptional fabric designs from the heart of Surat's textile heritage.
            </p>
            <div style={{ width: '32px', height: '2px', background: '#E8890C', borderRadius: '99px' }} />
          </div>

          {/* Navigation */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--color-text-primary)', marginBottom: '20px',
            }}>
              Navigation
            </h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { to: '/', label: 'Home' },
                { to: '/about', label: 'About' },
                { to: '/contact', label: 'Contact' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '13px', color: 'var(--color-text-secondary)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--color-text-primary)', marginBottom: '20px',
            }}>
              Contact Us
            </h3>
            <address style={{ fontStyle: 'normal', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                34-40, HARI OM INDUSTRIAL ESTATE, SAROLI,<br />
                Kumbharia Gam, Surat, Gujarat — 395010
              </span>
              <a
                href={`mailto:${settings.enquiry_email}`}
                style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              >
                {settings.enquiry_email}
              </a>
              <a
                href={`tel:${settings.enquiry_phone.replace(/[^\d+]/g, '')}`}
                style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              >
                {settings.enquiry_phone}
              </a>
              <a
                href={`tel:${settings.alt_enquiry_phone.replace(/[^\d+]/g, '')}`}
                style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: 'var(--color-text-secondary)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
              >
                {settings.alt_enquiry_phone}
              </a>
            </address>
          </div>

          {/* Follow Us */}
          <div>
            <h3 style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px', fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              color: 'var(--color-text-primary)', marginBottom: '20px',
            }}>
              Follow Us
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {socialLinks.map(link => (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`footer-social-row-${link.id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    textDecoration: 'none',
                    color: 'var(--color-text-secondary)',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = '#E8890C';
                    e.currentTarget.querySelector('.social-icon-box').style.background = 'rgba(232,137,12,0.1)';
                    e.currentTarget.querySelector('.social-icon-box').style.borderColor = 'rgba(232,137,12,0.35)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.querySelector('.social-icon-box').style.background = '#FFFFFF';
                    e.currentTarget.querySelector('.social-icon-box').style.borderColor = 'var(--color-border)';
                  }}
                >
                  {/* Icon box */}
                  <div
                    className="social-icon-box"
                    style={{
                      width: '36px', height: '36px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border)',
                      background: '#FFFFFF',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'background 0.25s, border-color 0.25s',
                    }}
                  >
                    {link.icon}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 700, letterSpacing: '0.04em' }}>
                      {link.label}
                    </div>
                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', marginTop: '1px' }}>
                      {link.handle}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--color-border)',
          paddingTop: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
        }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.04em' }}>
            © {year} Sumiro Fabric Design Factory. All rights reserved.
          </p>

          {/* Social icon buttons */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {socialLinks.map(link => (
              <SocialIconBtn key={link.id} link={link} />
            ))}
          </div>

          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Premium Fabrics from Surat
          </p>
        </div>
      </div>
    </footer>
  );
}
