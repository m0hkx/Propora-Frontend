import type { DocFile } from '../data/mock';
import type { NewDocDraft } from '../pages/Documents/UploadDocumentModal';
import { apiFetch, stripNulls } from './config';

type DocDoc = DocFile;

function toDocument(doc: DocDoc): DocFile {
    return stripNulls(doc);
}

export async function getDocuments(): Promise<DocFile[]> {
    const data = await apiFetch<{ documents: DocDoc[] }>('/documents');
    return data.documents.map(toDocument);
}

export async function createDocument(d: NewDocDraft, file: File): Promise<DocFile> {
    const formData = new FormData();
    formData.append('name', d.name);
    formData.append('propertyId', d.propertyId);
    if (d.tenantId) formData.append('tenantId', d.tenantId);
    formData.append('type', d.type);
    formData.append('description', `${d.type} uploaded ${new Date().toISOString().slice(0, 10)}.`);
    formData.append('file', file);

    const data = await apiFetch<{ document: DocDoc }>('/documents', {
        method: 'POST',
        body: formData,
    });
    return toDocument(data.document);
}

export async function updateDocument(id: string, patch: Partial<Omit<DocFile, 'id'>>): Promise<DocFile> {
    const data = await apiFetch<{ document: DocDoc }>(`/documents/${id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
    });
    return toDocument(data.document);
}

export async function archiveDocument(id: string): Promise<DocFile> {
    const data = await apiFetch<{ document: DocDoc }>(`/documents/${id}/archive`, { method: 'PATCH' });
    return toDocument(data.document);
}

export async function deleteDocument(id: string): Promise<void> {
    await apiFetch(`/documents/${id}`, { method: 'DELETE' });
}
