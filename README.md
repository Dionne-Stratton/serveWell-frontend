# ServeWell Frontend

React + Vite app for ServeWell: marketing site, public volunteer forms, and organization-scoped admin.

**Active SaaS branch:** `saas-foundation` (org routes, forms admin, signup). `main` may lag until merge.

## Prerequisites

- Node.js 22+ (match the API repo)
- `serveWell-server` running locally when testing API integration (sibling folder: `../serveWell-server`)

## Setup

```sh
npm install
cp .env.example .env
```

Set `VITE_API_URL` to your local Worker (default `http://localhost:8787` in `.env.example`). The server sets `FRONTEND_ORIGIN=http://localhost:5173` for CORS.

Optional: `VITE_DEMO_ADMIN_EMAIL` / `VITE_DEMO_ADMIN_PASSWORD` for silent sign-in on `/demo/admin` (defaults match demo seed).

## Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server (default port 5173)   |
| `npm run build`   | Production build                 |
| `npm run preview` | Preview production build         |

## Docs

Product and API details live in the parent folder:

- [Implementation plan](../docs/Implementation-Plan.md)
- [API contract](../docs/API-Contract.md)
- [Progress checklist](../docs/Implementation-Progress-Checklist.md)

## Routes

| Path | Purpose |
|------|---------|
| `/` | Marketing landing |
| `/signup` | Church registration (creates org + admin + default form) |
| `/login` | Staff login (redirects into org admin after sign-in) |
| `/demo` | Demo sandbox hub |
| `/demo/volunteer` | Demo public form (`/demo/serve` redirects here) |
| `/demo/admin` | Demo dashboard (silent sign-in; no login screen) |
| `/demo/admin/submissions/:id` | Demo submission detail |
| `/:organizationSlug` | Redirect: admin session → `/:slug/admin`, else `/` (no public org landing) |
| `/:organizationSlug/volunteer` | Org default volunteer form |
| `/:organizationSlug/forms/:formSlug` | Specific volunteer form |
| `/:organizationSlug/admin/login` | Org admin login |
| `/:organizationSlug/admin` | Submissions dashboard (filters apply on **Apply filters**) |
| `/:organizationSlug/admin/submissions/:id` | Submission detail (status autosaves; staff notes) |
| `/:organizationSlug/admin/forms` | Forms list + links to public URLs |
| `/:organizationSlug/admin/forms/new` | Create form (template or blank) |
| `/:organizationSlug/admin/forms/:formSlug/edit` | Edit form (sections, areas, acknowledgements; **Save changes** persists) |
| `/:organizationSlug/admin/form` | Legacy redirect → `/admin/forms` |

Unknown paths redirect to `/`.

## Local smoke test

1. Apply local D1 migrations and start the API (`serveWell-server`: `npm run dev`).
2. **Demo:** open `/demo/volunteer`, submit a response (email and phone required). Open `/demo/admin` for the dashboard.
3. **Real org:** register at `/signup` or use seed admin `church@example.com` / `temporary-password` at `/:slug/admin/login` (slug `demo` for seeded demo org).
4. Dashboard: set search/status/form/archived filters, click **Apply filters**. Change status on a row or detail page (saves immediately).
5. Forms (non-demo orgs): list → **New form** → edit → **Save changes**. Share `/:slug/forms/:formSlug` from the forms list.

Demo org forms are read-only on the API; the UI still shows forms for browsing.

## Not implemented (UI placeholders)

- Planning Center export on submission detail (disabled button; hover **i** for message)
- Broader polish pass (Phase 15 in checklist)
