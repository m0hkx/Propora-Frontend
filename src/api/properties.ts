import type { Property } from '../data/mock';
import type { PropertyDraft } from '../pages/Properties/propertyForm';
import { apiFetch, assetUrl, stripNulls } from './config';

interface PropertyDoc {
    id: string;
    name: string;
    address: string;
    city?: string;
    country?: string;
    type: string;
    status: Property['status'];
    totalUnits: number;
    occupied: number;
    baseRent: number;
    yearBuilt?: number;
    image?: string | null;
}

function initials(name: string): string {
    return name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
}

function toProperty(rawDoc: PropertyDoc): Property {
    const doc = stripNulls(rawDoc);
    return {
        id: doc.id,
        name: doc.name,
        address: doc.city ? `${doc.address}, ${doc.city}` : doc.address,
        country: doc.country === '' ? undefined : doc.country,
        type: doc.type,
        units: Number(doc.totalUnits) || 0,
        occupied: Number(doc.occupied) || 0,
        rent: Number(doc.baseRent) || 0,
        status: doc.status,
        image: initials(doc.name),
        imageUrl: doc.image ? assetUrl(`uploads/properties/${doc.image}`) : `https://picsum.photos/seed/${doc.id}/600/400`,
        yearBuilt: doc.yearBuilt ? Number(doc.yearBuilt) : new Date().getFullYear(),
    };
}

function toFormData(d: PropertyDraft, image: File | undefined): FormData {
    const formData = new FormData();

    formData.append("name", d.name);
    formData.append("type", d.type);
    formData.append("status", d.status);
    formData.append("description", d.description);
    formData.append("address", d.address);
    formData.append("city", d.city);
    formData.append("country", d.country);
    formData.append("postal", d.postal);
    formData.append("totalUnits", String(Number(d.units)));
    formData.append("baseRent", String(Number(d.baseRent)));
    formData.append("buyPrice", d.purchasePrice);
    formData.append("expectedRevnue", d.revenue);
    formData.append("monthlyExpenses", d.expenses);

    if (d.yearBuilt.trim() !== "") {
        formData.append("yearBuilt", String(Number(d.yearBuilt)));
    }
    if (d.floors.trim() !== "") {
        formData.append("floors", d.floors);
    }
    if (d.size.trim() !== "") {
        formData.append("size", d.size);
    }
    if (image) {
        formData.append("image", image);
    }

    return formData;
}

export async function getProperties(): Promise<Property[]> {
    const data = await apiFetch<{ properties: PropertyDoc[] }>('/properties');
    return data.properties.map(toProperty);
}

export async function createProperty(d: PropertyDraft, image: File | undefined): Promise<Property> {
    const data = await apiFetch<{ property: PropertyDoc }>('/properties', {
        method: 'POST',
        body: toFormData(d, image),
    });
    return toProperty(data.property);
}

export async function updateProperty(id: string, d: PropertyDraft, image: File | undefined): Promise<Property> {
    const data = await apiFetch<{ property: PropertyDoc }>(`/properties/${id}`, {
        method: 'PUT',
        body: toFormData(d, image),
    });
    return toProperty(data.property);
}

export async function deleteProperty(id: string): Promise<void> {
    await apiFetch(`/properties/${id}`, { method: 'DELETE' });
}
