import type { Tenant } from '../../data/mock';
import { tenantById } from '../../data/mock';
import type { SearchSelectOption } from '../../components/searchSelectUtils';

/** The lease fields that a selected tenant's record can fill in. */
export interface TenantPrefill {
  propertyId: string;
  rent: number;
  start: string;
  end: string;
}

/**
 * What the form should hold for the newly selected tenant.
 *
 * Always returns a complete value — for a cleared or unresolvable selection it
 * returns the pristine defaults — so the caller can overwrite unconditionally
 * and nothing from the previously selected tenant can survive the change.
 */
export function tenantPrefill(
  tenantId: string,
  tenants: Tenant[],
  defaultPropertyId: string
): TenantPrefill {
  const t = tenantId === '' ? undefined : tenantById(tenantId, tenants);
  if (!t) return { propertyId: defaultPropertyId, rent: 0, start: '', end: '' };
  return { propertyId: t.propertyId, rent: t.rent, start: t.leaseStart, end: t.leaseEnd };
}

/** Optional tenant fields (unit, email, phone) can be blank on a mid-session tenant. */
export const orDash = (v: string | undefined) => (v === undefined || v.trim() === '' ? '—' : v);

export function leaseTone(s: Tenant['leaseStatus']): 'success' | 'warn' | 'danger' {
  return s === 'Active' ? 'success' : s === 'Expiring Soon' ? 'warn' : 'danger';
}

/** Picker label/detail/search terms for a tenant, tolerant of missing fields. */
export function tenantOption(t: Tenant): SearchSelectOption {
  const unit = t.unit.trim() === '' ? '' : ` · Unit ${t.unit}`;
  const contact = [t.email, t.phone]
    .map((v) => (v === undefined ? '' : v.trim()))
    .filter((v) => v !== '')
    .join(' · ');
  return {
    value: t.id,
    label: `${t.name}${unit}`,
    // Email and phone are folded into the search index so users can find a
    // tenant by any identifying info, and rendered as the detail sub-line.
    keywords: `${t.email} ${t.unit} ${t.id}`,
    detail: contact === '' ? undefined : contact,
  };
}
