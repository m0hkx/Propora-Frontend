import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { MaintenanceRequest, MaintenanceStaff, MaintenanceStatus, NewMaintenanceDraft } from '../../types';
import { validateStaff } from '../../lib/staff';
import { validateMaintenanceTarget } from '../../lib/maintenanceScope';
import { DEFAULT_CALLING_COUNTRY } from '../../data/phone';
import * as maintenanceApi from '../../api/maintenance';
import * as staffApi from '../../api/maintenanceStaff';

export interface MaintenanceSlice {
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
}

export const createMaintenanceSlice: StateCreator<StoreState, [], [], MaintenanceSlice> = (set, get) => ({
  maintenance: [],
  fetchMaintenance: async () => set({ maintenance: await maintenanceApi.getMaintenanceRequests() }),
  addMaintenance: async (d) => {
    const err = validateMaintenanceTarget(d, get().units, get().tenants);
    if (err) return err;
    const created = await maintenanceApi.createMaintenanceRequest(d);
    set((s) => ({ maintenance: [created, ...s.maintenance] }));
    get().refreshNotifications();
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
});
