# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 19, TypeScript 6.0, Vite 8, Tailwind CSS v4, Zustand 5, React Router 7.
Single-page property management app (Propora). Backed by a real API — the sibling `../Propora-API` repo (Express + MongoDB, session-cookie auth) — everything except the Inbox/chat feature (still local seed data, see below) persists server-side per logged-in user.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (type-checks all project references, then bundles)
- `npm run lint` — ESLint flat config (`eslint .`)
- `npm run preview` — production preview server

There is no `test`, `typecheck`, or `format` script, and no test framework is installed. Type-checking happens inside `npm run build`; to type-check without bundling, run `npx tsc -b`.

## Architecture

- `src/main.tsx` → `src/App.tsx` — single entry. `App` wraps everything in `BrowserRouter` and routes `/login`, `/register`, and a `/*` `ProtectedRoute` around `AppShell`. `AppShell` is thin: it calls `loadAll()` (showing a retry banner if it fails), owns the open-modal state, and renders `components/TopBar` (nav, notifications/messages panels, account menu), `components/PageHeader` (title, subtitle, per-page action button — there is no global search; list pages have their own search field), the routed `<Routes>` (unknown paths redirect to `/dashboard`), `components/GlobalModals` and `Toasts`. Nav constants (`navPages`, `NavPage`, `routeToLabel`) are in `src/lib/nav.ts`.
- Routing is real (`react-router-dom`), not simulated: `/dashboard`, `/properties`, `/tenants`, `/leases`, `/payments`, `/maintenance`, `/documents`, `/profile`, with `/` redirecting to `/dashboard`. The current route is read via `useLocation()`/`NavLink` rather than a page-name `useState`.
- `src/auth/` — `AuthContext.tsx` (`AuthProvider`, verifies the session cookie against `GET /users/session` on mount) and `useAuth.ts` (the context object + hook, split out so Vite Fast Refresh doesn't choke on a file exporting both a component and a hook) and `ProtectedRoute.tsx`.
- `src/api/` — one file per backend resource (`properties.ts`, `units.ts`, `tenants.ts`, `leases.ts`, `payments.ts`, `maintenance.ts`, `maintenanceStaff.ts`, `documents.ts`, `notifications.ts`, `dashboard.ts`, `auth.ts`), all built on the shared `apiFetch`/`assetUrl`/`stripNulls` helpers in `config.ts`. Each file maps a backend document shape onto the matching frontend type from `src/types/` — the two shapes aren't always 1:1 (e.g. `Property.image` is display initials computed client-side; the backend's `image` field is the uploaded filename, turned into `imageUrl` via `assetUrl`).
- `src/state/store.ts` (via `src/state/useStore.ts`) — the single Zustand store, composed from slices in `src/state/slices/` (`propertySlice` = properties+units, `tenantSlice` = tenants+leases, `paymentSlice`, `maintenanceSlice` = maintenance+staff, `documentSlice`, `inboxSlice` = notifications+conversations, `uiSlice` = toasts). Add new state to the matching slice; `store.ts` only composes them and holds `loadAll`. Every resource starts empty and is hydrated by a `fetchX()` action; `loadAll()` fetches everything and runs on every `AppShell` mount (i.e. after each login, and twice in dev under StrictMode). The store is module-level and outlives `AppShell`, so `logout()` in `AuthContext` calls `resetStore()` to clear it — anything that ends a session must do the same. Resource mutators are async: they call the matching `src/api/*` function and merge the real server response into state, with no client-side ID generation. Exceptions: `markNotificationRead`/`markAllNotificationsRead` are optimistic (flip `read` first, roll back and rethrow on failure — the API returns no body to merge), and **Inbox/chat (`conversations`)** has no backend resource, so it seeds from `src/data/conversations.ts` and mutates locally. Writes that may create notifications call `refreshNotifications()` afterwards (a fire-and-forget re-fetch that logs failures).
- `src/types/` — every domain type (including the form `*Draft` types such as `TenantDraft`, so `api/` and `state/` never import from `pages/`), one file per area (`property.ts`, `unit.ts`, `tenant.ts`, `lease.ts`, `payment.ts`, `maintenance.ts`, `document.ts`, `notification.ts`, `message.ts`), re-exported from `src/types/index.ts`. Import them as `import type { Property } from '../types'` and reuse them everywhere rather than redefining shapes.
- `src/lib/lookup.ts` — id → display helpers (`propertyName`, `propertyCity`, `tenantById`, `tenantName`, `staffName`). The list argument is required: always pass the store's live array, never a hard-coded one. `formatMoney` lives in `src/lib/format.ts`.
- `src/components/ui.tsx` — shared primitives: `Card`, `Badge`, `Stat`, `Progress`, `Icon`.
- Styling is layered Tailwind v4: `theme → base → components → utilities` (declared in `src/index.css`).
  - `src/index.css` — Tailwind entry, `@theme` design tokens (colors etc.), font import.
  - `src/styles/components.css` (shared primitives: `.card`, `.btn-*`, `.badge`, forms, modals, tables), plus `chrome.css`, `motion.css`, `mobile-nav.css`, `auth.css` and `loader.css` — `@apply` composites, all imported into the `components` layer from `index.css` in that order (order matters for the cascade). Reuse these classes for badges/stats/cards rather than writing new CSS; put new feature-specific rules in the matching file.
  - `src/styles/base.css` — unlayered element-level rules that can't be utilities (box model, page background, focus ring, reduced-motion). Keep this file minimal; anything added needs a stated reason it can't be a utility.
  - The Tailwind v4 migration is complete — there is no legacy `:root` variable block to worry about.

