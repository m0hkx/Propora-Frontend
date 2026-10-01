import type { MaintenanceStaff, Property, Tenant } from '../types';

/**
 * Id → display lookups over the store's live lists. The list is required so a
 * call site can never fall back to stale or fake data and render a raw id.
 */

export function propertyName(id: string, properties: Property[]): string {
  return properties.find((p) => p.id === id)?.name ?? id;
}

/** City part of a property's "street, city" address. */
export function propertyCity(id: string, properties: Property[]): string {
  const addr = properties.find((p) => p.id === id)?.address ?? '';
  const parts = addr.split(',');
  return parts.length > 1 ? (parts[parts.length - 1] ?? '').trim() : addr;
}

/** The one tenant lookup: returns undefined when the id is not in the list. */
export function tenantById(id: string, tenants: Tenant[]): Tenant | undefined {
  return tenants.find((t) => t.id === id);
}

export function tenantName(id: string, tenants: Tenant[]): string {
  return tenantById(id, tenants)?.name ?? id;
}

export function staffName(id: string | undefined, staff: MaintenanceStaff[]): string {
  if (id === undefined) return 'Unassigned';
  return staff.find((s) => s.id === id)?.name ?? 'Unassigned';
}
