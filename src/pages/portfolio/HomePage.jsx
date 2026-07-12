import { useState, useEffect, useRef } from 'react';
import HeroBanner from '../../components/portfolio/HeroBanner';
import Seo from '../../components/ui/Seo';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
import Spinner from '../../components/ui/Spinner';

const optimizeCloudinaryUrl = (url) => {
  if (!url) return '';
  if (url.includes('cloudinary.com') && url.includes('/upload/')) {
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
  }
  return url;
};

const iconProps = {
  width: 24, height: 24, fill: 'none', stroke: 'currentColor',
  strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round',
  viewBox: '0 0 24 24',
};

const features = [
  {
    icon: (
      <svg {...iconProps}><path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5L12 3z" /></svg>
    ),
    title: 'Bespoke Silk & Jacquards',
    desc: 'Premium prints and brocades crafted on modern loom setups with meticulous attention.',
  },
  {
    icon: (
      <svg {...iconProps}><path d="M3 21v-4a4 4 0 014-4h2m6 0h2a4 4 0 014 4v4M12 3a3 3 0 100 6 3 3 0 000-6zm0 6v4" /></svg>
    ),
    title: 'Artisanal Embroideries',
    desc: 'Traditional threadwork and contemporary zari highlights representing rich cultural details.',
  },
  {
    icon: (
      <svg {...iconProps}><path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 008 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 8.6a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6h.09A1.65 1.65 0 0010 3.09V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9v.09a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>
    ),
    title: 'Exclusive Catalog Access',
    desc: 'Authorised clients access our private archive of patterns, specs and source files.',
  },
  {
    icon: (
      <svg {...iconProps}><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7l3-7z" /></svg>
    ),
    title: '20+ Years Heritage',
    desc: 'Two decades of craft excellence blending traditional artistry with modern precision.',
    dynamicYears: true,
  },
];

const slides = [
  {
    id: 1,
    image: '/collections/silk_brocade.png',
    title: 'Silk Brocade Collection',
    subtitle: 'Woven with gold & silver zari threads on pure silk base',
    tag: 'Signature Series',
  },
  {
    id: 2,
    image: '/collections/heritage_jacquard.png',
    title: 'Heritage Jacquard Weaves',
    subtitle: 'Traditional motifs reimagined for contemporary fashion',
    tag: 'Heritage Collection',
  },
  {
    id: 3,
    image: '/collections/artisanal_embroidery.png',
    title: 'Artisanal Embroideries',
    subtitle: 'Hand-crafted threadwork celebrating generations of craft',
    tag: 'Artisan Series',
  },
  {
    id: 4,
    image: '/collections/exclusive_prints.png',
    title: 'Exclusive Print Studio',
    subtitle: 'Custom digital and screen prints for bespoke design houses',
    tag: 'Custom Prints',
  },
];

