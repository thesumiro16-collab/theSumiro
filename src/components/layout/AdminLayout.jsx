import { useState, useEffect, useCallback } from 'react';
import { NavLink, Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { supabase } from '../../lib/supabase';
import ToastContainer from '../ui/ToastContainer';

const SIDEBAR_W = 288;
const BREAKPOINT = 768;

export default function AdminLayout() {
  const { user, profile, signOut } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < BREAKPOINT);
  const [isOpen, setIsOpen] = useState(window.innerWidth >= BREAKPOINT);
  const [messageCount, setMessageCount] = useState(0);

  /* ── Track viewport ──────────────────────────────────── */
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < BREAKPOINT;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(true);   // always open on desktop
      } else {
        setIsOpen(false);  // always closed on mobile by default
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /* ── Close sidebar on route change (mobile) ──────────── */
  useEffect(() => {
    if (isMobile) setIsOpen(false);
  }, [location.pathname, isMobile]);

  /* ── Real-time message count ──────────────────────────── */
  useEffect(() => {
    async function fetchCount() {
      try {
        const { count, error } = await supabase
          .from('contact_messages')
          .select('*', { count: 'exact', head: true });
        if (!error) setMessageCount(count || 0);
      } catch { /* table may not exist yet */ }
    }
    fetchCount();
    const channel = supabase
      .channel('sidebar-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_messages' }, fetchCount)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login');
  }, [signOut, navigate]);

  // Build full list of nav items with their permission key
  const ALL_NAV_ITEMS = [
    {
      to: '/app/dashboard', label: 'Design Catalog', permKey: 'dashboard',
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
    },
    {
      to: '/app/shared-folders', label: 'Shared Folders', permKey: 'shared_folders',
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>),
    },
    {
      to: '/app/inbox', label: 'Inquiries Inbox', permKey: 'inbox', badge: messageCount,
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><path strokeLinecap="round" strokeLinejoin="round" d="M3 10l9 6 9-6" /></svg>),
    },
    {
      to: '/app/ticker', label: 'Edit Ticker', permKey: 'ticker',
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>),
    },
    {
      to: '/app/settings', label: 'Enquiry Settings', permKey: 'settings',
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>),
    },
    {
      to: '/app/about-editor', label: 'Story Editor', permKey: 'about_editor',
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>),
    },
    {
      to: '/app/seo', label: 'SEO Settings', permKey: 'seo',
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" /></svg>),
    },
    {
      to: '/app/users', label: 'User Management', permKey: 'users',
      icon: (<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>),
    },
  ];

  // Admins see all items; others see items they have read or write permission for
  const userPerms = profile?.role === 'admin'
    ? Object.fromEntries(ALL_NAV_ITEMS.map(i => [i.permKey, 'write']))
    : (profile?.permissions || {});

  const navItems = ALL_NAV_ITEMS.filter(item =>
    profile?.role === 'admin' || userPerms[item.permKey] === true || userPerms[item.permKey] === 'read' || userPerms[item.permKey] === 'write'
  );

  /* ── Computed layout values ───────────────────────────── */
  // On desktop: push content right when sidebar is open
  // On mobile: never push content (sidebar overlays)
  const mainPaddingLeft = !isMobile && isOpen ? `${SIDEBAR_W}px` : '0';
  const headerPaddingLeft = !isMobile && isOpen ? `${SIDEBAR_W + 24}px` : '24px';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-soft)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Header Bar ──────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '60px',
        background: '#FFFFFF',
        borderBottom: '1px solid var(--color-border-soft)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingRight: '20px',
        paddingLeft: headerPaddingLeft,
        zIndex: 30,
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        transition: 'padding-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(v => !v)}
            aria-label="Toggle navigation menu"
            style={{
              padding: '8px',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              background: 'transparent',
              color: '#0A0A0A',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-soft)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo (shows when sidebar is hidden) */}
          {(!isOpen || isMobile) && (
            <Link to="/app/dashboard" style={{ display: 'flex', alignItems: 'center' }}>
              <img src="/The Sumiro Logo.png" alt="The Sumiro" style={{ height: '34px', width: 'auto' }} />
            </Link>
          )}

          {/* Desktop label */}
          {!isMobile && isOpen && (
            <span style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '10px', fontWeight: 700,
              color: '#A3A3A3',
              letterSpacing: '0.18em', textTransform: 'uppercase',
            }}>
              Administration Panel
            </span>
          )}
        </div>

        {/* Admin badge */}
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '10px', fontWeight: 700,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          color: '#E8890C',
          background: '#FDF3E3',
          border: '1px solid #F5C97A',
          borderRadius: '99px',
          padding: '3px 12px',
          whiteSpace: 'nowrap',
        }}>
          Admin
        </span>
      </header>

      {/* ── Mobile Backdrop ──────────────────────────────── */}
      {isMobile && isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.32)',
            backdropFilter: 'blur(2px)',
            zIndex: 40,
          }}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside style={{
        position: 'fixed',
        top: 0, bottom: 0, left: 0,
        zIndex: 50,
        width: `${SIDEBAR_W}px`,
        background: '#FFFFFF',
        borderRight: '1px solid var(--color-border-soft)',
        display: 'flex', flexDirection: 'column',
        transform: isOpen ? 'translateX(0)' : `translateX(-${SIDEBAR_W}px)`,
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isOpen ? '4px 0 24px rgba(0,0,0,0.06)' : 'none',
        overflow: 'hidden',
      }}>

        {/* Branding */}
        <div style={{
          height: '88px',
          borderBottom: '1px solid var(--color-border-soft)',
          padding: '0 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <Link to="/app/dashboard" onClick={() => isMobile && setIsOpen(false)}>
            <img src="/The Sumiro Logo.png" alt="The Sumiro" style={{ height: '44px', width: 'auto' }} />
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            aria-label="Close sidebar"
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              color: '#737373',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              borderRadius: '6px',
              transition: 'color 0.2s, background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0A'; e.currentTarget.style.background = 'var(--color-bg-soft)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#737373'; e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Nav label */}
        <div style={{ padding: '20px 24px 6px' }}>
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '9px', fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#C4BDB3',
          }}>
            Navigation
          </p>
        </div>

        {/* Nav Items */}
        <nav className="sidebar-nav-scroll" style={{ flex: '1 1 0', minHeight: 0, overflowY: 'auto', overflowX: 'hidden', padding: '6px 14px 20px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '13px 14px',
                borderRadius: '10px',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 600,
                letterSpacing: '0.01em',
                color: isActive ? '#E8890C' : '#3D3D3D',
                background: isActive ? '#FDF3E3' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.18s, color 0.18s',
                border: isActive ? '1px solid #F5C97A' : '1px solid transparent',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge > 0 && (
                <span style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '10px', fontWeight: 700,
                  color: '#FFFFFF',
                  background: '#E8890C',
                  borderRadius: '99px',
                  minWidth: '20px', height: '20px',
                  padding: '0 6px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(232,137,12,0.3)',
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User & Sign Out */}
        <div style={{
          padding: '16px 18px 20px',
          borderTop: '1px solid var(--color-border-soft)',
          flexShrink: 0,
        }}>
          {user && (
            <div style={{ marginBottom: '10px', padding: '10px 6px', borderRadius: '8px', background: 'var(--color-bg-soft)' }}>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: '#A3A3A3', marginBottom: '3px',
              }}>
                Logged in as
              </p>
              <p style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px', fontWeight: 600,
                color: '#3D3D3D',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={user.email}>
                {user.email}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: '#737373',
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF5F5'; e.currentTarget.style.color = '#EF4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#737373'; }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main style={{
        flex: 1,
        minWidth: 0,
        paddingTop: '60px',
        paddingLeft: mainPaddingLeft,
        transition: 'padding-left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflowX: 'hidden',
      }}>
        {settings.maintenance_mode && (
          <Link
            to="/app/settings"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
              padding: '10px 16px',
              background: '#FDF3E3',
              borderBottom: '1px solid #F5C97A',
              color: '#A16207',
              fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 700,
              letterSpacing: '0.04em', textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
            </svg>
            Maintenance mode is ON — the public site is hidden from visitors. Click to manage.
          </Link>
        )}
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  );
}