import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants/Tenants';
import Leases from './pages/Leases';
import Payments from './pages/Payments';
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

  useEffect(() => {
    loadAll().catch((err) => console.error('[boot] failed to load account data', err));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [openModal, setOpenModal] = useState<GlobalModal | null>(null);
  const [query, setQuery] = useState('');

  return (
    <div className="mx-auto w-full max-w-360 px-5.5 pt-4.5 pb-12 max-md:px-3 max-md:pb-10">
      <TopBar />
      <PageHeader query={query} onQueryChange={setQuery} onAction={setOpenModal} />

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
              <Route path="/properties" element={<Properties query={query} />} />
              <Route path="/tenants" element={<Tenants query={query} />} />
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
