import type { MaintenanceRequest, MaintenanceStatus, Property, Tenant, Unit } from '../../data/mock';
import { staffName, tenantName } from '../../data/mock';

export { maintenanceStatusTone as statusTone, maintenancePriorityTone as priorityTone } from '../../lib/tone';

export type MaintenanceTab = 'All' | 'Open' | 'In Progress' | 'Paused' | 'Scheduled' | 'Completed';

export interface MaintenanceFilters {
  search: string;
  status: 'All' | MaintenanceRequest['status'];
  priority: 'All' | MaintenanceRequest['priority'];
  property: string;
  category: 'All' | MaintenanceRequest['category'];
  /** 'all' | 'unassigned' | a MaintenanceStaff id. */
  assignee: string;
}

export const EMPTY_MFILTERS: MaintenanceFilters = {
  search: '', status: 'All', priority: 'All', property: 'all', category: 'All', assignee: 'all',
};

/** What a request targets, for the table/details "Property/Unit" column and search. */
export function scopeLabel(m: MaintenanceRequest, units: Unit[]): string {
  if (m.scope === 'property') return 'Entire Property';
  if (m.scope === 'units') {
    const names = m.unitIds.map((id) => units.find((u) => u.id === id)?.name ?? id);
    return names.length > 0 ? names.join(', ') : 'Entire Property';
  }
  return '—';
}

/** Joined tenant names for a tenant-scoped request, else a dash. */
export function tenantsLabel(m: MaintenanceRequest, tenants: Tenant[]): string {
  if (m.scope !== 'tenants' || m.tenantIds.length === 0) return '—';
  return m.tenantIds.map((id) => tenantName(id, tenants)).join(', ');
}

/** One search haystack covering property, scope target, tenants and assignee — used by the list search box. */
export function maintenanceSearchText(
  m: MaintenanceRequest,
  properties: Property[],
  units: Unit[],
  tenants: Tenant[],
  staffList: Parameters<typeof staffName>[1]
): string {
  return [
    m.title,
    properties.find((p) => p.id === m.propertyId)?.name ?? '',
    scopeLabel(m, units),
    tenantsLabel(m, tenants),
    staffName(m.assigneeId, staffList),
    m.description,
  ].join(' ');
}

/** Workflow order — used for status/priority column sorting. */
export const MAINTENANCE_STATUS_ORDER = ['Open', 'In Progress', 'Paused', 'Scheduled', 'Completed'] as const satisfies readonly MaintenanceStatus[];

export const MAINTENANCE_PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low'] as const satisfies readonly MaintenanceRequest['priority'][];