## Key gotchas

- **Custom breakpoint**: `--breakpoint-compact: 1100px` (use `max-compact:` / `min-compact:`).
- **`verbatimModuleSyntax`**: use `import type` for type-only imports (TypeScript errors otherwise).
- **`erasableSyntaxOnly`**: no enums or namespaces; use `type` unions and plain objects.
- **`noUnusedLocals` / `noUnusedParameters`**: enabled — unused imports/params fail `tsc -b`.
- **Zustand selectors**: always use individual selectors (`useStore((s) => s.thing)`) — don't destructure the whole store.
- **Toast auto-dismiss**: `pushToast` auto-dismisses after 3.5s via `window.setTimeout`.
- Writes are async and server-backed: a create/edit flow passes a "draft" object from the modal straight to the matching store action (`await addX(draft, ...)`), which calls `src/api/*` and merges the real response into state; handlers run the call through `useAsyncAction()` from `lib/useAsyncAction.ts` (`run(() => addX(d), 'Failed to …')` toasts on failure and returns `false`; a string result from a store action counts as a rejection). Forms that show the error inline — including Login/Register and the unit/staff modals — use `attempt()` from the same file, which returns the message or `null`. The message shown is the specific one when there is one (a store validation reason, or the server's own `message` carried on `ApiError.serverMessage`); the `'Failed to …'` label is only the fallback for generic failures (network down, or a server error with no message). Don't hand-write try/catch/`pushToast` blocks. Pre-flight validators (`lib/units.ts`, `lib/staff.ts`, `lib/maintenanceScope.ts`, `lib/files.ts`) still run client-side first for fast feedback — the backend re-validates authoritatively.
- The backend assigns every id (Mongo `ObjectId` hex strings) — don't generate ids client-side (`Date.now()`-based ids, `PAY-`/`M-`/`L-` sequences, etc. are gone from the create flows).
- Mongo round-trips an unset optional field as explicit `null`. Every `src/api/*` mapper runs the response through `stripNulls` (`api/config.ts`) before handing it to a frontend type, so `!== undefined` checks on optional fields keep working — do the same in any new `api/*.ts` file.

## Conventions

- Pages live in `src/pages/`; simple pages are flat files (`Login.tsx`, `Register.tsx`, `Profile.tsx`), every other page (Dashboard, Properties, Tenants, Leases, Payments, Maintenance, Documents) uses a feature subdirectory holding the container (named after the folder, e.g. `Tenants/Tenants.tsx`) plus whatever that page needs beside it — its modals at minimum. How far a page is split varies: Tenants, Maintenance and Documents have separate stats/filters/table/details components and a `*Utils.ts` for types + pure helpers; Dashboard, Payments and Leases are one container plus their modals (Leases keeps its local types inline in `Leases.tsx`; `leaseUtils.ts` holds tenant-option helpers shared by the lease, payment and maintenance modals); Properties adds `UnitsSection` and keeps form helpers in `propertyForm.ts`. None of these four has a `*Utils.ts` — don't create empty scaffolding to match the larger pages.
- Modals are colocated with their page (`Properties/AddPropertyModal.tsx`) — including the six global "create" modals. Those components still live in their page folders (several are reused there for edit flows, e.g. `TenantFormModal`, `AddPropertyModal`, `RecordPaymentModal`); `components/GlobalModals.tsx` only renders the create variant and wires its submit handler. They're opened by the `PageHeader` action button (the label/modal per page is the `HEADER_ACTIONS` map in `PageHeader.tsx`).
- Containers own state (store reads, filters, sort, pagination); child components are presentational, taking plain values and `onXxx` callbacks.
- `docs/` and `todo.md` are git-ignored (local-only, not committed) — `docs/` in particular may describe an older pre-Zustand/pre-router version of the app, so verify anything from it against the actual code before relying on it.
