import type {
  DocumentStatus,
  Lease,
  MaintenancePriority,
  MaintenanceStatus,
  Payment,
  PropertyStatus,
  Tenant,
  UnitStatus,
} from '../data/mock';

/** Single badge-tone vocabulary every status/priority mapping in the app resolves to. */
export type Tone = 'success' | 'warn' | 'info' | 'danger' | 'neutral';

export function propertyTone(s: PropertyStatus): Tone {
  return s === 'Active' ? 'success' : s === 'Vacant' ? 'warn' : 'danger';
}

export function leaseTone(s: Lease['status']): Tone {
  return s === 'Active' ? 'success' : s === 'Expiring' ? 'warn' : 'danger';
}

export function tenantLeaseTone(s: Tenant['leaseStatus']): Tone {
  return s === 'Active' ? 'success' : s === 'Expiring Soon' ? 'warn' : 'danger';
}

export function paymentTone(s: Payment['status']): Tone {
  return s === 'Paid' ? 'success' : s === 'Pending' ? 'warn' : 'danger';
}

export function tenantStatusTone(s: Tenant['status']): Tone {
  return s === 'Active' ? 'success' : s === 'Pending' ? 'warn' : 'neutral';
}

export function maintenanceStatusTone(s: MaintenanceStatus): Tone {
  if (s === 'Completed') return 'success';
  if (s === 'In Progress') return 'info';
  if (s === 'Scheduled') return 'neutral';
  if (s === 'Paused') return 'danger';
  return 'warn';
}

export function maintenancePriorityTone(p: MaintenancePriority): Tone {
  if (p === 'Urgent') return 'danger';
  if (p === 'High') return 'warn';
  if (p === 'Medium') return 'info';
  return 'neutral';
}

export function docStatusTone(s: DocumentStatus): Tone {
  if (s === 'Active') return 'success';
  if (s === 'Expiring Soon') return 'warn';
  if (s === 'Expired') return 'danger';
  return 'neutral';
}

export function unitStatusTone(s: UnitStatus): Tone {
  return s === 'Occupied' ? 'success' : s === 'Maintenance' ? 'warn' : 'info';
}
