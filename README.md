# ServeWell Frontend

React + Vite app for ServeWell: marketing site, public volunteer forms, and organization-scoped admin.

This frontend is a separate repository from the ServeWell API/Cloudflare Worker backend. Coordinate frontend and API contract changes across both repositories, and test database migrations against local D1 before applying them remotely.

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

## Documentation

The earlier development workspace referenced a sibling `../docs` directory for planning and API documents. Those files are not part of this frontend repository. Check the backend/project documentation and current server implementation for API contracts, D1 schema, migrations, and feature readiness; avoid relying on a frontend-only route description for backend behavior.

## Public site and beta messaging

The public marketing site uses `src/components/MarketingLayout.jsx` and `src/styles/marketing.css`, with Home, About, Pricing, Donate, demo, and staff sign-in navigation. The landing page has signup and demo calls to action. The Pricing page states that beta access is free and that organizations joining during beta keep the features available at beta end for free; later-added capabilities may be optional paid additions. Future plan prices and beta end date are not yet set.

`/donate` links to hosted PayPal checkout using `PAYPAL_SUPPORT_URL` from `src/constants/donations.js`. Contributions are optional and are not tax-deductible charitable donations. `src/components/SupportEmailContact.jsx` provides support email links on marketing pages.

## Routes

| Path | Purpose |
|------|---------|
| `/` | Marketing landing and signup/demo links |
| `/about` | About ServeWell and its features |
| `/pricing` | Beta-access promise and future-pricing information |
| `/donate` | Optional contributions via PayPal |
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
| `/:organizationSlug/admin/schedules` | Schedules hub: **Active & upcoming schedules** and **Schedule templates** (create wizard, **Duplicate** on templates). **Create schedule** is disabled until a template exists (hover tip). Demo: `/demo/admin/schedules`. |
| `/:organizationSlug/admin/schedules/generated/:id` | Generated schedule detail — draft, published, or archived; publish, send volunteer updates, auto-fill, archive, and review events with staffing/notes/resources. |
| `/:organizationSlug/admin/schedules/:id` | Schedule **template** detail — **autosave** name/type, serving areas, events & staffing (Saved toast); **Duplicate**; delete; **Create schedule from template**. Staffing dropdowns omit areas already used on that event. |
| `/:organizationSlug/admin/volunteers` | Volunteer submissions (filters apply on **Apply filters**) |
| `/:organizationSlug/admin/volunteers/:id` | Volunteer detail — status toolbar, PC sync/import badge, blackout dates, in-sync / stale banner, **Edit submission**, staff notes, **Delete** |
| `/:organizationSlug/admin/volunteers/:id/edit` | Admin intake editor (serving preferences include blackout dates; card layout). PC import rows: detail read-only, no edit. Demo org: no edit (API blocks PUT). `/admin/submissions/:id/edit` redirects here. |
| `/:organizationSlug/admin/profile` | Profile; organization edit (owner); **Admin** card (collapsible list, invites for owner); notification prefs; password reset; **owner-only** danger zone |
| `/:organizationSlug/admin/team` | Redirects to profile (legacy URL) |
| `/:organizationSlug/admin/forms` | Forms hub — **Active forms** and **Inactive forms**; public URLs, activate/deactivate, **Add new form** |
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
6. Forms (non-demo orgs): **Active forms** / **Inactive forms** on `/:slug/admin/forms` → **Add new form** → edit → **Save changes**. Activate/deactivate moves cards between sections. Share `/:slug/forms/:formSlug` from the list (or set `VITE_PUBLIC_SITE_URL` for copy-link URLs).
7. Schedules (non-demo orgs): `/:slug/admin/schedules` — create/duplicate **schedule templates** (detail edits autosave) and **generated schedules** from templates; open generated detail to review auto-assign summary, edit staffing, publish, and send volunteer updates when published.
8. **Team (non-demo):** owner opens `/:slug/admin/team`, invites by email; invitee uses `/accept-invite`. **Forgot password:** `/forgot-password` with org slug + email.

Demo org forms are read-only on the API; the UI still shows forms for browsing.

## Feature and documentation notes

- Generated schedule **archive** is implemented in the UI: `AdminGeneratedScheduleDetailPage.jsx` calls the archive API and displays `ArchiveGeneratedScheduleDialog.jsx`; archived schedules are read-only. Backend authorization and persistence must be checked in the API repository when changing this workflow.
- For scheduling, generated schedules, volunteer submissions, forms, admin permissions, Planning Center integration, and email behavior, refer to the actual API implementation and contract before changing frontend calls.
- The prior `../docs/...` references were written for a sibling-folder workspace layout and are not files contained in this GitHub frontend repository. Consult the corresponding backend/project documentation as available rather than assuming those relative links resolve when browsing this repository alone.
- Keep this README's route table and feature-status descriptions in sync with `src/App.jsx`, current components, and the backend. Additional polish and future features should not be marked as implemented solely because design notes mention them.
