// Property example images generated with Node library @faker-js/faker:
// faker.seed(7); faker.image.url({ width: 600, height: 400 }) x6 (picsum.photos)
export type PropertyStatus = 'Active' | 'Vacant' | 'Under Maintenance';
export type LeaseStatus = 'Active' | 'Expiring' | 'Expired';
export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';
export type MaintenanceStatus = 'Open' | 'In Progress' | 'Paused' | 'Scheduled' | 'Completed';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Urgent';
/** What a request targets — mutually exclusive; never a mix of the three. */
export type MaintenanceScope = 'property' | 'units' | 'tenants';
export type MaintenanceStaffStatus = 'Active' | 'Inactive';

export interface Property {
  id: string;
  name: string;
  address: string;
  /** ISO 3166-1 country name, as picked in the property form. Optional: seed properties predate the field. */
  country?: string;
  type: string;
  units: number;
  occupied: number;
  rent: number;
  status: PropertyStatus;
  image: string;
  imageUrl: string;
  yearBuilt: number;
}

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

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  unit: string;
  /** Link to a managed Unit record; `unit` stays the display label (legacy rows predate units). */
  unitId?: string;
  beds: string;
  leaseStart: string;
  leaseEnd: string;
  leaseStatus: 'Active' | 'Expiring Soon' | 'Expired';
  rent: number;
  paymentStatus: 'Paid' | 'Pending' | 'Overdue';
  paymentDate: string;
  status: 'Active' | 'Pending' | 'Inactive';
}

export interface Lease {
  id: string;
  propertyId: string;
  tenantId: string;
  /** Link to the leased Unit record within `propertyId`. */
  unitId?: string;
  start: string;
  end: string;
  rent: number;
  deposit: number;
  status: LeaseStatus;
}

export interface Payment {
  id: string;
  tenantId: string;
  propertyId: string;
  amount: number;
  date: string;
  method: 'Bank' | 'Card' | 'Cash';
  status: PaymentStatus;
  /** Source lease for auto-generated rent rows; manual records predate the link. */
  leaseId?: string;
  /** Billing period (YYYY-MM) for auto-generated rent rows; manual records use `date`. */
  period?: string;
}

export interface MaintenanceHistory {
  date: string;
  text: string;
}

/** A member of the maintenance/repair staff a request can be assigned to. */
export interface MaintenanceStaff {
  id: string;
  name: string;
  phone: string;
  email: string;
  specialty: MaintenanceRequest['category'];
  status: MaintenanceStaffStatus;
}

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  scope: MaintenanceScope;
  /** Populated only when `scope === 'units'`; every id belongs to `propertyId`. */
  unitIds: string[];
  /** Populated only when `scope === 'tenants'`; every id belongs to `propertyId`. */
  tenantIds: string[];
  title: string;
  description: string;
  category: 'Plumbing' | 'Electrical' | 'HVAC' | 'Appliance' | 'Structural' | 'Cleaning' | 'General' | 'Other';
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  reported: string;
  scheduledDate?: string;
  completedDate?: string;
  /** MaintenanceStaff id; undefined means Unassigned. */
  assigneeId?: string;
  estimatedCost: number;
  actualCost?: number;
  history: MaintenanceHistory[];
}

export type DocumentType =
  | 'Lease'
  | 'Contract'
  | 'Invoice'
  | 'Property Document'
  | 'Tenant Document'
  | 'Maintenance'
  | 'Insurance'
  | 'Legal'
  | 'Other';

export type DocumentStatus = 'Active' | 'Expired' | 'Expiring Soon' | 'Archived';

export interface DocFile {
  id: string;
  name: string;
  propertyId: string;
  unit?: string;
  tenantId?: string;
  leaseId?: string;
  type: DocumentType;
  size: string;
  uploadedBy: string;
  uploadDate: string;
  expirationDate?: string;
  status: DocumentStatus;
  description: string;
}

