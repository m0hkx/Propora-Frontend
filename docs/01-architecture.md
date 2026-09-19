# 01 · Architecture

## Stack

| Concern | Choice | Notes |
| --- | --- | --- |
| UI | React 19 | Function components + hooks only; no class components, no Suspense/RSC |
| Language | TypeScript 6 | Strict, plus `verbatimModuleSyntax`, `erasableSyntaxOnly`, `noUnusedLocals/Parameters` |
| Build | Vite 8 | `npm run build` = `tsc -b && vite build`, so type errors fail the build |
| Styling | Tailwind CSS v4 | `@theme` tokens + explicit cascade layers; no `tailwind.config.js` |
| State | Zustand 5 | One store, `persist` middleware for the user-created slices |
| Routing | React Router 7 | Real URL routing, not simulated page state |
| Phone | libphonenumber-js | Only runtime dependency beyond React/Zustand/Router |
| Lint | ESLint 10 flat config | Includes `react-hooks` rules (incl. `set-state-in-effect`) |

## Layer map

```
┌─────────────────────────────────────────────────────────────┐
│ src/main.tsx      boot catch-up (rent automation) → render  │
├─────────────────────────────────────────────────────────────┤
│ src/App.tsx       BrowserRouter → AppShell                  │
│                   topbar · nav · page header · <Routes>     │
│                   6 global "create" modals · toasts         │
├─────────────────────────────────────────────────────────────┤
│ src/pages/        Dashboard, Properties, Tenants, Leases,   │
│                   Payments, Maintenance, Documents, Profile │
├─────────────────────────────────────────────────────────────┤
│ src/components/   Modal, SearchSelect, MultiSearchSelect,   │
│                   PhoneInput, KpiCard, FilterBar, Pagination│
│                   SortableTh, RowMenu, EmptyState, charts   │
├─────────────────────────────────────────────────────────────┤
│ src/state/store.ts   THE store — every mutation lands here  │
├─────────────────────────────────────────────────────────────┤
│ src/lib/          pure domain logic: units, staff,          │
│                   maintenanceScope, paymentAutomation,      │
│                   files, sort, format, tone, stats, a11y    │
├─────────────────────────────────────────────────────────────┤
│ src/data/         mock.ts (types + seeds), countries, phone │
└─────────────────────────────────────────────────────────────┘
```

### Dependency direction (important)

```
pages ──▶ components ──▶ lib ──▶ data
  │                       ▲        ▲
  └────────▶ state ───────┘────────┘
```

* `state/store.ts` imports from `lib/` and `data/` — **never** from `pages/`.
* `lib/` modules are pure: no React, no store access, no DOM (except the one
  `File`-reading helper in `lib/files.ts`). This is what makes them trivially testable.
* When a page-level helper needs to be reachable by the store, it moves to `lib/`.
  That is exactly why `validateMaintenanceTarget` lives in `lib/maintenanceScope.ts`
  rather than in `pages/Maintenance/maintenanceUtils.ts` — the store calls it.

### Page structure convention

* **Simple page** → flat file: `pages/Dashboard.tsx`, `pages/Leases.tsx`, `pages/Payments.tsx`,
  `pages/Properties.tsx`, `pages/Profile.tsx`.
* **Complex feature** → directory with a container plus sub-components and a `*Utils.ts`
  module for types + pure helpers:

```
pages/Maintenance/
  Maintenance.tsx          container: store reads, filters, tab, selection, status/assignee actions
  MaintenanceStats.tsx     KPI row          (presentational)
  MaintenanceFilters.tsx   tabs + filters   (presentational)
  MaintenanceTable.tsx     table + sorting  (owns only sort/pagination UI state)
  MaintenanceDetails.tsx   detail modal + status transitions
  NewMaintenanceModal.tsx  create form
  StaffModal.tsx           staff roster CRUD
  StaffFormModal.tsx       staff add/edit form
  maintenanceUtils.ts      tabs, tones, scope labels, search haystack
```

The rule: **containers own state, children take plain values and `onXxx` callbacks.**
Tenants, Maintenance and Documents follow this; Properties/Leases/Payments are flat because
their sub-components did not earn extraction.

## State management

### One store, individual selectors

```ts
// ✅ the convention everywhere in this codebase
const tenants = useStore((s) => s.tenants);
const addTenant = useStore((s) => s.addTenant);

// ❌ never — destructuring the whole store re-renders on every unrelated write
const { tenants, addTenant } = useStore();
```

`src/state/useStore.ts` is a two-line barrel re-exporting `useStore` and its types, so pages
import from `state/useStore` and the store file itself stays an implementation detail.

### Slices

`properties · units · tenants · leases · payments · maintenance · staff · documents ·
notifications · conversations · toasts`

Each slice is a plain array plus its mutators. There are no thunks, no middleware beyond
`persist`, and no async anywhere — every write is synchronous.

### The store as service layer

Because there is no API, the store is the **integrity boundary**. Four actions re-validate
before writing and return `string | null` (the rejection reason, or `null` for success):

| Action | Guard | Lives in |
| --- | --- | --- |
| `addUnit` / `updateUnit` | `validateUnit` | `lib/units.ts` |
| `addMaintenance` | `validateMaintenanceTarget` | `lib/maintenanceScope.ts` |
| `addStaff` / `updateStaff` | `validateStaff` | `lib/staff.ts` |
| `addDocument` | `validateDocRecord` + `sanitizeFileName` | `lib/files.ts` |

