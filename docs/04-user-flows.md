# 04 · User Flows

Each flow lists the files it touches in order, so you can trace it in the codebase.

---

## Boot

```
main.tsx
  └─ useStore.getState().runPaymentAutomation()     // wrapped in try/catch — never breaks boot
  └─ createRoot(...).render(<App />)
App.tsx
  └─ <BrowserRouter> → <AppShell>
       topbar (search, notifications, messages) · nav · page header (+ action button)
       <Routes> … </Routes>
       6 global create modals · <Toasts />
```

The store hydrates from `localStorage` (`units`, `maintenance`, `staff`) and merges the
remaining slices from the seed arrays.

---

## Create a property

1. Header action on Dashboard/Properties reads **"Add Property"** (`headerAction(page)`).
2. `AddPropertyModal` (`mode="add"`, `initial={EMPTY_PROPERTY_DRAFT}`) collects the draft —
   name, type, **status**, description, address/city/country (`SearchSelect` over
   `COUNTRY_OPTIONS`), units, base rent, year built, image (`FileReader` → data URL).
3. Validation: name/type/address/city/units/base rent required; country must be a listed one.
4. `App.createProperty(draft, imageUrl)` builds the entity — `id: p-<timestamp>`,
   `address: "street, city"`, `occupied: 0`, `status: d.status`, initials for `image`,
   a `picsum.photos` seed when no image was uploaded — then `store.addProperty`.
5. Toast + `navigate('/properties')`.

**Edit** reuses the same modal with `mode="edit"` and `propertyToDraft(property)`;
`Properties.saveEdit` patches through `updateProperty`. Editing Status here is how a property
is marked **Under Maintenance**, which also moves it into that filter tab.

---

## Add a unit to a property

1. Properties → **View Details** → `PropertyDetailsModal` → `UnitsSection` (embedded, not a
   separate route).
2. **+ Add Unit** opens `UnitFormModal` (same form serves add and edit).
3. Name uniqueness is checked live against the property's units. **Unit type drives Bedrooms**:
   picking `2 BR` locks the Bedrooms field to `2`; only `Other` makes it editable.
4. `store.addUnit` / `updateUnit` re-validate via `validateUnit` and return a rejection string
   rendered as a `serverError` banner.
5. The row's status column shows `resolveUnitStatus(...)` — a unit with a live tenant or lease
   reads **Occupied** regardless of its stored status.
6. **Delete** → `getUnitBlockers` first. Blockers (tenants, live leases, open maintenance) are
   listed in a "Cannot delete" modal; only a clean unit reaches `ConfirmDialog`.

---

## Add a tenant

1. Header action on Tenants → `TenantFormModal` (also used for edit from the row menu).
2. Property select → **Unit select filtered to that property** (plus "Other — enter manually"
   for free-text). Picking a managed unit pulls in its rent and bed count.
3. Phone uses `PhoneInput`; its dial code defaults from the **selected property's country**.
4. Validation: name, email format, phone (when non-empty), property, unit, rent > 0, lease end.
5. `App.createTenant(draft)` → `store.addTenant` with `id: t-<timestamp>`, today's date as a
   lease-start fallback, `leaseStatus: 'Active'`, `paymentStatus: 'Paid'`.
6. Switching property clears the unit link — a unit never survives a property change.

---

## Create a lease

1. Header action on Leases → `AddLeaseModal`.
2. Tenant `SearchSelect` (searchable by name, email, phone, unit via `tenantOption`), filtered
   to the selected property. Selecting a tenant **prefills** property and rent
   (`tenantPrefill`) and adopts their unit link when it belongs to that property.
3. Changing property drops a tenant or unit that no longer belongs to it.
4. Validation: tenant (and still resolvable), property, rent > 0, start, end after start.
5. `App.createLease` → `store.addLease` with a generated `L-` id.

The tenant record itself is never written back to — only its id travels with the lease.

---

## Record a payment

1. Header action on Payments → `RecordPaymentModal` (`mode="add"`).
2. Tenant picker is filtered to the chosen property (or shows everyone when no property is
   chosen yet, in which case picking a tenant fills their property in). Selecting a tenant
   prefills the amount with their rent when the amount is still empty.
3. Validation: tenant, property, amount > 0, date required — and for **new** payments the date
   cannot be in the past. Edits are exempt so historical records stay editable.
4. `App.createPayment` → `store.addPayment` with a `PAY-` id.

**Edit** reuses the same modal (`mode="edit"`) from the row's Edit button, patching via
`updatePayment`.

---

