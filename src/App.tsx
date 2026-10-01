import { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard/Dashboard';
import Properties from './pages/Properties/Properties';
import Tenants from './pages/Tenants/Tenants';
import Leases from './pages/Leases/Leases';
import Payments from './pages/Payments/Payments';
import Maintenance from './pages/Maintenance/Maintenance';
import Documents from './pages/Documents/Documents';
import Profile from './pages/Profile';
import Toasts from './components/Toasts';
import TopBar from './components/TopBar';
import PageHeader from './components/PageHeader';
import GlobalModals, { type GlobalModal } from './components/GlobalModals';
import { useStore } from './state/useStore';
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ErrorBoundary, getErrorMessage } from 'react-error-boundary';

function AppShell() {
  const loadAll = useStore((s) => s.loadAll);

  const location = useLocation();
  const [openModal, setOpenModal] = useState<GlobalModal | null>(null);
  // Without this, a failed boot load looks like an empty account rather than an error.
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(
    () =>
      loadAll().catch((err) => {
        console.error('[boot] failed to load account data', err);
        setLoadFailed(true);
      }),
    [loadAll],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const retryLoad = () => {
    setLoadFailed(false);
    void load();
  };

  return (
    <div className="mx-auto w-full max-w-360 px-5.5 pt-4.5 pb-12 max-md:px-3 max-md:pb-10">
      <TopBar />
      <PageHeader onAction={setOpenModal} />

      {loadFailed ? (
        <div
          role="alert"
          className="mx-1 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-card border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
        >
          <span>Couldn't load your account data, so some pages may look empty.</span>
          <button className="btn btn-ghost btn-sm" type="button" onClick={retryLoad}>Retry</button>
        </div>
      ) : null}

      <main>
        <div key={location.pathname} className="page-enter">
          <ErrorBoundary
            fallbackRender={({ error, resetErrorBoundary }) => (
              <div role="alert">
                <p>Something went wrong. Please try again.</p>
                {import.meta.env.DEV ? <pre>{getErrorMessage(error)}</pre> : null}
                <button onClick={resetErrorBoundary}>Try again</button>
              </div>
            )}
          >
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/properties" element={<Properties />} />
              <Route path="/tenants" element={<Tenants />} />
              <Route path="/leases" element={<Leases />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </main>

      <GlobalModals open={openModal} onClose={() => setOpenModal(null)} />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
