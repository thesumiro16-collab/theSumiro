/**
 * Validates an email address.
 * @param {string} value
 * @returns {string|null} null if valid, error string otherwise
 */
export function validateEmail(value) {
  if (!value || !value.trim()) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(value.trim()) ? null : 'Valid email address required';
}

/**
 * Validates the contact form.
 * @param {{ name: string, email: string, message: string }} fields
 * @returns {{ name?: string, email?: string, message?: string }} errors object (empty = valid)
 */
export function validateContactForm({ name, email, message, phone }) {
  const errors = {};
  if (!name || !name.trim()) errors.name = 'Full name is required';
  else if (name.trim().length > 100) errors.name = 'Name must be 100 characters or fewer';
  
  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  if (!phone || !phone.trim()) {
    errors.phone = 'Mobile number is required';
  } else if (!/^\+?[0-9\s-]{10,15}$/.test(phone.trim())) {
    errors.phone = 'Invalid mobile number format';
  }

  if (!message || !message.trim()) errors.message = 'Message is required';
  else if (message.trim().length > 1000) errors.message = 'Message must be 1000 characters or fewer';
  return errors;
}

/**
 * Validates the design form.
 * @param {{ design_no: string, fabric_name: string, rate: number|string, tag: string, description: string, photos: File[] }} fields
 * @returns {Object} errors object (empty = valid)
 */
export function validateDesignForm({ design_no, fabric_name, rate, photos }) {
  const errors = {};
  if (!design_no || !design_no.trim()) errors.design_no = 'Design number is required';
  if (!fabric_name || !fabric_name.trim()) errors.fabric_name = 'Fabric name is required';
  if (rate === undefined || rate === null || rate === '')
    errors.rate = 'Rate is required';
  else if (isNaN(Number(rate)) || Number(rate) <= 0)
    errors.rate = 'Rate must be a positive number';
  // tag and description are now optional - no validation needed
  if (!photos || photos.length === 0) errors.photos = 'At least one photo is required';
  else if (photos.length > 1000) errors.photos = 'Maximum 1000 photos allowed';
  return errors;
}

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validates a single photo file.
 * @param {File} file
 * @returns {string|null} null if valid, error string otherwise
 */
export function validatePhoto(file) {
  if (!file) return 'No file provided';
  if (!ALLOWED_MIME_TYPES.has(file.type))
    return `${file.name}: Only JPEG, PNG, and WEBP images are allowed`;
  if (file.size > MAX_FILE_SIZE)
    return `${file.name}: File size must not exceed 10 MB`;
  return null;
}

/**
 * Validates the share folder form.
 * @param {{ folders_to_share: number|string, extra_folder: number|string, sent_date: string }} fields
 * @returns {Object} errors object (empty = valid)
 */
export function validateShareFolder({ folders_to_share, extra_folder, sent_date }) {
  const errors = {};
  const count = Number(folders_to_share);
  if (!folders_to_share && folders_to_share !== 0)
    errors.folders_to_share = 'Number of folders is required';
  else if (!Number.isInteger(count) || count <= 0)
    errors.folders_to_share = 'Must be a positive integer';
  else if (count > Number(extra_folder))
    errors.folders_to_share = `Cannot exceed available extra folders (${extra_folder})`;

  if (!sent_date) {
    errors.sent_date = 'Sent date is required';
  }
  return errors;
}

/**
 * Validates a folder count value.
 * @param {number|string} value
 * @returns {boolean} true iff value is a non-negative integer
 */
export function validateFolderCount(value) {
  return Number.isInteger(Number(value)) && Number(value) >= 0 && String(value).indexOf('.') === -1;
}
