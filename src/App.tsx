import { useEffect, useRef, useState } from 'react';
import Dashboard from './pages/Dashboard';
import Properties from './pages/Properties';
import Tenants from './pages/Tenants/Tenants';
import Leases from './pages/Leases';
import Payments from './pages/Payments';
import Maintenance from './pages/Maintenance/Maintenance';
import NewMaintenanceModal from './pages/Maintenance/NewMaintenanceModal';
import type { NewMaintenanceDraft } from './pages/Maintenance/NewMaintenanceModal';
import Documents from './pages/Documents/Documents';
import UploadDocumentModal from './pages/Documents/UploadDocumentModal';
import type { NewDocDraft } from './pages/Documents/UploadDocumentModal';
import Profile from './pages/Profile';
import AddPropertyModal from './pages/Properties/AddPropertyModal';
import TenantFormModal from './pages/Tenants/TenantFormModal';
import type { TenantDraft } from './pages/Tenants/TenantFormModal';
import AddLeaseModal from './pages/Leases/AddLeaseModal';
import type { LeaseDraft } from './pages/Leases/AddLeaseModal';
import RecordPaymentModal from './pages/Payments/RecordPaymentModal';
import type { PaymentDraft } from './pages/Payments/RecordPaymentModal';
import { Icon } from './components/ui';
import { Icons } from './components/icons';
import Toasts from './components/Toasts';
import NotificationsPanel from './components/NotificationsPanel';
import MessagesPanel from './components/MessagesPanel';
import { StoreProvider } from './state/store';
import { useStore } from './state/useStore';
import type { Property } from './data/mock';

type Page = 'Dashboard' | 'Properties' | 'Tenants' | 'Leases' | 'Payments' | 'Maintenance' | 'Documents' | 'Profile';

const navPages: Page[] = ['Dashboard', 'Properties', 'Tenants', 'Leases', 'Payments', 'Maintenance', 'Documents'];

// Pages with their own dedicated search field; the global topbar search stays hidden there
// so there is exactly one primary search per page.
const DEDICATED_SEARCH: Page[] = ['Properties', 'Tenants', 'Documents', 'Maintenance'];

const subtitles: Record<Page, string> = {
  Dashboard: 'Portfolio overview, rent pulse and activity',
  Properties: 'Manage and monitor all properties in your portfolio.',
  Tenants: 'Tenant roster with lease linkage',
  Leases: 'Active, expiring and expired leases',
  Payments: 'Rent history with collection status',
  Maintenance: 'Track, prioritize, and manage property maintenance requests.',
  Documents: 'Manage and organize all property-related documents.',
  Profile: 'Manager profile and preferences',
};

function headerAction(page: Page): string {
  if (page === 'Dashboard' || page === 'Properties') return 'Add Property';
  if (page === 'Maintenance') return 'New Request';
  if (page === 'Documents') return 'Upload Document';
  if (page === 'Tenants') return 'Add Tenant';
  if (page === 'Profile') return 'New Entry';
  return `New ${page.slice(0, -1)}`;
}

