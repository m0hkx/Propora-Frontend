# 02 · Data Model

Every type below lives in `src/data/mock.ts`. Reuse these types rather than redefining
shapes — that file is the single source of truth for the domain.

## Entity relationship map

```
                          ┌──────────────┐
                          │   Property   │
                          │ id, name,    │
                          │ status, rent │
                          └──────┬───────┘
                 ┌───────────────┼────────────────┬──────────────┐
                 │               │                │              │
          ┌──────▼─────┐  ┌──────▼─────┐   ┌──────▼──────┐  ┌────▼─────┐
          │    Unit    │  │   Tenant   │   │ Maintenance │  │ DocFile  │
          │ propertyId │◀─│ propertyId │   │  Request    │  │propertyId│
          │ name,type, │  │ unitId?    │   │ propertyId  │  │tenantId? │
          │ bedrooms   │  │ phone,rent │   │ scope       │  │leaseId?  │
          └──────▲─────┘  └──┬──────┬──┘   │ unitIds[]   │  └──────────┘
                 │           │      │      │ tenantIds[] │
                 │           │      │      │ assigneeId? │
                 │           │      │      └──────┬──────┘
                 │           │      │             │
          ┌──────┴─────┐  ┌──▼──────▼──┐   ┌──────▼──────────┐
          │   Lease    │  │  Payment   │   │ MaintenanceStaff│
          │ propertyId │  │ tenantId   │   │ name, phone,    │
          │ tenantId   │  │ propertyId │   │ email,specialty,│
          │ unitId?    │◀─│ leaseId?   │   │ status          │
          └────────────┘  │ period?    │   └─────────────────┘
                          └────────────┘
```

Everything references by **id**; human-readable names are resolved at render time through
`propertyName()`, `tenantName()`, `staffName()` in `mock.ts`. No entity ever embeds a copy of
another entity's display data.

---

## Property

```ts
interface Property {
  id: string;
  name: string;
  address: string;          // stored as "street, city"
  country?: string;         // ISO name from the country picker; optional (seeds predate it)
  type: string;             // Apartment Building / Villa / Office / …
  units: number;            // headline count (independent of the Unit registry)
  occupied: number;
  rent: number;             // base rent per unit per month
  status: PropertyStatus;   // 'Active' | 'Vacant' | 'Under Maintenance'
  image: string;            // initials fallback
  imageUrl: string;
  yearBuilt: number;
}
```

* `country` feeds the tenant/staff phone field's default dial code
  (`callingCountryForName` in `data/phone.ts`).
* `units` is a headline number typed by the user; the **Unit registry is separate** and may
  hold fewer records. They are intentionally not reconciled — the registry is opt-in per
  property.
* `status` is user-editable from the property form (Active / Vacant / Under Maintenance) and
  drives both the badge and the Properties status tabs.

## Unit

```ts
type UnitStatus = 'Vacant' | 'Occupied' | 'Maintenance';
type UnitType   = 'Studio' | '1 BR' | '2 BR' | '3 BR' | '4 BR' | 'Other';

interface Unit {
  id: string;
  propertyId: string;       // owner — a unit belongs to exactly one property
  name: string;             // "A-204"; unique within its property (case-insensitive)
  floor?: number;
  type: UnitType;
  bedrooms: number;         // derived from `type` unless type === 'Other'
  bathrooms: number;
  size?: number;            // sqm
  rent: number;
  status: UnitStatus;       // stored fallback — see occupancy resolution below
  notes?: string;
}
```

**Invariants**

1. `name` is unique per property, case-insensitively (`isDuplicateUnitName`).
2. `bedrooms` restates `type` for every type except `'Other'`; the form derives and locks it
   (`bedroomsForType`). `'Other'` is the only case where bedrooms is independent data.
3. Stored `status` is a *fallback*. The displayed status resolves through
   `resolveUnitStatus(unit, tenants, leases)`: any live tenant or lease link forces
   `'Occupied'`. One source of truth, computed rather than denormalised.

## Tenant

```ts
interface Tenant {
  id: string;
  name: string; email: string; phone: string;
  propertyId: string;
  unit: string;             // display label — legacy rows predate the Unit registry
  unitId?: string;          // link to a managed Unit within propertyId
  beds: string;             // 'Studio' | '1 BR' | … (mirrors UnitType vocabulary)
  leaseStart: string; leaseEnd: string;   // YYYY-MM-DD
  leaseStatus: 'Active' | 'Expiring Soon' | 'Expired';
  rent: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  paymentDate: string;
  status: 'Active' | 'Pending' | 'Inactive';
}
```

* The `unit` + `unitId?` pair is the **legacy-tolerant link pattern** used throughout:
  matchers honour the id first and fall back to the label, so rows created before the Unit
  registry keep working (`tenantOccupiesUnit`).
* `phone` is stored in international format (`+1 619 555 0142`) for records created/edited
  through the current form; older seed rows keep national format and still validate.

