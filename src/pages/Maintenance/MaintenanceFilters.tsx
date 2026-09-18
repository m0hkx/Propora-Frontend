import type { MaintenanceStaff, Property } from '../../data/mock';
import { Card } from '../../components/ui';
import { FilterRow, FilterTabs, SearchField } from '../../components/FilterBar';
import type { MaintenanceFilters, MaintenanceTab } from './maintenanceUtils';

const tabs: MaintenanceTab[] = ['All', 'Open', 'In Progress', 'Paused', 'Scheduled', 'Completed'];

export default function MaintenanceFilters({
  tab,
  counts,
  filters,
  properties,
  staff,
  onTab,
  onChange,
}: {
  tab: MaintenanceTab;
  counts: Record<MaintenanceTab, number>;
  filters: MaintenanceFilters;
  properties: Property[];
  staff: MaintenanceStaff[];
  onTab: (t: MaintenanceTab) => void;
  onChange: (f: MaintenanceFilters) => void;
}) {
  const set = (patch: Partial<MaintenanceFilters>) => onChange({ ...filters, ...patch });
  return (
    <Card>
      <FilterTabs
        tabs={tabs.map((t) => ({ key: t, label: t, count: counts[t] }))}
        active={tab}
        onChange={(k) => onTab(k as MaintenanceTab)}
        ariaLabel="Filter by status"
        className="mb-2.5"
      />
      <FilterRow>
        <SearchField
          value={filters.search}
          onChange={(v) => set({ search: v })}
          placeholder="Search maintenance requests..."
          ariaLabel="Search maintenance by title, property, unit, tenant or description"
        />
      </FilterRow>
      <div className="grid grid-cols-5 gap-2 mt-2.5 max-md:grid-cols-2">
        <select value={filters.status} onChange={(e) => set({ status: e.target.value as MaintenanceFilters['status'] })} aria-label="Filter by status">
          <option value="All">Status</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Paused">Paused</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
        </select>
        <select value={filters.priority} onChange={(e) => set({ priority: e.target.value as MaintenanceFilters['priority'] })} aria-label="Filter by priority">
          <option value="All">Priority</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select value={filters.property} onChange={(e) => set({ property: e.target.value })} aria-label="Filter by property">
          <option value="all">All Properties</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={filters.category} onChange={(e) => set({ category: e.target.value as MaintenanceFilters['category'] })} aria-label="Filter by category">
          <option value="All">Category</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Electrical">Electrical</option>
          <option value="HVAC">HVAC</option>
          <option value="Appliance">Appliance</option>
          <option value="Structural">Structural</option>
          <option value="Cleaning">Cleaning</option>
          <option value="General">General</option>
          <option value="Other">Other</option>
        </select>
        <select value={filters.assignee} onChange={(e) => set({ assignee: e.target.value })} aria-label="Filter by assignee">
          <option value="all">Assigned To</option>
          <option value="unassigned">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
    </Card>
  );
}
