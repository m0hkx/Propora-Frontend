export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unit: string;
  /** Link to a managed Unit record; `unit` stays the display label (legacy rows predate units). */
  unitId?: string;
  beds: string;
  leaseStart: string;
  leaseEnd: string;
  leaseStatus: 'Active' | 'Expiring Soon' | 'Expired';
  rent: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  paymentDate: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

export interface TenantDraft {
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unit: string;
  /** Link to a managed unit of the selected property; undefined for free-text units. */
  unitId?: string;
  beds: string;
  rent: number;
  leaseStart: string;
  leaseEnd: string;
  status: Tenant['status'];
}
