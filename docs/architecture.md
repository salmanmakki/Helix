# Helix Architecture Documentation

## Core Stack Overview
Helix has been refactored from static HTML pages to a production-grade full-stack MERN application:

* **Frontend**: React 19, Vite, TypeScript, TailwindCSS, Zustand (state management), React Router DOM (client routes), Axios (HTTP Client), TanStack Query (Server state synchrony).
* **Backend**: Node.js, Express, MongoDB Atlas via Mongoose ORM, JWT authentication, node-cron background scheduler.

---

## Codebase Structure
```text
helix/
├── client/          # Vite + React + TS App
│   ├── src/
│   │   ├── app/     # Core application routing & entry
│   │   ├── components/  # Reusable UI widgets (Borders, Shadows, Buttons)
│   │   ├── layouts/     # Shared page structures (Sidebar navigation layout)
│   │   ├── pages/       # Route-specific screen assemblies
│   │   ├── services/    # Axios client and API wrappers
│   │   ├── store/       # Zustand auth/client state stores
│   │   ├── types/       # Global TypeScript types
│   │   ├── utils/       # Common helper scripts
│   │   ├── main.tsx
│   │   └── App.tsx
├── server/          # Node + Express Backend
│   ├── src/
│   │   ├── config/      # DB connection details
│   │   ├── controllers/ # HTTP Request Handlers
│   │   ├── services/    # Business rules execution
│   │   ├── models/      # Mongoose Schemas
│   │   ├── routes/      # Express API endpoints
│   │   ├── middlewares/ # Guard functions, error managers
│   │   ├── validators/  # Input schemas verification
│   │   ├── jobs/        # Background cron schedules
│   │   ├── recommendations/ # Decay & Readiness engines
│   │   ├── utils/       # Hashing & helper library
│   │   └── app.js
│   └── server.js
└── docs/            # Structural Architecture docs
```

---

## Math Engines
1. **Decay Engine**: Implements spaced-repetition mathematical decay using:
   $$\text{effectiveScore} = \text{masteryScore} \times e^{-\lambda \times \text{daysSinceRevision}}$$
2. **Readiness Engine**: Computes overall preparation scores and flags critical topics based on cumulative decay and past failure intelligence reports.
3. **Failure Analytics Engine**: Isolates and aggregates topics with highest failure rates, specific interviews where failure is likely, and provides data metrics.
