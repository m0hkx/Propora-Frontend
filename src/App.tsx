import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { staffName } from './data/mock';
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
import { EMPTY_PROPERTY_DRAFT } from './pages/Properties/propertyForm';
import type { PropertyDraft } from './pages/Properties/propertyForm';
import TenantFormModal from './pages/Tenants/TenantFormModal';
import type { TenantDraft } from './pages/Tenants/TenantFormModal';
import AddLeaseModal from './pages/Leases/AddLeaseModal';
import type { LeaseDraft } from './pages/Leases/AddLeaseModal';
import RecordPaymentModal from './pages/Payments/RecordPaymentModal';
import type { PaymentDraft } from './pages/Payments/RecordPaymentModal';
import { Icon } from './components/ui';
import { Icons } from './components/icons';
import LogoMark from './components/Logo';
import Toasts from './components/Toasts';
import NotificationsPanel from './components/NotificationsPanel';
import MessagesPanel from './components/MessagesPanel';
import { useStore } from './state/useStore';

const navPages = ['dashboard', 'properties', 'tenants', 'leases', 'payments', 'maintenance', 'documents'] as const;
type NavPage = (typeof navPages)[number];

const routeToLabel: Record<NavPage, string> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  tenants: 'Tenants',
  leases: 'Leases',
  payments: 'Payments',
  maintenance: 'Maintenance',
  documents: 'Documents',
};

// Pages with their own dedicated search field; the global topbar search stays hidden there
const DEDICATED_SEARCH: NavPage[] = ['properties', 'tenants', 'documents', 'maintenance'];

const subtitles: Record<string, string> = {
  Dashboard: 'Portfolio overview, rent pulse and activity',
  Properties: 'Manage and monitor all properties in your portfolio.',
  Tenants: 'Tenant roster with lease linkage',
  Leases: 'Active, expiring and expired leases',
  Payments: 'Rent history with collection status',
  Maintenance: 'Track, prioritize, and manage property maintenance requests.',
  Documents: 'Manage and organize all property-related documents.',
  Profile: 'Manager profile and preferences',
};

function headerAction(page: string): string {
  if (page === 'Dashboard' || page === 'Properties') return 'Add Property';
  if (page === 'Maintenance') return 'New Request';
  if (page === 'Documents') return 'Upload Document';
  if (page === 'Tenants') return 'Add Tenant';
  if (page === 'Profile') return 'New Entry';
  return `New ${page.slice(0, -1)}`;
}

