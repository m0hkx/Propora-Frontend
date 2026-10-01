export type UnitStatus = 'Vacant' | 'Occupied' | 'Maintenance';

export type UnitType = 'Studio' | '1 BR' | '2 BR' | '3 BR' | '4 BR' | 'Other';

/**
 * An individual rentable unit inside a property (Property → Units → Tenant/Lease).
 * `status` is the stored fallback; the displayed status resolves to `Occupied`
 * whenever an active tenant or lease links to the unit (see `resolveUnitStatus`
 * in `src/lib/units.ts`) so there is a single source of truth.
 */
export interface Unit {
  id: string;
  propertyId: string;
  /** Unit number/label — unique within its property, e.g. "A-204". */
  name: string;
  floor?: number;
  type: UnitType;
  bedrooms: number;
  bathrooms: number;
  /** Floor area in sqm. */
  size?: number;
  /** Monthly rent. */
  rent: number;
  status: UnitStatus;
  notes?: string;
}
