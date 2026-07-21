import { useSettings } from '../../hooks/useSettings';
import Seo from '../../components/ui/Seo';
import Spinner from '../../components/ui/Spinner';

function parseStoryText(text) {
  if (!text) return { paragraphs: [], lists: { manufacture: [], process: [], chooseUs: [] } };

  const lines = text.split('\n').map(l => l.trim());
  const paragraphs = [];
  const lists = {
    manufacture: [],
    process: [],
    chooseUs: [],
  };

  let currentKey = null;
  let currentParagraph = [];

  for (let line of lines) {
    if (!line) {
      if (currentParagraph.length > 0 && !currentKey) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      continue;
    }

    const cleanLine = line.toLowerCase();
    
    // Check for sections
    if (cleanLine.includes('what we manufacture')) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      currentKey = 'manufacture';
      continue;
    } else if (cleanLine.includes('our manufacturing process')) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      currentKey = 'process';
      continue;
    } else if (cleanLine.includes('why customers choose us')) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
      currentKey = 'chooseUs';
      continue;
    }

    // Detect new paragraph starts that should break out of lists
    const isNewParaStart = 
      line.startsWith('We believe') || 
      line.startsWith('Today,') || 
      line.startsWith('Our goal') || 
      line.startsWith('At The Sumiro');

    if (currentKey && isNewParaStart) {
      currentKey = null;
    }

    if (currentKey) {
      const cleanedItem = line.replace(/^[-*•\s:]+/, '').trim();
      if (cleanedItem) {
        lists[currentKey].push(cleanedItem);
      }
    } else {
      currentParagraph.push(line);
    }
  }

  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }

  return { paragraphs, lists };
}

