import { useState, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <nav
        role="navigation"
        aria-label="Main navigation"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid #EDE9E3',
          transition: 'background 0.3s, box-shadow 0.3s',
          boxShadow: scrolled ? '0 2px 24px rgba(0,0,0,0.06)' : 'none',
        }}
      >
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            aria-label="The Sumiro home"
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            <img
              src="/The Sumiro Logo.png"
              alt="The Sumiro"
              style={{ height: '44px', width: 'auto', transition: 'transform 0.3s', display: 'block' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }} className="nav-desktop">
            {publicLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => ({
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isActive ? '#E8890C' : '#3D3D3D',
                  textDecoration: 'none',
                  position: 'relative',
                  paddingBottom: '4px',
                  transition: 'color 0.2s',
                })}
              >
                {({ isActive }) => (
                  <>
                    {label}
                    <span style={{
                      position: 'absolute', bottom: 0, left: 0,
                      width: isActive ? '100%' : '0%',
                      height: '1.5px',
                      background: '#E8890C',
                      borderRadius: '99px',
                      transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </>
                )}
              </NavLink>
            ))}

            {!loading && (user ? (
              <>
                <NavLink
                  to="/app/dashboard"
                  style={({ isActive }) => ({
                    fontFamily: 'var(--font-sans)',
                    fontSize: '11px', fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: isActive ? '#E8890C' : '#3D3D3D',
                    textDecoration: 'none',
                    position: 'relative', paddingBottom: '4px',
                    transition: 'color 0.2s',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      Dashboard
                      <span style={{
                        position: 'absolute', bottom: 0, left: 0,
                        width: isActive ? '100%' : '0%',
                        height: '1.5px', background: '#E8890C',
                        borderRadius: '99px',
                        transition: 'width 0.3s',
                      }} />
                    </>
                  )}
                </NavLink>
                <button
                  id="nav-logout-btn"
                  onClick={signOut}
                  className="btn-primary"
                  style={{ padding: '10px 22px' }}
                >
                  Logout
                </button>
              </>
            ) : (
              null /* Client Login hidden — restore by replacing null with the Link */
            ))}
          </div>

          {/* Mobile Hamburger */}
          <button
            id="nav-mobile-menu-toggle"
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            style={{
              background: 'none', border: '1.5px solid #E5E0D8',
              borderRadius: '6px', padding: '8px', cursor: 'pointer',
              color: '#0A0A0A', transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {menuOpen && (
        <div
          className="nav-mobile-menu animate-slide-down"
          style={{
            position: 'fixed', inset: '68px 0 0 0',
            background: 'rgba(255,255,255,0.98)',
            backdropFilter: 'blur(20px)',
            display: 'flex', flexDirection: 'column',
            padding: '40px 32px',
            zIndex: 49,
            overflowY: 'auto',
          }}
        >
          <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {publicLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                style={({ isActive }) => ({
                  fontFamily: 'var(--font-sans)',
                  fontSize: '13px', fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: isActive ? '#E8890C' : '#0A0A0A',
                  textDecoration: 'none',
                  padding: '16px 0',
                  borderBottom: '1px solid #F0EDE8',
                  transition: 'color 0.2s',
                })}
                className="animate-fade-up"
              >
                {label}
              </NavLink>
            ))}

            {!loading && (user ? (
              <>
                <NavLink
                  to="/app/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={({ isActive }) => ({
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px', fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: isActive ? '#E8890C' : '#0A0A0A',
                    textDecoration: 'none',
                    padding: '16px 0',
                    borderBottom: '1px solid #F0EDE8',
                  })}
                  className="animate-fade-up"
                >
                  Dashboard
                </NavLink>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '13px', fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    color: '#0A0A0A', background: 'none', border: 'none',
                    textAlign: 'left', padding: '16px 0',
                    borderBottom: '1px solid #F0EDE8',
                    cursor: 'pointer', transition: 'color 0.2s',
                  }}
                  className="animate-fade-up"
                >
                  Logout
                </button>
              </>
            ) : (
              null /* Client Login hidden — restore by replacing null with the Link */
            ))}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', color: '#A3A3A3', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              The Sumiro — Surat, India
            </p>
          </div>
        </div>
      )}
    </>
  );
}