Callers must handle the rejection — e.g. `App.tsx#createMaintenance` toasts the message and
leaves the modal open rather than assuming success.

### Persistence

```ts
persist(…, {
  name: 'propora-units-v1',
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: (s) => ({ units: s.units, maintenance: s.maintenance, staff: s.staff }),
})
```

Only the three slices holding **user-created or user-changed records** survive a reload.
Everything else is session-scoped seed data and resets — which is deliberate: the seeds are
demo fixtures, and persisting them would make the demo drift without a way to reset it.

Because `partialize` only ever *added* keys, no migration/version bump was needed: an older
persisted blob simply leaves `maintenance`/`staff` at their seed values on merge.

## Routing

Real routing via `react-router-dom`; the active page is read from `useLocation()`/`NavLink`,
never from a `useState` page name.

| Route | Page |
| --- | --- |
| `/` | redirect → `/dashboard` |
| `/dashboard` | portfolio overview, KPIs, action-required lists |
| `/properties` | property grid + details/edit modals (units managed inside details) |
| `/tenants` | tenant roster |
| `/leases` | lease list |
| `/payments` | payment history + rent-automation catch-up |
| `/maintenance` | requests + staff management |
| `/documents` | document vault |
| `/profile` | manager profile (static) |

**Cross-page deep links** use query params rather than new routes: the tenant row menu
navigates to `/leases?tenantId=t1` and `/payments?tenantId=t1`; both pages read
`useSearchParams()`, show a "filtered to this tenant" banner, and offer a clear-filter button.

## The global create-modal pattern

Six create modals live in `App.tsx`/`AppShell` rather than inside their pages, because they
are opened from the shared header action button (whose label is route-derived:
`headerAction(page)`).

```
[Header "+ New Request"] → setNewMaintOpen(true)
   → <NewMaintenanceModal onCreate={createMaintenance} />      // returns a *draft*
      → App.createMaintenance(draft)                            // id generation, timestamps
         → store.addMaintenance(entity)  →  string | null       // validation gate
            ├── null    → close modal, pushToast, pushNotification
            └── message → pushToast(message), keep modal open
```

The modal never touches the store; it hands back a plain draft object. ID generation, history
seeding and notifications belong to the App-level handler. Page-local modals (edit/details)
break this rule deliberately and call the store directly — e.g. `UnitFormModal` and
`StaffFormModal` — because they are not part of the shared header flow.

## Styling system

Tailwind v4 with an explicit layer order declared in `src/index.css`:

```css
@layer theme, base, components, utilities;
```

| File | Role |
| --- | --- |
| `src/index.css` | Tailwind entry, `@theme` design tokens, font import |
| `src/styles/components.css` | `@apply` composites in the `components` layer — `.card`, `.btn-*`, `.badge`, `.field`, `.combo-*`, `.chip`, `.modal-*`, `.tab` |
| `src/styles/base.css` | unlayered element rules that cannot be utilities (box model, page background, focus ring, reduced motion) |

Tokens are defined once in `@theme` (`--color-primary`, `--radius-card`, `--shadow-modal`,
`--ease-spring`, `--breakpoint-compact: 1100px`…) and consumed as Tailwind utilities
(`bg-primary`, `rounded-card`, `shadow-modal`, `max-compact:`/`min-compact:`).

Rule of thumb used throughout: **reuse a `components.css` composite** (`.card`, `.badge`,
`.field`, `.tab`) before writing new CSS; reach for utilities for layout; only add to
`base.css` with a stated reason it cannot be a utility.

## Shared UI primitives worth knowing

| Component | Why it exists |
| --- | --- |
| `Modal` | Overlay + dialog shell, Escape handling, focus trap |
| `SearchSelect` | Searchable single-select for lists too long for `<select>`; ranked matching (label-prefix → label-substring → keyword), `detail` sub-line, capped rendered rows |
| `MultiSearchSelect` | Multi-pick sibling; **reuses `searchSelectUtils` matching**, toggles without closing, renders removable chips |
| `PhoneInput` | Dial-code `SearchSelect` + national-number input formatted live by `AsYouType` |
| `KpiCard` | The one KPI hero: tinted icon, delta pill, count-up number, per-property sparkline |
| `FilterBar` (`FilterTabs`/`FilterRow`/`FilterControls`/`SearchField`) | Shared filter header across list pages |
| `SortableTh` + `lib/sort.ts` | One sorting vocabulary for every table (`byText`/`byNumber`/`byDate`/`byRank`), missing values always sort last |
| `Pagination`, `EmptyState`, `RowMenu`, `MobileRowCard` | De-duplicated list-page furniture |
| `charts.tsx` | Hand-rolled inline SVG sparkline/donut/area — no chart library |

## Data seeding

`src/data/mock.ts` holds every entity type *and* the seed arrays. Generated demo rows use a
small seeded PRNG (`_rand`) so pagination, filters and counts are stable across reloads —
important because the app has no database to make ordering deterministic.

Seed volumes: 6 properties · 14 units · 128 tenants · 6 leases · 8 payments ·
67 maintenance requests · 6 staff · 48 documents.
