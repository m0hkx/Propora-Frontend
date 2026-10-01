import { useLocation } from 'react-router-dom';
import { Icon } from './ui';
import { Icons } from './icons';
import type { GlobalModal } from './GlobalModals';
import { routeToLabel, type NavPage } from '../lib/nav';

// Pages with their own dedicated search field; the global search stays hidden there
const DEDICATED_SEARCH: NavPage[] = ['properties', 'tenants', 'documents', 'maintenance'];

const SUBTITLES: Record<string, string> = {
  Dashboard: 'Portfolio overview, rent pulse and activity',
  Properties: 'Manage and monitor all properties in your portfolio.',
  Tenants: 'Tenant roster with lease linkage',
  Leases: 'Active, expiring and expired leases',
  Payments: 'Rent history with collection status',
  Maintenance: 'Track, prioritize, and manage property maintenance requests.',
  Documents: 'Manage and organize all property-related documents.',
  Profile: 'Manager profile and preferences',
};

// Header button per page: its label and which global create-modal it opens
const HEADER_ACTIONS: Record<NavPage, { label: string; modal: GlobalModal }> = {
  dashboard: { label: 'Add Property', modal: 'property' },
  properties: { label: 'Add Property', modal: 'property' },
  tenants: { label: 'Add Tenant', modal: 'tenant' },
  leases: { label: 'New Lease', modal: 'lease' },
  payments: { label: 'New Payment', modal: 'payment' },
  maintenance: { label: 'New Request', modal: 'maintenance' },
  documents: { label: 'Upload Document', modal: 'document' },
};

interface PageHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onAction: (modal: GlobalModal) => void;
}

export default function PageHeader({ query, onQueryChange, onAction }: PageHeaderProps) {
  const segment = useLocation().pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const isProfile = segment === 'profile';
  const route = segment as NavPage;
  const page = isProfile ? 'Profile' : routeToLabel[route] ?? 'Dashboard';
  const action = isProfile ? undefined : HEADER_ACTIONS[route];

  return (
    <div className="flex items-center justify-between gap-3 flex-wrap mx-1 mt-5.5 mb-4">
      <div>
        <h1 className="font-display text-[26px] m-0 max-md:text-[22px]">
          {route === 'dashboard' ? 'Property Management Overview' : page}
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">{SUBTITLES[page]}</p>
      </div>
      {isProfile ? null : (
        <div className="flex items-center gap-2.5 flex-wrap">
          {DEDICATED_SEARCH.includes(route) ? null : (
            <label className="search max-md:min-w-full">
              <Icon icon={Icons.search} />
              <input
                placeholder={`Search ${page.toLowerCase()}...`}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                aria-label={`Search ${page}`}
              />
            </label>
          )}
          {action ? (
            <button className="btn btn-primary" type="button" onClick={() => onAction(action.modal)}>
              <Icon icon={Icons.plus} /> {action.label}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
