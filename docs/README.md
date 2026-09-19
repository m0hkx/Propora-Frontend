# Propora — Project Documentation

Propora is a single-page property-management dashboard: properties → units → tenants →
leases → payments, plus maintenance requests and a document vault. It is **frontend-only** —
there is no backend, no API and no database. All data lives in a Zustand store seeded from
`src/data/mock.ts`, with a small slice persisted to `localStorage`.

This folder is the working documentation for the codebase. `docs/` is git-ignored, so these
files are local reference material, not shipped artifacts.

## Read in this order

| Doc | What it answers |
| --- | --- |
| [01-architecture.md](./01-architecture.md) | How the app is put together: layers, state, routing, styling, build |
| [02-data-model.md](./02-data-model.md) | Every entity, how they relate, and which invariants must hold |
| [03-business-logic.md](./03-business-logic.md) | The domain rules — rent automation, maintenance scope/lifecycle, validation gates |
| [04-user-flows.md](./04-user-flows.md) | End-to-end walkthroughs of each flow, file by file |
| [design-system/colors.md](./design-system/colors.md) | Colour tokens |

## 60-second orientation

```
main.tsx          boot: run rent automation, then render
  └── App.tsx     BrowserRouter + AppShell (topbar, nav, routed pages, global modals, toasts)
        ├── pages/        feature screens (container owns state, children are presentational)
        ├── components/   shared UI primitives (Modal, SearchSelect, KpiCard, tables…)
        ├── lib/          pure domain logic + utilities (no React, no store)
        ├── data/         entity types + seed data + reference data (countries, dial codes)
        └── state/store.ts  the single Zustand store — every write goes through here
```

**The one rule that explains most of the design:** because there is no backend, the Zustand
store *is* the service layer. Forms validate for user experience; the store re-validates for
data integrity and returns a rejection string. See
[03-business-logic.md § Validation](./03-business-logic.md#validation-the-two-gate-pattern).

## Commands

```bash
npm run dev       # Vite dev server
npm run build     # tsc -b && vite build  (type-check gates the build)
npm run lint      # ESLint flat config
npm run preview   # serve the production build
npx tsc -b        # type-check without bundling
```

There is no test script and no test framework installed — see
[05-interview-qa.md § Testing](./05-interview-qa.md#testing--quality) for how the code is
nonetheless structured to be testable, and what you would add first.
