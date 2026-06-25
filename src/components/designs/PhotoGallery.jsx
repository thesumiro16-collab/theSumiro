import { useState, useEffect } from 'react';
import PlaceholderImage from '../ui/PlaceholderImage';

// Helper to draw rounded rectangle for canvas styling
function drawRoundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    // Fallback for older browsers
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
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

// Generates a base64 watermarked image url with design number & logo burned in
function generateWatermarkedImage(imageUrl, designNo) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Append cache-busting to prevent CORS cache issues
    const cacheBuster = imageUrl.includes('?') ? '&wmark=true' : '?wmark=true';
    img.src = imageUrl + cacheBuster;

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // 1. Draw base image
      ctx.drawImage(img, 0, 0);

      // 2. Load and draw logo watermark
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = '/The Sumiro Logo.png?wmark=true';

      const drawDesignNoBadge = () => {
        ctx.save();
        // Font size relative to image dimensions
        const fontSize = Math.max(16, Math.floor(canvas.width * 0.025));
        ctx.font = `bold ${fontSize}px monospace`;
        ctx.textBaseline = 'top';

        const text = designNo;
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;

        const paddingX = canvas.width * 0.04;
        const paddingY = canvas.height * 0.04;

        const badgePaddingX = fontSize * 0.8;
        const badgePaddingY = fontSize * 0.4;
        const badgeW = textWidth + (badgePaddingX * 2);
        const badgeH = textHeight + (badgePaddingY * 2);
        const badgeX = paddingX;
        const badgeY = paddingY;

        drawRoundRect(ctx, badgeX, badgeY, badgeW, badgeH, 8, 'rgba(0, 0, 0, 0.7)', null);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, badgeX + badgePaddingX, badgeY + badgePaddingY);
        ctx.restore();
      };

      logo.onload = () => {
        ctx.save();
        // Logo width is 18% of canvas width
        const logoTargetWidth = Math.max(80, canvas.width * 0.18);
        const logoAspect = logo.naturalWidth ? (logo.naturalHeight / logo.naturalWidth) : 0.3;
        const logoTargetHeight = logoTargetWidth * logoAspect;

        const paddingX = canvas.width * 0.04;
        const paddingY = canvas.height * 0.04;

        const logoX = canvas.width - logoTargetWidth - paddingX;
        const logoY = canvas.height - logoTargetHeight - paddingY;

        // Draw pill container for logo (white/20, border white/30)
        const bgW = logoTargetWidth + 24;
        const bgH = logoTargetHeight + 24;
        const bgX = logoX - 12;
        const bgY = logoY - 12;

        ctx.lineWidth = Math.max(1, Math.floor(canvas.width * 0.0015));
        drawRoundRect(
          ctx, 
          bgX, 
          bgY, 
          bgW, 
          bgH, 
          12, 
          'rgba(255, 255, 255, 0.2)', 
          'rgba(255, 255, 255, 0.3)'
        );

        ctx.globalAlpha = 0.85;
        ctx.drawImage(logo, logoX, logoY, logoTargetWidth, logoTargetHeight);
        ctx.restore();

        // Draw design number
        drawDesignNoBadge();

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      logo.onerror = () => {
        // Fallback: draw text watermark "The Sumiro" in bottom-right
        ctx.save();
        const fontSize = Math.max(16, Math.floor(canvas.width * 0.025));
        ctx.font = `italic bold ${fontSize}px sans-serif`;
        
        const paddingX = canvas.width * 0.04;
        const paddingY = canvas.height * 0.04;

        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'right';
        
        // Draw text background shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillText("The Sumiro", canvas.width - paddingX + 2, canvas.height - paddingY + 2);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText("The Sumiro", canvas.width - paddingX, canvas.height - paddingY);
        ctx.restore();

        // Draw design number
        drawDesignNoBadge();

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
    };

    img.onerror = () => {
      resolve(imageUrl);
    };
  });
}

