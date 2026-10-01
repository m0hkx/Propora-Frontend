export type DocumentType =
  | 'Lease'
  | 'Contract'
  | 'Invoice'
  | 'Property Document'
  | 'Tenant Document'
  | 'Maintenance'
  | 'Insurance'
  | 'Legal'
  | 'Other';

export type DocumentStatus = 'Active' | 'Expired' | 'Expiring Soon' | 'Archived';

export interface DocFile {
  id: string;
  name: string;
  propertyId: string;
  unit?: string;
  tenantId?: string;
  leaseId?: string;
  type: DocumentType;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  expirationDate?: string;
  status: DocumentStatus;
  description: string;
}

export interface NewDocDraft {
  name: string;
  propertyId: string;
  tenantId?: string;
  type: DocumentType;
  size: string;
  /** Real byte count — enforced again by the storage layer. */
  sizeBytes: number;
  /** Browser-supplied MIME — advisory only, re-checked by the storage layer. */
  mime: string;
}
