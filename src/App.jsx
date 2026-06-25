import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ToastProvider } from './contexts/ToastContext';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ToastContainer from './components/ui/ToastContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy-loaded pages — only downloaded when the route is visited
const HomePage = lazy(() => import('./pages/portfolio/HomePage'));
const AboutPage = lazy(() => import('./pages/portfolio/AboutPage'));
const ContactPage = lazy(() => import('./pages/portfolio/ContactPage'));
const NotFoundPage = lazy(() => import('./pages/portfolio/NotFoundPage'));
const MaintenancePage = lazy(() => import('./pages/portfolio/MaintenancePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/app/DashboardPage'));
const DesignDetailPage = lazy(() => import('./pages/app/DesignDetailPage'));
const SharedFoldersPage = lazy(() => import('./pages/app/SharedFoldersPage'));

// New Admin Panel Pages & Layout
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const InboxPage = lazy(() => import('./pages/app/InboxPage'));
const TickerPage = lazy(() => import('./pages/app/TickerPage'));
const EnquirySettingsPage = lazy(() => import('./pages/app/EnquirySettingsPage'));
const AboutEditorPage = lazy(() => import('./pages/app/AboutEditorPage'));

/* Minimal loading spinner shown while lazy chunks load */
function PageLoader() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', gap: '16px',
    }}>
      <div style={{
        width: '36px', height: '36px',
        border: '2.5px solid #E5E0D8',
        borderTopColor: '#E8890C',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <span style={{
        fontFamily: 'var(--font-sans)',
        fontSize: '10px', letterSpacing: '0.14em',
        textTransform: 'uppercase', color: '#A3A3A3',
      }}>Loading…</span>
    </div>
  );
}

// Layout wrapper for public portfolio pages (incorporates header Navbar and Footer)
function PublicLayout() {
  const { settings, loading } = useSettings();
  const { user } = useAuth();

  // When maintenance mode is on, send public visitors to the maintenance page.
  // Logged-in users (admins) bypass it so they can still preview the live site.
  if (!loading && settings.maintenance_mode && !user) {
    return <Navigate to="/maintenance" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  const hostname = window.location.hostname;
  
  // Detect if strictly admin subdomain (starts with admin.)
  const isAdminSubdomain = hostname.startsWith('admin.');
  
  // Detect if strictly public production domain (no admin prefix)
  const isStrictPublic = hostname === 'sumiro.in' || hostname === 'www.sumiro.in';

  if (isAdminSubdomain) {
    // Admin Subdomain Layout (No public Navbar/Footer, restricted to admin routes)
    return (
      <BrowserRouter>
        <AuthProvider>
          <SettingsProvider>
            <ToastProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Root redirects to dashboard */}
                  <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
                  <Route path="/login" element={<LoginPage />} />

                  {/* Private App — wrapped in ProtectedRoute and AdminLayout */}
                  <Route element={<ProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/app/dashboard" element={<DashboardPage />} />
                      <Route path="/app/design/:id" element={<DesignDetailPage />} />
                      <Route path="/app/shared-folders" element={<SharedFoldersPage />} />
                      <Route path="/app/inbox" element={<InboxPage />} />
                      <Route path="/app/ticker" element={<TickerPage />} />
                      <Route path="/app/settings" element={<EnquirySettingsPage />} />
                      <Route path="/app/about-editor" element={<AboutEditorPage />} />
                    </Route>
                  </Route>

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                </Routes>
              </Suspense>
              <ToastContainer />
            </ToastProvider>
          </SettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  }

  // Public / Main domain or standard localhost development
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Standalone maintenance page (no navbar/footer) */}
                <Route path="/maintenance" element={<MaintenancePage />} />

                {/* Public Portfolio with Header and Footer */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  {/* 404 — keeps navbar/footer */}
                  <Route path="*" element={<NotFoundPage />} />
                </Route>

                {/* If strictly public domain, prevent access to login / app pages. Otherwise allow for local testing. */}
                {isStrictPublic ? (
                  <>
                    <Route path="/login" element={<Navigate to="/" replace />} />
                    <Route path="/app/*" element={<Navigate to="/" replace />} />
                  </>
                ) : (
                  <>
                    <Route path="/login" element={<LoginPage />} />
                    <Route element={<ProtectedRoute />}>
                      <Route element={<AdminLayout />}>
                        <Route path="/app/dashboard" element={<DashboardPage />} />
                        <Route path="/app/design/:id" element={<DesignDetailPage />} />
                        <Route path="/app/shared-folders" element={<SharedFoldersPage />} />
                        <Route path="/app/inbox" element={<InboxPage />} />
                        <Route path="/app/ticker" element={<TickerPage />} />
                        <Route path="/app/settings" element={<EnquirySettingsPage />} />
                      <Route path="/app/about-editor" element={<AboutEditorPage />} />
                      </Route>
                    </Route>
                  </>
                )}
              </Routes>
            </Suspense>
            <ToastContainer />
          </ToastProvider>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
