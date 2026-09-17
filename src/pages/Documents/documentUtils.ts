import type { DocFile, DocumentStatus, DocumentType } from '../../data/mock';

export type DateFilter = 'any' | 'today' | 'week' | 'month' | 'year';

export interface DocFilters {
  search: string;
  property: string;
  type: 'All Types' | DocumentType;
  tenant: string;
  status: 'All' | DocumentStatus;
  date: DateFilter;
}

export const EMPTY_FILTERS: DocFilters = {
  search: '', property: 'all', type: 'All Types', tenant: 'all', status: 'All', date: 'any',
};

export function filtersActive(f: DocFilters): boolean {
  return f.search.trim() !== '' || f.property !== 'all' || f.type !== 'All Types' || f.tenant !== 'all' || f.status !== 'All' || f.date !== 'any';
}
export function docStatusTone(s: DocumentStatus): 'success' | 'warn' | 'danger' | 'neutral' {
  if (s === 'Active') return 'success';
  if (s === 'Expiring Soon') return 'warn';
  if (s === 'Expired') return 'danger';
  return 'neutral';
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

export function matchesDateFilter(uploadDate: string, f: DateFilter, now: Date): boolean {
  if (f === 'any') return true;
  const d = startOfDay(new Date(`${uploadDate}T00:00:00`));
  if (Number.isNaN(d.getTime())) return false;
  const today = startOfDay(now);
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000);
  if (f === 'today') return diffDays === 0;
  if (f === 'week') return diffDays >= 0 && diffDays < 7;
  if (f === 'month') return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  return d.getFullYear() === today.getFullYear();
}

export function docSearchText(d: DocFile, property: string, tenant: string): string {
  return `${d.name} ${property} ${d.unit ?? ''} ${tenant} ${d.type} ${d.leaseId ?? ''}`.toLowerCase();
}
