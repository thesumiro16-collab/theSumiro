import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const PAGE_SIZE = 20;

export function useDesigns() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Build a base query that excludes system rows
      let countQuery = supabase
        .from('designs')
        .select('*', { count: 'exact', head: true })
        .not('design_no', 'like', 'SYSTEM_%');

      let dataQuery = supabase
        .from('designs')
        .select('*')
        .not('design_no', 'like', 'SYSTEM_%')
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply search filter if present
      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        const searchFilter = `design_no.ilike.${term},fabric_name.ilike.${term},tag.ilike.${term},description.ilike.${term}`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
      }

      // Execute count and data in parallel
      const [countResult, dataResult] = await Promise.all([countQuery, dataQuery]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      setTotalCount(countResult.count || 0);

      const paginated = dataResult.data || [];

      // Fetch first photo for each design on the current page
      let designsWithPhotos = paginated;
      if (paginated.length > 0) {
        const ids = paginated.map((d) => d.id);
        const { data: photos } = await supabase
          .from('design_photos')
          .select('*')
          .in('design_id', ids)
          .order('sort_order', { ascending: true });

        // Keep only the lowest sort_order photo per design
        const photoMap = {};
        (photos || []).forEach((p) => {
          if (!photoMap[p.design_id]) {
            photoMap[p.design_id] = p;
          }
        });

        designsWithPhotos = paginated.map((d) => ({
          ...d,
          photos: photoMap[d.id] ? [photoMap[d.id]] : [],
        }));
      }

      setDesigns(designsWithPhotos);
    } catch (err) {
      setError(err.message || 'Failed to load designs');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm]);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  const handleSetSearchTerm = useCallback((term) => {
    setPage(1);
    setSearchTerm(term);
  }, []);

  return {
    designs,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    searchTerm,
    setPage,
    setSearchTerm: handleSetSearchTerm,
    refetch: fetchDesigns,
  };
}
