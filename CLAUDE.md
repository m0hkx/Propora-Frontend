# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

React 19, TypeScript 6.0, Vite 8, Tailwind CSS v4, Zustand 5, React Router 7.
Single-page property management app (Propora). No backend — all data is mock/in-memory (`src/data/mock.ts`), nothing persists across a reload.

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (type-checks all project references, then bundles)
- `npm run lint` — ESLint flat config (`eslint .`)
- `npm run preview` — production preview server

There is no `test`, `typecheck`, or `format` script, and no test framework is installed. Type-checking happens inside `npm run build`; to type-check without bundling, run `npx tsc -b`.

## Architecture

- `src/main.tsx` → `src/App.tsx` — single entry. `App` wraps everything in `BrowserRouter`; `AppShell` is the actual frame (topbar, nav, page header, routed `<Routes>`, the six global create-modals, toasts).
- Routing is real (`react-router-dom`), not simulated: `/dashboard`, `/properties`, `/tenants`, `/leases`, `/payments`, `/maintenance`, `/documents`, `/profile`, with `/` redirecting to `/dashboard`. The current route is read via `useLocation()`/`NavLink` rather than a page-name `useState`.
- `src/state/store.ts` (via `src/state/useStore.ts`) — the single Zustand store, seeded from `src/data/mock.ts`. All domain entities (properties, tenants, leases, payments, maintenance, documents, notifications, conversations) and their mutators live here.
- `src/data/mock.ts` — every domain type (`Property`, `Tenant`, `Lease`, `Payment`, `MaintenanceRequest`, `DocFile`, `AppNotification`, `Conversation`, status unions) plus the seed arrays. Reuse these types everywhere rather than redefining shapes.
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
- Writes are synchronous and local: create flows build a full entity in `App.tsx` (id generation + `pushToast`) from a "draft" object returned by the modal, then call the matching store `addX`. There's no request/loading/error state anywhere — don't add any.
- Some create modals import seed data (`src/data/mock.ts`) directly instead of reading from the store, so tenants/etc. created mid-session may be missing from their dropdowns — check before assuming a dropdown is store-backed.

## Conventions

- Pages live in `src/pages/`; simple pages are flat files (`Dashboard.tsx`, `Properties.tsx`), complex ones (Tenants, Maintenance, Documents) use a feature subdirectory with the container, sub-components (stats/filters/table/details), and a `*Utils.ts` module for types + pure helpers.
- Modals are colocated with their page (`Properties/AddPropertyModal.tsx`) except the six global "create" modals, which are declared in `App.tsx`/`AppShell` and opened via the header action button.
- Containers own state (store reads, filters, sort, pagination); child components are presentational, taking plain values and `onXxx` callbacks.
- `docs/` and `todo.md` are git-ignored (local-only, not committed) — `docs/` in particular may describe an older pre-Zustand/pre-router version of the app, so verify anything from it against the actual code before relying on it.
