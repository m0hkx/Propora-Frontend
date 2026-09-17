import type { MaintenanceRequest, Tenant, Unit } from '../data/mock';

/**
 * The property → unit(s)/tenant(s) relationship a maintenance request must
 * satisfy. Lives in `lib/` (not the page's `maintenanceUtils.ts`) so the
 * store can run it as a service-layer guard on `addMaintenance`, the same
 * pattern `validateUnit` gives `addUnit`.
 */
export interface MaintenanceTargetInput {
  propertyId: string;
  scope: MaintenanceRequest['scope'];
  unitIds: string[];
  tenantIds: string[];
}

/**
 * Submit-time guard for the property → unit(s)/tenant(s) relationship:
 * property is always required; a `units`/`tenants` scope needs at least one
 * pick, and every pick must actually belong to the selected property.
 */
export function validateMaintenanceTarget(
  input: MaintenanceTargetInput,
  units: Unit[],
  tenants: Tenant[]
): string | null {
  if (input.propertyId === '') return 'Property is required.';
  if (input.scope === 'units') {
    if (input.unitIds.length === 0) return 'Select at least one unit.';
    const valid = new Set(units.filter((u) => u.propertyId === input.propertyId).map((u) => u.id));
    if (!input.unitIds.every((id) => valid.has(id))) return 'One or more selected units do not belong to this property.';
  }
  if (input.scope === 'tenants') {
    if (input.tenantIds.length === 0) return 'Select at least one tenant.';
    const valid = new Set(tenants.filter((t) => t.propertyId === input.propertyId).map((t) => t.id));
    if (!input.tenantIds.every((id) => valid.has(id))) return 'One or more selected tenants do not belong to this property.';
  }
  return null;
}