## Rent automation (no user action)

```
boot (main.tsx)  ─┐
                  ├─▶ store.runPaymentAutomation()
Payments mount ───┘        │
                           ├─ zonedToday('UTC', now)
                           ├─ planAutomationRun(snapshot, today)
                           │    ├─ generationPeriods → current month (+ next inside 3-day lead)
                           │    ├─ planMonthlyPayments per period  → Pending rows
                           │    └─ planOverdueTransitions          → ids to flip
                           ├─ nothing to do?  → return early, no set()
                           ├─ one set(): prepend created rows, flip ids still Pending
                           ├─ logAutomationReport (counts + ids only, no PII)
                           └─ pushNotification("Rent automation ran")
```

A payment due Oct 1 stays **Pending** on Oct 1 and becomes **Overdue** on Oct 2
(`OVERDUE_GRACE_DAYS = 1`).

---

## Create a maintenance request

1. Header action on Maintenance → `NewMaintenanceModal`, which receives `properties`, `units`,
   `tenants` and `staff` from the store via `App.tsx`.
2. **Request details** — title, property (`<select>`, small list), description.
3. **Scope** — a three-way tab control:

   | Choice | What appears |
   | --- | --- |
   | Entire Property | nothing else to pick |
   | Specific Units | `MultiSearchSelect` over that property's units (label `A-204 · 2 BR`, detail `Floor 2 · Occupied`) |
   | Specific Tenants | `MultiSearchSelect` over that property's tenants, searchable by name/email/phone/unit |

   Selected items render as removable chips. Changing property or scope clears both lists.
4. **Assignment** — `SearchSelect` over **Active** staff only; empty selection = Unassigned.
5. Validation: title, description, and `validateMaintenanceTarget` (property present; the
   chosen scope has ≥1 target, all belonging to that property).
6. `App.createMaintenance(draft)` builds the entity — next `M-` id, `status: 'Open'`, today's
   `reported`, history seeded with `"Request created"` and `"Assigned to X"` — and calls
   `store.addMaintenance`, which **re-validates** and may return a rejection string. On
   rejection the modal stays open and the reason is toasted.
7. Success → toast + a `maintenance` notification.

---

## Work a maintenance request (status + assignment)

1. Maintenance table row → `MaintenanceDetails`.
2. Header badges show priority / status / category; the body shows Property, Scope, and the
   resolved Unit(s) or Tenant(s).
3. **Assignment** is an inline `SearchSelect` — reassign, or clear it to unassign. Either way
   `Maintenance.changeAssignee` appends to history and toasts.
4. **Status buttons** depend on current status:
   * `Open` → Start Progress · Schedule
   * `In Progress` → Move back to Open · **Pause Progress** (confirm) · Mark Completed
   * `Paused` → **Resume Progress** · Mark Completed
   * `Scheduled` → Mark Completed
5. `Maintenance.changeStatus` writes status, preserves `scheduledDate`, clears
   `completedDate` unless completing, carries `actualCost`, and appends
   `"Status changed to X"`.

Because `maintenance` is persisted, the new status survives a refresh.

---

## Manage maintenance staff

1. Maintenance page → **Manage Staff** → `StaffModal` (roster table).
2. **+ Add Staff** / **Edit** → `StaffFormModal`: name, email, phone (`PhoneInput`),
   specialty (reuses the maintenance category union), status.
3. **Deactivate/Activate** toggles `status` inline — deactivated staff disappear from
   assignment pickers but remain visible on requests they already hold.
4. **Delete** → `getStaffBlockers`; open assigned requests are listed and block the delete,
   otherwise `ConfirmDialog`.

---

## Upload a document

1. Header action on Documents → `UploadDocumentModal`.
2. The picker accepts PDF/DOC/DOCX/XLS/XLSX/TXT (`DOC_ACCEPT`).
3. Validation runs in stages: `validateDocRecord` (extension, ≤10 MB, MIME) then
   `verifyDocFileContent` (magic bytes, and for OOXML a zip central-directory walk requiring a
   `word/`/`xl/` entry).
4. `App.createDocument` → `store.addDocument(record, { sizeBytes, mime })`, which re-validates
   and sanitises the filename. A rejection is toasted and the modal stays open.

---

## Cross-page navigation

From a tenant's row menu:

* **View Lease** → `/leases?tenantId=t1`
* **View Payments** → `/payments?tenantId=t1`

Both pages read `useSearchParams()`, render a banner naming the tenant, filter to their rows,
and offer "Clear filter". Notifications do the same kind of jump via their `link` field.
