import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  conversations as seedConversations,
  documents as seedDocuments,
  leases as seedLeases,
  maintenance as seedMaintenance,
  notifications as seedNotifications,
  payments as seedPayments,
  properties as seedProperties,
  tenants as seedTenants,
} from '../data/mock';
import type {
  AppNotification,
  Conversation,
  DocFile,
  Lease,
  MaintenanceRequest,
  Payment,
  Property,
  Tenant,
} from '../data/mock';
import { StoreContext } from './useStore';

export interface Toast {
  id: number;
  message: string;
}

export interface StoreValue {
  properties: Property[];
  addProperty: (p: Property) => void;
  tenants: Tenant[];
  addTenant: (t: Tenant) => void;
  updateTenant: (id: string, patch: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  leases: Lease[];
  addLease: (l: Lease) => void;
  payments: Payment[];
  addPayment: (p: Payment) => void;
  maintenance: MaintenanceRequest[];
  addMaintenance: (m: MaintenanceRequest) => void;
  updateMaintenance: (id: string, patch: Partial<MaintenanceRequest>) => void;
  documents: DocFile[];
  addDocument: (d: DocFile) => void;
  updateDocument: (id: string, patch: Partial<DocFile>) => void;
  deleteDocument: (id: string) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  pushNotification: (n: Omit<AppNotification, 'id' | 'read'>) => void;
  conversations: Conversation[];
  markConversationRead: (id: string) => void;
  sendMessage: (conversationId: string, text: string) => void;
  toasts: Toast[];
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;
}

let toastSeq = 1;
let notificationSeq = 100;
let messageSeq = 100;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [properties, setProperties] = useState<Property[]>(seedProperties);
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);
  const [leases, setLeases] = useState<Lease[]>(seedLeases);
  const [payments, setPayments] = useState<Payment[]>(seedPayments);
  const [maintenance, setMaintenance] = useState<MaintenanceRequest[]>(seedMaintenance);
  const [documents, setDocuments] = useState<DocFile[]>(seedDocuments);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);
  const [conversations, setConversations] = useState<Conversation[]>(seedConversations);
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

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, 'id' | 'read'>) => {
    const id = `n-${notificationSeq++}`;
    setNotifications((list) => [{ ...n, id, read: false }, ...list]);
  }, []);

  const markConversationRead = useCallback((id: string) => {
    setConversations((list) => list.map((c) => (c.id === id ? { ...c, unread: 0 } : c)));
  }, []);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    setConversations((list) =>
      list.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, { id: `m-${messageSeq++}`, from: 'me', text: trimmed, time: 'Now' }] }
          : c
      )
    );
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      properties,
      addProperty: (p) => setProperties((list) => [p, ...list]),
      tenants,
      addTenant: (t) => setTenants((list) => [t, ...list]),
      updateTenant: (id, patch) => setTenants((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t))),
      deleteTenant: (id) => setTenants((list) => list.filter((t) => t.id !== id)),
      leases,
      addLease: (l) => setLeases((list) => [l, ...list]),
      payments,
      addPayment: (p) => setPayments((list) => [p, ...list]),
      maintenance,
      addMaintenance: (m) => setMaintenance((list) => [m, ...list]),
      updateMaintenance: (id, patch) =>
        setMaintenance((list) => list.map((m) => (m.id === id ? { ...m, ...patch } : m))),
      documents,
      addDocument: (d) => setDocuments((list) => [d, ...list]),
      updateDocument: (id, patch) =>
        setDocuments((list) => list.map((d) => (d.id === id ? { ...d, ...patch } : d))),
      deleteDocument: (id) => setDocuments((list) => list.filter((d) => d.id !== id)),
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      pushNotification,
      conversations,
      markConversationRead,
      sendMessage,
      toasts,
      pushToast,
      dismissToast,
    }),
    [
      properties, tenants, leases, payments, maintenance, documents,
      notifications, conversations, toasts, pushToast, dismissToast,
      markNotificationRead, markAllNotificationsRead, pushNotification,
      markConversationRead, sendMessage,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
