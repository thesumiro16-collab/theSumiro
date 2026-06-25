/**
 * Filters designs to only those marked as public.
 *
 * @param {Array} designs - Array of design objects
 * @returns {Array} Only designs where is_public === true
 */
export function selectPublicDesigns(designs) {
  if (!designs) return [];
  return designs.filter((d) => d.is_public === true);
}