export default function HomePage() {
  const { settings, loading } = useSettings();
  const foundingYear = parseInt(settings.about_founding_year, 10) || 2006;
  const yearsOfHeritage = Math.max(1, new Date().getFullYear() - foundingYear);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlayingFactoryVideo, setIsPlayingFactoryVideo] = useState(false);
  const [isHoveringVideo, setIsHoveringVideo] = useState(false);
  const [marqueeTags, setMarqueeTags] = useState([
    'Silk Brocades','Jacquard Weaves','Zari Embroidery','Digital Prints','Heritage Motifs','Screen Prints','Velvet Textures','Organza Fabrics'
  ]);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  // Fetch marquee items from Supabase
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
          setMarqueeTags(JSON.parse(data.description));
        }
      } catch (err) {
        console.error('Failed to load marquee tags, using defaults:', err);
      }
    }
    loadMarquee();
  }, []);

  // Intersection Observer for scroll-reveal animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-item');
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // Use admin-uploaded collection images when available, fall back to static slides
  const activeSlides = settings.collection_slides && settings.collection_slides.length > 0
    ? settings.collection_slides.map((item, idx) => {
        const fallback = slides[idx % slides.length];
        if (typeof item === 'string') {
          return { ...fallback, id: idx + 1, image: item };
        }
        return {
          id: idx + 1,
          image: item.image,
          title: item.title || fallback.title,
          subtitle: item.subtitle || fallback.subtitle,
          tag: item.tag || fallback.tag,
        };
      })
    : slides;

  // Auto-play slider
  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(autoPlayRef.current);
  }, [activeSlides.length]);

  if (loading) {
    return <Spinner fullPage />;
  }
    const goTo = (idx) => {
    clearInterval(autoPlayRef.current);
    setActiveSlide(idx);
    autoPlayRef.current = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % activeSlides.length);
    }, 4500);
  };
  const prev = () => goTo((activeSlide - 1 + activeSlides.length) % activeSlides.length);
  const next = () => goTo((activeSlide + 1) % activeSlides.length);

  return (
    <div className="animate-fade-in">
      <Seo
        title={settings.seo_home_title || 'Home'}
        description={settings.seo_home_description}
        path="/"
      />
      <HeroBanner />

      {/* ── MARQUEE TICKER ──────────────────────────────────── */}
      <div aria-hidden="true" style={{ background: '#1A1208', padding: '14px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', width: 'max-content', animation: '30s linear infinite marquee-scroll', willChange: 'transform' }}>
          {/* Four copies so content always fills the viewport without a visible reset */}
          {[...marqueeTags, ...marqueeTags, ...marqueeTags, ...marqueeTags].map((text, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '20px', padding: '0 28px', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: i % 2 === 0 ? '#FFFFFF' : '#E8890C', flexShrink: 0 }}>
              {text}
              <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#E8890C', flexShrink: 0 }} />
            </span>
          ))}
        </div>
      </div>

      {/* ── Image Slider ──────────────────────────────────── */}
      <section
        aria-label="Collections Slider"
        className="reveal-item"
        style={{
          background: 'var(--color-bg-soft)',
          padding: '88px 24px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px', marginBottom: '40px' }}>
            <div>
              <span className="pill-label" style={{ marginBottom: '16px', display: 'inline-flex' }}>Our Collections</span>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.8rem, 4vw, 3rem)',
                fontWeight: 400,
                color: 'var(--color-text-primary)',
                lineHeight: 1.15,
                marginTop: '14px',
              }}>
                Curated <span style={{ fontStyle: 'italic', color: '#E8890C' }}>Fabric Stories</span>
              </h2>
            </div>
            {/* Arrow Controls */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { label: '←', action: prev, id: 'slider-prev' },
                { label: '→', action: next, id: 'slider-next' },
              ].map(({ label, action, id }) => (
                <button
                  key={id}
                  id={id}
                  onClick={action}
                  aria-label={label === '←' ? 'Previous slide' : 'Next slide'}
                  style={{
                    width: '48px', height: '48px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--color-border)',
                    background: '#FFFFFF',
                    color: 'var(--color-text-primary)',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.25s, border-color 0.25s, transform 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = '#E8890C';
                    e.currentTarget.style.color = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E8890C';
                    e.currentTarget.style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Slide */}
          <div
            ref={sliderRef}
            style={{
              position: 'relative',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.09)',
              border: '1px solid var(--color-border)',
            }}
          >
            {activeSlides.map((slide, idx) => (
              <div
                key={`${slide.image}_${idx}`}
                style={{
                  position: idx === activeSlide ? 'relative' : 'absolute',
                  inset: 0,
                  opacity: idx === activeSlide ? 1 : 0,
                  transition: 'opacity 0.7s ease',
                  pointerEvents: idx === activeSlide ? 'auto' : 'none',
                }}
              >
                <div style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: 'clamp(320px, 48vw, 540px)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}>
                  {/* Floating Tag Top Left */}
                  <span style={{
                    position: 'absolute',
                    top: 'clamp(16px, 4vw, 28px)',
                    left: 'clamp(16px, 4vw, 28px)',
                    zIndex: 3,
                    fontFamily: 'var(--font-sans)', fontSize: 'clamp(9px, 1.2vw, 11px)', fontWeight: 700, letterSpacing: '0.2em',
                    textTransform: 'uppercase', color: '#E8890C',
                    background: 'rgba(232, 137, 12, 0.15)', border: '1px solid rgba(232, 137, 12, 0.4)',
                    backdropFilter: 'blur(8px)',
                    padding: '5px 12px', borderRadius: '99px', display: 'inline-block',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}>{slide.tag}</span>

                  <img
                    src={optimizeCloudinaryUrl(slide.image)}
                    alt={slide.title}
                    loading="lazy"
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      zIndex: 0,
                    }}
                  />
                  {/* Gradient */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)',
                    zIndex: 1,
                  }} />
                  {/* Text Overlay */}
                  <div style={{
                    position: 'relative',
                    zIndex: 2,
                    padding: 'clamp(20px, 5vw, 40px)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(10px, 2vw, 14px)',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                      {/* Slide counter */}
                      <div style={{
                        fontFamily: 'var(--font-sans)', fontSize: 'clamp(11px, 1.5vw, 13px)',
                        color: 'rgba(255,255,255,0.6)',
                        letterSpacing: '0.1em',
                        display: 'flex', alignItems: 'center',
                      }}>
                        <span style={{ fontSize: 'clamp(16px, 2.5vw, 22px)', fontFamily: 'var(--font-serif)', color: '#FFFFFF', fontWeight: 300 }}>
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        {' / '}{String(activeSlides.length).padStart(2, '0')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(8px, 1.5vw, 12px)' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 'clamp(1.25rem, 3.5vw, 2.3rem)',
                        fontWeight: 400, color: '#FFFFFF',
                        lineHeight: 1.2,
                        margin: 0,
                      }}>{slide.title}</h3>
                      
                      <p style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: 'clamp(12px, 1.8vw, 14.5px)',
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: 1.55,
                        margin: 0,
                      }}>
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
            {activeSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                style={{
                  width: idx === activeSlide ? '28px' : '8px',
                  height: '8px',
                  borderRadius: '99px',
                  background: idx === activeSlide ? '#E8890C' : '#D4C9B5',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'width 0.35s cubic-bezier(0.16,1,0.3,1), background 0.3s',
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: VIDEO SHOWCASE (Etro-Style Single Cinematic Viewport) ───────────────── */}
      <section
        aria-label="Campaign Video"
        className="reveal-item"
        style={{
          background: '#FFFFFF',
          padding: '112px 24px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Video Player Container */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 30px 80px rgba(220, 212, 196, 0.35)',
              border: '1.5px solid #EDE9E3',
              cursor: settings.home_video_url ? 'default' : 'pointer',
              background: '#0B0B0A',
            }}
            onMouseEnter={() => setIsHoveringVideo(true)}
            onMouseLeave={() => setIsHoveringVideo(false)}
            onClick={settings.home_video_url ? undefined : () => setIsPlayingFactoryVideo(true)}
          >
            {/* 16:9 Aspect Ratio box */}
            <div style={{ paddingTop: '56.25%', position: 'relative' }}>
              {settings.home_video_url ? (
                <video
                  src={settings.home_video_url}
                  poster={settings.home_video_thumbnail || undefined}
                  controls
                  controlsList="nodownload noplaybackrate"
                  disablePictureInPicture
                  onContextMenu={e => e.preventDefault()}
                  autoPlay
                  muted
                  loop
                  playsInline
                  style={{
                    position: 'absolute', inset: 0,
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : !isPlayingFactoryVideo ? (
                <>
                  <img
                    src={settings.home_video_thumbnail || "/collections/jacquard_loom.png"}
                    alt="The Sumiro Factory Mill"
                    loading="lazy"
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isHoveringVideo ? 'scale(1.03)' : 'scale(1)',
                    }}
                  />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(10,10,10,0.5) 100%)',
                  }} />
                  
                  {/* Minimal gold play outline */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '84px', height: '84px',
                      borderRadius: '50%',
                      border: '1.5px solid #D4AF37', // Fine gold outline
                      background: isHoveringVideo ? 'rgba(232, 137, 12, 0.85)' : 'rgba(255, 255, 255, 0.95)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                      transform: isHoveringVideo ? 'scale(1.1)' : 'scale(1)',
                      boxShadow: isHoveringVideo ? '0 12px 30px rgba(232,137,12,0.3)' : '0 4px 15px rgba(0,0,0,0.1)'
                    }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" style={{ marginLeft: '4px' }}>
                        <polygon 
                          points="6,3 20,12 6,21" 
                          fill={isHoveringVideo ? '#FFFFFF' : '#E8890C'} 
                          style={{ transition: 'fill 0.4s' }}
                        />
                      </svg>
                    </div>
                  </div>
                </>
              ) : (
                <img
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  src="/collections/collections_showreel.webp"
                  alt="Collections Showreel"
                  loading="lazy"
                />
              )}
            </div>
          </div>

          {/* Etro-Style Editorial Caption below */}
          <div style={{ 
            textAlign: 'center', 
            marginTop: '56px',
            background: '#FAF9F6',
            border: '1px solid #EAE6DF',
            borderRadius: '16px',
            padding: '44px 32px',
            position: 'relative',
            maxWidth: '780px',
            margin: '56px auto 0',
            boxShadow: '0 10px 30px rgba(220, 212, 196, 0.15)'
          }}>
            {/* Elegant Top Gold Line */}
            <div style={{
              width: '48px',
              height: '2px',
              background: 'linear-gradient(90deg, #E8890C, #F5C97A)',
              margin: '0 auto 24px',
              borderRadius: '2px'
            }} />

            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#E8890C',
              display: 'block',
              marginBottom: '16px'
            }}>
              [ COLLECTIONS SHOWREEL ]
            </span>

            {/* Stylized Quote Text */}
            <p style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(16px, 2.4vw, 20px)',
              fontStyle: 'italic',
              color: '#1A1A1A',
              lineHeight: 1.8,
              maxWidth: '640px',
              margin: '0 auto',
              position: 'relative',
              fontWeight: 400,
            }}>
              <span style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: '3rem', 
                color: '#D4C9B5', 
                lineHeight: 0,
                position: 'absolute',
                left: '-28px',
                top: '12px',
                pointerEvents: 'none'
              }}>“</span>
              A digital showcase of our premium collections, demonstrating the smooth flows and luxurious textures of the Sumiro fabrics on our interactive digital studio.
              <span style={{ 
                fontFamily: 'var(--font-serif)', 
                fontSize: '3rem', 
                color: '#D4C9B5', 
                lineHeight: 0,
                position: 'absolute',
                right: '-28px',
                bottom: '-12px',
                pointerEvents: 'none'
              }}>”</span>
            </p>

            {/* Elegant Subtitle */}
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#736F66',
              display: 'block',
              marginTop: '20px'
            }}>
              — Interactive Textile Exhibition
            </span>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: WHY CHOOSE US (Etro-Style Luxury Sand Section) ────────────────────── */}
      <section
        aria-label="Why Choose Us"
        className="reveal-item"
        style={{
          background: '#F4F2EF', // Etro Sand/Cream
          padding: '112px 24px',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          
          {/* Editorial Header */}
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '18px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              display: 'block',
              marginBottom: '16px'
            }}>
              [ WHY CHOOSE US ]
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 5vw, 3.2rem)',
              fontWeight: 300,
              color: '#1A1A1A',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              lineHeight: 1.1,
              marginTop: '16px'
            }}>
              Woven with Intention,<br />
              <span style={{ fontStyle: 'italic', color: '#E8890C', fontFamily: 'var(--font-serif)' }}>Crafted with Care</span>
            </h2>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14.5px',
              color: '#4B5563',
              marginTop: '20px',
              maxWidth: '480px',
              margin: '20px auto 0',
              fontWeight: 300,
              lineHeight: 1.7
            }}>
              Our core commitments to uncompromising quality, Surat textile heritage, and bespoke customer excellence.
            </p>
          </div>

          {/* Cards Deck with Alternating Tilts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '32px',
            padding: '20px 0'
          }} className="reveal-stagger">
            {features.map(({ icon, title, desc, dynamicYears }, idx) => {
              // Heritage card shows years derived from the configured founding year
              const displayTitle = dynamicYears ? `${yearsOfHeritage}+ Years Heritage` : title;
              const displayDesc = dynamicYears
                ? `Over ${yearsOfHeritage} years of craft excellence blending traditional artistry with modern precision.`
                : desc;
              // Alternating tilt angles
              const tiltAngles = ['-3deg', '3deg', '-2deg', '2deg'];
              const translations = ['-8px', '8px', '-5px', '5px'];
              const initialTilt = tiltAngles[idx % tiltAngles.length];
              const initialTranslate = translations[idx % translations.length];

              return (
                <div
                  key={title}
                  style={{
                    padding: '48px 36px',
                    background: '#FFFFFF',
                    border: '1px solid rgba(229, 224, 216, 0.8)',
                    borderRadius: '12px',
                    transform: `rotate(${initialTilt}) translateY(${initialTranslate})`,
                    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    cursor: 'default',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 8px 30px rgba(220, 212, 196, 0.08)'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.06) rotate(0deg)';
                    e.currentTarget.style.boxShadow = '0 24px 60px rgba(212, 201, 181, 0.28)';
                    e.currentTarget.style.borderColor = 'var(--color-accent)';
                    e.currentTarget.querySelector('.bottom-accent').style.transform = 'scaleX(1)';
                    e.currentTarget.querySelector('.icon-wrapper').style.transform = 'scale(1.08) rotate(6deg)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = `rotate(${initialTilt}) translateY(${initialTranslate})`;
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(220, 212, 196, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(229, 224, 216, 0.8)';
                    e.currentTarget.querySelector('.bottom-accent').style.transform = 'scaleX(0)';
                    e.currentTarget.querySelector('.icon-wrapper').style.transform = 'none';
                  }}
                >
                  {/* Clean circular icon badge */}
                  <div 
                    className="icon-wrapper"
                    style={{
                      width: '52px',
                      height: '52px',
                      borderRadius: '50%',
                      background: '#FDF3E3',
                      border: '1.5px solid #F5C97A',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#E8890C',
                      marginBottom: '24px',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {icon}
                  </div>

                  <h3 style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '19px',
                    fontWeight: 500,
                    color: '#1A1A1A',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    marginBottom: '12px',
                    lineHeight: 1.3
                  }}>
                    {displayTitle}
                  </h3>
                  
                  <p style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '14.5px',
                    color: '#4B5563',
                    lineHeight: 1.75,
                    fontWeight: 300
                  }}>
                    {displayDesc}
                  </p>

                  {/* Saffron bottom slide-out accent */}
                  <div 
                    className="bottom-accent"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: '#E8890C',
                      transform: 'scaleX(0)',
                      transformOrigin: 'left',
                      transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Band */}
      <section
        className="reveal-item"
        style={{
          background: 'linear-gradient(135deg, #F7F5F1 0%, #F0EDE8 100%)',
          padding: '88px 24px',
          textAlign: 'center',
          borderTop: '1px solid #E5E0D8',
        }}
      >
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div className="accent-line" style={{ margin: '0 auto 24px' }} />
          <h2 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 400, color: '#0A0A0A',
            marginBottom: '16px', lineHeight: 1.2,
          }}>
            Ready to collaborate?
          </h2>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '15px', color: '#737373',
            marginBottom: '36px', lineHeight: 1.7,
          }}>
            Contact us to discuss custom designs, bulk orders, or to request access to our exclusive client catalogue.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/contact" className="btn-primary" id="home-cta-contact">Contact Us</a>
            <a href="/about" className="btn-outline" id="home-cta-about">Learn More</a>
          </div>
        </div>
      </section>
    </div>
  );
}

