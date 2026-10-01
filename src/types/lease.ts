export type LeaseStatus = 'Active' | 'Expiring' | 'Expired';

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  /** Link to the leased Unit record within `propertyId`. */
  unitId?: string;
  start: string;
  end: string;
  rent: number;
  deposit: number;
  status: LeaseStatus;
}
