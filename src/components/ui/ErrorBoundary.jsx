import { Component } from 'react';

/**
 * Catches uncaught render errors in the subtree and shows a graceful fallback
 * instead of unmounting the entire app (white screen).
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // In production this is where you'd forward to an error-reporting service.
    if (import.meta.env.DEV) {
      console.error('Uncaught render error:', error, info);
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.assign('/');
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '20px',
          padding: '24px', textAlign: 'center', background: 'var(--color-bg-soft, #FAF9F6)',
        }}>
          <h1 style={{
            fontFamily: 'var(--font-serif, Georgia, serif)',
            fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 400, color: '#1A1A1A',
          }}>
            Something went wrong
          </h1>
          <p style={{
            fontFamily: 'var(--font-sans, system-ui, sans-serif)',
            fontSize: '14px', color: '#737373', maxWidth: '420px', lineHeight: 1.6,
          }}>
            An unexpected error occurred while loading this page. Please try again.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '11px 26px', borderRadius: '10px', border: 'none',
              background: '#E8890C', color: '#FFFFFF', cursor: 'pointer',
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Back to Home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
