import type { Tenant } from '../data/mock';
import type { TenantDraft } from '../pages/Tenants/TenantFormModal';
import { apiFetch, stripNulls } from './config';

type TenantDoc = Tenant;

function toTenant(doc: TenantDoc): Tenant {
    return stripNulls(doc);
}

export async function getTenants(): Promise<Tenant[]> {
    const data = await apiFetch<{ tenants: TenantDoc[] }>('/tenants');
    return data.tenants.map(toTenant);
}

export async function createTenant(d: TenantDraft): Promise<Tenant> {
    const data = await apiFetch<{ tenant: TenantDoc }>('/tenants', {
        method: 'POST',
        body: JSON.stringify(d),
    });
    return toTenant(data.tenant);
}

export async function updateTenant(id: string, d: TenantDraft): Promise<Tenant> {
    const data = await apiFetch<{ tenant: TenantDoc }>(`/tenants/${id}`, {
        method: 'PUT',
        body: JSON.stringify(d),
    });
    return toTenant(data.tenant);
}

export async function deleteTenant(id: string): Promise<void> {
    await apiFetch(`/tenants/${id}`, { method: 'DELETE' });
}
