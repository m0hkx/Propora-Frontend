import { create } from 'zustand';

import type {
  AppNotification,
  ChatMessage,
  Conversation,
  DocFile,
  Lease,
  MaintenanceRequest,
  MaintenanceStaff,
  MaintenanceStatus,
  Payment,
  Property,
  Tenant,
  Unit,
} from '../data/mock';
import { conversations as seedConversations } from '../data/mock';

import { validateUnit } from '../lib/units';
import { validateStaff } from '../lib/staff';
import { validateMaintenanceTarget } from '../lib/maintenanceScope';
import { sanitizeFileName, validateDocRecord } from '../lib/files';

import { DEFAULT_CALLING_COUNTRY } from '../data/phone';

import {
  APP_TIMEZONE,
  logAutomationReport,
  planAutomationRun,
  zonedToday,
} from '../lib/paymentAutomation';
import type { PaymentAutomationReport } from '../lib/paymentAutomation';

import * as propertiesApi from '../api/properties';
import * as unitsApi from '../api/units';
import * as tenantsApi from '../api/tenants';
import * as leasesApi from '../api/leases';
import * as paymentsApi from '../api/payments';
import * as maintenanceApi from '../api/maintenance';
import * as staffApi from '../api/maintenanceStaff';
import * as documentsApi from '../api/documents';
import * as notificationsApi from '../api/notifications';

import type { PropertyDraft } from '../pages/Properties/propertyForm';
import type { TenantDraft } from '../pages/Tenants/TenantFormModal';
import type { LeaseDraft } from '../pages/Leases/AddLeaseModal';
import type { PaymentDraft } from '../pages/Payments/RecordPaymentModal';
import type { NewMaintenanceDraft } from '../pages/Maintenance/NewMaintenanceModal';
import type { NewDocDraft } from '../pages/Documents/UploadDocumentModal';

export interface Toast {
  id: number;
  message: string;
}

export interface StoreState {
  properties: Property[];
  fetchProperties: () => Promise<void>;
  addProperty: (d: PropertyDraft, image: File | undefined) => Promise<void>;
  updateProperty: (id: string, d: PropertyDraft, image: File | undefined) => Promise<void>;
  deleteProperty: (id: string) => Promise<void>;

  units: Unit[];
  fetchUnits: () => Promise<void>;
  /**
   * Service-layer writes. Add/update run `validateUnit` (required name,
   * per-property uniqueness, non-negative numbers) before ever reaching the
   * network, and return the rejection reason instead of persisting bad data
   * — `null` means success (and the store already reflects the server row).
   */
  addUnit: (propertyId: string, u: Omit<Unit, 'id' | 'propertyId'>) => Promise<string | null>;
  updateUnit: (id: string, patch: Partial<Omit<Unit, 'id'>>) => Promise<string | null>;
  deleteUnit: (id: string) => Promise<void>;

  tenants: Tenant[];
  fetchTenants: () => Promise<void>;
  addTenant: (d: TenantDraft) => Promise<void>;
  updateTenant: (id: string, d: TenantDraft) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;

  leases: Lease[];
  fetchLeases: () => Promise<void>;
  addLease: (d: LeaseDraft) => Promise<void>;

  payments: Payment[];
  fetchPayments: () => Promise<void>;
  addPayment: (d: PaymentDraft) => Promise<void>;
  updatePayment: (id: string, patch: Partial<PaymentDraft>) => Promise<void>;
  /**
   * Idempotent rent-automation job: generates due billing periods as Pending
   * and flips Pending rows past due date + grace to Overdue, persisting each
   * change through the API. Safe to run any number of times; accepts an
   * explicit clock for testing (defaults to now).
   */
  runPaymentAutomation: (now?: Date) => Promise<PaymentAutomationReport>;

  maintenance: MaintenanceRequest[];
  fetchMaintenance: () => Promise<void>;
  /**
   * Service-layer write: validates the property → unit(s)/tenant(s)
   * relationship (`validateMaintenanceTarget`) before ever reaching the
   * network — the same pre-flight `addUnit` gives units.
   */
  addMaintenance: (d: NewMaintenanceDraft) => Promise<string | null>;
  updateMaintenanceStatus: (id: string, status: MaintenanceStatus) => Promise<void>;
  updateMaintenanceAssignee: (id: string, staffId: string | undefined) => Promise<void>;

