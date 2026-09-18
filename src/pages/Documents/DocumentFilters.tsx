import { tenantName } from '../../data/mock';
import type { Property } from '../../data/mock';
import { Card } from '../../components/ui';
import { FilterRow, SearchField } from '../../components/FilterBar';
import type { DateFilter, DocFilters } from './documentUtils';
import { filtersActive } from './documentUtils';

const TYPES = [
  'All Types', 'Lease', 'Contract', 'Invoice', 'Property Document',
  'Tenant Document', 'Maintenance', 'Insurance', 'Legal', 'Other',
] as const;

export default function DocumentFilters({
  filters,
  properties,
  tenantIds,
  onChange,
  onClear,
}: {
  filters: DocFilters;
  properties: Property[];
  tenantIds: string[];
  onChange: (f: DocFilters) => void;
  onClear: () => void;
}) {
  const set = (patch: Partial<DocFilters>) => onChange({ ...filters, ...patch });
  return (
    <Card>
      <FilterRow>
        <SearchField
          value={filters.search}
          onChange={(v) => set({ search: v })}
          placeholder="Search documents by name, property, tenant, or lease..."
          ariaLabel="Search documents by name, property, tenant, or lease"
        />
        {filtersActive(filters) && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClear}>Clear Filters</button>
        )}
      </FilterRow>
      <div className="grid grid-cols-5 gap-2 mt-2.5 max-md:grid-cols-2">
        <select value={filters.property} onChange={(e) => set({ property: e.target.value })} aria-label="Filter by property">
          <option value="all">All Properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select value={filters.type} onChange={(e) => set({ type: e.target.value as DocFilters['type'] })} aria-label="Filter by document type">
          {TYPES.map((t) => (
            <option key={t} value={t}>{t === 'All Types' ? 'Document Type' : t}</option>
          ))}
        </select>
        <select value={filters.tenant} onChange={(e) => set({ tenant: e.target.value })} aria-label="Filter by tenant">
          <option value="all">All Tenants</option>
          {tenantIds.map((id) => (
            <option key={id} value={id}>{tenantName(id)}</option>
          ))}
        </select>
        <select value={filters.status} onChange={(e) => set({ status: e.target.value as DocFilters['status'] })} aria-label="Filter by status">
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Expiring Soon">Expiring Soon</option>
          <option value="Expired">Expired</option>
          <option value="Archived">Archived</option>
        </select>
        <select value={filters.date} onChange={(e) => set({ date: e.target.value as DateFilter })} aria-label="Filter by date">
          <option value="any">Any Date</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
    </Card>
  );
}

