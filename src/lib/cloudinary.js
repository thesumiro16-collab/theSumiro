import { supabase } from './supabase';

/**
 * Fetches a signed upload token from the edge function.
 * Returns { signature, timestamp, api_key, cloud_name, folder }.
 * The Cloudinary API secret never touches the browser.
 */
async function getUploadSignature() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudinary-sign`,
    { headers: { Authorization: `Bearer ${session.access_token}` } }
  );

  if (!res.ok) throw new Error('Failed to get upload signature');

  const data = await res.json();
  if (!data.signature || !data.cloud_name) {
    throw new Error('Invalid upload signature response');
  }
  return data;
}

/**
 * Compresses an image file on the client-side using Canvas.
 * Limits max dimensions to 1600px and reduces JPEG quality to 80%.
 *
 * @param {File} file
 * @returns {Promise<File>}
 */
function compressImage(file) {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file); // Non-images are uploaded as-is
    }

    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      const MAX_WIDTH = 1600;
      const MAX_HEIGHT = 1600;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width <= MAX_WIDTH && height <= MAX_HEIGHT && file.size < 400 * 1024) {
        return resolve(file); // Already small, skip canvas processing
      }

      if (width > height) {
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        },
        'image/jpeg',
        0.8 // 80% JPEG quality
      );
    };

    img.onerror = () => {
      resolve(file); // Fallback to original file on error
    };
  });
}

/**
 * Uploads multiple files to Cloudinary using server-signed requests.
 * Processes files in concurrent workers (limit: 5).
 *
 * @param {File[]} files
 * @param {function(current: number, total: number)} [onProgress]
 * @returns {Promise<Array<{ secure_url: string, public_id: string, fileName: string }>>}
 */
export async function uploadPhotosToCloudinary(files, onProgress) {
  // Get one signature for the whole batch — valid for the upload window (~1 hr)
  const { signature, timestamp, api_key, cloud_name, folder } = await getUploadSignature();

  const results = [];
  const errors  = [];
  let completedCount = 0;
  const total = files.length;

  const CONCURRENCY_LIMIT = 5;
  let fileIndex = 0;

  async function uploadWorker() {
    while (fileIndex < total) {
      const currentIdx = fileIndex++;
      const file = files[currentIdx];
      if (!file) continue;

      try {
        // Compress the image file client-side
        const processedFile = await compressImage(file);

        const formData = new FormData();
        formData.append('file', processedFile);
        formData.append('api_key', api_key);
        formData.append('timestamp', timestamp);
        formData.append('signature', signature);
        formData.append('folder', folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,
          { method: 'POST', body: formData }
        );

        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}));
          // Log full Cloudinary error for diagnosis
          const detail = errorData?.error?.message || JSON.stringify(errorData);
          errors.push(`${file.name}: HTTP ${uploadRes.status} — ${detail}`);
        } else {
          const { secure_url, public_id } = await uploadRes.json();
          results.push({ secure_url, public_id, fileName: file.name });
        }
      } catch (err) {
        errors.push(`${file.name}: ${err.message}`);
      } finally {
        completedCount++;
        onProgress?.(completedCount, total);
      }
    }
  }

  const workers = [];
  const activeWorkers = Math.min(CONCURRENCY_LIMIT, total);
  for (let i = 0; i < activeWorkers; i++) {
    workers.push(uploadWorker());
  }

  await Promise.all(workers);

  if (errors.length > 0) {
    throw new Error(`Upload failed for: ${errors.join('; ')}`);
  }

  return results;
}

/**
 * Deletes a single photo from Cloudinary via the signed edge function.
 *
 * @param {string} publicId
 */
export async function deletePhotoFromCloudinary(publicId) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudinary-sign`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ public_id: publicId }),
    }
  );

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to delete photo: ${errorText}`);
  }

  return await res.json();
}

/**
 * Uploads a single video to Cloudinary using a server-signed request.
 * Uses XHR so upload progress is trackable.
 *
 * @param {File} file
 * @param {function(percent: number)} [onProgress]
 * @returns {Promise<{ secure_url: string, public_id: string, fileName: string }>}
 */
export async function uploadVideoToCloudinary(file, onProgress) {
  const { signature, timestamp, api_key, cloud_name, folder } = await getUploadSignature();

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('folder', folder);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      });
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            secure_url: response.secure_url,
            public_id: response.public_id,
            fileName: file.name,
          });
        } catch {
          reject(new Error('Invalid response from Cloudinary'));
        }
      } else {
        try {
          const errorData = JSON.parse(xhr.responseText);
          reject(new Error(errorData.error?.message || 'Upload failed'));
        } catch {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => reject(new Error('Network error during video upload'));

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloud_name}/video/upload`);
    xhr.send(formData);
  });
}
