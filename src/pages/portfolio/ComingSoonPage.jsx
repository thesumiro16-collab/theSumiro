import { useState, useEffect, useRef } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import Seo from '../../components/ui/Seo';
import { supabase } from '../../lib/supabase';

export default function ComingSoonPage() {
  const { settings } = useSettings();
  const comingSoonDescription = settings.countdown_description || 'We are preparing a brand new collection of premium woven silks and jacquards. Stay tuned for the drop!';
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isLapsed, setIsLapsed] = useState(false);
  const canvasRef = useRef(null);
  const hasTriggeredRef = useRef(false);

  const targetDate = settings.countdown_target_date;
  const title = settings.countdown_title || 'Exquisite New Collection Drop';
  const description = settings.countdown_description || 'We are preparing a brand new collection of premium woven silks and jacquards. Stay tuned for the drop!';

  const titleWords = title.trim().split(/\s+/);
  const lastWord = titleWords.length > 1 ? titleWords.pop() : '';
  const initialWords = titleWords.length > 0 ? titleWords.join(' ') : title;

  const triggerAutoOff = async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    try {
      await supabase.rpc('disable_countdown_mode');
    } catch (e) {
      console.error('Failed to auto-disable countdown:', e);
    }
    window.location.href = '/';
  };

  // Calculate countdown
  useEffect(() => {
    if (!targetDate) {
      setIsLapsed(true);
      triggerAutoOff();
      return;
    }

    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      if (difference <= 0) {
        setIsLapsed(true);
        triggerAutoOff();
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    const initialVal = calculateTimeLeft();
    setTimeLeft(initialVal);

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Weave Background & Gold Particles Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particles (Gold dust flakes)
    const particles = [];
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        speedY: -(Math.random() * 0.3 + 0.1),
        speedX: Math.random() * 0.15 - 0.075,
        opacity: Math.random() * 0.4 + 0.15,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Light warm background base
      ctx.fillStyle = '#F7F5F1';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Loom Warp & Weft thread grid lines
      ctx.strokeStyle = '#EDE9E3';
      ctx.lineWidth = 0.5;
      const step = 48;

      // Warp
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Weft
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Floating gold leaf particles
      particles.forEach((p) => {
        ctx.fillStyle = `rgba(232, 137, 12, ${p.opacity})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
        ctx.fill();

        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10 || p.x > canvas.width + 10) {
          p.x = Math.random() * canvas.width;
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleRefresh = () => {
    triggerAutoOff();
  };

  return (
    <div style={{
      minHeight: '100vh',
      color: '#0A0A0A',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      boxSizing: 'border-box',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <Seo
        title="Coming Soon"
        description={comingSoonDescription}
        path="/coming-soon"
      />
      {/* Background Interactive Weaving Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Main Luxury Container */}
      <div style={{
        maxWidth: '600px',
        width: '100%',
        padding: '24px 16px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '36px',
        position: 'relative',
        zIndex: 2,
      }}>

        {/* Brand Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{
            position: 'relative',
            width: '64px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {/* Double outer spinning loader wheel */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '2px dashed #E8890C',
              borderRadius: '50%',
              animation: 'spin 25s linear infinite',
              opacity: 0.5,
            }} />
            <div style={{
              position: 'absolute', inset: '4px',
              border: '1px solid #EDE9E3',
              borderRadius: '50%',
            }} />
            <img
              src="/The Sumiro Logo.png"
              alt="The Sumiro"
              style={{
                width: '38px',
                height: 'auto',
                opacity: 0.9,
              }}
            />
          </div>
          <span style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.3em',
            textTransform: 'uppercase',
            color: '#E8890C',
          }}>
            THE SUMIRO
          </span>
        </div>

        {/* Title & Countdown Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', alignItems: 'center' }}>
          <div>

            <h1 style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(2.5rem, 7vw, 4.2rem)',
              fontWeight: 300,
              lineHeight: 1.15,
              color: '#0A0A0A',
              margin: 0,
            }}>
              {initialWords}{' '}
              {lastWord && (
                <span style={{
                  fontStyle: 'italic',
                  color: '#E8890C',
                  fontWeight: 400,
                }}>
                  {lastWord}
                </span>
              )}
            </h1>
            <p style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '14px',
              color: '#44403C',
              lineHeight: 1.6,
              marginTop: '12px',
              marginBottom: 0,
              fontWeight: 400,
              maxWidth: '480px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}>
              {description}
            </p>
          </div>

          {/* Countdown layout */}
          {!isLapsed ? (
            <div style={{ display: 'flex', gap: '14px', width: '100%', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '400px', margin: '8px 0' }}>
              {[
                { label: 'Days', val: timeLeft.days },
                { label: 'Hours', val: timeLeft.hours },
                { label: 'Minutes', val: timeLeft.minutes },
                { label: 'Seconds', val: timeLeft.seconds },
              ].map(({ label, val }) => (
                <div
                  key={label}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.borderColor = 'rgba(232, 137, 12, 0.35)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(232, 137, 12, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = 'rgba(232, 137, 12, 0.15)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(232, 137, 12, 0.04)';
                  }}
                  style={{
                    flex: '1 1 76px',
                    maxWidth: '85px',
                    background: 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(8px)',
                    borderTop: '3px solid #E8890C',
                    borderLeft: '1px solid rgba(232, 137, 12, 0.15)',
                    borderRight: '1px solid rgba(232, 137, 12, 0.15)',
                    borderBottom: '1px solid rgba(232, 137, 12, 0.15)',
                    borderRadius: '12px',
                    padding: '14px 6px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: '0 8px 24px rgba(232, 137, 12, 0.04)',
                    cursor: 'default',
                  }}
                >
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                    fontWeight: 700,
                    color: '#E8890C',
                    lineHeight: 1,
                  }}>
                    {String(val).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#57534E',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    {label}
                    {label === 'Seconds' && (
                      <span style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#E8890C',
                        display: 'inline-block',
                        animation: 'blink 1.2s infinite ease-in-out',
                      }} />
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#15803D', fontWeight: 600, margin: 0 }}>
                The collection has launched!
              </p>
              <button
                onClick={handleRefresh}
                className="btn-primary"
                style={{
                  padding: '11px 28px',
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  borderRadius: '8px',
                }}
              >
                ENTER ARCHIVE
              </button>
            </div>
          )}
        </div>

        {/* Footer Helpline Links */}
        <div style={{
          borderTop: '1px solid #EDE9E3',
          width: '100%',
          paddingTop: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#44403C', fontWeight: 500, margin: 0 }}>
            Interested in previews? Connect with our showroom team
          </p>
          {settings.enquiry_phone && (
            <a
              href={`https://wa.me/${settings.enquiry_phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 600,
                color: '#15803D',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 16px',
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '99px',
                transition: 'background 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(34, 197, 94, 0.06)'}
            >
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.49-3.238l.385.228c1.547.919 3.494 1.405 5.076 1.406 5.86 0 10.627-4.757 10.63-10.623.002-2.84-1.1-5.511-3.104-7.519C17.53 2.247 14.86 1.15 12.01 1.15 6.148 1.15 1.385 5.908 1.382 11.777c-.001 1.957.513 3.864 1.488 5.545l.269.465-1.01 3.693 3.786-.993-.362.215zm13.123-5.282c-.318-.159-1.88-.928-2.171-1.033-.29-.105-.502-.158-.713.159-.211.317-.818 1.031-1.003 1.242-.185.21-.37.24-.688.081-1.884-.943-3.126-1.554-4.38-2.731-.329-.307-.633-.679-.933-1.096-.184-.316-.02-.488.139-.646.144-.143.318-.371.477-.556.16-.184.212-.317.318-.528.106-.212.053-.397-.026-.555-.079-.159-.713-1.718-.977-2.352-.258-.619-.52-.534-.713-.544-.185-.01-.397-.012-.609-.012-.211 0-.555.08-.846.397-.29.317-1.11 1.084-1.11 2.642 0 1.557 1.136 3.065 1.295 3.276.159.212 2.235 3.413 5.414 4.786.756.327 1.346.522 1.807.669.76.241 1.452.207 2.001.125.612-.091 1.88-.767 2.145-1.473.264-.707.264-1.317.185-1.423-.079-.106-.29-.159-.609-.318z" />
              </svg>
              Message Showroom
            </a>
          )}
        </div>
      </div>

      {/* Keyframe loader style */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(232, 137, 12, 0.3);
          }
          50% {
            transform: scale(1.04);
            box-shadow: 0 4px 20px rgba(232, 137, 12, 0.6);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(232, 137, 12, 0.3);
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.15; transform: scale(0.85); }
          50% { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}
