import type { Unit } from '../data/mock';
import { apiFetch, stripNulls } from './config';

type UnitDoc = Unit;

function toUnit(doc: UnitDoc): Unit {
    return stripNulls(doc);
}

export async function getPropertyUnits(propertyId: string): Promise<Unit[]> {
    const data = await apiFetch<{ units: UnitDoc[] }>(`/units/properties/${propertyId}/units`);
    return data.units.map(toUnit);
}

/** There's no flat `GET /units` — units are only listable per property, so the store hydrates by fanning out over every property. */
export async function getAllUnits(propertyIds: string[]): Promise<Unit[]> {
    const perProperty = await Promise.all(propertyIds.map(getPropertyUnits));
    return perProperty.flat();
}

export async function createUnit(propertyId: string, patch: Omit<Unit, 'id' | 'propertyId'>): Promise<Unit> {
    const data = await apiFetch<{ unit: UnitDoc }>(`/units/properties/${propertyId}/units`, {
        method: 'POST',
        body: JSON.stringify(patch),
    });
    return toUnit(data.unit);
}

export async function updateUnit(id: string, patch: Partial<Omit<Unit, 'id'>>): Promise<Unit> {
    const data = await apiFetch<{ unit: UnitDoc }>(`/units/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
    });
    return toUnit(data.unit);
}

export async function deleteUnit(id: string): Promise<void> {
    await apiFetch(`/units/${id}`, { method: 'DELETE' });
}
