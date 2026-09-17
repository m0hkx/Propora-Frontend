import type { MaintenanceRequest, MaintenanceStatus } from '../../data/mock';

export type MaintenanceTab = 'All' | 'Open' | 'In Progress' | 'Scheduled' | 'Completed';

export interface MaintenanceFilters {
  search: string;
  status: 'All' | MaintenanceRequest['status'];
  priority: 'All' | MaintenanceRequest['priority'];
  property: string;
  category: 'All' | MaintenanceRequest['category'];
  assignee: string;
}

export const EMPTY_MFILTERS: MaintenanceFilters = {
  search: '', status: 'All', priority: 'All', property: 'all', category: 'All', assignee: 'all',
};

export function statusTone(s: MaintenanceStatus): 'success' | 'warn' | 'info' | 'danger' | 'neutral' {
  if (s === 'Completed') return 'success';
  if (s === 'In Progress') return 'info';
  if (s === 'Scheduled') return 'neutral';
  return 'warn';
}

export function priorityTone(p: MaintenanceRequest['priority']): 'danger' | 'warn' | 'info' | 'neutral' {
  if (p === 'Urgent') return 'danger';
  if (p === 'High') return 'warn';
  if (p === 'Medium') return 'info';
  return 'neutral';
}
