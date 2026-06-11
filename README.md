# ServeWell Frontend

React + Vite app for ServeWell: marketing site, public volunteer forms, and organization-scoped admin.

For repo/branch deployment notes, see [Progress checklist](../docs/Implementation-Progress-Checklist.md).

## Prerequisites

- Node.js 22+ (match the API repo)
- `serveWell-server` running locally when testing API integration (sibling folder: `../serveWell-server`)

## Setup

```sh
npm install
cp .env.example .env
```

Set `VITE_API_URL` to your local Worker (default `http://localhost:8787` in `.env.example`). The server sets `FRONTEND_ORIGIN=http://localhost:5173` for CORS.

Optional:

- `VITE_PUBLIC_SITE_URL` — origin used in shareable form links (defaults to production marketing URL when unset).
- `VITE_DEMO_ADMIN_EMAIL` / `VITE_DEMO_ADMIN_PASSWORD` — silent sign-in on `/demo/admin` (defaults match demo seed).

## Scripts

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run dev`     | Dev server (default port 5173)   |
| `npm run build`   | Production build                 |
| `npm run preview` | Preview production build         |
| `npm run lint`    | ESLint                           |

## Docs

Product and API details live in the parent folder:

- [Implementation plan](../docs/Implementation-Plan.md)
- [API contract](../docs/API-Contract.md)
- [Progress checklist](../docs/Implementation-Progress-Checklist.md)

## Routes

| Path | Purpose |
|------|---------|
| `/` | Marketing landing |
| `/signup` | Church registration (creates org + owner admin + default form) |
| `/login` | Staff login (`organizationSlug` + email + password → org admin) |
| `/forgot-password` | Request password reset (org slug + email) |
| `/church-slug-hint` | Email reminder of church name and URL slug (email only) |
| `/reset-password` | Complete reset from email link (`?token=`) |
| `/accept-invite` | Accept team invite and set password (`?token=`) |
| `/demo` | Redirects to `/demo/admin` |
| `/demo/volunteer` | Demo public form (`/demo/serve` redirects here) |
| `/demo/admin` | Demo admin home (silent sign-in; Planning Center UI hidden) |
| `/demo/admin/login` | Redirects to `/demo/admin` |
| `/demo/admin/volunteers` | Demo volunteer submissions list |
| `/demo/admin/volunteers/:id` | Demo volunteer detail (`/demo/admin/submissions/:id` redirects here) |
| `/demo/admin/forms` | Demo forms list (read-only via API) |
| `/demo/admin/forms/:formSlug` | Demo form preview (read-only) |
| `/:organizationSlug` | Redirect: admin session → `/:slug/admin`, else `/` (no public org landing) |
| `/:organizationSlug/volunteer` | Org default volunteer form (blackout dates, “Already submitted?” update link) |
| `/:organizationSlug/forms/:formSlug` | Specific volunteer form |
| `/:organizationSlug/volunteer/update` | Volunteer self-edit from email link (`?token=`) |
| `/:organizationSlug/admin/login` | Org admin login |
| `/:organizationSlug/admin` | Admin home (counts, forms, Planning Center connect when API credentials are set) |
| `/:organizationSlug/admin/import` | Planning Center import v1 (hidden on demo; requires PC connected) |
| `/:organizationSlug/admin/volunteers` | Volunteer submissions (filters apply on **Apply filters**) |
| `/:organizationSlug/admin/volunteers/:id` | Volunteer detail — status toolbar, PC sync/import badge, blackout dates, in-sync / stale banner, **Edit submission**, staff notes, **Delete** |
| `/:organizationSlug/admin/volunteers/:id/edit` | Admin intake editor (serving preferences include blackout dates; card layout). PC import rows: detail read-only, no edit. Demo org: no edit (API blocks PUT). `/admin/submissions/:id/edit` redirects here. |
| `/:organizationSlug/admin/profile` | Profile; organization edit (owner); **Admin** card (collapsible list, invites for owner); notification prefs; password reset; **owner-only** danger zone |
| `/:organizationSlug/admin/team` | Redirects to profile (legacy URL) |
| `/:organizationSlug/admin/forms` | Forms list + links to public URLs |
| `/:organizationSlug/admin/forms/new` | Create form (template or blank) |
| `/:organizationSlug/admin/forms/:formSlug/edit` | Edit form (sections, areas, acknowledgements; **Save changes** persists) |
| `/:organizationSlug/admin/form` | Legacy redirect → `/admin/forms` |

Unknown paths redirect to `/`.

## Local smoke test

1. Apply local D1 migrations and start the API (`serveWell-server`: `npm run dev`).
2. **Demo:** open `/demo/volunteer`, submit a response (email required; optional blackout dates). Open `/demo/admin/volunteers` for submissions.
3. **Real org:** register at `/signup` or use seed admin `church@example.com` / `temporary-password` with organization slug `demo` at `/login` or `/:slug/admin/login`.
4. Dashboard: set search/status/form/archived filters, click **Apply filters**. Change status on a row or detail page (saves immediately). On a real org (`/:slug/admin`), use **Connect Planning Center** when the server has OAuth secrets configured.
5. Volunteer detail (non-demo): **Edit submission** → change intake → **Save changes** → detail shows save notice; if linked to PC, use **Sync to Planning Center** after intake edits.
6. Forms (non-demo orgs): list → **New form** → edit → **Save changes**. Share `/:slug/forms/:formSlug` from the forms list (or set `VITE_PUBLIC_SITE_URL` for copy-link URLs).
7. **Team (non-demo):** owner opens `/:slug/admin/team`, invites by email; invitee uses `/accept-invite`. **Forgot password:** `/forgot-password` with org slug + email.

Demo org forms are read-only on the API; the UI still shows forms for browsing.

## Not implemented (UI placeholders)

- Broader polish pass (Phase 15 in checklist)
