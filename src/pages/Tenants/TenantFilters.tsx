import { Card, Icon } from '../../components/ui';
import { Icons } from '../../components/icons';
import type { TenantSort, TenantTab } from './tenantUtils';
import type { SortState } from '../../lib/sort';

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
  sort: SortState<TenantSort>;
  onTab: (t: TenantTab) => void;
  onSearch: (s: string) => void;
  onSort: (s: TenantSort) => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-3 flex-wrap max-md:flex-col max-md:items-stretch">
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
        <div className="flex gap-2 items-center flex-wrap flex-auto justify-end max-md:w-full">
          <label className="search search-sm">
            <Icon d={Icons.search} />
            <input
              placeholder="Search tenants..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search tenants by name, email, phone, property or unit"
            />
          </label>
          {/* Shortcut into the same sort state the column headers drive, so the
              two can never disagree. Direction is toggled from the headers. */}
          <select value={sort.key} onChange={(e) => onSort(e.target.value as TenantSort)} aria-label="Sort tenants" className="max-md:flex-1">
            <option value="featured">Sort</option>
            <option value="name">Name</option>
            <option value="property">Property</option>
            <option value="unit">Unit</option>
            <option value="rent">Monthly rent</option>
            <option value="leaseEnd">Lease end</option>
            <option value="payment">Payment</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
