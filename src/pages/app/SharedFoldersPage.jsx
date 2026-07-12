import { useState } from 'react';
import { useSharedFolders } from '../../hooks/useSharedFolders';
import Pagination from '../../components/ui/Pagination';
import { formatDate, formatRate } from '../../utils/formatters';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const FILTERS = ['all', 'pending', 'returned'];

const statusStyle = {
  pending:  { background: 'rgba(234,179,8,0.10)', color: '#A16207', border: '1px solid rgba(234,179,8,0.3)' },
  returned: { background: 'rgba(34,197,94,0.08)',  color: '#15803D', border: '1px solid rgba(34,197,94,0.25)' },
};

export default function SharedFoldersPage() {
  const { records, loading, error, page, totalPages, filter, searchTerm, returning, setPage, setFilter, setSearchTerm, markReturned } = useSharedFolders();
  const { canWrite } = useAuth();
  const isWritable = canWrite('shared_folders');

  // Date-range for the Excel export (filters by Sent Date)
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');

  const handleExportCSV = async () => {
    try {
      let query = supabase
        .from('shared_folders')
        .select('*, designs(design_no)')
        .order('sent_date', { ascending: false });
      if (filter !== 'all') query = query.eq('status', filter);
      if (exportFrom) query = query.gte('sent_date', exportFrom);
      if (exportTo) query = query.lte('sent_date', exportTo);
      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;

      const exportRecords = (data || []).map((r) => ({ ...r, design_no: r.designs?.design_no ?? '—' }));
      if (exportRecords.length === 0) {
        alert('No records found for the selected date range.');
        return;
      }
      const headers = ['Design No.', 'Party Name', 'City', 'Folders Shared', 'Rate (₹)', 'Sent Date', 'Status'];
      const rows = exportRecords.map(r => [
        r.design_no, r.party_name, r.city, r.folders_shared,
        r.rate != null ? r.rate : '—',
        r.sent_date ? new Date(r.sent_date).toLocaleDateString('en-US') : '—',
        r.status,
      ]);
      const csvContent = [headers.join(','), ...rows.map(row => row.map(val => `"${String(val ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const rangePart = exportFrom || exportTo ? `_${exportFrom || 'start'}_to_${exportTo || 'end'}` : '';
      link.download = `shared_folders_${filter}${rangePart}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    }
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: 'calc(100vh - 60px)', background: 'var(--color-bg-soft)' }}>
      <div className="admin-page-inner">

        {/* ── Page Header ─────────────────────────────── */}
        <div className="animate-fade-up" style={{ marginBottom: '32px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            <Link
              to="/app/dashboard"
              style={{
                fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: '#A3A3A3', textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#E8890C'}
              onMouseLeave={e => e.currentTarget.style.color = '#A3A3A3'}
            >
              Dashboard
            </Link>
            <svg width="12" height="12" fill="none" stroke="#D4C9B5" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0A0A0A' }}>
              Shared Folders
            </span>
          </div>

          <div className="admin-page-header-row" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <span className="pill-label" style={{ marginBottom: '12px', display: 'inline-flex' }}>
                <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                Folder Tracking
              </span>
              <h1 style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 'clamp(1.6rem, 4vw, 2.4rem)',
                fontWeight: 400, color: '#0A0A0A',
                lineHeight: 1.15, marginTop: '10px',
              }}>
                Shared Folders
              </h1>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', marginTop: '6px' }}>
                Track all physical design folder shares with clients
              </p>
            </div>

            {/* Actions row */}
            <div className="admin-header-actions" style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
              {/* Export date range */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="export-from" style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A3A3A3' }}>From</label>
                  <input
                    id="export-from"
                    type="date"
                    value={exportFrom}
                    max={exportTo || undefined}
                    onChange={(e) => setExportFrom(e.target.value)}
                    style={{ height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 10px', fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#3D3D3D', background: '#FFFFFF', outline: 'none' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label htmlFor="export-to" style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#A3A3A3' }}>To</label>
                  <input
                    id="export-to"
                    type="date"
                    value={exportTo}
                    min={exportFrom || undefined}
                    onChange={(e) => setExportTo(e.target.value)}
                    style={{ height: '40px', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 10px', fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#3D3D3D', background: '#FFFFFF', outline: 'none' }}
                  />
                </div>
                {(exportFrom || exportTo) && (
                  <button
                    onClick={() => { setExportFrom(''); setExportTo(''); }}
                    title="Clear date range"
                    style={{ height: '40px', padding: '0 10px', border: '1px solid var(--color-border)', borderRadius: '8px', background: '#FFFFFF', color: '#A3A3A3', cursor: 'pointer', fontFamily: 'var(--font-sans)', fontSize: '11px' }}
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                style={{
                  padding: '10px 18px', borderRadius: '10px',
                  fontSize: '11px', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  border: '1.5px solid #E8890C', color: '#E8890C',
                  background: '#FFFFFF', cursor: 'pointer',
                  height: '40px',
                  transition: 'background 0.2s, color 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E8890C'; e.currentTarget.style.color = '#FFFFFF'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#E8890C'; }}
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Excel
              </button>

              {/* Filter Tabs */}
              <div className="admin-filter-tabs" style={{
                display: 'flex', gap: '6px',
                background: '#FFFFFF',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                padding: '5px',
              }}>
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      padding: '7px 18px', borderRadius: '7px',
                      border: 'none',
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px', fontWeight: 700,
                      letterSpacing: '0.1em', textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'background 0.25s, color 0.25s',
                      background: filter === f ? '#E8890C' : 'transparent',
                      color: filter === f ? '#FFFFFF' : '#737373',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Search Bar ─────────────────────────────── */}
        <div style={{ marginBottom: '20px', position: 'relative', maxWidth: '420px' }}>
          <svg
            width="16" height="16" fill="none" stroke="#A3A3A3" strokeWidth="2" viewBox="0 0 24 24"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by party name or city…"
            style={{
              width: '100%', boxSizing: 'border-box',
              height: '44px', padding: '0 40px 0 42px',
              border: '1px solid var(--color-border)', borderRadius: '10px',
              fontFamily: 'var(--font-sans)', fontSize: '14px',
              color: '#0A0A0A', background: '#FFFFFF', outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#E8890C'; e.target.style.boxShadow = '0 0 0 3px rgba(232,137,12,0.10)'; }}
            onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none'; }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              aria-label="Clear search"
              style={{
                position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                width: '24px', height: '24px', borderRadius: '50%', border: 'none',
                background: 'var(--color-bg-soft)', color: '#737373', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px',
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* ── Loading ─────────────────────────────────── */}
        {loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '80px 24px',
            background: '#FFFFFF', border: '1px solid var(--color-border-soft)', borderRadius: '16px',
          }}>
            <div style={{
              width: '40px', height: '40px',
              border: '2.5px solid #E5E0D8', borderTopColor: '#E8890C',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '16px',
            }} />
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Loading records…
            </p>
          </div>
        )}

        {/* ── Error ───────────────────────────────────── */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '64px 24px', color: '#DC2626', fontFamily: 'var(--font-sans)', fontSize: '14px' }}>
            {error}
          </div>
        )}

        {/* ── Table / Empty ──────────────────────────── */}
        {!loading && !error && (
          <>
            {records.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '80px 24px',
                background: '#FFFFFF', border: '1.5px dashed #D4C9B5', borderRadius: '16px',
              }}>
                <div style={{ color: '#D4C9B5', marginBottom: '16px' }}>
                  <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', fontWeight: 400, color: '#0A0A0A', marginBottom: '8px' }}>No records found</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373' }}>
                  No shared folder records match the current filter.
                </p>
              </div>
            ) : (
              /* ── Horizontally scrollable table wrapper ── */
              <div style={{
                background: '#FFFFFF', border: '1px solid var(--color-border)',
                borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
              }}>
                {/* Scroll hint on mobile */}
                <div className="sf-scroll-hint">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Scroll to see all columns
                </div>

                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{
                    width: '100%',
                    minWidth: '700px',
                    borderCollapse: 'collapse',
                    fontFamily: 'var(--font-sans)',
                  }}>
                    {/* ── Table Head ── */}
                    <thead>
                      <tr style={{ background: 'var(--color-bg-soft)', borderBottom: '1px solid var(--color-border)' }}>
                        {[
                          { label: 'Design No.',  w: '100px' },
                          { label: 'Party Name',  w: 'auto'  },
                          { label: 'City',        w: '90px'  },
                          { label: 'Folders',     w: '70px'  },
                          { label: 'Rate',        w: '100px' },
                          { label: 'Sent Date',   w: '100px' },
                          { label: 'Status',      w: '90px'  },
                          { label: '',            w: '120px' },
                        ].map(({ label, w }) => (
                          <th
                            key={label}
                            style={{
                              padding: '12px 16px',
                              textAlign: 'left',
                              fontFamily: 'var(--font-sans)',
                              fontSize: '9px', fontWeight: 700,
                              letterSpacing: '0.16em',
                              textTransform: 'uppercase',
                              color: '#A3A3A3',
                              whiteSpace: 'nowrap',
                              width: w,
                            }}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    {/* ── Table Body ── */}
                    <tbody>
                      {records.map((record, i) => (
                        <tr
                          key={record.id}
                          className="animate-fade-up"
                          style={{
                            borderBottom: i < records.length - 1 ? '1px solid var(--color-border-soft)' : 'none',
                            transition: 'background 0.18s',
                            cursor: 'default',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-soft)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                          {/* Design No */}
                          <td style={{ padding: '16px 16px', fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', color: '#737373', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                            {record.design_no}
                          </td>
                          {/* Party Name */}
                          <td style={{ padding: '16px 16px', fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, color: '#0A0A0A' }}>
                            {record.party_name}
                          </td>
                          {/* City */}
                          <td style={{ padding: '16px 16px', fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373', whiteSpace: 'nowrap' }}>
                            {record.city}
                          </td>
                          {/* Folders */}
                          <td style={{ padding: '16px 16px', fontFamily: 'var(--font-sans)', fontSize: '16px', fontWeight: 700, color: '#E8890C', textAlign: 'center' }}>
                            {record.folders_shared}
                          </td>
                          {/* Rate */}
                          <td style={{ padding: '16px 16px', fontFamily: 'var(--font-sans)', fontSize: '13px', fontWeight: 600, color: '#0A0A0A', whiteSpace: 'nowrap' }}>
                            {record.rate != null ? formatRate(record.rate) : '—'}
                          </td>
                          {/* Sent Date */}
                          <td style={{ padding: '16px 16px', fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#737373', whiteSpace: 'nowrap' }}>
                            {record.sent_date ? formatDate(record.sent_date) : '—'}
                          </td>
                          {/* Status Badge */}
                          <td style={{ padding: '16px 16px', whiteSpace: 'nowrap' }}>
                            <span style={{
                              fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
                              letterSpacing: '0.1em', textTransform: 'capitalize',
                              padding: '4px 12px', borderRadius: '99px',
                              ...(statusStyle[record.status] || statusStyle.pending),
                            }}>
                              {record.status}
                            </span>
                          </td>
                          {/* Action */}
                          <td style={{ padding: '16px 16px', whiteSpace: 'nowrap' }}>
                            {record.status === 'pending' && isWritable && (
                            <button
                              onClick={() => markReturned(record)}
                              disabled={returning[record.id]}
                              style={{
                                fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                padding: '7px 14px',
                                border: '1.5px solid var(--color-border)',
                                borderRadius: '8px',
                                background: returning[record.id] ? 'var(--color-bg-soft)' : '#FFFFFF',
                                color: '#3D3D3D',
                                cursor: returning[record.id] ? 'not-allowed' : 'pointer',
                                opacity: returning[record.id] ? 0.6 : 1,
                                transition: 'background 0.2s, border-color 0.2s, color 0.2s',
                                whiteSpace: 'nowrap',
                              }}
                              onMouseEnter={e => {
                                if (!returning[record.id]) {
                                  e.currentTarget.style.background = '#E8890C';
                                  e.currentTarget.style.color = '#FFFFFF';
                                  e.currentTarget.style.borderColor = '#E8890C';
                                }
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#FFFFFF';
                                e.currentTarget.style.color = '#3D3D3D';
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                              }}
                            >
                              {returning[record.id] ? 'Marking…' : 'Mark Returned'}
                            </button>
                          )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
