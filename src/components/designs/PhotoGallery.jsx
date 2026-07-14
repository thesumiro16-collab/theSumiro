import { useState, useEffect, useRef } from 'react';
import PlaceholderImage from '../ui/PlaceholderImage';

// ─── Canvas watermark helpers ────────────────────────────────────────────────
function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
  if (fill)   { ctx.fillStyle = fill;   ctx.fill();   }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

function generateWatermarkedImage(imageUrl, designNo) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const cb = imageUrl.includes('?') ? '&wmark=true' : '?wmark=true';
    img.src = imageUrl + cb;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = '/The Sumiro Logo.png?wmark=true';

      const drawBadge = () => {
        ctx.save();
        const fs = Math.max(16, Math.floor(canvas.width * 0.025));
        ctx.font = `bold ${fs}px monospace`;
        ctx.textBaseline = 'top';
        const tw = ctx.measureText(designNo).width;
        const px = canvas.width * 0.04, py = canvas.height * 0.04;
        const bpx = fs * 0.8, bpy = fs * 0.4;
        const bw = tw + bpx * 2, bh = fs + bpy * 2;
        drawRoundRect(ctx, px, py, bw, bh, 8, 'rgba(0,0,0,0.7)', null);
        ctx.fillStyle = '#FFF';
        ctx.fillText(designNo, px + bpx, py + bpy);
        ctx.restore();
      };

      const drawLogo = (logo) => {
        ctx.save();
        const lw = Math.max(80, canvas.width * 0.18);
        const lh = lw * ((logo.naturalHeight || 1) / (logo.naturalWidth || 1));
        const px = canvas.width * 0.04, py = canvas.height * 0.04;
        const lx = canvas.width - lw - px, ly = canvas.height - lh - py;
        ctx.lineWidth = Math.max(1, Math.floor(canvas.width * 0.0015));
        drawRoundRect(ctx, lx - 12, ly - 12, lw + 24, lh + 24, 12, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.3)');
        ctx.globalAlpha = 0.85;
        ctx.drawImage(logo, lx, ly, lw, lh);
        ctx.restore();
        drawBadge();
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      logo.onload  = () => drawLogo(logo);
      logo.onerror = () => {
        ctx.save();
        const fs = Math.max(16, Math.floor(canvas.width * 0.025));
        ctx.font = `italic bold ${fs}px sans-serif`;
        const px = canvas.width * 0.04, py = canvas.height * 0.04;
        ctx.textBaseline = 'bottom'; ctx.textAlign = 'right';
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillText('The Sumiro', canvas.width - px + 2, canvas.height - py + 2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fillText('The Sumiro', canvas.width - px, canvas.height - py);
        ctx.restore();
        drawBadge();
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
    };

    img.onerror = () => resolve(imageUrl);
  });
}

function downloadUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function PhotoGallery({ photos, designNo }) {
  const [current, setCurrent]           = useState(0);
  const [watermarkedUrls, setWatermarkedUrls] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Touch swipe state
  const touchStartX = useRef(null);

  const photo      = photos && photos.length > 0 ? (photos[current] || photos[0]) : null;
  const hasMultiple = photos && photos.length > 1;

  // Clamp index
  useEffect(() => {
    if (photos && current >= photos.length) setCurrent(0);
  }, [photos, current]);

  const prev = () => setCurrent(i => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setCurrent(i => (i === photos.length - 1 ? 0 : i + 1));

  // Pre-generate watermark
  useEffect(() => {
    if (photo && !watermarkedUrls[photo.secure_url]) {
      generateWatermarkedImage(photo.secure_url, designNo).then(wUrl =>
        setWatermarkedUrls(prev => ({ ...prev, [photo.secure_url]: wUrl }))
      );
    }
  }, [current, photos, designNo, photo]);

  if (!photos || photos.length === 0) {
    return <PlaceholderImage className="w-full aspect-[3/4] rounded-xl" />;
  }

  const handleDownload = async (e) => {
    if (e) e.stopPropagation();
    if (!photo) return;
    let wUrl = watermarkedUrls[photo.secure_url];
    if (!wUrl) {
      setIsProcessing(true);
      try {
        wUrl = await generateWatermarkedImage(photo.secure_url, designNo);
        setWatermarkedUrls(p => ({ ...p, [photo.secure_url]: wUrl }));
      } catch { wUrl = photo.secure_url; }
      finally  { setIsProcessing(false); }
    }
    downloadUrl(wUrl, `${designNo}-${current + 1}.jpg`);
  };

  // ── Touch handlers for main carousel ──
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  return (
    <div style={{ width: '100%' }}>

      {/* ── Main Carousel ───────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '3 / 4',          // portrait ratio — correct for fabric
          borderRadius: '14px',
          overflow: 'hidden',
          background: '#F2EDE6',
          userSelect: 'none',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <img
          key={photo.secure_url}
          src={photo.secure_url}
          alt={`Design ${designNo} — photo ${current + 1}`}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Design No Badge — always visible */}
        <div style={{
          position: 'absolute', top: '12px', left: '12px',
          background: 'rgba(0,0,0,0.72)', color: '#FFF',
          padding: '5px 12px', borderRadius: '7px',
          backdropFilter: 'blur(6px)',
          fontSize: '11px', fontWeight: 700, fontFamily: 'monospace',
          letterSpacing: '0.06em', pointerEvents: 'none',
        }}>
          {designNo}
        </div>

        {/* Action buttons — always visible on top-right */}
        <div style={{
          position: 'absolute', top: '12px', right: '12px',
          display: 'flex', gap: '6px',
        }}>
          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            title="Download watermarked"
            style={{
              width: '38px', height: '38px', borderRadius: '8px', border: 'none',
              background: 'rgba(0,0,0,0.7)', color: '#FFF', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(6px)', opacity: isProcessing ? 0.6 : 1,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          >
            {isProcessing
              ? <div style={{ width: 18, height: 18, border: '2px solid #FFF', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              : <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            }
          </button>
        </div>

        {/* Logo — bottom right, always visible */}
        <div style={{
          position: 'absolute', bottom: '12px', right: '12px',
          background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(6px)',
          borderRadius: '8px', padding: '8px 10px',
          border: '1px solid rgba(255,255,255,0.28)',
          pointerEvents: 'none',
        }}>
          <img src="/The Sumiro Logo.png" alt="The Sumiro" style={{ height: '36px', width: 'auto', opacity: 0.85 }} />
        </div>

        {/* ── Nav arrows ── always visible on mobile, hover on desktop ── */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              style={{
                position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)',
                width: '38px', height: '38px', borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
                fontSize: '22px', lineHeight: 1, color: '#333', fontWeight: 300,
              }}
            >‹</button>
            <button
              onClick={next}
              aria-label="Next photo"
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                width: '38px', height: '38px', borderRadius: '50%', border: 'none',
                background: 'rgba(255,255,255,0.9)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.20)',
                fontSize: '22px', lineHeight: 1, color: '#333', fontWeight: 300,
              }}
            >›</button>

            {/* Dot indicators — always visible at bottom */}
            <div style={{
              position: 'absolute', bottom: '14px', left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: '6px',
            }}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Photo ${i + 1}`}
                  style={{
                    width: i === current ? '18px' : '7px',
                    height: '7px',
                    borderRadius: '4px',
                    border: 'none', cursor: 'pointer',
                    background: i === current ? '#FFF' : 'rgba(255,255,255,0.5)',
                    transition: 'all 0.25s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Thumbnail strip (desktop) ─────────────────────────────── */}
      {hasMultiple && (
        <div style={{
          display: 'flex', gap: '8px', marginTop: '10px',
          overflowX: 'auto', paddingBottom: '4px',
          scrollbarWidth: 'none',
        }}>
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              style={{
                flexShrink: 0, width: '60px', height: '76px',
                borderRadius: '8px', overflow: 'hidden', border: 'none',
                cursor: 'pointer', padding: 0,
                outline: i === current ? '2.5px solid #E8890C' : '2px solid transparent',
                outlineOffset: '1px',
                opacity: i === current ? 1 : 0.6,
                transition: 'all 0.2s',
              }}
            >
              <img
                src={p.secure_url}
                alt={`Thumb ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Shimmer + spin keyframes */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
