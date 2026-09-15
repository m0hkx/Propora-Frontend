import { tenantName } from '../../data/mock';
import type { Property } from '../../data/mock';
import { Card, Icon } from '../../components/ui';
import { Icons } from '../../components/icons';
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
      <div className="controls-row">
        <label className="search search-grow">
          <Icon d={Icons.search} />
          <input
            placeholder="Search documents by name, property, tenant, or lease..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            aria-label="Search documents by name, property, tenant, or lease"
          />
        </label>
        {filtersActive(filters) && (
          <button className="btn btn-ghost btn-sm" type="button" onClick={onClear}>Clear Filters</button>
        )}
      </div>
      <div className="filter-grid">
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