function downloadUrl(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function PhotoGallery({ photos, designNo }) {
  const [current, setCurrent] = useState(0);
  const [watermarkedUrls, setWatermarkedUrls] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Safely fallback to first photo if current index is temporarily out of bounds
  const photo = photos && photos.length > 0 ? (photos[current] || photos[0]) : null;
  const hasMultiple = photos && photos.length > 1;

  // Keep current index in bounds if photos length decreases
  useEffect(() => {
    if (photos && current >= photos.length) {
      setCurrent(0);
    }
  }, [photos, current]);

  const prev = () => setCurrent((i) => (i === 0 ? photos.length - 1 : i - 1));
  const next = () => setCurrent((i) => (i === photos.length - 1 ? 0 : i + 1));

  // Pre-generate watermark for current photo in the background
  useEffect(() => {
    if (photo && !watermarkedUrls[photo.secure_url]) {
      generateWatermarkedImage(photo.secure_url, designNo).then(wUrl => {
        setWatermarkedUrls(prev => ({ ...prev, [photo.secure_url]: wUrl }));
      });
    }
  }, [current, photos, designNo, photo]);

  // Handle keyboard inputs when Lightbox is open
  useEffect(() => {
    if (!lightboxOpen) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowRight' && hasMultiple) next();
      if (e.key === 'ArrowLeft' && hasMultiple) prev();
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, current, hasMultiple]);

  if (!photos || photos.length === 0) {
    return <PlaceholderImage className="w-full aspect-square rounded-lg" />;
  }

  const handleDownload = async (e) => {
    if (e) e.stopPropagation();
    const activePhoto = photo;
    if (!activePhoto) return;
    let wUrl = watermarkedUrls[activePhoto.secure_url];
    
    if (!wUrl) {
      setIsProcessing(true);
      try {
        wUrl = await generateWatermarkedImage(activePhoto.secure_url, designNo);
        setWatermarkedUrls(prev => ({ ...prev, [activePhoto.secure_url]: wUrl }));
      } catch {
        wUrl = activePhoto.secure_url;
      } finally {
        setIsProcessing(false);
      }
    }
    
    downloadUrl(wUrl, `${designNo}-${current + 1}.jpg`);
  };

  const handleOpenLightbox = (e) => {
    if (e) e.stopPropagation();
    setLightboxOpen(true);
  };

  return (
    <div className="w-full">
      {/* Main image with overlay */}
      <div className="w-full aspect-square overflow-hidden rounded-lg bg-gray-100 relative group">
        <img
          src={photo.secure_url}
          alt={`Photo ${current + 1}`}
          className="w-full h-full object-cover cursor-zoom-in transition-transform duration-500 hover:scale-[1.02]"
          onClick={handleOpenLightbox}
        />
        
        {/* Overlay: Design Number, Logo Watermark & Hover Controls */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none', zIndex: 10 }}>
          {/* Design No Badge - Top Left */}
          <div 
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(0, 0, 0, 0.75)',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)',
              pointerEvents: 'auto',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace', color: '#FFFFFF' }}>{designNo}</p>
          </div>

          {/* Hover Actions - Top Right */}
          <div 
            className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-250"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              display: 'flex',
              gap: '8px',
              pointerEvents: 'auto',
            }}
          >
            <button
              onClick={handleOpenLightbox}
              className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-sm transition-colors cursor-pointer hover:scale-105 active:scale-95 shadow-md flex items-center justify-center"
              style={{ border: 'none', width: '34px', height: '34px' }}
              title="Open/Zoom Watermarked Image"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              disabled={isProcessing}
              className="bg-black/70 hover:bg-black/90 text-white p-2 rounded-lg backdrop-blur-sm transition-colors cursor-pointer hover:scale-105 active:scale-95 shadow-md flex items-center justify-center disabled:opacity-50"
              style={{ border: 'none', width: '34px', height: '34px' }}
              title="Download Watermarked Image"
            >
              {isProcessing ? (
                <div className="w-[18px] h-[18px] border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              )}
            </button>
          </div>

          {/* Logo Watermark - Bottom Right */}
          <div 
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              pointerEvents: 'auto',
            }}
          >
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30 shadow-sm" style={{ display: 'flex', alignItems: 'center', justifySpaceBetween: 'center' }}>
              <img 
                src="/The Sumiro Logo.png" 
                alt="The Sumiro" 
                className="h-12 w-auto opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Navigation controls — only when multiple photos */}
        {hasMultiple && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 rounded-full w-9 h-9 flex items-center justify-center hover:bg-white shadow-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              ‹
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 text-gray-800 rounded-full w-9 h-9 flex items-center justify-center hover:bg-white shadow-lg transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            >
              ›
            </button>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Photo ${i + 1}`}
                  className={`w-2 h-2 transition-colors rounded-full cursor-pointer ${
                    i === current ? 'bg-gray-800 border border-gray-800' : 'bg-gray-300 border border-gray-400'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col justify-between p-4 md:p-6 animate-fade-in"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Header */}
          <div className="w-full flex justify-between items-center text-white z-10">
            <div className="font-mono text-sm tracking-wider bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
              {designNo} — Photo {current + 1} of {photos.length}
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg backdrop-blur-md transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 text-sm font-medium"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
                Download
              </button>
              <button
                onClick={() => setLightboxOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors cursor-pointer"
                aria-label="Close Lightbox"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Image Viewport */}
          <div className="flex-1 flex items-center justify-center relative my-4" onClick={e => e.stopPropagation()}>
            <div className="relative max-w-full max-h-[80vh] flex items-center justify-center">
              <img
                src={watermarkedUrls[photo.secure_url] || photo.secure_url}
                alt={`Photo ${current + 1} fullscreen`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl transition-all duration-300"
              />
              {!watermarkedUrls[photo.secure_url] && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs rounded-lg">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Navigation buttons (if multiple photos) */}
            {hasMultiple && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm cursor-pointer hover:scale-105"
                  aria-label="Previous image"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/25 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all shadow-lg backdrop-blur-sm cursor-pointer hover:scale-105"
                  aria-label="Next image"
                >
                  <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Footer Indicators */}
          {hasMultiple && (
            <div className="w-full flex justify-center gap-2 pb-2 z-10" onClick={e => e.stopPropagation()}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
