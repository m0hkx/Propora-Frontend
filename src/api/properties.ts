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

type PropertyDraftResponse = {
    property: {
        description?: string | null;
        postal?: string | null;
        floors?: number | null;
        size?: number | null;
        buyPrice?: number | null;
        monthlyExpenses?: number | null;
    };
};

interface MissingPropertyData {
    description: string;
    postal: string;
    floors: string;
    size: string;
    purchasePrice: string;
    expenses: string;
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

const PAGE_SIZE = 50;

/**
 * The API caps how many properties one call returns, so pull every page. The
 * rest of the app (KPIs, filters, dropdowns) works on the full list.
 */
export async function getProperties(): Promise<Property[]> {
    const docs: PropertyDoc[] = [];
    let page = 1;

    let totalPages: number;
    do {
        const data = await apiFetch<{ properties: PropertyDoc[]; totalPages?: number }>(
            `/properties?page=${page}&limit=${PAGE_SIZE}`
        );
        docs.push(...data.properties);
        totalPages = data.totalPages ?? 1;
        page += 1;
    } while (page <= totalPages);

    return docs.map(toProperty);
}

export async function getPropertyDraft(p: Property): Promise<MissingPropertyData> {
    const data = await apiFetch<PropertyDraftResponse>(`/properties/${p.id}`);
    const property = stripNulls(data.property);

    return {
        description: property.description ?? '',
        postal: property.postal ?? '',
        floors: property.floors?.toString() ?? '',
        size: property.size?.toString() ?? '',
        purchasePrice: property.buyPrice?.toString() ?? '',
        expenses: property.monthlyExpenses?.toString() ?? '',
    };
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
