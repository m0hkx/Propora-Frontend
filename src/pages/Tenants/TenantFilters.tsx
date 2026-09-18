import { Card } from '../../components/ui';
import { FilterControls, FilterRow, FilterTabs, SearchField } from '../../components/FilterBar';
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
      <FilterRow>
        <FilterTabs
          tabs={tabs.map((t) => ({ key: t, label: t, count: counts[t] }))}
          active={tab}
          onChange={(k) => onTab(k as TenantTab)}
          ariaLabel="Filter tenants"
        />
        <FilterControls>
          <SearchField
            value={search}
            onChange={onSearch}
            placeholder="Search tenants..."
            ariaLabel="Search tenants by name, email, phone, property or unit"
            variant="sm"
          />
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
        </FilterControls>
      </FilterRow>
    </Card>
  );
}
