import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { Property, PropertyDraft, Unit } from '../../types';
import { validateUnit } from '../../lib/units';
import * as propertiesApi from '../../api/properties';
import * as unitsApi from '../../api/units';

export interface PropertySlice {
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
}

export const createPropertySlice: StateCreator<StoreState, [], [], PropertySlice> = (set, get) => ({
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
});
