# Insta-gpu

An enterprise SaaS platform for managing cloud-GPU cybercafés and workstation networks. The application provides role-tailored dashboards, real-time monitoring, billing, pre-booking, and operational tooling for a multi-branch GPU rental business.

- Live preview: 
- Production: 

---

## Overview

Cloud GPU is built around a strict hierarchical RBAC model and adaptive UX — every role sees an interface tuned to their day-to-day work:

| Role          | Primary surface                                                                 |
| ------------- | ------------------------------------------------------------------------------- |
| Super Admin   | Network-wide telemetry, seat activity, GPU nodes, integrations, deletion review |
| Admin         | Portfolio oversight, owner/manager management, settlements, analytics           |
| Cafe Owner    | Branch P&L, active sessions, billing health, simplified KPIs                    |
| Manager       | Tablet-first POS: live seats, bookings, shift handover, issue reporting         |

Users can only manage their direct subordinates and only see data scoped to their portfolio.

## Feature highlights

- **Role-specific dashboards** with live KPI cards (active users, revenue, sessions, GPU availability) that animate on value changes.
- **Seat management** — interactive seat grid with GPU metadata, real-time status, and operational controls.
- **Pre-booking** — conflict-aware seat scheduling synchronized with the live seat grid.
- **Billing & usage** — usage-based billing, role-scoped financial responsibility, active session tracking, and settlements.
- **Monitoring** — live sessions, failed transactions, application logs, and (for super admins) seat activity inspector.
- **Analytics** — dedicated BI views for P&L, growth rate, branch efficiency, and user retention (Recharts).
- **Shift handover notes** — managers leave structured notes (summary, pending tasks, incidents, cash, priority) for the next shift, embedded in the shift-timing pill.
- **Profile & security** — completion meter that requires every profile field plus 2FA enabled to reach 100%.
- **2FA** — multi-step setup with multiple methods and recovery state machine.
- **Notifications** — dual interface: slide-out panel and a dedicated page.
- **Branch management** — hierarchical assignment, multi-step configuration wizard, scoped visibility.
- **Theming** — dark-first premium SaaS aesthetic with light mode, Lucide icons, no emojis.

## Tech stack

- **Framework**: React 18 + TypeScript + Vite 5
- **Styling**: Tailwind CSS v3, shadcn/ui (Radix primitives), `tailwindcss-animate`, semantic design tokens in `src/index.css`
- **State**: Zustand (with persistence), TanStack React Query
- **Forms & validation**: React Hook Form, Zod, Formik/Yup patterns
- **Routing**: React Router v6 with `RoleGuard`
- **Charts**: Recharts
- **Motion**: Framer Motion
- **3D / background**: three.js, @react-three/fiber, @react-three/drei
- **Backend**: Lovable Cloud (auth, database, edge functions, storage)
- **Testing**: Vitest + Testing Library, Playwright

## Project structure

```
src/
  components/ui/         shadcn primitives
  features/              feature modules (dashboards, billing, monitoring, bookings, branches, settings, login)
  pages/                 route-level pages
  shared/
    lib/                 stores (Zustand), RBAC, mock data, helpers
    ui/                  atoms / molecules / organisms / motion (Atomic Design)
    types/               shared TypeScript types
  integrations/supabase/ auto-generated client (do not edit)
  hooks/                 reusable hooks
  index.css              design tokens & theme
```

Architecture follows strict Atomic Design — UI components are logic-free; pages compose features.

## Getting started

Requirements: Node.js 18+ and a package manager (npm or pnpm).

```bash
npm install
npm run dev          # start Vite dev server
npm run build        # production build
npm run build:dev    # development-mode build
npm run preview      # preview production build
npm run lint         # eslint
npm run test         # vitest run
npm run test:watch   # vitest watch
```

Playwright tests use the config at `playwright.config.ts`.

## Conventions

- Use semantic design tokens; never hardcode colors like `text-white` or `bg-[#...]` in components.
- Lucide icons only. No emojis in UI or copy.
- No global search bar in navigation.
- Tagline: **Beyond Hardware**.
- Roles enforced via a dedicated `user_roles` table and security-definer `has_role()` function — never store roles on the profile.

