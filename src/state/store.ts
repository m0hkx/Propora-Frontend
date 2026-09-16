import { create } from 'zustand';
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
  ChatMessage,
  Conversation,
  DocFile,
  Lease,
  MaintenanceRequest,
  Payment,
  Property,
  Tenant,
} from '../data/mock';

export interface Toast {
  id: number;
  message: string;
}

export interface StoreState {
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

/** Kept as an alias so existing `StoreValue` imports keep compiling. */
export type StoreValue = StoreState;

let toastSeq = 1;
let notificationSeq = 100;
let messageSeq = 100;

export const useStore = create<StoreState>()((set, get) => ({
  properties: seedProperties,
  addProperty: (p) => set((s) => ({ properties: [p, ...s.properties] })),

  tenants: seedTenants,
  addTenant: (t) => set((s) => ({ tenants: [t, ...s.tenants] })),
  updateTenant: (id, patch) =>
    set((s) => ({ tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
  deleteTenant: (id) => set((s) => ({ tenants: s.tenants.filter((t) => t.id !== id) })),

  leases: seedLeases,
  addLease: (l) => set((s) => ({ leases: [l, ...s.leases] })),

  payments: seedPayments,
  addPayment: (p) => set((s) => ({ payments: [p, ...s.payments] })),

  maintenance: seedMaintenance,
  addMaintenance: (m) => set((s) => ({ maintenance: [m, ...s.maintenance] })),
  updateMaintenance: (id, patch) =>
    set((s) => ({ maintenance: s.maintenance.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),

  documents: seedDocuments,
  addDocument: (d) => set((s) => ({ documents: [d, ...s.documents] })),
  updateDocument: (id, patch) =>
    set((s) => ({ documents: s.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  deleteDocument: (id) => set((s) => ({ documents: s.documents.filter((d) => d.id !== id) })),

  notifications: seedNotifications,
  markNotificationRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  markAllNotificationsRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  pushNotification: (n) => {
    const id = `n-${notificationSeq++}`;
    set((s) => ({ notifications: [{ ...n, id, read: false }, ...s.notifications] }));
  },

  conversations: seedConversations,
  markConversationRead: (id) =>
    set((s) => ({ conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)) })),
  sendMessage: (conversationId, text) => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    const message: ChatMessage = { id: `m-${messageSeq++}`, from: 'me', text: trimmed, time: 'Now' };
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, messages: [...c.messages, message] } : c
      ),
    }));
  },

  toasts: [],
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  pushToast: (message) => {
    const id = toastSeq++;
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id, message }] }));
    window.setTimeout(() => get().dismissToast(id), 3500);
  },
}));
