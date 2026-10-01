<div align="center">

# Propora

**Property management, made legible.**

The web app for Propora: one calm dashboard for properties, tenants, leases, rent, repairs and documents.

![React](https://img.shields.io/badge/React-19-0F766E?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-0F766E?style=flat-square&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-0F766E?style=flat-square&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-0F766E?style=flat-square&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-5-0F766E?style=flat-square)

**[📖 Full documentation →](../docs/README.md)**

</div>

<img src="public/slide.png" alt="Propora — property management, made legible" width="100%" />

## About

A React single-page app that talks to the [Propora API](https://github.com/m0hkx/Propora-Backend) (Express + MongoDB). Every screen reads and writes real data through the API, and you stay signed in with a session cookie.

## Demo account

| Email | Password |
| --- | --- |
| `demo@propora.dev` | `Demo1234!` |

The account is created by `npm run seed` in the API.

## Getting started

Start the [API](https://github.com/m0hkx/Propora-Backend) first, then:

```bash
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:3000
npm run dev            # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build |

## Project structure

```
src/
├── pages/        one folder per screen, with its modals
├── components/   shared UI: cards, tables, modals, charts
├── state/        Zustand store, split into slices
├── api/          one file per API resource
├── auth/         session check and protected routes
├── lib/          small helpers: validation, sorting, formatting
├── types/        shared TypeScript types
└── styles/       Tailwind v4 layers and component classes
```

## Learn more

The [main documentation](../docs/README.md) covers everything else:

- [Screenshots](../docs/02-screenshots.md) and [features](../docs/03-features.md)
- [System design](../docs/04-system-design.md) and [design system](../docs/07-design-system.md)
- [Full setup guide](../docs/08-getting-started.md)

**Backend:** [Propora-Backend](https://github.com/m0hkx/Propora-Backend)