export const properties: Property[] = [
  { id: 'p1', name: 'Ocean View Residences', address: '12 Marina Blvd, San Diego', type: 'Apartment', units: 24, occupied: 22, rent: 2850, status: 'Active', image: 'OV', imageUrl: 'https://picsum.photos/seed/MrIYx/600/400', yearBuilt: 2018 },
  { id: 'p2', name: 'Cedar Court Apartments', address: '48 Cedar St, Austin', type: 'Apartment', units: 18, occupied: 15, rent: 1950, status: 'Active', image: 'CC', imageUrl: 'https://picsum.photos/seed/4guGNn4h/600/400', yearBuilt: 2015 },
  { id: 'p3', name: 'Elm & Park Lofts', address: '7 Elm Park, Chicago', type: 'Loft', units: 32, occupied: 28, rent: 2400, status: 'Active', image: 'EP', imageUrl: 'https://picsum.photos/seed/dsV1BWeyU8/600/400', yearBuilt: 2020 },
  { id: 'p4', name: 'Sunset Villas', address: '301 Sunset Ave, Phoenix', type: 'Villa', units: 12, occupied: 9, rent: 2200, status: 'Vacant', image: 'SV', imageUrl: 'https://picsum.photos/seed/KFtcuntm/600/400', yearBuilt: 2012 },
  { id: 'p5', name: 'Harbor Point', address: '90 Harbor Rd, Seattle', type: 'Apartment', units: 20, occupied: 20, rent: 3100, status: 'Active', image: 'HP', imageUrl: 'https://picsum.photos/seed/LjzhslEmsI/600/400', yearBuilt: 2021 },
  { id: 'p6', name: 'Maple Grove', address: '5 Maple Ln, Denver', type: 'Townhouse', units: 16, occupied: 0, rent: 1750, status: 'Under Maintenance', image: 'MG', imageUrl: 'https://picsum.photos/seed/UbJqqDw/600/400', yearBuilt: 2009 },
];

/**
 * Managed unit registry (Property → Units). Seed units mirror the curated
 * tenant/lease/maintenance rows above; generated demo rows keep their
 * free-text `unit` label without a `unitId` link.
 */
export const units: Unit[] = [
  { id: 'u-p1-204', propertyId: 'p1', name: 'A-204', floor: 2, type: '2 BR', bedrooms: 2, bathrooms: 2, size: 85, rent: 2850, status: 'Occupied' },
  { id: 'u-p1-205', propertyId: 'p1', name: 'A-205', floor: 2, type: '2 BR', bedrooms: 2, bathrooms: 2, size: 85, rent: 2850, status: 'Vacant' },
  { id: 'u-p1-101', propertyId: 'p1', name: 'A-101', floor: 1, type: '1 BR', bedrooms: 1, bathrooms: 1, size: 55, rent: 1950, status: 'Maintenance', notes: 'Bathroom retile in progress.' },
  { id: 'u-p2-101', propertyId: 'p2', name: 'B-101', floor: 1, type: '1 BR', bedrooms: 1, bathrooms: 1, size: 52, rent: 1950, status: 'Occupied' },
  { id: 'u-p2-102', propertyId: 'p2', name: 'B-102', floor: 1, type: '2 BR', bedrooms: 2, bathrooms: 1, size: 72, rent: 2100, status: 'Vacant' },
  { id: 'u-p3-305', propertyId: 'p3', name: 'C-305', floor: 3, type: '2 BR', bedrooms: 2, bathrooms: 2, size: 80, rent: 2400, status: 'Occupied' },
  { id: 'u-p3-110', propertyId: 'p3', name: 'C-110', floor: 1, type: '1 BR', bedrooms: 1, bathrooms: 1, size: 54, rent: 2400, status: 'Occupied' },
  { id: 'u-p3-111', propertyId: 'p3', name: 'C-111', floor: 1, type: 'Studio', bedrooms: 0, bathrooms: 1, size: 38, rent: 1800, status: 'Vacant' },
  { id: 'u-p4-102', propertyId: 'p4', name: 'D-102', floor: 1, type: '2 BR', bedrooms: 2, bathrooms: 2, size: 78, rent: 2200, status: 'Vacant', notes: 'Previous tenancy ended Aug 2025.' },
  { id: 'u-p4-103', propertyId: 'p4', name: 'D-103', floor: 1, type: '2 BR', bedrooms: 2, bathrooms: 1, size: 70, rent: 2150, status: 'Vacant' },
  { id: 'u-p5-401', propertyId: 'p5', name: 'E-401', floor: 4, type: '3 BR', bedrooms: 3, bathrooms: 2, size: 110, rent: 3100, status: 'Occupied' },
  { id: 'u-p5-402', propertyId: 'p5', name: 'E-402', floor: 4, type: '3 BR', bedrooms: 3, bathrooms: 2, size: 108, rent: 3100, status: 'Vacant' },
  { id: 'u-p6-101', propertyId: 'p6', name: 'F-101', floor: 1, type: '2 BR', bedrooms: 2, bathrooms: 1, size: 68, rent: 1750, status: 'Maintenance', notes: 'Lobby + unit turnover refresh.' },
  { id: 'u-p6-102', propertyId: 'p6', name: 'F-102', floor: 1, type: '1 BR', bedrooms: 1, bathrooms: 1, size: 50, rent: 1650, status: 'Maintenance' },
];

