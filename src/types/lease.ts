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

export interface LeaseDraft {
  propertyId: string;
  tenantId: string;
  /** Leased unit within `propertyId`; undefined when the lease covers no specific unit. */
  unitId?: string;
  rent: number;
  deposit: number;
  start: string;
  end: string;
}
