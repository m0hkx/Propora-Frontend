export type MaintenanceStatus = 'Open' | 'In Progress' | 'Paused' | 'Scheduled' | 'Completed';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Urgent';
/** What a request targets — mutually exclusive; never a mix of the three. */
export type MaintenanceScope = 'property' | 'units' | 'tenants';
export type MaintenanceStaffStatus = 'Active' | 'Inactive';

export interface MaintenanceHistory {
  date: string;
  text: string;
}

/** A member of the maintenance/repair staff a request can be assigned to. */
export interface MaintenanceStaff {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: MaintenanceRequest['category'];
  status: MaintenanceStaffStatus;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  scope: MaintenanceScope;
  /** Populated only when `scope === 'units'`; every id belongs to `propertyId`. */
  unitIds: string[];
  /** Populated only when `scope === 'tenants'`; every id belongs to `propertyId`. */
  tenantIds: string[];
  title: string;
  description: string;
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliance' | 'Structural' | 'Cleaning' | 'General' | 'Other';
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reported: string;
  scheduledDate?: string;
  completedDate?: string;
  /** MaintenanceStaff id; undefined means Unassigned. */
  assigneeId?: string;
  estimatedCost: number;
  actualCost?: number;
  history: MaintenanceHistory[];
}
