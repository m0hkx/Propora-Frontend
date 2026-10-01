export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  date: string;
  method: 'Bank' | 'Card' | 'Cash';
  status: PaymentStatus;
  /** Source lease for auto-generated rent rows; manual records predate the link. */
  leaseId?: string;
  /** Billing period (YYYY-MM) for auto-generated rent rows; manual records use `date`. */
  period?: string;
}
