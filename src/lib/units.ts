import type { Lease, MaintenanceRequest, Tenant, Unit, UnitStatus } from '../data/mock';

/**
 * Unit domain helpers (Property → Units → Tenant/Lease).
 *
 * Units are the join between a property and its occupants: tenants, leases
 * and maintenance requests carry an optional `unitId` plus a legacy
 * free-text `unit` label. Every matcher below honours the link first and
 * falls back to the label so rows that predate the unit registry keep
 * working.
 */

/** Units of one property, sorted by label. Never leaks other properties' units. */
export function unitsForProperty(units: Unit[], propertyId: string): Unit[] {
  return units
    .filter((u) => u.propertyId === propertyId)
    .sort((a, b) => a.name.localeCompare(b.name, 'en-US', { numeric: true }));
}

/** Case-insensitive duplicate check scoped to one property (same label may repeat across properties). */
export function isDuplicateUnitName(
  units: Unit[],
  propertyId: string,
  name: string,
  excludeId?: string
): boolean {
  const needle = name.trim().toLowerCase();
  if (needle === '') return false;
  return units.some(
    (u) => u.propertyId === propertyId && u.id !== excludeId && u.name.trim().toLowerCase() === needle
  );
}

export interface UnitInput {
  name: string;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  floor?: number;
  size?: number;
}

/**
 * Service-level validation shared by the store actions (the form modal adds
 * per-field messages on top). Returns the first problem, or `null` when the
 * input is safe to persist.
 */
export function validateUnit(
  units: Unit[],
  propertyId: string,
  input: UnitInput,
  excludeId?: string
): string | null {
  if (input.name.trim() === '') return 'Unit name/number is required.';
  if (isDuplicateUnitName(units, propertyId, input.name, excludeId))
    return `Unit "${input.name.trim()}" already exists in this property.`;
  if (!Number.isFinite(input.rent) || input.rent <= 0) return 'Enter a monthly rent greater than 0.';
  for (const [label, value, integer] of [
    ['Bedrooms', input.bedrooms, true],
    ['Bathrooms', input.bathrooms, false],
    ['Size', input.size ?? 0, false],
    ['Floor', input.floor ?? 0, true],
  ] as const) {
    if (!Number.isFinite(value) || value < 0) return `${label} cannot be negative.`;
    if (integer && !Number.isInteger(value)) return `${label} must be a whole number.`;
  }
  return null;
}

/** Does this tenant currently occupy the unit? Inactive tenancies are history, not occupancy. */
export function tenantOccupiesUnit(tenant: Tenant, unit: Unit): boolean {
  if (tenant.status === 'Inactive') return false;
  if (tenant.unitId !== undefined) return tenant.unitId === unit.id;
  return (
    tenant.propertyId === unit.propertyId &&
    tenant.unit.trim().toLowerCase() === unit.name.trim().toLowerCase()
  );
}

/** Does this lease currently cover the unit (directly, or through its tenant)? */
export function leaseCoversUnit(lease: Lease, unit: Unit, tenants: Tenant[]): boolean {
  const live = lease.status === 'Active' || lease.status === 'Expiring';
  if (!live) return false;
  if (lease.unitId !== undefined) return lease.unitId === unit.id;
  const tenant = tenants.find((t) => t.id === lease.tenantId);
  return tenant !== undefined && tenantOccupiesUnit(tenant, unit);
}

/**
 * Single source of truth for availability: a unit with a live tenant or
 * lease link reads `Occupied` no matter what is stored; otherwise the stored
 * status (Vacant / Maintenance) applies.
 */
export function resolveUnitStatus(unit: Unit, tenants: Tenant[], leases: Lease[]): UnitStatus {
  const occupied =
    tenants.some((t) => tenantOccupiesUnit(t, unit)) || leases.some((l) => leaseCoversUnit(l, unit, tenants));
  return occupied ? 'Occupied' : unit.status;
}

/**
 * Reasons a unit cannot be deleted. Tenants, live leases and open maintenance
 * block deletion; payments reference tenants/properties (never units), so
 * deleting a unit can neither orphan nor erase them.
 */
export function getUnitBlockers(
  unit: Unit,
  tenants: Tenant[],
  leases: Lease[],
  maintenance: MaintenanceRequest[]
): string[] {
  const blockers: string[] = [];
  const holders = tenants.filter((t) => tenantOccupiesUnit(t, unit));
  for (const t of holders) blockers.push(`Assigned to tenant ${t.name}`);
  const liveLeases = leases.filter((l) => leaseCoversUnit(l, unit, tenants));
  for (const l of liveLeases) {
    if (!holders.some((t) => t.id === l.tenantId)) blockers.push(`Covered by active lease ${l.id}`);
  }
  const open = maintenance.filter((m) => {
    if (m.status === 'Completed') return false;
    if (m.scope === 'property') return m.propertyId === unit.propertyId;
    if (m.scope === 'units') return m.unitIds.includes(unit.id);
    // Tenant-scoped requests are already covered by the tenant/lease blockers above.
    return false;
  });
  for (const m of open) blockers.push(`Has open maintenance request ${m.id} (${m.status})`);
  return blockers;
}

/** Display label for a lease row: linked unit name, else the tenant's free-text label. */
export function leaseUnitLabel(
  lease: Lease,
  units: Unit[],
  tenants: Tenant[]
): string {
  if (lease.unitId !== undefined) {
    const match = units.find((u) => u.id === lease.unitId);
    if (match) return match.name;
  }
  return tenants.find((t) => t.id === lease.tenantId)?.unit ?? '—';
}