const _first = ['Sarah', 'Michael', 'David', 'John', 'Elena', 'Omar', 'Lena', 'Carlos', 'Aisha', 'Tom', 'Nadia', 'Peter', 'Yuki', 'Anna', 'Rami', 'Julia', 'Sam', 'Maria', 'Ken', 'Lara', 'Ivan', 'Huda', 'Chris', 'Dana'];
const _last = ['Johnson', 'Smith', 'Brown', 'Wilson', 'Garcia', 'Haddad', 'Fischer', 'Lopez', 'Khan', 'Miller', 'Ali', 'Novak', 'Tanaka', 'Ross', 'Khalil', 'Becker', 'Adams', 'Silva', 'Watanabe', 'Nasser', 'Petrov', 'Salem', 'Evans', 'Mansour'];
const _props = ['p1', 'p2', 'p3', 'p4', 'p5', 'p1', 'p3', 'p2'];
const _beds = ['Studio', '1 BR', '2 BR', '2 BR', '3 BR'];

export const tenants: Tenant[] = [
  { id: 't1', name: 'Amelia Hart', email: 'amelia@mail.com', phone: '(619) 555-0142', propertyId: 'p1', unit: 'A-204', unitId: 'u-p1-204', beds: '2 BR', leaseStart: '2025-06-01', leaseEnd: '2026-05-31', leaseStatus: 'Active', rent: 2850, paymentStatus: 'Paid', paymentDate: 'Sep 1', status: 'Active' },
  { id: 't2', name: 'Jonas Weber', email: 'jonas@mail.com', phone: '(512) 555-0188', propertyId: 'p2', unit: 'B-101', unitId: 'u-p2-101', beds: '1 BR', leaseStart: '2024-11-01', leaseEnd: '2025-11-30', leaseStatus: 'Expiring Soon', rent: 1950, paymentStatus: 'Pending', paymentDate: 'Sep 5', status: 'Pending' },
  { id: 't3', name: 'Priya Nair', email: 'priya@mail.com', phone: '(312) 555-0119', propertyId: 'p3', unit: 'C-305', unitId: 'u-p3-305', beds: '2 BR', leaseStart: '2025-02-01', leaseEnd: '2026-01-31', leaseStatus: 'Active', rent: 2400, paymentStatus: 'Paid', paymentDate: 'Sep 2', status: 'Active' },
  { id: 't4', name: 'Diego Ramos', email: 'diego@mail.com', phone: '(602) 555-0133', propertyId: 'p4', unit: 'D-102', unitId: 'u-p4-102', beds: '2 BR', leaseStart: '2024-08-01', leaseEnd: '2025-08-31', leaseStatus: 'Expired', rent: 2200, paymentStatus: 'Overdue', paymentDate: 'Aug 28', status: 'Inactive' },
  { id: 't5', name: 'Sofia Lind', email: 'sofia@mail.com', phone: '(206) 555-0177', propertyId: 'p5', unit: 'E-401', unitId: 'u-p5-401', beds: '3 BR', leaseStart: '2025-04-01', leaseEnd: '2026-03-31', leaseStatus: 'Active', rent: 3100, paymentStatus: 'Paid', paymentDate: 'Sep 3', status: 'Active' },
  { id: 't6', name: 'Marcus Chen', email: 'marcus@mail.com', phone: '(720) 555-0121', propertyId: 'p3', unit: 'C-110', unitId: 'u-p3-110', beds: '1 BR', leaseStart: '2025-07-01', leaseEnd: '2026-06-30', leaseStatus: 'Active', rent: 2400, paymentStatus: 'Overdue', paymentDate: 'Aug 30', status: 'Active' },
  ...generatedTenants(),
];

