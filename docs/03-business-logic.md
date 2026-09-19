# 03 · Business Logic

Every rule below lives in a pure module under `src/lib/` or a feature `*Utils.ts`, so it can
be reasoned about (and tested) without React or the store.

---

## Validation: the two-gate pattern

There is no backend, so the store is the integrity boundary. Every important write passes
through **two gates**:

```
┌── Gate 1 — the form ────────────┐   ┌── Gate 2 — the store ───────────────┐
│ per-field messages, live, for   │   │ one guard function, returns          │
│ user experience                 │──▶│ `string | null`; refuses to persist  │
│ e.g. errs.name / errs.email     │   │ e.g. validateUnit, validateStaff     │
└─────────────────────────────────┘   └──────────────────────────────────────┘
```

| Write | Store action | Guard | Rules enforced |
| --- | --- | --- | --- |
| Unit | `addUnit` / `updateUnit` | `validateUnit` | name required, unique per property, rent > 0, no negative numbers, integral bedrooms/floor |
| Maintenance | `addMaintenance` | `validateMaintenanceTarget` | property required; `units` scope needs ≥1 unit **belonging to that property**; `tenants` scope likewise |
| Staff | `addStaff` / `updateStaff` | `validateStaff` | name required, email required + format, phone valid when present |
| Document | `addDocument` | `validateDocRecord` + `sanitizeFileName` | extension supported, size ≤ 10 MB, MIME consistent, filename sanitised |

The caller must handle the rejection. `App.tsx#createMaintenance` and `#createDocument` toast
the message and **keep the modal open**; `UnitFormModal`/`StaffFormModal` render it as a
`serverError` banner under the form.

> Interview framing: this is deliberately the shape a real API boundary would have. Swap the
> guard call for `await api.post(...)` and the UI contract — `string | null` rejection,
> modal stays open — does not change.

---

## Rent automation

`src/lib/paymentAutomation.ts` + `store.runPaymentAutomation`.

### The scheduling problem

A frontend-only SPA has no cron, no queue and no process running while the app is closed. The
job is therefore split the way offline-first apps do it:

* **Pure planners** — `planMonthlyPayments`, `planOverdueTransitions`, `planAutomationRun`.
  They take an explicit `today` and have no clock, network or DOM dependency.
* **One applier** — `store.runPaymentAutomation` applies a plan in a single `set()`.
* **Event-driven triggers**, not timers: app boot (`main.tsx`) and Payments page mount
  (`Payments.tsx` `useEffect`). Every run is idempotent, so repeated runs are safe.

A real backend scheduler could call the exact same planner functions unchanged.

### Constants

```ts
APP_TIMEZONE         = 'UTC'   // business timezone for all day boundaries
GENERATION_LEAD_DAYS = 3       // generate next month once within 3 days of it
OVERDUE_GRACE_DAYS   = 1       // Pending → Overdue one day after the due date
```

### Generation

For each period returned by `generationPeriods(today)` (always the current month for
missed-run catch-up, plus next month inside the lead window):

```
for each lease:
  skip unless status is Active | Expiring          → 'expired-lease'
  skip if the term is unusable or period outside it
  skip if tenant missing or Inactive               → 'inactive-tenant'
  skip if rent missing/≤0                          → 'missing-data' + error
  skip if already covered                          → duplicatesSkipped
  create Payment { id: PAY-<leaseId>-<period>, date: first of month, status: 'Pending' }
```

**Idempotency** has two layers: the deterministic id, *and* a coverage check that treats any
same-tenant payment whose `date` falls in the period as covering it — so a manually recorded
payment also blocks generation. Within a single run, later periods see earlier periods'
creations before deciding duplicates.

Skips are classified, never thrown: one broken lease can't abort the whole run.

### Overdue transition

```ts
planOverdueTransitions(payments, today):
  cutoff = today - OVERDUE_GRACE_DAYS
  every Pending payment with date <= cutoff  →  Overdue
```

| Due date | On the due date | One day later |
| --- | --- | --- |
| Oct 1 | stays `Pending` | becomes `Overdue` |

