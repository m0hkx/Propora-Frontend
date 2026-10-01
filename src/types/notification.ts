export type NotificationKind = 'maintenance' | 'payment' | 'lease' | 'tenant';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  link: 'Maintenance' | 'Payments' | 'Leases' | 'Tenants';
}
