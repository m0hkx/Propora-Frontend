import { apiFetch } from './config';

export interface DashboardSummary {
    totalProp: number;
    totalunits: number;
    monthlyRevenue: number;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
    return apiFetch<DashboardSummary>('/dashboard');
}
