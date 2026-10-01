export const navPages = ['dashboard', 'properties', 'tenants', 'leases', 'payments', 'maintenance', 'documents'] as const;
export type NavPage = (typeof navPages)[number];

export const routeToLabel: Record<NavPage, string> = {
  dashboard: 'Dashboard',
  properties: 'Properties',
  tenants: 'Tenants',
  leases: 'Leases',
  payments: 'Payments',
  maintenance: 'Maintenance',
  documents: 'Documents',
};