function AppShell() {
  const {
    properties, maintenance, tenants, leases, payments,
    addProperty, addTenant, addLease, addPayment, addMaintenance, addDocument,
    pushToast, pushNotification, notifications, conversations,
  } = useStore();
  const [page, setPage] = useState<Page>('Dashboard');
  const [query, setQuery] = useState('');
  const [tenantFocus, setTenantFocus] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerPanel, setHeaderPanel] = useState<'notif' | 'msg' | null>(null);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [addPropOpen, setAddPropOpen] = useState(false);
  const [addTenantOpen, setAddTenantOpen] = useState(false);
  const [addLeaseOpen, setAddLeaseOpen] = useState(false);
  const [recordPayOpen, setRecordPayOpen] = useState(false);
  const [newMaintOpen, setNewMaintOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!headerPanel) return;
    const ref = headerPanel === 'notif' ? notifRef : msgRef;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setHeaderPanel(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setHeaderPanel(null);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [headerPanel]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = conversations.reduce((s, c) => s + c.unread, 0);

  const go = (p: Page, focus: string | null = null) => {
    setTenantFocus(focus);
    setPage(p);
    setHeaderPanel(null);
  };

  const openFullProfile = () => {
    setPage('Profile');
    setMenuOpen(false);
  };

  const onHeaderAction = () => {
    if (page === 'Dashboard' || page === 'Properties') setAddPropOpen(true);
    else if (page === 'Tenants') setAddTenantOpen(true);
    else if (page === 'Leases') setAddLeaseOpen(true);
    else if (page === 'Payments') setRecordPayOpen(true);
    else if (page === 'Maintenance') setNewMaintOpen(true);
    else if (page === 'Documents') setUploadOpen(true);
  };

  const createProperty = (p: Property) => {
    addProperty(p);
    setAddPropOpen(false);
    pushToast('Property created successfully');
    setPage('Properties');
  };

  const createTenant = (d: TenantDraft) => {
    const today = new Date().toISOString().slice(0, 10);
    addTenant({
      id: `t-${Date.now()}`,
      name: d.name,
      email: d.email,
      phone: d.phone === '' ? '—' : d.phone,
      propertyId: d.propertyId,
      unit: d.unit,
      beds: d.beds,
      leaseStart: d.leaseStart === '' ? today : d.leaseStart,
      leaseEnd: d.leaseEnd,
      leaseStatus: 'Active',
      rent: d.rent,
      paymentStatus: 'Paid',
      paymentDate: '—',
      status: d.status,
    });
    setAddTenantOpen(false);
    pushToast(`Tenant ${d.name} added`);
    setPage('Tenants');
  };

  const createLease = (d: LeaseDraft) => {
    const maxId = leases.reduce((m, l) => {
      const n = Number(l.id.replace('L-', ''));
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 1029);
    addLease({
      id: `L-${maxId + 1}`,
      propertyId: d.propertyId,
      tenantId: d.tenantId,
      rent: d.rent,
      deposit: d.deposit,
      start: d.start,
      end: d.end,
      status: 'Active',
    });
    setAddLeaseOpen(false);
    pushToast(`Lease L-${maxId + 1} created`);
  };

  const createPayment = (d: PaymentDraft) => {
    const maxId = payments.reduce((m, p) => {
      const n = Number(p.id.replace('PAY-', ''));
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 9018);
    addPayment({
      id: `PAY-${maxId + 1}`,
      tenantId: d.tenantId,
      propertyId: d.propertyId,
      amount: d.amount,
      date: d.date,
      method: d.method,
      status: d.status,
    });
    setRecordPayOpen(false);
    pushToast(`Payment of $${d.amount.toLocaleString('en-US')} recorded`);
  };

  const createMaintenance = (d: NewMaintenanceDraft) => {
    const maxId = maintenance.reduce((m, r) => {
      const n = Number(r.id.replace('M-', ''));
      return Number.isNaN(n) ? m : Math.max(m, n);
    }, 200);
    const today = new Date().toISOString().slice(0, 10);
    addMaintenance({
      id: `M-${maxId + 1}`,
      propertyId: d.propertyId,
      unit: d.unit,
      tenantId: d.tenantId,
      title: d.title,
      description: d.description,
      category: d.category,
      priority: d.priority,
      status: 'Open',
      reported: today,
      scheduledDate: d.scheduledDate,
      assignee: d.assignee,
      estimatedCost: d.estimatedCost,
      history: [
        { date: today, text: 'Request created' },
        ...(d.assignee !== 'Unassigned' ? [{ date: today, text: `Assigned to ${d.assignee}` }] : []),
      ],
    });
    setNewMaintOpen(false);
    pushToast('Maintenance request created');
    pushNotification({
      kind: 'maintenance',
      title: 'New maintenance request',
      detail: d.title,
      time: 'Now',
      link: 'Maintenance',
    });
  };

  const createDocument = (d: NewDocDraft) => {
    const today = new Date().toISOString().slice(0, 10);
    addDocument({
      id: `d-${Date.now()}`,
      name: d.name,
      propertyId: d.propertyId,
      tenantId: d.tenantId,
      type: d.type,
      size: d.size,
      uploadedBy: 'Jordan Miller',
      uploadDate: today,
      status: 'Active',
      description: `${d.type} uploaded ${today}.`,
    });
    setUploadOpen(false);
    pushToast('Document uploaded successfully');
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">P</div>
          <span className="brand-name">Propora</span>
        </div>
        <nav className="nav-pills" aria-label="Primary">
          {navPages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => go(p)}
              className={`nav-pill ${page === p ? 'active' : ''}`}
              aria-current={page === p ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
        </nav>
        <div className="top-actions">
          <div className="avatar-wrap" ref={notifRef}>
            <button
              className="icon-btn badge-wrap"
              type="button"
              aria-label={`Notifications${unreadNotifications > 0 ? `, ${unreadNotifications} unread` : ''}`}
              aria-haspopup="menu"
              aria-expanded={headerPanel === 'notif'}
              onClick={() => setHeaderPanel((v) => (v === 'notif' ? null : 'notif'))}
            >
              <Icon d={Icons.bell} />
              {unreadNotifications > 0 ? <span className="count-badge">{unreadNotifications}</span> : null}
            </button>
            {headerPanel === 'notif' ? (
              <NotificationsPanel onNavigate={(p) => go(p)} onClose={() => setHeaderPanel(null)} />
            ) : null}
          </div>
          <div className="avatar-wrap" ref={msgRef}>
            <button
              className="icon-btn badge-wrap"
              type="button"
              aria-label={`Messages${unreadMessages > 0 ? `, ${unreadMessages} unread` : ''}`}
              aria-haspopup="menu"
              aria-expanded={headerPanel === 'msg'}
              onClick={() => setHeaderPanel((v) => (v === 'msg' ? null : 'msg'))}
            >
              <Icon d={Icons.card} />
              {unreadMessages > 0 ? <span className="count-badge">{unreadMessages}</span> : null}
            </button>
            {headerPanel === 'msg' ? <MessagesPanel /> : null}
          </div>
          <div className="avatar-wrap" ref={menuRef}>
            <button
              className="avatar"
              type="button"
              title="Jordan Miller - Account"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              style={{ border: '2px solid #fff', cursor: 'pointer' }}
            >
              JM
            </button>
            {menuOpen && (
              <div className="dropdown" role="menu" aria-label="Profile menu">
                <div className="dropdown-head">
                  <div className="avatar avatar-lg">JM</div>
                  <div>
                    <strong>Jordan Miller</strong>
                    <div className="small muted">jordan@propora.io</div>
                    <span className="badge success" style={{ marginTop: 4 }}>Property Manager</span>
                  </div>
                </div>
                <button className="btn btn-teal dropdown-full" type="button" onClick={openFullProfile}>
                  Open full profile
                </button>
                <div className="dropdown-section">
                  <div className="dropdown-title">Settings</div>
                  <div className="setting-row">
                    <span>Email notifications</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={emailNotif}
                      className={`switch ${emailNotif ? 'on' : ''}`}
                      onClick={() => setEmailNotif((v) => !v)}
                    >
                      <span className="knob" />
                    </button>
                  </div>
                  <div className="setting-row">
                    <span>SMS rent alerts</span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={smsAlerts}
                      className={`switch ${smsAlerts ? 'on' : ''}`}
                      onClick={() => setSmsAlerts((v) => !v)}
                    >
                      <span className="knob" />
                    </button>
                  </div>
                  <div className="setting-row">
                    <label htmlFor="cur">Currency</label>
                    <select id="cur" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                  <div className="setting-row">
                    <span>Theme</span>
                    <span className="badge neutral">Teal light</span>
                  </div>
                </div>
                <div className="dropdown-foot">
                  <button className="btn btn-ghost" type="button" onClick={() => setMenuOpen(false)}>Close</button>
                  <button className="btn btn-ghost" type="button">Sign out</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Page header -> Title, Description */}
      <div className="page-head">
        <div>
          <h1 className="page-title">{page === 'Dashboard' ? 'Property Management Overview' : page}</h1>
          <p className="page-sub">{subtitles[page]}</p>
        </div>
        <div className="head-actions">
          {DEDICATED_SEARCH.includes(page) ? null : (
            <label className="search">
              <Icon d={Icons.search} />
              <input
                placeholder={`Search ${page.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={`Search ${page}`}
              />
            </label>
          )}
          {page === 'Profile' ? null : (
            <button className="btn btn-primary" type="button" onClick={onHeaderAction}><Icon d={Icons.plus} /> {headerAction(page)}</button>
          )}
        </div>
      </div>

      <main>
        {page === 'Dashboard' && <Dashboard onNavigate={(p) => go(p)} />}
        {page === 'Properties' && <Properties query={query} />}
        {page === 'Tenants' && <Tenants query={query} onNavigate={(p, tenantId) => go(p, tenantId ?? null)} />}
        {page === 'Leases' && <Leases focusTenantId={tenantFocus} onClearFocus={() => setTenantFocus(null)} />}
        {page === 'Payments' && <Payments focusTenantId={tenantFocus} onClearFocus={() => setTenantFocus(null)} />}
        {page === 'Maintenance' && <Maintenance />}
        {page === 'Documents' && <Documents />}
        {page === 'Profile' && <Profile />}
      </main>

      {addPropOpen && <AddPropertyModal onClose={() => setAddPropOpen(false)} onCreate={createProperty} />}

      {addTenantOpen && (
        <TenantFormModal
          title="Add Tenant"
          initial={{
            name: '', email: '', phone: '', propertyId: properties[0]?.id ?? '',
            unit: '', beds: '2 BR', rent: 0, leaseStart: '', leaseEnd: '', status: 'Active',
          }}
          properties={properties}
          onClose={() => setAddTenantOpen(false)}
          onSubmit={createTenant}
        />
      )}

      {addLeaseOpen && (
        <AddLeaseModal
          properties={properties}
          tenants={tenants}
          onClose={() => setAddLeaseOpen(false)}
          onCreate={createLease}
        />
      )}

      {recordPayOpen && (
        <RecordPaymentModal
          properties={properties}
          tenants={tenants}
          onClose={() => setRecordPayOpen(false)}
          onCreate={createPayment}
        />
      )}

      {newMaintOpen && (
        <NewMaintenanceModal
          properties={properties}
          assignees={[...new Set(maintenance.map((m) => m.assignee))].sort()}
          onClose={() => setNewMaintOpen(false)}
          onCreate={createMaintenance}
        />
      )}
      
      {uploadOpen && (
        <UploadDocumentModal properties={properties} onClose={() => setUploadOpen(false)} onCreate={createDocument} />
      )}
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
