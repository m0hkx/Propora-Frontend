import type { MaintenanceRequest, MaintenanceStatus } from '../data/mock';
import type { NewMaintenanceDraft } from '../pages/Maintenance/NewMaintenanceModal';
import { apiFetch, stripNulls } from './config';

type RequestDoc = MaintenanceRequest;

function toRequest(doc: RequestDoc): MaintenanceRequest {
    return stripNulls(doc);
}

export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
    const data = await apiFetch<{ maintenance: RequestDoc[] }>('/maintenance');
    return data.maintenance.map(toRequest);
}

export async function createMaintenanceRequest(d: NewMaintenanceDraft): Promise<MaintenanceRequest> {
    const data = await apiFetch<{ request: RequestDoc }>('/maintenance', {
        method: 'POST',
        body: JSON.stringify(d),
    });
    return toRequest(data.request);
}

export async function updateMaintenanceStatus(id: string, status: MaintenanceStatus): Promise<MaintenanceRequest> {
    const data = await apiFetch<{ request: RequestDoc }>(`/maintenance/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });
    return toRequest(data.request);
}

export async function updateMaintenanceAssignee(id: string, assigneeId: string | undefined): Promise<MaintenanceRequest> {
    const data = await apiFetch<{ request: RequestDoc }>(`/maintenance/${id}/assignee`, {
        method: 'PATCH',
        body: JSON.stringify({ assigneeId }),
    });
    return toRequest(data.request);
}

export async function deleteMaintenanceRequest(id: string): Promise<void> {
    await apiFetch(`/maintenance/${id}`, { method: 'DELETE' });
}
