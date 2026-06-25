import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';

export default function InboxModal() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      // If table doesn't exist yet on their remote database, show helpful info
      if (err.code === 'PGRST205') {
        setMessages(null);
      } else {
        addToast({ type: 'error', message: err.message || 'Failed to load messages' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    try {
      const { error } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addToast({ type: 'success', message: 'Message deleted successfully' });
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      addToast({ type: 'error', message: err.message || 'Failed to delete message' });
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid #E5E0D8',
          borderTopColor: '#E8890C',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  // Handle case where table is not migrated/created in their Supabase dashboard yet
  if (messages === null) {
    return (
      <div style={{ padding: '12px 0', textAlign: 'center' }}>
        <div style={{ color: '#EF4444', marginBottom: '16px' }}>
          <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 500, color: '#0A0A0A', marginBottom: '8px' }}>
          Table Not Found
        </h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#666666', lineHeight: 1.6, maxWidth: '360px', margin: '0 auto 20px' }}>
          The <strong>contact_messages</strong> table hasn't been created on your Supabase database yet. Please run the SQL migration script:
        </p>
        <code style={{ 
          display: 'block', 
          background: 'var(--color-bg-soft)', 
          padding: '12px', 
          borderRadius: '8px', 
          fontSize: '11px', 
          textAlign: 'left', 
          fontFamily: 'monospace',
          border: '1px solid var(--color-border)',
          whiteSpace: 'pre-wrap',
          color: '#333333'
        }}>
          {`CREATE TABLE contact_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  phone       TEXT NOT NULL,
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);`}
        </code>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px' }}>
        <div style={{ color: '#D4C9B5', marginBottom: '16px' }}>
          <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 24 24" style={{ margin: '0 auto' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0l-8 5-8-5" />
          </svg>
        </div>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 500, color: '#0A0A0A', marginBottom: '6px' }}>
          Inbox is empty
        </h3>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', color: '#737373' }}>
          No contact inquiries have been received yet.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
      {messages.map((m) => (
        <div
          key={m.id}
          style={{
            background: 'var(--color-bg-soft)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: '12px',
            padding: '20px',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          {/* Header info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '16px', fontWeight: 500, color: '#0A0A0A', margin: 0 }}>
                {m.name}
              </h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '2px' }}>
                <a
                  href={`mailto:${m.email}`}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#E8890C', textDecoration: 'none', fontWeight: 500 }}
                >
                  {m.email}
                </a>
                {m.phone && (
                  <a
                    href={`tel:${m.phone}`}
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: '#737373', textDecoration: 'none', fontWeight: 500 }}
                  >
                    · {m.phone}
                  </a>
                )}
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#A3A3A3' }}>
                {formatDate(m.created_at)}
              </span>
              <button
                onClick={() => handleDelete(m.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#A3A3A3',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s, background-color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.color = '#EF4444';
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.color = '#A3A3A3';
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Delete message"
              >
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message body */}
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            color: '#333333',
            lineHeight: 1.6,
            margin: 0,
            whiteSpace: 'pre-wrap'
          }}>
            {m.message}
          </p>
        </div>
      ))}
    </div>
  );
}
