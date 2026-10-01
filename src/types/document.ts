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
