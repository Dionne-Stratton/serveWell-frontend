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

## Docs

Product and API details are in [`docs/`](./docs/), including `Implementation-Plan.md` and `API-Contract.md`.
