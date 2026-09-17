import type { Tenant } from '../../data/mock';

export type TenantTab = 'All' | 'Active' | 'Pending' | 'Expiring' | 'Overdue';
export type TenantSort = 'featured' | 'name' | 'rent' | 'leaseEnd';
export type TenantAction = 'view' | 'edit' | 'lease' | 'payments' | 'delete';

export function initials(name: string): string {
  return name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
}

const avatarPalette = ['#0F766E', '#0369A1', '#7C3AED', '#B45309', '#475569', '#047857'];

export function avatarBg(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0;
  return avatarPalette[Math.abs(h) % avatarPalette.length];
}

export function leaseTone(s: Tenant['leaseStatus']): 'success' | 'warn' | 'danger' {
  return s === 'Active' ? 'success' : s === 'Expiring Soon' ? 'warn' : 'danger';
}

export function paymentTone(s: Tenant['paymentStatus']): 'success' | 'warn' | 'danger' {
  return s === 'Paid' ? 'success' : s === 'Pending' ? 'warn' : 'danger';
}

export function tenantTone(s: Tenant['status']): 'success' | 'warn' | 'neutral' {
  return s === 'Active' ? 'success' : s === 'Pending' ? 'warn' : 'neutral';
}

export function matchesTab(t: Tenant, tab: TenantTab): boolean {
  if (tab === 'All') return true;
  if (tab === 'Active') return t.status === 'Active';
  if (tab === 'Pending') return t.status === 'Pending';
  if (tab === 'Expiring') return t.leaseStatus === 'Expiring Soon';
  return t.paymentStatus === 'Overdue';
}
