# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 19, TypeScript 6.0, Vite 8, Tailwind CSS v4, Zustand 5, React Router 7.
Single-page property management app (Propora). Backed by a real API — the sibling `../Propora-API` repo (Express + MongoDB, session-cookie auth) — everything except the Inbox/chat feature (still local mock data, see below) persists server-side per logged-in user.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (type-checks all project references, then bundles)
- `npm run lint` — ESLint flat config (`eslint .`)
- `npm run preview` — production preview server

There is no `test`, `typecheck`, or `format` script, and no test framework is installed. Type-checking happens inside `npm run build`; to type-check without bundling, run `npx tsc -b`.

## Architecture

- `src/main.tsx` → `src/App.tsx` — single entry. `App` wraps everything in `BrowserRouter` and routes `/login`, `/register`, and a `/*` `ProtectedRoute` around `AppShell` (topbar, nav, page header, routed `<Routes>`, the six global create-modals, toasts).
- Routing is real (`react-router-dom`), not simulated: `/dashboard`, `/properties`, `/tenants`, `/leases`, `/payments`, `/maintenance`, `/documents`, `/profile`, with `/` redirecting to `/dashboard`. The current route is read via `useLocation()`/`NavLink` rather than a page-name `useState`.
- `src/auth/` — `AuthContext.tsx` (`AuthProvider`, verifies the session cookie against `GET /users/session` on mount) and `useAuth.ts` (the context object + hook, split out so Vite Fast Refresh doesn't choke on a file exporting both a component and a hook) and `ProtectedRoute.tsx`.
- `src/api/` — one file per backend resource (`properties.ts`, `units.ts`, `tenants.ts`, `leases.ts`, `payments.ts`, `maintenance.ts`, `maintenanceStaff.ts`, `documents.ts`, `notifications.ts`, `dashboard.ts`, `auth.ts`), all built on the shared `apiFetch`/`assetUrl`/`stripNulls` helpers in `config.ts`. Each file maps a backend document shape onto the matching frontend type from `data/mock.ts` — the two shapes aren't always 1:1 (e.g. `Property.image` is display initials computed client-side; the backend's `image` field is the uploaded filename, turned into `imageUrl` via `assetUrl`).
- `src/state/store.ts` (via `src/state/useStore.ts`) — the single Zustand store. Every resource slice (properties, units, tenants, leases, payments, maintenance, staff, documents, notifications) starts empty and is hydrated by a `fetchX()` action; `loadAll()` fetches everything and is called once from `AppShell` after a session is confirmed. Every mutator is async: it calls the matching `src/api/*` function and merges the real server response into state — there is no client-side ID generation or optimistic-without-a-network-call path anymore. **Inbox/chat (`conversations`) is the one exception** — no backend resource exists for it, so it still seeds from `data/mock.ts` and mutates locally.
- `src/data/mock.ts` — every domain type (`Property`, `Tenant`, `Lease`, `Payment`, `MaintenanceRequest`, `DocFile`, `AppNotification`, `Conversation`, status unions) plus (now only for `conversations`) seed data. Reuse these types everywhere rather than redefining shapes.
- `src/components/ui.tsx` — shared primitives: `Card`, `Badge`, `Stat`, `Progress`, `Icon`.
- Styling is layered Tailwind v4: `theme → base → components → utilities` (declared in `src/index.css`).
  - `src/index.css` — Tailwind entry, `@theme` design tokens (colors etc.), font import.
  - `src/styles/components.css` — `@apply` composites (`.card`, `.btn-*`, `.badge`, etc.) in the `components` layer. Reuse these classes for badges/stats/cards rather than writing new CSS.
  - `src/styles/base.css` — unlayered element-level rules that can't be utilities (box model, page background, focus ring, reduced-motion). Keep this file minimal; anything added needs a stated reason it can't be a utility.
  - The Tailwind v4 migration is complete — there is no legacy `:root` variable block to worry about.

## Key gotchas

- **Custom breakpoint**: `--breakpoint-compact: 1100px` (use `max-compact:` / `min-compact:`).
- **`verbatimModuleSyntax`**: use `import type` for type-only imports (TypeScript errors otherwise).
- **`erasableSyntaxOnly`**: no enums or namespaces; use `type` unions and plain objects.
- **`noUnusedLocals` / `noUnusedParameters`**: enabled — unused imports/params fail `tsc -b`.
- **Zustand selectors**: always use individual selectors (`useStore((s) => s.thing)`) — don't destructure the whole store.
- **Toast auto-dismiss**: `pushToast` auto-dismisses after 3.5s via `window.setTimeout`.
- Writes are async and server-backed: a create/edit flow passes a "draft" object from the modal straight to the matching store action (`await addX(draft, ...)`), which calls `src/api/*` and merges the real response into state; page-level handlers wrap the call in try/catch and `pushToast` the error message on failure. Pre-flight validators (`lib/units.ts`, `lib/staff.ts`, `lib/maintenanceScope.ts`, `lib/files.ts`) still run client-side first for fast feedback — the backend re-validates authoritatively.
- The backend assigns every id (Mongo `ObjectId` hex strings) — don't generate ids client-side (`Date.now()`-based ids, `PAY-`/`M-`/`L-` sequences, etc. are gone from the create flows).
- Some create modals import seed data (`src/data/mock.ts`) directly instead of reading from the store (e.g. `UploadDocumentModal`'s tenant picker) — check before assuming a dropdown is store-backed.
- Mongo round-trips an unset optional field as explicit `null`. Every `src/api/*` mapper runs the response through `stripNulls` (`api/config.ts`) before handing it to a frontend type, so `!== undefined` checks on optional fields keep working — do the same in any new `api/*.ts` file.

## Conventions

- Pages live in `src/pages/`; simple pages are flat files (`Dashboard.tsx`, `Properties.tsx`), complex ones (Tenants, Maintenance, Documents) use a feature subdirectory with the container, sub-components (stats/filters/table/details), and a `*Utils.ts` module for types + pure helpers.
- Modals are colocated with their page (`Properties/AddPropertyModal.tsx`) except the six global "create" modals, which are declared in `App.tsx`/`AppShell` and opened via the header action button.
- Containers own state (store reads, filters, sort, pagination); child components are presentational, taking plain values and `onXxx` callbacks.
- `docs/` and `todo.md` are git-ignored (local-only, not committed) — `docs/` in particular may describe an older pre-Zustand/pre-router version of the app, so verify anything from it against the actual code before relying on it.
