# Propora — Agent Instructions

## Stack

React 19, TypeScript 6.0, Vite 8, Tailwind CSS v4, Zustand 5.
Single-page property management app. No backend — all data is mock/in-memory (`src/data/mock.ts`).

## Commands

- `npm run dev` — Vite dev server
- `npm run build` — `tsc -b && vite build` (type-checks all project references, then bundles)
- `npm run lint` — ESLint flat config (`eslint .`)
- `npm run preview` — production preview server

There is no `typecheck`, `test`, or `format` script. Type-checking happens inside `npm run build`. If you need to type-check without building, run `npx tsc -b`.

## Project Structure

- `src/main.tsx` → `src/App.tsx` — single entry, all routing is a `page` state variable (no react-router)
- `src/state/store.ts` — Zustand store (seeded from `src/data/mock.ts`)
- `src/components/ui.tsx` — shared primitives: `Card`, `Badge`, `Stat`, `Progress`, `Icon`
- `src/styles/components.css` — `@apply` composites (`.card`, `.btn-*`, `.badge`, etc.) in the `components` layer
- `src/styles/base.css` — element-level rules (cannot be utilities)
- `src/index.css` — Tailwind v4 entry, theme tokens, layer ordering

## Tailwind v4 Migration

The CSS layer order is `theme → base → components → utilities`. Legacy `:root` variables still exist for Phase 2–6 replacement — see comments in `src/index.css` and `src/styles/*.css`.

**Do not** add new rules to `:root` or `src/styles/base.css`. Prefer Tailwind utilities or `src/styles/components.css` composites.

## Key Gotchas

- **No router**: page switching is `useState<'Dashboard' | 'Properties' | ...>` in `App.tsx`. Navigation is `go(page)` calls.
- **Custom breakpoint**: `--breakpoint-compact: 1100px` (use `max-compact:` / `min-compact:`)
- **`verbatimModuleSyntax`**: use `import type` for type-only imports (TypeScript will error otherwise)
- **`erasableSyntaxOnly`**: no enums or namespaces; use `type` unions and plain objects
- **`noUnusedLocals` / `noUnusedParameters`**: enabled — unused imports/params fail `tsc -b`
- **Zustand selectors**: always use individual selectors (`useStore((s) => s.thing)`) — don't destructure the store
- **Toast auto-dismiss**: `pushToast` auto-dismisses after 3.5s via `window.setTimeout`

## Conventions

- Pages live in `src/pages/`; multi-file pages use subdirectories (e.g., `Tenants/Tenants.tsx`)
- Modals are colocated with their page (`Properties/AddPropertyModal.tsx`)
- All seed data types are exported from `src/data/mock.ts` — reuse these types everywhere
- Badge/Stat/Card components use `src/styles/components.css` class names — don't create new CSS for these
