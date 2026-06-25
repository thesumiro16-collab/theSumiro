import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../contexts/ToastContext';

const PAGE_SIZE = 20;

export function useSharedFolders() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'returned'
  const [searchTerm, setSearchTerm] = useState('');
  const [returning, setReturning] = useState({}); // { [id]: true } for optimistic disable
  const { addToast } = useToast();

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('shared_folders')
        .select('*, designs(design_no)', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Search across party name and city
      if (searchTerm.trim()) {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`party_name.ilike.${term},city.ilike.${term}`);
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;
      if (fetchError) throw fetchError;

      // Flatten design_no onto the record
      const flat = (data || []).map((r) => ({
        ...r,
        design_no: r.designs?.design_no ?? '—',
      }));

      setRecords(flat);
      setTotalCount(count ?? 0);
    } catch (err) {
      setError(err.message || 'Failed to load shared folders');
    } finally {
      setLoading(false);
    }
  }, [page, filter, searchTerm]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleSetFilter = useCallback((newFilter) => {
    setPage(1);
    setFilter(newFilter);
  }, []);

  const handleSetSearchTerm = useCallback((term) => {
    setPage(1);
    setSearchTerm(term);
  }, []);

  const markReturned = useCallback(
    async (record) => {
      // Optimistic: disable button
      setReturning((prev) => ({ ...prev, [record.id]: true }));

      const { error: rpcError } = await supabase.rpc('mark_folder_returned', {
        folder_id: record.id,
      });

      if (rpcError) {
        setReturning((prev) => ({ ...prev, [record.id]: false }));
        addToast({ type: 'error', message: 'Failed to mark as returned' });
      } else {
        setRecords((prev) =>
          prev.map((r) => (r.id === record.id ? { ...r, status: 'returned' } : r))
        );
        setReturning((prev) => ({ ...prev, [record.id]: false }));
        addToast({ type: 'success', message: 'Marked as returned' });
      }
    },
    [addToast]
  );

  return {
    records,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    filter,
    searchTerm,
    returning,
    setPage,
    setFilter: handleSetFilter,
    setSearchTerm: handleSetSearchTerm,
    markReturned,
    refetch: fetchRecords,
  };
}
