<div align="center">

# Propora

### Property management, made legible.

A desktop dashboard that brings portfolio health, cash flow, and operational
priorities into one calm operating picture.

![React](https://img.shields.io/badge/react-19-0F766E?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-6-0F766E?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/vite-8-0F766E?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/tailwind-4-0F766E?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/zustand-5-0F766E?style=flat-square)
![React Router](https://img.shields.io/badge/react_router-7-0F766E?style=flat-square&logo=reactrouter&logoColor=white)

**`WEB APP · DASHBOARD`**

*Product design / UI system / data visualization*

</div>
<img src="public/slide.png" alt="Propora — property management, made legible" width="100%" />
---

## The idea

Property managers live in spreadsheets: units here, arrears there, maintenance
requests in someone's inbox. Propora collapses that into a single screen where
the answer to *"how is my portfolio doing?"* is legible in under five seconds —
hero KPIs, a revenue pulse, occupancy, and everything that needs attention,
ranked.

This repository is a **frontend portfolio case study**: a fully interactive
product surface running on realistic generated data. There is no backend — every
flow (filtering, creating, editing, messaging) works end-to-end in memory, which
keeps the focus where it belongs: product, interaction, and interface craft.

## What it does

| Area | Highlights |
| ---- | ---------- |
| **Dashboard** | Animated KPI hero cards with sparklines, revenue area chart with hover tooltips, occupancy donut, property performance, action-required triage modal, activity timeline |
| **Properties** | Portfolio summary cards, status tabs, type filter, sorting, occupancy/revenue per card, image-with-fallback grid, detail views, create flow with image upload preview |
| **Tenants** | 128-record roster with status tabs, search, sorting, pagination, detail / edit / delete flows, deep links into leases & payments |
| **Leases** | Status tabs, property filter, sorting, tenant-scoped focus mode via shareable `?tenantId=` URLs |
| **Payments** | Collection KPIs + collection rate, status/method filters, payment history, record-payment flow with rent auto-fill |
| **Maintenance** | Work-queue stats, six-axis filtering, sortable table with incremental loading, status transitions with activity history |
| **Documents** | Library stats, five-axis filtering, flat or grouped-by-property views, view/edit/move/archive/delete, mocked upload zone |
| **Inbox** | Notification center with mark-read + deep links, two-pane tenant messaging with replies |
| **Shell** | Client-side routing, global + per-page search, toasts, profile, fully responsive down to 320px with a mobile nav panel |

## Design system

Designed, not decorated — one teal identity carried through every surface:

- **Palette** — Trust Teal `#0F766E` on a mint wash `#F0FDFA`, deep-teal ink `#134E4A` (never black), semantic badge tones for every status
- **Type** — Plus Jakarta Sans throughout, tabular numerals for metrics so count-ups never jitter
- **Shape & depth** — 18px cards with mint-tinted borders and teal-tinted shadows, pill actions, ambient gradient background with a faint architectural grid
- **Motion** — one spring easing for entrances, one crisp ease for feedback; staggered section reveals, animated charts, press states everywhere, fully `prefers-reduced-motion` safe
- **Voice** — plain verbs, sentence case, toasts that confirm what happened (`Lease L-1030 created`)

## Tech stack

| Layer | Choice |
| ----- | ------ |
| UI runtime | React 19 + TypeScript 6 |
| Build | Vite 8 (`tsc -b && vite build`) |
| Styling | Tailwind CSS v4 (`@theme` tokens + `@apply` composites) |
| State | Zustand 5, selector subscriptions |
| Routing | React Router 7, flat route table |
| Charts | Hand-rolled SVG (area, donut, sparklines) — no chart dependency |
| Data | Generated in-memory seed (`src/data/mock.ts`), no backend |
| Quality gates | `tsc -b` project references, ESLint flat config |

## Getting started

```bash
npm install   # install dependencies
npm run dev   # start the dev server with HMR
npm run lint  # eslint over the repo
npm run build # type-check, then bundle to dist/
npm run preview # serve the production build
```

No `.env`, database, or migration step — open `http://localhost:5173` and click around.

## Project structure

```
src/
├── App.tsx            # shell: topbar, routing, page header, create-flows, toasts
├── main.tsx           # StrictMode entry
├── index.css          # Tailwind v4 entry + @theme design tokens
├── components/        # shared primitives (Card, Badge, KpiCard, Modal, charts…)
├── pages/             # one route per screen; complex ones get feature folders
├── state/             # single Zustand store (+ tiny re-export barrel)
├── data/mock.ts       # domain types, seed data, deterministic generators
├── lib/               # shared helpers (date format, count-up, stats)
└── styles/            # @apply composites + element-level base rules
```

Conventions: pages own their filter state and modals; domain data flows top-down
from the store; type-only imports use `import type`; all display copy lives next
to the component that renders it.

## Honest limitations

- All data resets on reload — persistence was intentionally out of scope.
- Showcase aggregates on the dashboard are illustrative constants; list views and
  triage queues compute live from the store.
- Related records don't cascade (deleting a tenant keeps their leases for
  bookkeeping — the confirm dialog says so).

## Roadmap ideas

Persisted store (localStorage adapter) · route-level code splitting · real
backend behind the existing store interface · `strict: true` TypeScript ·
playwright smoke tests · dark-theme token pass.

---

<div align="center">

Built as a portfolio case study in interface craft — every pixel and
interaction above runs in this repo.

</div>
