/**
 * Formats a design sequence number to the "D-XXXX" format.
 * @param {number} n - The sequential integer
 * @returns {string} e.g. "D-0001"
 */
export function formatDesignNo(n) {
  return 'D-' + String(n).padStart(4, '0');
}

/**
 * Formats an ISO timestamp to a locale date string.
 * @param {string} isoStr - ISO 8601 timestamp
 * @returns {string} locale-formatted date
 */
export function formatDate(isoStr) {
  if (!isoStr) return '';
  return new Date(isoStr).toLocaleDateString();
}

/**
 * Formats a numeric rate as a currency string.
 * @param {number} n
 * @returns {string} e.g. "₹1,200.00"
 */
export function formatRate(n) {
  if (n === null || n === undefined) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(n);
}