export default function AboutPage() {
  const { settings, loading } = useSettings();

  if (loading) {
    return <Spinner fullPage />;
  }
  const p1Parsed = parseStoryText(settings.about_story_p1);
  const p2Parsed = parseStoryText(settings.about_story_p2);

  const combinedParagraphs = [...(p1Parsed.paragraphs || []), ...(p2Parsed.paragraphs || [])];
  const combinedLists = {
    manufacture: [...(p1Parsed.lists?.manufacture || []), ...(p2Parsed.lists?.manufacture || [])],
    process: [...(p1Parsed.lists?.process || []), ...(p2Parsed.lists?.process || [])],
    chooseUs: [...(p1Parsed.lists?.chooseUs || []), ...(p2Parsed.lists?.chooseUs || [])],
  };

  const hasLists = 
    combinedLists.manufacture.length > 0 ||
    combinedLists.process.length > 0 ||
    combinedLists.chooseUs.length > 0;

  const values = [
    {
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      title: 'Quality First',
      desc: "We don't cut corners. Every design goes through strict checks before it ever reaches you.",
    },
    {
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Timely Delivery',
      desc: 'We know your time matters. When we give a delivery date, we stick to it.',
    },
    {
      icon: (
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: 'Innovation',
      desc: "We keep an eye on what's trending globally, but never forget the roots of traditional Indian craftsmanship.",
    },
  ];

  return (
    <div className="animate-fade-in">
      <Seo
        title={settings.seo_about_title || 'About Us'}
        description={settings.seo_about_description}
        path="/about"
      />

      {/* Page Hero */}
      <section style={{
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F7F5F1 100%)',
        padding: 'clamp(64px, 10vw, 112px) 24px',
        borderBottom: '1px solid #E5E0D8',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Dot bg */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, #D4C9B5 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: 0.3,
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 40%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '700px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '28px' }}>
            <span className="pill-label">Our Heritage</span>
          </div>
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(2.4rem, 6vw, 4.2rem)',
            fontWeight: 400, color: '#0A0A0A',
            lineHeight: 1.1, letterSpacing: '-0.02em',
            marginBottom: '20px',
          }}>
            Crafting Fabrics{' '}
            <span style={{ fontStyle: 'italic', color: '#E8890C' }}>Since {settings.about_founding_year || '2006'}</span>
          </h1>
          <div className="accent-line" style={{ margin: '0 auto' }} />
        </div>
      </section>

      {/* Story */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '88px 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '48px',
          alignItems: 'start',
        }}>
          <div>
            <span className="pill-label" style={{ marginBottom: '24px', display: 'inline-flex' }}>Our Story</span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4vw, 2.8rem)',
              fontWeight: 400, color: '#0A0A0A',
              marginBottom: '20px', lineHeight: 1.25,
            }}>
              {settings.about_story_title || "Rooted in Surat's Textile Heritage"}
            </h2>
            <div className="accent-line" style={{ marginBottom: '24px' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {combinedParagraphs.map((para, index) => (
              <p
                key={index}
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '15px',
                  color: index === 0 ? '#3D3D3D' : '#737373',
                  lineHeight: 1.85,
                  whiteSpace: 'pre-line',
                  margin: 0,
                }}
              >
                {para}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{
        background: '#F7F5F1',
        borderTop: '1px solid #E5E0D8',
        borderBottom: '1px solid #E5E0D8',
        padding: '88px 24px',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <span className="pill-label" style={{ marginBottom: '32px', display: 'inline-flex' }}>Our Mission</span>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.6rem, 3vw, 2.2rem)',
            fontWeight: 400, color: '#0A0A0A',
            marginBottom: '24px',
          }}>
            Fabrics People Actually Love
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px', color: '#737373',
            lineHeight: 1.85, marginBottom: '40px',
            maxWidth: '680px', margin: '0 auto 40px',
          }}>
            Simple goal — make fabrics that look great, feel great, and hold up well.
            We work with small designers, boutiques, and large export houses alike.
            Whoever you are, if you care about quality, we'll get along just fine.
          </p>

          {/* Blockquote */}
          <blockquote style={{
            borderLeft: '3px solid #E8890C',
            paddingLeft: '24px',
            textAlign: 'left',
            maxWidth: '600px',
            margin: '0 auto 64px',
          }}>
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(1.1rem, 2.5vw, 1.4rem)',
              fontStyle: 'italic', color: '#0A0A0A',
              lineHeight: 1.6,
            }}>
              "Good fabric doesn't need to be explained. The moment you touch it, you know."
              — The Sumiro Team, Surat
            </p>
          </blockquote>

          {/* Values */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '30px',
            marginTop: '48px',
          }} className="stagger">
            {values.map(({ icon, title, desc }, index) => (
              <div
                key={title}
                className="card animate-fade-up"
                style={{
                  padding: '44px 32px',
                  textAlign: 'left',
                  background: '#FFFFFF',
                  border: '1px solid #EAE6DF',
                  borderRadius: '16px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 30px 60px -15px rgba(232, 137, 12, 0.08), 0 10px 30px -10px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.borderColor = '#E8890C';
                  const indexEl = e.currentTarget.querySelector('.card-index');
                  if (indexEl) {
                    indexEl.style.transform = 'scale(1.1) translateY(-2px)';
                    indexEl.style.color = '#E8890C';
                    indexEl.style.opacity = '0.18';
                  }
                  const borderTop = e.currentTarget.querySelector('.card-top-border');
                  if (borderTop) {
                    borderTop.style.transform = 'scaleX(1)';
                  }
                  const iconBg = e.currentTarget.querySelector('.icon-bg');
                  if (iconBg) {
                    iconBg.style.background = '#E8890C';
                    iconBg.style.color = '#FFFFFF';
                    iconBg.style.transform = 'scale(1.05) rotate(5deg)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.02)';
                  e.currentTarget.style.borderColor = '#EAE6DF';
                  const indexEl = e.currentTarget.querySelector('.card-index');
                  if (indexEl) {
                    indexEl.style.transform = 'none';
                    indexEl.style.color = '#1A1A1A';
                    indexEl.style.opacity = '0.05';
                  }
                  const borderTop = e.currentTarget.querySelector('.card-top-border');
                  if (borderTop) {
                    borderTop.style.transform = 'scaleX(0)';
                  }
                  const iconBg = e.currentTarget.querySelector('.icon-bg');
                  if (iconBg) {
                    iconBg.style.background = '#FDF3E3';
                    iconBg.style.color = '#E8890C';
                    iconBg.style.transform = 'none';
                  }
                }}
              >
                {/* Subtle top indicator bar */}
                <div 
                  className="card-top-border"
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #E8890C, #F5C97A)',
                    transform: 'scaleX(0)',
                    transformOrigin: 'left',
                    transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />

                {/* Elegant big index number in background */}
                <span 
                  className="card-index"
                  style={{
                    position: 'absolute',
                    top: '24px',
                    right: '32px',
                    fontFamily: 'var(--font-serif)',
                    fontSize: '4.5rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    color: '#1A1A1A',
                    opacity: 0.05,
                    pointerEvents: 'none',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Premium Icon Container */}
                <div 
                  className="icon-bg"
                  style={{
                    width: '56px',
                    height: '56px',
                    background: '#FDF3E3',
                    border: '1px solid rgba(245, 201, 122, 0.4)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#E8890C',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    marginBottom: '12px',
                  }}
                >
                  {icon}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '20px',
                  fontWeight: 500,
                  color: '#0A0A0A',
                  letterSpacing: '-0.01em',
                  marginTop: '4px',
                }}>
                  {title}
                </h3>

                <p style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '14px',
                  color: '#666666',
                  lineHeight: 1.7,
                  margin: 0,
                  fontWeight: 300,
                }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '88px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <span className="pill-label" style={{ marginBottom: '20px', display: 'inline-flex' }}>Find Us</span>
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
            fontWeight: 400, color: '#0A0A0A',
            lineHeight: 1.2,
          }}>
            Visit Our Factory
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373', marginTop: '10px' }}>
            We're right in the middle of Surat's industrial belt — easy to find, easy to visit.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          {/* Address */}
          <div className="card" style={{ padding: '40px 36px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px',
            }}>
              <div style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: '#FDF3E3', border: '1px solid #F5C97A',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#E8890C',
              }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 500, color: '#0A0A0A' }}>
                Primary Location
              </h3>
            </div>
            <address style={{ fontStyle: 'normal', fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#737373', lineHeight: 1.8 }}>
              <strong style={{ color: '#0A0A0A', display: 'block', marginBottom: '4px' }}>Sumiro Fabric Design Factory</strong>
              34-40, HARI OM INDUSTRIAL ESTATE, SAROLI,<br />
              Kumbharia Gam, Surat, Gujarat — 395010
            </address>
          </div>

          {/* Contact */}
          <div className="card" style={{ padding: '40px 36px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px',
            }}>
              <div style={{
                width: '42px', height: '42px', flexShrink: 0,
                background: '#FDF3E3', border: '1px solid #F5C97A',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#E8890C',
              }}>
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 500, color: '#0A0A0A' }}>
                Get In Touch
              </h3>
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <li style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', display: 'flex', gap: '10px' }}>
                <span style={{ color: '#A3A3A3', minWidth: '50px' }}>Email</span>
                <a href={`mailto:${settings.enquiry_email}`} style={{ color: '#0A0A0A', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0A0A0A'}
                >{settings.enquiry_email}</a>
              </li>
              <li style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', display: 'flex', gap: '10px' }}>
                <span style={{ color: '#A3A3A3', minWidth: '50px' }}>Phone</span>
                <a href={`tel:${settings.enquiry_phone.replace(/[^\d+]/g, '')}`} style={{ color: '#0A0A0A', fontWeight: 500, transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
                  onMouseLeave={e => e.currentTarget.style.color = '#0A0A0A'}
                >{settings.enquiry_phone}</a>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
