import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { Lease, LeaseDraft, Tenant, TenantDraft } from '../../types';
import { validateTenantUnit } from '../../lib/units';
import * as tenantsApi from '../../api/tenants';
import * as leasesApi from '../../api/leases';

export interface TenantSlice {
  tenants: Tenant[];
  fetchTenants: () => Promise<void>;
  addTenant: (d: TenantDraft) => Promise<void>;
  updateTenant: (id: string, d: TenantDraft) => Promise<void>;
  deleteTenant: (id: string) => Promise<void>;

  leases: Lease[];
  fetchLeases: () => Promise<void>;
  addLease: (d: LeaseDraft) => Promise<void>;
}

export const createTenantSlice: StateCreator<StoreState, [], [], TenantSlice> = (set, get) => ({
  tenants: [],
  fetchTenants: async () => set({ tenants: await tenantsApi.getTenants() }),
  addTenant: async (d) => {
    const err = validateTenantUnit(d, get().units, get().tenants, get().leases);
    if (err) throw new Error(err);
    const created = await tenantsApi.createTenant(d);
    set((s) => ({ tenants: [created, ...s.tenants] }));
    void get().fetchNotifications();
  },
  updateTenant: async (id, d) => {
    const err = validateTenantUnit(d, get().units, get().tenants, get().leases, id);
    if (err) throw new Error(err);
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
});