## Lease

```ts
interface Lease {
  id: string;               // "L-1024"
  propertyId: string; tenantId: string;
  unitId?: string;          // leased unit within propertyId
  start: string; end: string;
  rent: number; deposit: number;
  status: 'Active' | 'Expiring' | 'Expired';
}
```

Leases are the input to rent generation: only `Active`/`Expiring` leases produce payments.

## Payment

```ts
interface Payment {
  id: string;               // manual: "PAY-9011" · generated: "PAY-<leaseId>-<YYYY-MM>"
  tenantId: string; propertyId: string;
  amount: number;
  date: string;             // due date for generated rows
  method: 'Bank' | 'Card' | 'Cash';
  status: 'Paid' | 'Pending' | 'Overdue';
  leaseId?: string;         // present on auto-generated rent rows
  period?: string;          // billing period "YYYY-MM" on generated rows
}
```

The `id`/`leaseId`/`period` triple is the **idempotency key** for rent automation — see
[03-business-logic.md](./03-business-logic.md#rent-automation).

## MaintenanceRequest

```ts
type MaintenanceStatus = 'Open' | 'In Progress' | 'Paused' | 'Scheduled' | 'Completed';
type MaintenanceScope  = 'property' | 'units' | 'tenants';

interface MaintenanceRequest {
  id: string;               // "M-201"
  propertyId: string;
  scope: MaintenanceScope;  // discriminant: what the request targets
  unitIds: string[];        // populated only when scope === 'units'
  tenantIds: string[];      // populated only when scope === 'tenants'
  title: string; description: string;
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliance' | 'Structural' | 'Cleaning' | 'General' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: MaintenanceStatus;
  reported: string; scheduledDate?: string; completedDate?: string;
  assigneeId?: string;      // → MaintenanceStaff.id; undefined = Unassigned
  estimatedCost: number; actualCost?: number;
  history: { date: string; text: string }[];   // append-only audit trail
}
```

**The scope discriminant** is the heart of this entity. A request targets exactly one of:

| scope | meaning | unitIds | tenantIds |
| --- | --- | --- | --- |
| `'property'` | the whole building / a common area | `[]` | `[]` |
| `'units'` | one or more specific units | ≥ 1, all in `propertyId` | `[]` |
| `'tenants'` | one or more specific tenants | `[]` | ≥ 1, all in `propertyId` |

This is why a whole-property request needs **no placeholder unit or tenant record** — the
absence of ids is meaningful, not missing data. Enforced by `validateMaintenanceTarget`.

`history` is append-only: every status change and reassignment pushes an entry, and nothing
ever removes one. That is what makes pause/resume non-destructive.

## MaintenanceStaff

```ts
interface MaintenanceStaff {
  id: string;
  name: string; phone: string; email: string;
  specialty: MaintenanceRequest['category'];   // reuses the category union, not a new one
  status: 'Active' | 'Inactive';
}
```

* Only `Active` staff are offered in assignment pickers; an already-assigned staff member
  stays selectable even after deactivation so their name still renders.
* Deletion is blocked while any non-`Completed` request is assigned to them
  (`getStaffBlockers`).

## DocFile

```ts
interface DocFile {
  id: string; name: string;
  propertyId: string; unit?: string; tenantId?: string; leaseId?: string;
  type: DocumentType;       // Lease | Contract | Invoice | Property Document | … | Other
  size: string;             // display string, e.g. "2.4 MB"
  uploadedBy: string; uploadDate: string; expirationDate?: string;
  status: DocumentStatus;   // Active | Expired | Expiring Soon | Archived
  description: string;
}
```

## Supporting types

* `AppNotification` — `kind` (maintenance/payment/lease/tenant), title, detail, read flag and
  a `link` naming the page to open.
* `Conversation` / `ChatMessage` — the messages panel.
* `Toast` — `{ id, message }`, auto-dismissed after 3.5s by `pushToast`.

## Cross-entity invariants (the ones worth stating in an interview)

1. **Units and tenants never cross properties.** Every picker filters by the selected
   property, every property switch clears dependent selections, and the store re-validates on
   write (`validateMaintenanceTarget`).
2. **Unit names are unique per property**, not globally — "A-101" can exist in two buildings.
3. **Maintenance targets are exclusive by scope** — `unitIds` and `tenantIds` are never both
   populated.
4. **Occupancy is derived, never stored twice** — `resolveUnitStatus` computes it from live
   tenants/leases.
5. **Bedrooms restates unit type** for all types but `'Other'`.
6. **Generated payments are idempotent** by `PAY-<leaseId>-<period>` plus a tenant/period
   coverage check that also respects manually recorded payments.
7. **Deletion is blocked, never cascaded** — deleting a unit or staff member is refused while
   dependents exist (`getUnitBlockers`, `getStaffBlockers`), with the blocking records listed
   for the user. Nothing silently orphans.
