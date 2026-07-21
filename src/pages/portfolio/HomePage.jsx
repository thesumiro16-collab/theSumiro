import { useState, useEffect, useRef } from 'react';
import HeroBanner from '../../components/portfolio/HeroBanner';
import Seo from '../../components/ui/Seo';
import { supabase } from '../../lib/supabase';
import { useSettings } from '../../hooks/useSettings';
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

function renderInstagramReel(value, idx) {
  if (!value) return null;

  const trimmed = value.trim();

  // Case A: Raw Embed Code (blockquote or iframe)
  if (trimmed.startsWith('<') && (trimmed.includes('blockquote') || trimmed.includes('iframe'))) {
    return (
      <div 
        className="instagram-embed-container"
        dangerouslySetInnerHTML={{ __html: trimmed }} 
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          border: 'none', overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      />
    );
  }

  // Case B: Regular Instagram URL
  if (trimmed.includes('instagram.com/reel/') || trimmed.includes('instagram.com/p/')) {
    let embedUrl = trimmed;
    if (!embedUrl.endsWith('/')) embedUrl += '/';
    if (!embedUrl.includes('/embed/')) {
      embedUrl = embedUrl.split('?')[0] + 'embed/';
    }
    return (
      <iframe
        src={embedUrl}
        title={`Instagram Reel ${idx + 1}`}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          border: 'none', overflow: 'hidden'
        }}
        scrolling="no"
        allowTransparency
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      />
    );
  }

  // Case C: Native HTML5 MP4 Loop
  return (
    <>
      <video
        src={trimmed}
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
        }}
      />
      {/* Overlays */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)',
        zIndex: 2,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ color: '#FFFFFF', opacity: 0.9 }}>
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF'
          }}>
            <svg width="10" height="10" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="6,3 20,12 6,21" />
            </svg>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.02em' }}>
            @the.sumiro
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: 'rgba(255,255,255,0.85)' }}>
            Click to Watch Loom Video
          </span>
        </div>
      </div>
    </>
  );
}

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
  
  const p1Parsed = parseStoryText(settings.about_story_p1);
  const p2Parsed = parseStoryText(settings.about_story_p2);

  const defaultManufacture = [
    'Premium Silks & Zari Brocades',
    'Luxury Jacquard Weave Textiles',
    'Bespoke Artisanal Embroideries'
  ];

  const defaultProcess = [
    'Raw Silk & Thread Sourcing',
    'Computerized CAD Design Patterns',
    'Modern High-Precision Looms Production'
  ];

  const defaultChooseUs = [
    'Flawless Thread Consistency',
    'Guaranteed On-Time Dispatches',
    'Custom Designing Support'
  ];

  const combinedLists = {
    manufacture: settings.craft_manufacture_list?.length > 0
      ? settings.craft_manufacture_list
      : defaultManufacture,
    process: settings.craft_process_list?.length > 0
      ? settings.craft_process_list
      : defaultProcess,
    chooseUs: settings.craft_promise_list?.length > 0
      ? settings.craft_promise_list
      : defaultChooseUs,
  };

  const hasLists = true;

  const foundingYear = parseInt(settings.about_founding_year, 10) || 2006;
  const yearsOfHeritage = Math.max(1, new Date().getFullYear() - foundingYear);
  const [activeSlide, setActiveSlide] = useState(0);
  const [activeTab, setActiveTab] = useState('manufacture');
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

  // Handle Instagram embeds processing when settings change
  useEffect(() => {
    if (document.querySelector('.instagram-media')) {
      if (!document.getElementById('instagram-embed-script')) {
        const script = document.createElement('script');
        script.id = 'instagram-embed-script';
        script.async = true;
        script.src = '//www.instagram.com/embed.js';
        document.body.appendChild(script);
      } else if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    }
  }, [settings]);

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
        fullTitle={settings.seo_home_title || 'The Sumiro — Premium Fabric Designs from Surat, India'}
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

      {/* ── SECTION: OUR CRAFT & PROCESS (Dynamic Cabinet Display on Home Page) ─────────── */}
      {hasLists && (
        <section
          aria-label="Our Craft and Process"
          className="reveal-item"
          style={{
            background: '#FFFFFF',
            padding: '100px 24px',
            borderTop: '1px solid var(--color-border)',
          }}
        >
          <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
            {/* Section Header */}
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <span style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.24em',
                textTransform: 'uppercase',
                color: '#E8890C',
                display: 'block',
                marginBottom: '16px'
              }}>
                [ {settings.craft_section_subtitle || 'Our Craft & Process'} ]
              </span>
              <h2 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
                fontWeight: 300,
                color: '#1A1A1A',
                letterSpacing: '-0.02em',
                textTransform: 'uppercase',
                lineHeight: 1.2,
                margin: '0 auto',
              }}>
                {settings.craft_section_title || 'Woven with Intention, Crafted to Inspire'}
              </h2>
            </div>

            {/* Dynamic Luxury Tabs Switcher */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '12px',
              marginBottom: '32px',
              borderBottom: '1px solid #EAE6DF',
              paddingBottom: '8px',
              flexWrap: 'wrap'
            }}>
              {combinedLists.manufacture.length > 0 && (
                <button
                  onClick={() => setActiveTab('manufacture')}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: activeTab === 'manufacture' ? '#E8890C' : '#888275',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  What We Manufacture
                  {activeTab === 'manufacture' && (
                    <div style={{
                      position: 'absolute', bottom: '-9px', left: 0, right: 0,
                      height: '2.5px', background: '#E8890C', borderRadius: '1px'
                    }} />
                  )}
                </button>
              )}

              {combinedLists.process.length > 0 && (
                <button
                  onClick={() => setActiveTab('process')}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: activeTab === 'process' ? '#E8890C' : '#888275',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  Our Process
                  {activeTab === 'process' && (
                    <div style={{
                      position: 'absolute', bottom: '-9px', left: 0, right: 0,
                      height: '2.5px', background: '#E8890C', borderRadius: '1px'
                    }} />
                  )}
                </button>
              )}

              {combinedLists.chooseUs.length > 0 && (
                <button
                  onClick={() => setActiveTab('chooseUs')}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    background: 'none',
                    border: 'none',
                    outline: 'none',
                    color: activeTab === 'chooseUs' ? '#E8890C' : '#888275',
                    padding: '12px 24px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  Our Promise
                  {activeTab === 'chooseUs' && (
                    <div style={{
                      position: 'absolute', bottom: '-9px', left: 0, right: 0,
                      height: '2.5px', background: '#E8890C', borderRadius: '1px'
                    }} />
                  )}
                </button>
              )}
            </div>

            {/* Split Content Showcase Panel */}
            <div style={{
              background: '#F7F5F1',
              border: '1.5px solid #E5E0D8',
              borderRadius: '24px',
              padding: '40px',
              boxShadow: '0 8px 30px rgba(220, 212, 196, 0.06)',
            }}>
              {/* Tab 1 Content: Manufacture */}
              {activeTab === 'manufacture' && combinedLists.manufacture.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
                  {/* Left Column: Spool Graphic */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: '#FDF3E3', border: '1.5px solid #F5C97A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#E8890C', marginBottom: '8px'
                    }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096m.813 5.096a11.977 11.977 0 01-3.228-3.35m0 0a10.01 10.01 0 001.61-4.73C7.294 5.145 12 3 12 3s4.706 2.145 4.793 4.824c.057 1.76-.43 3.42-1.344 4.78a11.975 11.975 0 01-3.228 3.3m0 0l-.813 5.096m0 0l.813-5.096m-.813 0c-.394-.055-.783-.146-1.164-.272m.764-5.708a3 3 0 110-6 3 3 0 010 6z" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: '#0A0A0A', margin: 0 }}>
                      What We Manufacture
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#736F66', lineHeight: 1.7, margin: 0 }}>
                      {settings.craft_manufacture_desc || 'We supply premium fabric weaves designed to satisfy high-end boutique standards, luxury garment houses, and wholesale suppliers. Every meter represents flawless embroidery work and deep texture detail.'}
                    </p>
                  </div>
                  {/* Right Column: Custom lists */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE6DF',
                    borderRadius: '16px',
                    padding: '28px',
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '12px'
                  }}>
                    {combinedLists.manufacture.map((item, idx) => (
                      <div key={idx} style={{
                        fontFamily: 'var(--font-sans)', fontSize: '13.5px', color: '#3D3D3D',
                        display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: idx < combinedLists.manufacture.length - 1 ? '10px' : '0',
                        borderBottom: idx < combinedLists.manufacture.length - 1 ? '1px dashed #EDEAE4' : 'none'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E8890C', flexShrink: 0 }} />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2 Content: Process */}
              {activeTab === 'process' && combinedLists.process.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
                  {/* Left Column: Process Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: '#FDF3E3', border: '1px solid #F5C97A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#E8890C', marginBottom: '8px'
                    }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: '#0A0A0A', margin: 0 }}>
                      Our Timeline & Flow
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#736F66', lineHeight: 1.7, margin: 0 }}>
                      {settings.craft_process_desc || 'Our manufacturing pipeline ensures complete precision from raw fabric sourcing through computerized design layouts, meticulous embroidery production, and multi-tier quality checks.'}
                    </p>
                  </div>
                  {/* Right Column: Timeline Stepper */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE6DF',
                    borderRadius: '16px',
                    padding: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}>
                    {combinedLists.process.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <span style={{
                          fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
                          width: '20px', height: '20px', borderRadius: '50%',
                          background: '#E8890C', color: '#FFFFFF',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '13.5px', color: '#3D3D3D' }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3 Content: Promise */}
              {activeTab === 'chooseUs' && combinedLists.chooseUs.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '48px', alignItems: 'center' }}>
                  {/* Left Column: Promise Description */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: '#FDF3E3', border: '1px solid #F5C97A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#E8890C', marginBottom: '8px'
                    }}>
                      <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 400, color: '#0A0A0A', margin: 0 }}>
                      Our Core Promises
                    </h3>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', color: '#736F66', lineHeight: 1.7, margin: 0 }}>
                      {settings.craft_promise_desc || 'Our commitment to wholesalers, retailers, and export houses is absolute. We guarantee consistency in thread quality, reliable dispatch schedules, and premium manufacturing support.'}
                    </p>
                  </div>
                  {/* Right Column: Promises checklist */}
                  <div style={{
                    background: '#FFFFFF',
                    border: '1px solid #EAE6DF',
                    borderRadius: '16px',
                    padding: '28px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px'
                  }}>
                    {combinedLists.chooseUs.map((item, idx) => (
                      <div key={idx} style={{
                        fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#3D3D3D',
                        display: 'flex', alignItems: 'center', gap: '8px'
                      }}>
                        <span style={{
                          color: '#15803D', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.08)',
                          border: '1px solid rgba(34, 197, 94, 0.25)', fontSize: '9px', fontWeight: 'bold', flexShrink: 0
                        }}>✓</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

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

      
      {/* ── SECTION: INSTAGRAM REELS (Curated 3-Reel Showcase) ─────────────────────────── */}
      <section
        aria-label="Instagram Reels"
        className="reveal-item"
        style={{
          background: '#FFFFFF',
          padding: '100px 24px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: '#E8890C',
              display: 'block',
              marginBottom: '16px'
            }}>
              [ @the.sumiro on Instagram ]
            </span>
            <h2 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2rem, 4.5vw, 2.8rem)',
              fontWeight: 300,
              color: '#1A1A1A',
              letterSpacing: '-0.02em',
              textTransform: 'uppercase',
              lineHeight: 1.2,
              margin: '0 auto',
            }}>
              Behind the Looms, <span style={{ fontStyle: 'italic', color: '#E8890C', fontFamily: 'var(--font-serif)' }}>Active Reels</span>
            </h2>
          </div>

          {/* 3 Reels Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              settings.instagram_reel_1 || 'https://assets.mixkit.co/videos/preview/mixkit-sewing-machine-stitching-a-fabric-close-up-40455-large.mp4',
              settings.instagram_reel_2 || 'https://assets.mixkit.co/videos/preview/mixkit-working-on-a-weaving-loom-40333-large.mp4',
              settings.instagram_reel_3 || 'https://assets.mixkit.co/videos/preview/mixkit-fabrics-hanging-in-a-market-stall-40457-large.mp4'
            ].map((reelUrl, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  paddingTop: '177.77%', // 9:16 aspect ratio
                  background: '#0B0B0A',
                  boxShadow: '0 10px 30px rgba(10,10,10,0.05)',
                  border: '1.5px solid #EAE6DF',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.querySelector('video')?.play().catch(() => {});
                  e.currentTarget.style.transform = 'scale(1.03) translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 20px 45px rgba(232,137,12,0.15)';
                  e.currentTarget.style.borderColor = '#E8890C';
                }}
                onMouseLeave={e => {
                  e.currentTarget.querySelector('video')?.pause();
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(10,10,10,0.05)';
                  e.currentTarget.style.borderColor = '#EAE6DF';
                }}
              >
                {renderInstagramReel(reelUrl, idx)}
              </div>
            ))}
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

