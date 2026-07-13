/**
 * Helper to load an image URL into an HTMLImageElement
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for Cloudinary images
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
}

/**
 * Computes a 256-bit average hash (aHash) and average RGB color of an image using a canvas.
 * Resizes the image to 16x16 pixels.
 */
export async function computeImageSignature(imgElementOrUrl) {
  try {
    let img;
    if (typeof imgElementOrUrl === 'string') {
      img = await loadImage(imgElementOrUrl);
    } else {
      img = imgElementOrUrl;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas 2D context');

    // Draw and resize the image
    ctx.drawImage(img, 0, 0, 16, 16);

    const imgData = ctx.getImageData(0, 0, 16, 16);
    const data = imgData.data;

    let totalR = 0, totalG = 0, totalB = 0;
    const grayscale = new Float32Array(256);

    // Compute pixel grayscale values and average colors
    for (let i = 0; i < 256; i++) {
      const idx = i * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      totalR += r;
      totalG += g;
      totalB += b;

      // Grayscale conversion using luminance formula
      grayscale[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Average colors
    const avgR = totalR / 256;
    const avgG = totalG / 256;
    const avgB = totalB / 256;

    // Compute average grayscale value
    let graySum = 0;
    for (let i = 0; i < 256; graySum += grayscale[i++]);
    const avgGray = graySum / 256;

    // Generate 256-bit hash (1 if pixel > average, 0 if <= average)
    let hash = '';
    for (let i = 0; i < 256; i++) {
      hash += grayscale[i] > avgGray ? '1' : '0';
    }

    return { hash, avgColor: { r: avgR, g: avgG, b: avgB } };
  } catch (err) {
    console.error('Error computing image signature:', err);
    return null;
  }
}

/**
 * Compares two signatures and returns a similarity score from 0.0 to 1.0
 */
export function compareSignatures(sig1, sig2) {
  if (!sig1 || !sig2) return 0;

  // 1. Calculate Hamming distance on hashes (perceptual structure match)
  let hammingDistance = 0;
  const len = Math.min(sig1.hash.length, sig2.hash.length);
  for (let i = 0; i < len; i++) {
    if (sig1.hash[i] !== sig2.hash[i]) {
      hammingDistance++;
    }
  }
  // Convert Hamming distance to structural match score (0 to 1)
  const structuralScore = 1 - hammingDistance / len;

  // 2. Calculate Color distance (Euclidean distance in RGB space)
  const rDiff = sig1.avgColor.r - sig2.avgColor.r;
  const gDiff = sig1.avgColor.g - sig2.avgColor.g;
  const bDiff = sig1.avgColor.b - sig2.avgColor.b;
  // Maximum possible Euclidean distance is sqrt(255^2 + 255^2 + 255^2) = 441.67
  const colorDist = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  const colorScore = 1 - colorDist / 441.67;

  // 3. Blend scores (70% structural similarity, 30% color similarity)
  const combinedScore = structuralScore * 0.7 + colorScore * 0.3;

  return combinedScore;
}

/**
 * Runs visual search comparison against loaded designs and their photos list
 */
export async function performVisualSearch(uploadedFile, designsList, allPhotosList, onProgress) {
  // 1. Compute signature of uploaded file
  const fileUrl = URL.createObjectURL(uploadedFile);
  const uploadSig = await computeImageSignature(fileUrl);
  URL.revokeObjectURL(fileUrl);

  if (!uploadSig) return [];

  // Group photos by design_id
  const photosByDesign = {};
  allPhotosList.forEach(p => {
    if (!photosByDesign[p.design_id]) photosByDesign[p.design_id] = [];
    photosByDesign[p.design_id].push(p.secure_url);
  });

  const results = [];
  let processed = 0;
  const total = designsList.length;

  for (const design of designsList) {
    const urls = photosByDesign[design.id] || [];
    let bestScore = 0;

    for (const url of urls) {
      // Check cache first
      const cacheKey = `sumiro_sig_${url}`;
      let sig;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) sig = JSON.parse(cached);
      } catch (e) {
        console.warn('Cache read error:', e);
      }

      if (!sig) {
        sig = await computeImageSignature(url);
        if (sig) {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(sig));
          } catch (e) {
            console.warn('Cache write error:', e);
          }
        }
      }

      if (sig) {
        const score = compareSignatures(uploadSig, sig);
        if (score > bestScore) {
          bestScore = score;
        }
      }
    }

    // Include all designs that have photos, sorted by similarity
    if (urls.length > 0) {
      results.push({
        ...design,
        // Include first photo for rendering compatibility
        photos: [{ secure_url: urls[0] }],
        similarityScore: Math.round(bestScore * 100)
      });
    }

    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / total) * 100));
    }
  }

  // Sort by score descending (most similar first)
  results.sort((a, b) => b.similarityScore - a.similarityScore);
  return results;
}