`Paid` and already-`Overdue` rows are never touched, and a row with an unparseable date is
conservatively left alone. At apply time the store **re-checks** `p.status === 'Pending'`
before flipping, so a payment marked Paid between planning and applying can't be clobbered.

Date maths runs on `YYYY-MM-DD` strings via UTC millis (`addDaysIso`), which is DST-proof;
"today" comes from `zonedToday(APP_TIMEZONE, now)` using `Intl.DateTimeFormat`, never from
`toISOString().slice(0,10)` (which would be the device's UTC day, not the business day).

### Reporting

Every run returns a `PaymentAutomationReport` (periods, created ids, duplicates, ineligible
count, overdue ids, errors) and logs a single PII-free line — counts and ids only, never
names, emails or amounts. A notification is pushed when anything actually changed.

---

## Maintenance: scope model

`src/lib/maintenanceScope.ts` + `pages/Maintenance/maintenanceUtils.ts`.

A request targets the **entire property**, **specific units**, or **specific tenants** — and
exactly one of the three (`scope` is the discriminant). Consequences:

* An entire-property request stores `unitIds: []`, `tenantIds: []`. No placeholder records.
* Pickers only ever offer units/tenants of the selected property
  (`unitsForProperty`, `tenants.filter(t => t.propertyId === propertyId)`).
* Switching property **clears both selections unconditionally** — a unit from Property A can
  never survive into Property B.
* Switching scope clears both as well, so leftovers can't leak into the submitted draft.
* Submit rebuilds them from scope anyway (`unitIds: scope === 'units' ? unitIds : []`) —
  defence in depth — and then the store re-validates.

`scopeLabel(m, units)` and `tenantsLabel(m, tenants)` are the single source of truth for how
a target renders in the table, the details modal and the search haystack.

## Maintenance: status lifecycle

```
                   ┌──────────────┐
        ┌─────────▶│    Open      │◀──────────┐
        │          └──┬────────┬──┘           │ "Move back to Open"
        │   "Schedule"│        │"Start Progress"
        │             ▼        ▼
        │      ┌───────────┐  ┌──────────────┐   "Pause Progress"   ┌──────────┐
        │      │ Scheduled │  │ In Progress  │─────(confirm)───────▶│  Paused  │
        │      └─────┬─────┘  └──────┬───────┘◀───"Resume Progress"─┴────┬─────┘
        │            │               │                                   │
        │            └───────────────┼───────────────────────────────────┘
        │                            ▼
        │                     ┌─────────────┐
        └─────────────────────│  Completed  │
                              └─────────────┘
```

Rules:

* **Pausing is not completing.** `changeStatus` only stamps `completedDate`/`actualCost` when
  the target status is `'Completed'`; for every other status `completedDate` is cleared and
  `actualCost` is carried through untouched.
* **Nothing is reset.** `scheduledDate` is preserved (`m.scheduledDate ?? …`), and `history`
  is appended to, never rewritten. A paused request keeps its full trail and resumes exactly
  where it was.
* **Pause requires confirmation** — the only transition gated by a `ConfirmDialog`, because
  it is the one that stalls work.
* Completion can be reached from `In Progress`, `Scheduled` or `Paused`.

## Maintenance: staff assignment

* Assignment stores `assigneeId` (a real FK); `undefined` means Unassigned, and
  `staffName(id, staff)` resolves the display name.
* Assignment pickers list **Active staff only**, plus the currently assigned member even if
  since deactivated — so deactivating someone never silently blanks an existing assignment.
* Reassignment is available inline in the details modal and appends
  `"Reassigned to X"` / `"Unassigned"` to history.
* **Delete is blocked, not cascaded**: `getStaffBlockers` lists every non-`Completed` request
  still assigned, and the UI shows those ids instead of a confirm dialog.

---

## Units

| Rule | Where |
| --- | --- |
| Unit names unique per property (case-insensitive) | `isDuplicateUnitName` |
| Occupancy derived from live tenants/leases, overriding stored status | `resolveUnitStatus` |
| A tenant occupies a unit by `unitId`, else by matching label within the property; `Inactive` tenants never count | `tenantOccupiesUnit` |
| A lease covers a unit only while `Active`/`Expiring`, by `unitId` or through its tenant | `leaseCoversUnit` |
| Bedrooms derived from unit type; `'Other'` is the only manual case | `bedroomsForType` |
| Delete blocked by tenants, live leases and non-completed maintenance — each listed | `getUnitBlockers` |

Unit-delete blockers are also scope-aware for maintenance: a whole-property request blocks
every unit in that property; a `units`-scoped request blocks the units it names; tenant-scoped
requests need no separate check because the occupying tenant already blocks deletion.

---

## Phone numbers

`src/data/phone.ts` + `src/components/PhoneInput.tsx`, built on **libphonenumber-js**.

* **Input** — a dial-code `SearchSelect` (flag + `+code`, country name as the searchable
  `detail`) beside a national-number input formatted live by `AsYouType`.
* **Default country** — derived from the selected property's `country`
  (`callingCountryForName`), falling back to `DEFAULT_CALLING_COUNTRY = 'US'`. While the field
  is untouched and empty it keeps following the property; once the user types or picks a
  country, it stops.
* **Storage** — one string: international format (`+1 619 555 0142`) once the number parses,
  otherwise the raw text. No second "country" column on the entity.
* **Validation** — `isPhoneValid(value, country)`. A `+`-prefixed value validates against the
  country embedded in the number, so the `country` argument only matters for national-format
  input. That is what lets legacy seed numbers like `(619) 555-0142` keep validating while new
  entries are normalised.

## Documents

`src/lib/files.ts` — the strictest validation in the app, because file upload is the one place
untrusted bytes enter.

1. **Extension** must be one of PDF, DOC, DOCX, XLS, XLSX, TXT.
2. **Size** ≤ 10 MB, non-empty.
3. **MIME** is advisory: an explicit mismatch fails closed, an empty value defers to sniffing.
4. **Content sniffing** (`verifyDocFileContent`) — magic bytes for PDF (`%PDF`), legacy Office
   (`D0CF11E0`), OOXML (`PK`); NUL-byte sampling for text. For docx/xlsx it then walks the zip
   **central directory** and requires a `word/` or `xl/` entry, so a renamed `.zip` or `.png`
   is rejected.
5. **Filename sanitisation** (`sanitizeFileName`) — strips directory components (path
   traversal), control characters, collapses whitespace, caps length. The store persists the
   sanitised name.

Both the upload form and `store.addDocument` call the same `validateDocRecord`, so the gates
cannot drift apart.

---

## Cross-cutting conventions

**Tone mapping** — `lib/tone.ts` is the single badge vocabulary
(`success | warn | info | danger | neutral`) with one function per status union
(`propertyTone`, `paymentTone`, `maintenanceStatusTone`, `unitStatusTone`…). Colour never
gets decided inline in a component.

**Sorting** — `lib/sort.ts` gives every table one comparator set: `byText` (accent-insensitive,
numeric-aware so "A-2" precedes "A-10"), `byNumber` (always on the raw value, never the
formatted string), `byDate` (chronological, unparseable = missing), `byRank` (domain order for
status columns). Missing/empty values sort **last in both directions**, matching spreadsheet
expectations. `nextSort` defines the click behaviour: new column starts ascending, active
column toggles.

**Search** — each feature builds one haystack string (`maintenanceSearchText`,
`docSearchText`, inline for tenants/payments/leases) so a single query box matches across
names, ids, resolved labels and contact details.

**Dates** — `lib/format.ts`: `fmtDate` renders `YYYY-MM-DD` for display and echoes invalid
input back rather than printing "Invalid Date"; `MIN_DATE`/`MAX_DATE`/`isValidIsoDate` bound
every `<input type="date">` and work around the browser quirk where the year segment accepts
more than four digits.

**Money** — `formatMoney` in `mock.ts` is the only formatter (`$2,850`, `en-US`).

**Toasts** — `pushToast` keeps at most three and auto-dismisses each after 3.5 s.
