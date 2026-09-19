import type { Lease } from '../data/mock';
import type { LeaseDraft } from '../pages/Leases/AddLeaseModal';
import { apiFetch, stripNulls } from './config';

type LeaseDoc = Lease;

function toLease(doc: LeaseDoc): Lease {
    return stripNulls(doc);
}

export async function getLeases(): Promise<Lease[]> {
    const data = await apiFetch<{ leases: LeaseDoc[] }>('/leases');
    return data.leases.map(toLease);
}

export async function createLease(d: LeaseDraft): Promise<Lease> {
    const data = await apiFetch<{ lease: LeaseDoc }>('/leases', {
        method: 'POST',
        body: JSON.stringify(d),
    });
    return toLease(data.lease);
}

export async function updateLease(id: string, patch: Partial<LeaseDraft & { status: Lease['status'] }>): Promise<Lease> {
    const data = await apiFetch<{ lease: LeaseDoc }>(`/leases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
    });
    return toLease(data.lease);
}

export async function deleteLease(id: string): Promise<void> {
    await apiFetch(`/leases/${id}`, { method: 'DELETE' });
}
