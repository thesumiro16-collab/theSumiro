import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Spinner from '../../components/ui/Spinner';
import { useSettings } from '../../hooks/useSettings';

export default function LoginPage() {
  const { settings } = useSettings();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/app/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn(form.email, form.password);
      navigate(redirect, { replace: true });
    } catch {
      setError('Email or password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="animate-fade-in"
      style={{
        minHeight: 'calc(100vh - 68px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #FFFFFF 0%, #F7F5F1 60%, #F0EDE8 100%)',
        padding: '40px 24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Dot bg */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, #D4C9B5 1px, transparent 1px)',
        backgroundSize: '28px 28px', opacity: 0.3,
        maskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 40%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 80% at 50% 50%, black 40%, transparent 100%)',
      }} />
      {/* Saffron glow */}
      <div style={{
        position: 'absolute', top: '20%', right: '15%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(232,137,12,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px' }}>

        {/* Logo + Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img
            src="/The Sumiro Logo.png"
            alt="The Sumiro"
            style={{ height: '72px', width: 'auto', margin: '0 auto 20px', display: 'block' }}
          />
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: '28px', fontWeight: 400,
            color: '#0A0A0A', marginBottom: '8px',
          }}>
            Client Portal
          </h1>
          <div className="accent-line" style={{ margin: '0 auto 10px' }} />
          <p style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '12px', color: '#A3A3A3',
            letterSpacing: '0.10em', textTransform: 'uppercase',
          }}>
            Sign in with authorized credentials
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E0D8',
          borderRadius: '12px',
          padding: '44px 40px',
          boxShadow: '0 4px 40px rgba(0,0,0,0.06)',
        }}>
          <form id="login-form" onSubmit={handleLogin} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email */}
            <div>
              <label htmlFor="login-email" className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email" name="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="your@email.com"
                className="form-input"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className="form-label">Password</label>
              <input
                id="login-password"
                type="password" name="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: '6px',
                padding: '12px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: '13px', color: '#DC2626',
              }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', marginTop: '4px' }}
            >
              {loading && <Spinner />}
              {loading ? 'Please wait…' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p style={{
          textAlign: 'center',
          fontFamily: 'var(--font-sans)',
          fontSize: '12px', color: '#A3A3A3',
          marginTop: '24px',
        }}>
          Authorized clients only. Contact{' '}
          <a href={`mailto:${settings.enquiry_email}`} style={{ color: '#E8890C' }}>{settings.enquiry_email}</a>{' '}
          to request access.
        </p>
      </div>
    </div>
  );
}
