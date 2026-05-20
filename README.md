# ServeWell Frontend

React + Vite app for the ServeWell volunteer intake prototype.

## Prerequisites

- Node.js 22+ (match the API repo)
- `serveWell-server` running locally when testing API integration (sibling folder: `../serveWell-server`)

## Setup

```sh
npm install
cp .env.example .env
```

## Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server (default port 5173)   |
| `npm run build`   | Production build                 |
| `npm run preview` | Preview production build         |

API default: `http://localhost:8787` (see `.env.example`). The server sets `FRONTEND_ORIGIN=http://localhost:5173` for CORS.

## Routes (Phase 2 shell)

| Path | Page |
|------|------|
| `/` | Staff landing |
| `/serve` | Public volunteer form (placeholder) |
| `/admin/login` | Admin login (placeholder) |
| `/admin` | Admin dashboard (placeholder) |
| `/admin/submissions/:id` | Submission detail (placeholder) |

Unknown paths redirect to `/`.

## Phase 9: admin dashboard

1. API running; sign in at `/admin/login`.
2. Open `/admin` — submission list loads (submit a test via `/serve` if empty).
3. Use search / status / archived filters; open **View details** on a row.
4. Detail page shows contact, areas, confirmations, and notes (status edit not wired until server PATCH exists).

## Phase 7: admin auth

1. API running on port 8787.
2. Open `http://localhost:5173/admin` — should redirect to `/admin/login`.
3. Sign in with seeded credentials from `docs/API-README.md` (`church@example.com` / `temporary-password`).
4. Confirm dashboard loads and shows signed-in email; **Log out** returns to login.
5. Visit `/admin/submissions/1` while logged out — should redirect to login, then return after sign-in.
6. Refresh while logged in — session should persist.

## Phase 6: volunteer form (`/serve`)

Requires the API at `VITE_API_URL` (default `http://localhost:8787`). Copy `.env.example` to `.env` if needed.

1. Start `serveWell-server` (`npm run dev`) with local D1 migrations applied.
2. Open `http://localhost:5173/serve`.
3. Submit a test interest (select at least one serving area; confirm any required checkboxes for that area).
4. Confirm success message and “Submit another response.”

## Docs

Product and API details are in [`docs/`](./docs/), including `Implementation-Plan.md` and `API-Contract.md`.
