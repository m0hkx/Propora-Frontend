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
