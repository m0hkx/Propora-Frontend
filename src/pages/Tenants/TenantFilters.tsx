import { Card, Icon } from '../../components/ui';
import { Icons } from '../../components/icons';
import type { TenantSort, TenantTab } from './tenantUtils';

const tabs: TenantTab[] = ['All', 'Active', 'Pending', 'Expiring', 'Overdue'];

export default function TenantFilters({
  tab,
  counts,
  search,
  sort,
  onTab,
  onSearch,
  onSort,
}: {
  tab: TenantTab;
  counts: Record<TenantTab, number>;
  search: string;
  sort: TenantSort;
  onTab: (t: TenantTab) => void;
  onSearch: (s: string) => void;
  onSort: (s: TenantSort) => void;
}) {
  return (
    <Card>
      <div className="controls-row">
        <div className="tabs" role="tablist" aria-label="Filter tenants">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => onTab(t)}
              className={`tab ${tab === t ? 'active' : ''}`}
            >
              {t} · {counts[t]}
            </button>
          ))}
        </div>
        <div className="controls-side">
          <label className="search search-sm">
            <Icon d={Icons.search} />
            <input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search tenants by name, email, phone, property or unit"
            />
          </label>
          <select value={sort} onChange={(e) => onSort(e.target.value as TenantSort)} aria-label="Sort tenants">
            <option value="featured">Sort</option>
            <option value="name">Name A–Z</option>
            <option value="rent">Rent high–low</option>
            <option value="leaseEnd">Lease ending soon</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
