import type { MaintenanceStaff } from '../data/mock';
import { apiFetch, stripNulls } from './config';

type StaffDoc = MaintenanceStaff;

function toStaff(doc: StaffDoc): MaintenanceStaff {
    return stripNulls(doc);
}

export async function getStaff(): Promise<MaintenanceStaff[]> {
    const data = await apiFetch<{ staff: StaffDoc[] }>('/maintenance/staff');
    return data.staff.map(toStaff);
}

export async function createStaff(patch: Omit<MaintenanceStaff, 'id'>): Promise<MaintenanceStaff> {
    const data = await apiFetch<{ staff: StaffDoc }>('/maintenance/staff', {
        method: 'POST',
        body: JSON.stringify(patch),
    });
    return toStaff(data.staff);
}

export async function updateStaff(id: string, patch: Partial<Omit<MaintenanceStaff, 'id'>>): Promise<MaintenanceStaff> {
    const data = await apiFetch<{ staff: StaffDoc }>(`/maintenance/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
    });
    return toStaff(data.staff);
}

export async function deleteStaff(id: string): Promise<void> {
    await apiFetch(`/maintenance/staff/${id}`, { method: 'DELETE' });
}