  staff: MaintenanceStaff[];
  fetchStaff: () => Promise<void>;
  /** Add/update run `validateStaff` (name, email format, phone if present) and return the rejection reason — `null` means success. */
  addStaff: (s: Omit<MaintenanceStaff, 'id'>) => Promise<string | null>;
  updateStaff: (id: string, patch: Partial<Omit<MaintenanceStaff, 'id'>>) => Promise<string | null>;
  deleteStaff: (id: string) => Promise<void>;

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

  notifications: AppNotification[];
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;

  // Inbox/chat stays on local mock data — no backend resource exists for it.
  conversations: Conversation[];
  markConversationRead: (id: string) => void;
  sendMessage: (conversationId: string, text: string) => void;

  toasts: Toast[];
  pushToast: (message: string) => void;
  dismissToast: (id: number) => void;

  /** Fetches every server-backed resource once a session is confirmed, then runs the automation catch-up. */
  loadAll: () => Promise<void>;
}

let toastSeq = 1;
let messageSeq = 100;

export const useStore = create<StoreState>()((set, get) => ({
  properties: [],
  fetchProperties: async () => set({ properties: await propertiesApi.getProperties() }),
  addProperty: async (d, image) => {
    const created = await propertiesApi.createProperty(d, image);
    set((s) => ({ properties: [created, ...s.properties] }));
  },
  updateProperty: async (id, d, image) => {
    const updated = await propertiesApi.updateProperty(id, d, image);
    set((s) => ({ properties: s.properties.map((p) => (p.id === id ? updated : p)) }));
  },
  deleteProperty: async (id) => {
    await propertiesApi.deleteProperty(id);
    set((s) => ({ properties: s.properties.filter((p) => p.id !== id) }));
  },

  units: [],
  fetchUnits: async () => {
    const units = await unitsApi.getAllUnits(get().properties.map((p) => p.id));
    set({ units });
  },
  addUnit: async (propertyId, u) => {
    const err = validateUnit(get().units, propertyId, u);
    if (err) return err;
    const created = await unitsApi.createUnit(propertyId, u);
    set((s) => ({ units: [created, ...s.units] }));
    return null;
  },
  updateUnit: async (id, patch) => {
    const units = get().units;
    const existing = units.find((u) => u.id === id);
    if (!existing) return 'Unit not found.';
    const next = { ...existing, ...patch };
    const err = validateUnit(units, next.propertyId, next, id);
    if (err) return err;
    const updated = await unitsApi.updateUnit(id, patch);
    set((s) => ({ units: s.units.map((u) => (u.id === id ? updated : u)) }));
    return null;
  },
  deleteUnit: async (id) => {
    await unitsApi.deleteUnit(id);
    set((s) => ({ units: s.units.filter((u) => u.id !== id) }));
  },

  tenants: [],
  fetchTenants: async () => set({ tenants: await tenantsApi.getTenants() }),
  addTenant: async (d) => {
    const created = await tenantsApi.createTenant(d);
    set((s) => ({ tenants: [created, ...s.tenants] }));
    void get().fetchNotifications();
  },
  updateTenant: async (id, d) => {
    const updated = await tenantsApi.updateTenant(id, d);
    set((s) => ({ tenants: s.tenants.map((t) => (t.id === id ? updated : t)) }));
  },
  deleteTenant: async (id) => {
    await tenantsApi.deleteTenant(id);
    set((s) => ({ tenants: s.tenants.filter((t) => t.id !== id) }));
  },

  leases: [],
  fetchLeases: async () => set({ leases: await leasesApi.getLeases() }),
  addLease: async (d) => {
    const created = await leasesApi.createLease(d);
    set((s) => ({ leases: [created, ...s.leases] }));
  },

  payments: [],
  fetchPayments: async () => set({ payments: await paymentsApi.getPayments() }),
  addPayment: async (d) => {
    const created = await paymentsApi.createPayment(d);
    set((s) => ({ payments: [created, ...s.payments] }));
  },
  updatePayment: async (id, patch) => {
    const updated = await paymentsApi.updatePayment(id, patch);
    set((s) => ({ payments: s.payments.map((p) => (p.id === id ? updated : p)) }));
    if (patch.status === 'Overdue') void get().fetchNotifications();
  },
  runPaymentAutomation: async (now) => {
    const { leases, tenants, payments } = get();
    let today: string;
    try {
      today = zonedToday(APP_TIMEZONE, now ?? new Date());
    } catch (err) {
      console.error('[payments:auto] clock/timezone failure — run aborted', err);
      return {
        ranAt: 'unknown',
        timeZone: APP_TIMEZONE,
        periods: [],
        createdIds: [],
        duplicatesSkipped: 0,
        ineligibleSkipped: 0,
        markedOverdueIds: [],
        errors: ['Clock/timezone failure — run aborted.'],
      };
    }
    const { toCreate, toMarkOverdue, report } = planAutomationRun({ leases, tenants, payments }, today);
    if (toCreate.length === 0 && toMarkOverdue.length === 0) return report;

    await Promise.all(
      toCreate.map((p) =>
        paymentsApi.createPayment({
          tenantId: p.tenantId,
          propertyId: p.propertyId,
          amount: p.amount,
          date: p.date,
          method: p.method,
          status: p.status,
          leaseId: p.leaseId,
          period: p.period,
        })
      )
    );
    await Promise.all(toMarkOverdue.map((id) => paymentsApi.updatePayment(id, { status: 'Overdue' })));
    await get().fetchPayments();

    logAutomationReport(report);
    get().pushToast(
      `Rent automation: ${report.createdIds.length} payment(s) generated, ${report.markedOverdueIds.length} marked overdue.`
    );
    void get().fetchNotifications();
    return report;
  },

  maintenance: [],
  fetchMaintenance: async () => set({ maintenance: await maintenanceApi.getMaintenanceRequests() }),
  addMaintenance: async (d) => {
    const err = validateMaintenanceTarget(d, get().units, get().tenants);
    if (err) return err;
    const created = await maintenanceApi.createMaintenanceRequest(d);
    set((s) => ({ maintenance: [created, ...s.maintenance] }));
    void get().fetchNotifications();
    return null;
  },
  updateMaintenanceStatus: async (id, status) => {
    const updated = await maintenanceApi.updateMaintenanceStatus(id, status);
    set((s) => ({ maintenance: s.maintenance.map((m) => (m.id === id ? updated : m)) }));
  },
  updateMaintenanceAssignee: async (id, staffId) => {
    const updated = await maintenanceApi.updateMaintenanceAssignee(id, staffId);
    set((s) => ({ maintenance: s.maintenance.map((m) => (m.id === id ? updated : m)) }));
  },

  staff: [],
  fetchStaff: async () => set({ staff: await staffApi.getStaff() }),
  addStaff: async (staffMember) => {
    const err = validateStaff(staffMember, DEFAULT_CALLING_COUNTRY);
    if (err) return err;
    const created = await staffApi.createStaff(staffMember);
    set((s) => ({ staff: [created, ...s.staff] }));
    return null;
  },
  updateStaff: async (id, patch) => {
    const existing = get().staff.find((s) => s.id === id);
    if (!existing) return 'Staff member not found.';
    const next = { ...existing, ...patch };
    const err = validateStaff(next, DEFAULT_CALLING_COUNTRY);
    if (err) return err;
    const updated = await staffApi.updateStaff(id, patch);
    set((s) => ({ staff: s.staff.map((m) => (m.id === id ? updated : m)) }));
    return null;
  },
  deleteStaff: async (id) => {
    await staffApi.deleteStaff(id);
    set((s) => ({ staff: s.staff.filter((m) => m.id !== id) }));
  },

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

  notifications: [],
  fetchNotifications: async () => set({ notifications: await notificationsApi.getNotifications() }),
  markNotificationRead: async (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    await notificationsApi.markNotificationAsRead(id);
  },
  markAllNotificationsRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    await notificationsApi.markAllNotificationsAsRead();
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

  loadAll: async () => {
    await get().fetchProperties();
    await Promise.all([
      get().fetchUnits(),
      get().fetchTenants(),
      get().fetchLeases(),
      get().fetchPayments(),
      get().fetchMaintenance(),
      get().fetchStaff(),
      get().fetchDocuments(),
      get().fetchNotifications(),
    ]);
    try {
      await get().runPaymentAutomation();
    } catch (err) {
      console.error('[payments:auto] boot catch-up failed', err);
    }
  },
}));
