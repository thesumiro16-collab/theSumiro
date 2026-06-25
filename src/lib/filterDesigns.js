/**
 * Filters designs by searchTerm against design_no, tag, fabric_name, and description fields.
 * Case-insensitive. Empty term returns all designs.
 *
 * @param {Array} designs - Array of design objects
 * @param {string} searchTerm - Search string
 * @returns {Array} Filtered designs
 */
export function filterDesigns(designs, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return designs;
  const term = searchTerm.trim().toLowerCase();
  return designs.filter((d) => {
    const designNo = (d.design_no || '').toLowerCase();
    const tag = (d.tag || '').toLowerCase();
    const fabricName = (d.fabric_name || '').toLowerCase();
    const description = (d.description || '').toLowerCase();
    
    return (
      designNo.includes(term) ||
      tag.includes(term) ||
      fabricName.includes(term) ||
      description.includes(term)
    );
  });
}
