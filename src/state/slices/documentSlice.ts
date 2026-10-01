import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { DocFile, NewDocDraft } from '../../types';
import { sanitizeFileName, validateDocRecord } from '../../lib/files';
import * as documentsApi from '../../api/documents';

export interface DocumentSlice {
  documents: DocFile[];
  fetchDocuments: () => Promise<void>;
  /**
   * Re-validates extension, size and MIME independently of the upload form
   * before the file ever reaches the network. Returns the rejection reason,
   * or `null` on success.
   */
  addDocument: (d: NewDocDraft, file: File) => Promise<string | null>;
  updateDocument: (id: string, patch: Partial<Omit<DocFile, 'id'>>) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
}

export const createDocumentSlice: StateCreator<StoreState, [], [], DocumentSlice> = (set) => ({
  documents: [],
  fetchDocuments: async () => set({ documents: await documentsApi.getDocuments() }),
  addDocument: async (d, file) => {
    const err = validateDocRecord(d.name, d.sizeBytes, d.mime);
    if (err) return err;
    const clean = sanitizeFileName(d.name);
    if (clean === '') return 'Document name is required.';
    const created = await documentsApi.createDocument({ ...d, name: clean }, file);
    set((s) => ({ documents: [created, ...s.documents] }));
    return null;
  },
  updateDocument: async (id, patch) => {
    const updated =
      patch.status === 'Archived' && Object.keys(patch).length === 1
        ? await documentsApi.archiveDocument(id)
        : await documentsApi.updateDocument(id, patch);
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? updated : d)) }));
  },
  deleteDocument: async (id) => {
    await documentsApi.deleteDocument(id);
    set((s) => ({ documents: s.documents.filter((d) => d.id !== id) }));
  },
});