// Deterministic demo data (seeded PRNG) so pagination/filtering is stable.
function _rand(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatedTenants(): Tenant[] {
  const rnd = _rand(42);
  // Exact portfolio-wide counts: Active 116 / Pending 4 / Inactive 8,
  // Expiring Soon 8, Overdue 5 (t2/t4/t6 curated + sets below).
  const expiring = new Set([4, 16, 28, 40, 52, 64, 76]);
  const overdue = new Set([6, 26, 46]);
  const pending = new Set([5, 29, 53]);
  const inactive = new Set([9, 21, 33, 45, 57, 69, 81]);
  const out: Tenant[] = [];
  for (let i = 0; i < 122; i++) {
    const fn = _first[i % _first.length];
    const ln = _last[(i * 7 + 3) % _last.length];
    const pid = _props[i % _props.length];
    const unit = `${'ABCDEF'[i % 6]}-${101 + ((i * 37) % 300)}`;
    const rent = 950 + Math.floor(rnd() * 18) * 100;
    const leaseStatus: Tenant['leaseStatus'] = expiring.has(i)
      ? 'Expiring Soon'
      : i % 17 === 10
        ? 'Expired'
        : 'Active';
    const paymentStatus: Tenant['paymentStatus'] = overdue.has(i)
      ? 'Overdue'
      : i % 11 === 3
        ? 'Pending'
        : 'Paid';
    const status: Tenant['status'] = pending.has(i) ? 'Pending' : inactive.has(i) ? 'Inactive' : 'Active';
    out.push({
      id: `t${7 + i}`,
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(i / 24) + 1}@mail.com`,
      phone: `(555) 555-${1000 + i}`,
      propertyId: pid,
      unit,
      beds: _beds[i % _beds.length],
      leaseStart: '2025-01-15',
      leaseEnd: expiring.has(i) ? `2026-10-${15 + (i % 10)}` : `202${6 + Math.floor(rnd() * 2)}-${String(1 + Math.floor(rnd() * 12)).padStart(2, '0')}-28`,
      leaseStatus,
      rent,
      paymentStatus,
      paymentDate: `Sep ${(i % 28) + 1}`,
      status,
    });
  }
  return out;
}

export const leases: Lease[] = [
  { id: 'L-1024', propertyId: 'p1', tenantId: 't1', unitId: 'u-p1-204', start: '2025-06-01', end: '2026-05-31', rent: 2850, deposit: 2850, status: 'Active' },
  { id: 'L-1025', propertyId: 'p2', tenantId: 't2', unitId: 'u-p2-101', start: '2024-11-01', end: '2025-11-30', rent: 1950, deposit: 1950, status: 'Expiring' },
  { id: 'L-1026', propertyId: 'p3', tenantId: 't3', unitId: 'u-p3-305', start: '2025-02-01', end: '2026-01-31', rent: 2400, deposit: 2400, status: 'Active' },
  { id: 'L-1027', propertyId: 'p4', tenantId: 't4', unitId: 'u-p4-102', start: '2024-08-01', end: '2025-08-31', rent: 2200, deposit: 2200, status: 'Expired' },
  { id: 'L-1028', propertyId: 'p5', tenantId: 't5', unitId: 'u-p5-401', start: '2025-04-01', end: '2026-03-31', rent: 3100, deposit: 3100, status: 'Active' },
  { id: 'L-1029', propertyId: 'p3', tenantId: 't6', unitId: 'u-p3-110', start: '2025-07-01', end: '2026-06-30', rent: 2400, deposit: 2400, status: 'Active' },
];

export const payments: Payment[] = [
  { id: 'PAY-9011', tenantId: 't1', propertyId: 'p1', amount: 2850, date: '2026-09-01', method: 'Bank', status: 'Paid' },
  { id: 'PAY-9012', tenantId: 't3', propertyId: 'p3', amount: 2400, date: '2026-09-02', method: 'Card', status: 'Paid' },
  { id: 'PAY-9013', tenantId: 't5', propertyId: 'p5', amount: 3100, date: '2026-09-03', method: 'Bank', status: 'Paid' },
  { id: 'PAY-9014', tenantId: 't2', propertyId: 'p2', amount: 1950, date: '2026-09-05', method: 'Card', status: 'Pending' },
  { id: 'PAY-9015', tenantId: 't6', propertyId: 'p3', amount: 2400, date: '2026-08-01', method: 'Bank', status: 'Overdue' },
  { id: 'PAY-9016', tenantId: 't4', propertyId: 'p4', amount: 2200, date: '2026-07-01', method: 'Cash', status: 'Overdue' },
  { id: 'PAY-9017', tenantId: 't1', propertyId: 'p1', amount: 2850, date: '2026-08-01', method: 'Bank', status: 'Paid' },
  { id: 'PAY-9018', tenantId: 't5', propertyId: 'p5', amount: 3100, date: '2026-08-01', method: 'Bank', status: 'Paid' },
];

/**
 * Maintenance staff directory. `st6` is deliberately unreferenced by any
 * request and Inactive, so the "inactive staff can't be assigned" rule has a
 * seeded example out of the box.
 */
export const staff: MaintenanceStaff[] = [
  { id: 'st1', name: 'R. Alvarez', phone: '(619) 555-0301', email: 'r.alvarez@propora.io', specialty: 'Plumbing', status: 'Active' },
  { id: 'st2', name: 'K. Osei', phone: '(619) 555-0302', email: 'k.osei@propora.io', specialty: 'HVAC', status: 'Active' },
  { id: 'st3', name: 'J. Park', phone: '(619) 555-0303', email: 'j.park@propora.io', specialty: 'Electrical', status: 'Active' },
  { id: 'st4', name: 'Ahmed Maintenance', phone: '(619) 555-0304', email: 'ahmed@propora.io', specialty: 'General', status: 'Active' },
  { id: 'st5', name: 'L. Haddad', phone: '(619) 555-0305', email: 'l.haddad@propora.io', specialty: 'Appliance', status: 'Active' },
  { id: 'st6', name: 'M. Torres', phone: '(619) 555-0306', email: 'm.torres@propora.io', specialty: 'Cleaning', status: 'Inactive' },
];

export function staffName(id: string | undefined, list: MaintenanceStaff[] = staff): string {
  if (id === undefined) return 'Unassigned';
  return list.find((s) => s.id === id)?.name ?? 'Unassigned';
}

// FK + display-name pairs (same index) for the generated rows below — avoids a
// staff lookup per row while keeping the assignment a real MaintenanceStaff id.
const _staffIds = ['st1', 'st2', 'st3', 'st4', 'st5'];
const _mAssignees = ['R. Alvarez', 'K. Osei', 'J. Park', 'Ahmed Maintenance', 'L. Haddad'];
const _mPriorities: MaintenancePriority[] = ['High', 'Medium', 'Low', 'Medium', 'High', 'Low', 'Urgent', 'Medium', 'Low', 'Medium'];
const _mTitles: [MaintenanceRequest['category'], string, string][] = [
  ['Plumbing', 'Clogged bathroom drain', 'Shower drains slowly; snake the line and check the trap for buildup.'],
  ['Electrical', 'Faulty outlet in bedroom', 'Outlet shows no power on one side; test breaker and replace receptacle if needed.'],
  ['HVAC', 'Thermostat unresponsive', 'Thermostat screen blank; replace batteries and verify furnace control wiring.'],
  ['Appliance', 'Oven not heating evenly', 'Lower element glows weakly; replace bake element and calibrate thermostat.'],
  ['Structural', 'Crack in hallway drywall', 'Hairline crack above door frame; tape, mud, sand and repaint.'],
  ['Cleaning', 'Move-out deep clean', 'Full turnover clean including carpets, appliances and windows.'],
  ['General', 'Balcony railing loose', 'Railing wobbles at bracket; re-anchor bolts and verify stability.'],
  ['Plumbing', 'Running toilet', 'Toilet runs every few minutes; replace flapper and fill valve.'],
  ['Electrical', 'Doorbell not working', 'No chime on press; check transformer voltage and replace chime unit.'],
  ['HVAC', 'Noisy vent fan', 'Bathroom vent rattles; clean blades and replace worn bushings.'],
];

// Grouped once for the generated rows below — every generated unit/tenant
// target is guaranteed to actually belong to the request's property.
const _unitsByProperty = new Map<string, string[]>();
for (const u of units) _unitsByProperty.set(u.propertyId, [...(_unitsByProperty.get(u.propertyId) ?? []), u.id]);
const _tenantsByProperty = new Map<string, string[]>();
for (const t of tenants) _tenantsByProperty.set(t.propertyId, [...(_tenantsByProperty.get(t.propertyId) ?? []), t.id]);

export const maintenance: MaintenanceRequest[] = [
  { id: 'M-201', propertyId: 'p1', scope: 'tenants', unitIds: [], tenantIds: ['t1'], title: 'Leaking kitchen faucet unit A-204', description: 'Kitchen faucet drips continuously even when fully closed. Likely a worn cartridge that needs replacement.', category: 'Plumbing', priority: 'High', status: 'Open', reported: '2026-09-10', assigneeId: 'st1', estimatedCost: 120, history: [{ date: '2026-09-10', text: 'Request created' }, { date: '2026-09-10', text: 'Assigned to R. Alvarez' }] },
  { id: 'M-202', propertyId: 'p3', scope: 'tenants', unitIds: [], tenantIds: ['t3'], title: 'AC not cooling C-305', description: 'Split AC blows warm air. Filter cleaned by tenant with no improvement; likely refrigerant or compressor issue.', category: 'HVAC', priority: 'Urgent', status: 'In Progress', reported: '2026-09-11', scheduledDate: '2026-09-15', assigneeId: 'st2', estimatedCost: 320, history: [{ date: '2026-09-11', text: 'Request created' }, { date: '2026-09-11', text: 'Assigned to K. Osei' }, { date: '2026-09-12', text: 'Status changed to In Progress' }] },
  { id: 'M-203', propertyId: 'p2', scope: 'property', unitIds: [], tenantIds: [], title: 'Hallway light flicker', description: 'Second-floor hallway lights flicker intermittently. Suspected loose ballast; electrician scheduled.', category: 'Electrical', priority: 'Medium', status: 'In Progress', reported: '2026-09-08', scheduledDate: '2026-09-14', assigneeId: 'st3', estimatedCost: 150, history: [{ date: '2026-09-08', text: 'Request created' }, { date: '2026-09-09', text: 'Assigned to J. Park' }, { date: '2026-09-12', text: 'Status changed to In Progress' }] },
  { id: 'M-204', propertyId: 'p5', scope: 'tenants', unitIds: [], tenantIds: ['t5'], title: 'Dishwasher noise E-401', description: 'Dishwasher rattles during drain cycle. Replaced drain pump; tested quiet.', category: 'Appliance', priority: 'Low', status: 'Completed', reported: '2026-09-02', scheduledDate: '2026-09-04', completedDate: '2026-09-05', assigneeId: 'st1', estimatedCost: 180, actualCost: 165, history: [{ date: '2026-09-02', text: 'Request created' }, { date: '2026-09-03', text: 'Assigned to R. Alvarez' }, { date: '2026-09-04', text: 'Status changed to In Progress' }, { date: '2026-09-05', text: 'Status changed to Completed' }] },
  { id: 'M-205', propertyId: 'p6', scope: 'property', unitIds: [], tenantIds: [], title: 'Lobby repaint + flooring', description: 'Turnover refresh: repaint lobby walls and replace damaged vinyl planks near entrance.', category: 'General', priority: 'Medium', status: 'Open', reported: '2026-09-06', estimatedCost: 2400, history: [{ date: '2026-09-06', text: 'Request created' }] },
  { id: 'M-206', propertyId: 'p4', scope: 'tenants', unitIds: [], tenantIds: ['t4'], title: 'Bathroom exhaust fan D-102', description: 'Exhaust fan hums loudly. Replaced motor assembly.', category: 'Electrical', priority: 'Low', status: 'Completed', reported: '2026-08-28', scheduledDate: '2026-08-30', completedDate: '2026-08-30', assigneeId: 'st3', estimatedCost: 95, actualCost: 95, history: [{ date: '2026-08-28', text: 'Request created' }, { date: '2026-08-29', text: 'Assigned to J. Park' }, { date: '2026-08-30', text: 'Status changed to Completed' }] },
  ...generatedMaintenance(),
];

// Portfolio counts: Open 12 / In Progress 7 / Scheduled 5 / Completed 43 (incl. 6 curated above).
function generatedMaintenance(): MaintenanceRequest[] {
  const rnd = _rand(99);
  const out: MaintenanceRequest[] = [];
  const inProgPriorities: MaintenancePriority[] = ['High', 'Urgent', 'High', 'Medium', 'Low'];
  for (let i = 0; i < 61; i++) {
    const status: MaintenanceStatus = i < 10 ? 'Open' : i < 15 ? 'In Progress' : i < 20 ? 'Scheduled' : 'Completed';
    const [category, title, description] = _mTitles[i % _mTitles.length];
    const pid = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'][i % 6];
    const priority: MaintenancePriority =
      status === 'In Progress' ? inProgPriorities[i - 10] : _mPriorities[i % _mPriorities.length];
    const day = String(1 + ((i * 7) % 14)).padStart(2, '0');
    const reported = status === 'Completed' ? `2026-08-${day}` : `2026-09-${day}`;
    const estimatedCost = 80 + Math.floor(rnd() * 12) * 50;
    const history: MaintenanceHistory[] = [{ date: reported, text: 'Request created' }];

    // Deterministic scope mix so the seed data exercises every scenario:
    // mostly a specific tenant, a slice of specific unit(s), a slice of the
    // entire property (falling back to property scope if a pool is empty).
    let scope: MaintenanceScope = 'property';
    let unitIds: string[] = [];
    let tenantIds: string[] = [];
    if (i % 7 === 0) {
      const pool = _unitsByProperty.get(pid) ?? [];
      if (pool.length > 0) {
        const a = pool[i % pool.length];
        const b = pool[(i + 3) % pool.length];
        scope = 'units';
        unitIds = a === b ? [a] : [a, b];
      }
    } else if (i % 13 !== 0) {
      const pool = _tenantsByProperty.get(pid) ?? [];
      if (pool.length > 0) {
        scope = 'tenants';
        tenantIds = [pool[i % pool.length]];
      }
    }

    const assigneeId = status === 'Open' && i % 3 === 0 ? undefined : _staffIds[i % _staffIds.length];
    if (assigneeId !== undefined) history.push({ date: reported, text: `Assigned to ${_mAssignees[i % _mAssignees.length]}` });
    let scheduledDate: string | undefined;
    let completedDate: string | undefined;
    let actualCost: number | undefined;
    if (status !== 'Open') {
      scheduledDate = `2026-09-${String(1 + ((i * 5) % 15)).padStart(2, '0')}`;
      history.push({ date: scheduledDate, text: `Status changed to ${status}` });
    }
    if (status === 'Completed') {
      completedDate = `2026-09-${String(2 + ((i * 3) % 13)).padStart(2, '0')}`;
      actualCost = Math.max(50, estimatedCost + (Math.floor(rnd() * 5) - 2) * 25);
      history.push({ date: completedDate, text: 'Status changed to Completed' });
    }
    out.push({
      id: `M-${207 + i}`,
      propertyId: pid,
      scope,
      unitIds,
      tenantIds,
      title,
      description,
      category,
      priority,
      status,
      reported,
      scheduledDate,
      completedDate,
      assigneeId,
      estimatedCost,
      actualCost,
      history,
    });
  }
  return out;
}

const _docTypes: DocumentType[] = ['Lease', 'Contract', 'Invoice', 'Property Document', 'Tenant Document', 'Maintenance', 'Insurance', 'Legal', 'Other'];

export const documents: DocFile[] = [
  { id: 'd1', name: 'Ocean View - Master Lease.pdf', propertyId: 'p1', tenantId: 't1', leaseId: 'L-1024', type: 'Lease', size: '2.4 MB', uploadedBy: 'Jordan Miller', uploadDate: '2026-08-22', expirationDate: '2026-05-31', status: 'Active', description: 'Executed master lease for Ocean View Residences unit A-204, including renewal terms and deposit schedule.' },
  { id: 'd2', name: 'Cedar Court - Inspection Report.pdf', propertyId: 'p2', type: 'Property Document', size: '1.1 MB', uploadedBy: 'R. Alvarez', uploadDate: '2026-08-30', status: 'Active', description: 'Annual building inspection covering structure, roofing, plumbing and common areas.' },
  { id: 'd3', name: 'Q3 Rent Roll.xlsx', propertyId: 'p3', type: 'Invoice', size: '880 KB', uploadedBy: 'Jordan Miller', uploadDate: '2026-09-05', status: 'Active', description: 'Third-quarter rent roll with collected, pending and overdue balances per unit.' },
  { id: 'd4', name: 'Harbor Point - Insurance.pdf', propertyId: 'p5', type: 'Insurance', size: '3.2 MB', uploadedBy: 'Sofia Admin', uploadDate: '2026-07-18', expirationDate: '2026-10-01', status: 'Expiring Soon', description: 'Building hazard and liability policy renewing October 1; renewal quote requested.' },
  { id: 'd5', name: 'Maintenance Vendor Contracts.zip', propertyId: 'p1', type: 'Contract', size: '12 MB', uploadedBy: 'Jordan Miller', uploadDate: '2026-09-01', expirationDate: '2027-09-01', status: 'Active', description: 'Signed annual contracts for plumbing, electrical and HVAC vendors.' },
  { id: 'd6', name: 'Tenant Handbook 2026.pdf', propertyId: 'p3', type: 'Other', size: '4.6 MB', uploadedBy: 'Sofia Admin', uploadDate: '2026-06-12', status: 'Active', description: 'Community rules, move-in checklist and emergency contacts distributed to all tenants.' },
  ...generatedDocuments(),
];

function generatedDocuments(): DocFile[] {
  const rnd = _rand(123);
  const out: DocFile[] = [];
  for (let i = 0; i < 42; i++) {
    const type = _docTypes[i % _docTypes.length];
    const pid = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'][i % 6];
    const tenant = tenants[(i * 5) % 30];
    const unit = tenant.unit;
    const day = String(1 + ((i * 7) % 15)).padStart(2, '0');
    const uploadDate = `2026-09-${day}`;
    let name: string;
    let expirationDate: string | undefined;
    let leaseId: string | undefined;
    let tenantId: string | undefined;
    if (type === 'Lease') {
      leaseId = `L-${1024 + (i % 6)}`;
      tenantId = tenant.id;
      name = `Lease Agreement - Unit ${unit}`;
      expirationDate = `2026-1${i % 2}-28`;
    } else if (type === 'Invoice') {
      tenantId = tenant.id;
      name = `Rent Invoice Sep 2026 - Unit ${unit}`;
    } else if (type === 'Tenant Document') {
      tenantId = tenant.id;
      name = `Tenant Application - ${tenant.name}`;
    } else if (type === 'Maintenance') {
      name = `Work Order M-${207 + (i % 40)} - Unit ${unit}`;
    } else if (type === 'Insurance') {
      name = `Property Insurance 2026 - ${propertyName(pid)}`;
      expirationDate = `2026-10-${String(1 + (i % 20)).padStart(2, '0')}`;
    } else if (type === 'Contract') {
      name = `Vendor Contract - ${['Plumbing', 'Electrical', 'HVAC', 'Cleaning'][i % 4]} ${2026}`;
      expirationDate = `2027-09-${day}`;
    } else if (type === 'Legal') {
      tenantId = tenant.id;
      name = `Lease Addendum - Unit ${unit}`;
    } else if (type === 'Property Document') {
      name = `Building Inspection - ${propertyName(pid)}`;
    } else {
      name = `Move-in Checklist - Unit ${unit}`;
    }
    let status: DocumentStatus = 'Active';
    if (i % 9 === 8) status = 'Archived';
    else if (i % 7 === 6) status = 'Expiring Soon';
    else if (i % 11 === 10) status = 'Expired';
    out.push({
      id: `d${7 + i}`,
      name: `${name}.pdf`,
      propertyId: pid,
      unit,
      tenantId,
      leaseId,
      type,
      size: `${(0.4 + rnd() * 8).toFixed(1)} MB`,
      uploadedBy: ['Jordan Miller', 'Sofia Admin', 'R. Alvarez'][i % 3],
      uploadDate,
      expirationDate,
      status,
      description: `${type} record for ${propertyName(pid)}${unit ? ` unit ${unit}` : ''}, uploaded ${uploadDate}.`,
    });
  }
  return out;
}

export function propertyName(id: string, list: Property[] = properties): string {
  return list.find((p) => p.id === id)?.name ?? id;
}

export function propertyCity(id: string, list: Property[] = properties): string {
  const addr = list.find((p) => p.id === id)?.address ?? '';
  const parts = addr.split(',');
  return parts.length > 1 ? parts[parts.length - 1].trim() : addr;
}

/** The one tenant lookup: returns undefined when the id is not in the list. */
export function tenantById(id: string, list: Tenant[] = tenants): Tenant | undefined {
  return list.find((t) => t.id === id);
}

export function tenantName(id: string, list: Tenant[] = tenants): string {
  return tenantById(id, list)?.name ?? id;
}

export function formatMoney(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

export type NotificationKind = 'maintenance' | 'payment' | 'lease' | 'tenant';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  link: 'Maintenance' | 'Payments' | 'Leases' | 'Tenants';
}

export const notifications: AppNotification[] = [
  { id: 'n1', kind: 'maintenance', title: 'New maintenance request', detail: 'AC not cooling in C-305 (Elm & Park Lofts)', time: '25 min ago', read: false, link: 'Maintenance' },
  { id: 'n2', kind: 'payment', title: 'Overdue payment', detail: 'Marcus Chen · $2,400 · Elm & Park C-110', time: '2 hours ago', read: false, link: 'Payments' },
  { id: 'n3', kind: 'lease', title: 'Lease expiring soon', detail: 'Jonas Weber · B-101 ends Nov 30, 2025', time: '5 hours ago', read: false, link: 'Leases' },
  { id: 'n4', kind: 'tenant', title: 'New tenant application', detail: 'Sunset Villas · Unit D-104 awaiting review', time: 'Yesterday', read: true, link: 'Tenants' },
  { id: 'n5', kind: 'maintenance', title: 'Request completed', detail: 'Dishwasher noise E-401 resolved by R. Alvarez', time: 'Yesterday', read: true, link: 'Maintenance' },
  { id: 'n6', kind: 'payment', title: 'Rent received', detail: 'Amelia Hart · $2,850 · Ocean View A-204', time: '2 days ago', read: true, link: 'Payments' },
];

export interface ChatMessage {
  id: string;
  from: 'them' | 'me';
  text: string;
  time: string;
}

export interface Conversation {
  id: string;
  name: string;
  context: string;
  unread: number;
  messages: ChatMessage[];
}

export const conversations: Conversation[] = [
  {
    id: 'c1',
    name: 'Amelia Hart',
    context: 'Ocean View · A-204',
    unread: 2,
    messages: [
      { id: 'c1m1', from: 'them', text: 'Hi! The kitchen faucet is still dripping after the visit. Could someone come back?', time: '10:12 AM' },
      { id: 'c1m2', from: 'me', text: 'Hi Amelia, sorry about that — I have flagged it as high priority with our plumber.', time: '10:20 AM' },
      { id: 'c1m3', from: 'them', text: 'Thank you! I am home after 4pm tomorrow if that helps.', time: '10:24 AM' },
    ],
  },
  {
    id: 'c2',
    name: 'K. Osei',
    context: 'Technician · HVAC',
    unread: 1,
    messages: [
      { id: 'c2m1', from: 'them', text: 'C-305 compressor looks fine — likely just low refrigerant. Topping up today.', time: '9:02 AM' },
    ],
  },
  {
    id: 'c3',
    name: 'Sofia Lind',
    context: 'Harbor Point · E-401',
    unread: 0,
    messages: [
      { id: 'c3m1', from: 'them', text: 'Thanks for the quick dishwasher fix!', time: 'Mon' },
      { id: 'c3m2', from: 'me', text: 'You are welcome, Sofia!', time: 'Mon' },
    ],
  },
];