function AppShell() {
  const addProperty = useStore((s) => s.addProperty);
  const addTenant = useStore((s) => s.addTenant);
  const addLease = useStore((s) => s.addLease);
  const addPayment = useStore((s) => s.addPayment);
  const addMaintenance = useStore((s) => s.addMaintenance);
  const addDocument = useStore((s) => s.addDocument);
  const pushToast = useStore((s) => s.pushToast);
  const pushNotification = useStore((s) => s.pushNotification);
  const properties = useStore((s) => s.properties);
  const units = useStore((s) => s.units);
  const maintenance = useStore((s) => s.maintenance);
  const staff = useStore((s) => s.staff);
  const tenants = useStore((s) => s.tenants);
  const leases = useStore((s) => s.leases);
  const payments = useStore((s) => s.payments);
  const notifications = useStore((s) => s.notifications);
  const conversations = useStore((s) => s.conversations);

  const location = useLocation();
  const navigate = useNavigate();

  const segments = location.pathname.split('/').filter(Boolean);
  const currentRoute: NavPage = (segments[0] ?? 'dashboard') as NavPage;
  const currentPage = routeToLabel[currentRoute] ?? 'Dashboard';

  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
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
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen && headerPanel === null && !navOpen) return;

    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (headerPanel !== null) {
        const ref = headerPanel === 'notif' ? notifRef : msgRef;
        if (ref.current && !ref.current.contains(e.target as Node)) setHeaderPanel(null);
      }
      if (navRef.current && !navRef.current.contains(e.target as Node)) setNavOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setHeaderPanel(null);
        setNavOpen(false);
      }
    };

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen, headerPanel, navOpen]);

  const unreadNotifications = notifications.filter((n) => !n.read).length;
  const unreadMessages = conversations.reduce((s, c) => s + c.unread, 0);

  const openFullProfile = () => {
    navigate('/profile');
    setMenuOpen(false);
  };

  const onHeaderAction = () => {
    if (currentRoute === 'dashboard' || currentRoute === 'properties') setAddPropOpen(true);
    else if (currentRoute === 'tenants') setAddTenantOpen(true);
    else if (currentRoute === 'leases') setAddLeaseOpen(true);
    else if (currentRoute === 'payments') setRecordPayOpen(true);
    else if (currentRoute === 'maintenance') setNewMaintOpen(true);
    else if (currentRoute === 'documents') setUploadOpen(true);
  };

  const createProperty = (d: PropertyDraft, imageUrl: string) => {
    const units = Number(d.units);
    const seed = `custom-${Date.now()}`;
    addProperty({
      id: `p-${Date.now()}`,
      name: d.name,
      address: `${d.address}, ${d.city}`,
      country: d.country === '' ? undefined : d.country,
      type: d.type,
      units,
      occupied: 0,
      // Base rent is whatever the user typed — never derived.
      rent: Number(d.baseRent),
      status: d.status,
      image: d.name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase(),
      imageUrl: imageUrl === '' ? `https://picsum.photos/seed/${seed}/600/400` : imageUrl,
      yearBuilt: d.yearBuilt.trim() !== '' ? Number(d.yearBuilt) : new Date().getFullYear(),
    });
    setAddPropOpen(false);
    pushToast('Property created successfully');
    navigate('/properties');
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
      unitId: d.unitId,
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
    navigate('/tenants');
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
      unitId: d.unitId,
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
    // Second gate: the store re-validates the property/unit/tenant relationship
    // even if the form is bypassed.
    const rejected = addMaintenance({
      id: `M-${maxId + 1}`,
      propertyId: d.propertyId,
      scope: d.scope,
      unitIds: d.unitIds,
      tenantIds: d.tenantIds,
      title: d.title,
      description: d.description,
      category: d.category,
      priority: d.priority,
      status: 'Open',
      reported: today,
      scheduledDate: d.scheduledDate,
      assigneeId: d.assigneeId,
      estimatedCost: d.estimatedCost,
      history: [
        { date: today, text: 'Request created' },
        ...(d.assigneeId ? [{ date: today, text: `Assigned to ${staffName(d.assigneeId, staff)}` }] : []),
      ],
    });
    if (rejected) {
      pushToast(rejected);
      return;
    }
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
    // Second gate: the storage layer re-validates even if the form is bypassed.
    const rejected = addDocument(
      {
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
      },
      { sizeBytes: d.sizeBytes, mime: d.mime }
    );
    if (rejected) {
      pushToast(rejected);
      return;
    }
    setUploadOpen(false);
    pushToast('Document uploaded successfully');
  };

  return (
    <div className="mx-auto w-full max-w-[1440px] px-[22px] pt-[18px] pb-12 max-md:px-3 max-md:pb-10">
      <header className="topbar">
        <div ref={navRef} className="flex items-center gap-3 md:contents">
          <button
            className={`icon-btn nav-toggle md:hidden ${navOpen ? 'open' : ''}`}
            type="button"
            aria-label={navOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={navOpen}
            aria-controls="mobile-nav"
            onClick={() => setNavOpen((v) => !v)}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        <div className="brand">
          <div className="brand-mark"><LogoMark /></div>
          <span className="brand-name max-sm:hidden">Propora</span>
        </div>
          {navOpen ? (
            <nav id="mobile-nav" className="mobile-nav md:hidden" aria-label="Primary">
              {navPages.map((p) => (
                <NavLink
                  key={p}
                  to={`/${p}`}
                  onClick={() => setNavOpen(false)}
                  className={({ isActive }: { isActive: boolean }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
                >
                  {routeToLabel[p]}
                  <span className="mobile-nav-go" aria-hidden="true">→</span>
                </NavLink>
              ))}
              <NavLink
                to="/profile"
                onClick={() => setNavOpen(false)}
                className={({ isActive }: { isActive: boolean }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
              >
                Profile
                <span className="mobile-nav-go" aria-hidden="true">→</span>
              </NavLink>
            </nav>
          ) : null}
        </div>
        <nav className="nav-pills max-compact:max-w-[46vw] max-md:hidden" aria-label="Primary">
          {navPages.map((p) => (
            <NavLink
              key={p}
              to={`/${p}`}
              className={({ isActive }: { isActive: boolean }) => `nav-pill ${isActive ? 'active' : ''}`}
            >
              {routeToLabel[p]}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-2.5">
          <div className="relative" ref={notifRef}>
            <button
              className="icon-btn relative"
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
              <NotificationsPanel onClose={() => setHeaderPanel(null)} />
            ) : null}
          </div>
          <div className="relative" ref={msgRef}>
            <button
              className="icon-btn relative"
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
          <div className="relative" ref={menuRef}>
            <button
              className="avatar"
              type="button"
              title="Jordan Miller - Account"
              aria-label="Account menu"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
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
                    <span className="badge success mt-1">Property Manager</span>
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
      <div className="flex items-center justify-between gap-3 flex-wrap mx-1 mt-[22px] mb-4">
        <div>
          <h1 className="font-display text-[26px] m-0 max-md:text-[22px]">{currentRoute === 'dashboard' ? 'Property Management Overview' : currentPage}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{subtitles[currentPage]}</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {DEDICATED_SEARCH.includes(currentRoute) ? null : (
            <label className="search max-md:min-w-full">
              <Icon d={Icons.search} />
              <input
                placeholder={`Search ${currentPage.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={`Search ${currentPage}`}
              />
            </label>
          )}
          {segments[0] === 'profile' ? null : (
            <button className="btn btn-primary" type="button" onClick={onHeaderAction}><Icon d={Icons.plus} /> {headerAction(currentPage)}</button>
          )}
        </div>
      </div>

      <main>
        <div key={location.pathname} className="page-enter">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/properties" element={<Properties query={query} />} />
            <Route path="/tenants" element={<Tenants query={query} />} />
            <Route path="/leases" element={<Leases />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </main>

      {addPropOpen && (
        <AddPropertyModal
          mode="add"
          title="Add Property"
          initial={EMPTY_PROPERTY_DRAFT}
          initialImageUrl=""
          onClose={() => setAddPropOpen(false)}
          onSubmit={createProperty}
        />
      )}

      {addTenantOpen && (
        <TenantFormModal
          title="Add Tenant"
          initial={{
            name: '', email: '', phone: '', propertyId: properties[0]?.id ?? '',
            unit: '', unitId: undefined, beds: '2 BR', rent: 0, leaseStart: '', leaseEnd: '', status: 'Active',
          }}
          properties={properties}
          units={units}
          onClose={() => setAddTenantOpen(false)}
          onSubmit={createTenant}
        />
      )}

      {addLeaseOpen && (
        <AddLeaseModal
          properties={properties}
          tenants={tenants}
          units={units}
          onClose={() => setAddLeaseOpen(false)}
          onCreate={createLease}
        />
      )}

      {recordPayOpen && (
        <RecordPaymentModal
          mode="add"
          title="Record Payment"
          initial={{
            tenantId: '', propertyId: properties[0]?.id ?? '', amount: 0,
            date: new Date().toISOString().slice(0, 10), method: 'Bank', status: 'Paid',
          }}
          properties={properties}
          tenants={tenants}
          onClose={() => setRecordPayOpen(false)}
          onSubmit={createPayment}
        />
      )}

      {newMaintOpen && (
        <NewMaintenanceModal
          properties={properties}
          units={units}
          tenants={tenants}
          staff={staff}
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
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
