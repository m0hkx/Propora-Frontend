import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { documents as seedDocuments, maintenance as seedMaintenance, properties as seedProperties } from '../data/mock';
import type { DocFile, MaintenanceRequest, Property } from '../data/mock';
import { StoreContext } from './useStore';

export interface Toast {
  id: number;
  message: string;
}

export interface StoreValue {
  properties: Property[];
  addProperty: (p: Property) => void;
  maintenance: MaintenanceRequest[];
  addMaintenance: (m: MaintenanceRequest) => void;
  updateMaintenance: (id: string, patch: Partial<MaintenanceRequest>) => void;
  documents: DocFile[];
  addDocument: (d: DocFile) => void;
  updateDocument: (id: string, patch: Partial<DocFile>) => void;
  deleteDocument: (id: string) => void;
  toasts: Toast[];
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 1;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(seedProperties);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>(seedMaintenance);
  const [documents, setDocuments] = useState<DocFile[]>(seedDocuments);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string) => {
      const id = toastSeq++;
      setToasts((list) => [...list.slice(-2), { id, message }]);
      window.setTimeout(() => dismissToast(id), 3500);
    },
    [dismissToast]
  );

  const value = useMemo<StoreValue>(
    () => ({
      properties,
      addProperty: (p) => setProperties((list) => [p, ...list]),
      maintenance,
      addMaintenance: (m) => setMaintenance((list) => [m, ...list]),
      updateMaintenance: (id, patch) =>
        setMaintenance((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m))),
      documents,
      addDocument: (d) => setDocuments((list) => [d, ...list]),
      updateDocument: (id, patch) =>
        setDocuments((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d))),
      deleteDocument: (id) => setDocuments((list) => list.filter((d) => d.id !== id)),
      toasts,
      pushToast,
      dismissToast,
    }),
    [properties, maintenance, documents, toasts, pushToast, dismissToast]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
