# SiteForge — Visual No-Code Website Builder (MERN)

A portfolio-quality MERN MVP in the spirit of Wix / Webflow / landing-page builders: create sites, pick a template or start blank, drag-and-drop components on a canvas, edit styles, manage pages + navigation + theme + media + SEO, autosave with version history + undo/redo, preview responsively, publish to a public URL, collect form submissions and view basic analytics — with Owner / Editor / Viewer RBAC enforced on the backend.

## Demo account

On first boot the server seeds a **public demo account** so visitors can explore without registering. The credentials are intentionally public — they are rendered **only on the login page** (`client/src/components/DemoAccessPanel.jsx`, values from `client/src/config/demo.js`, mirrored in `server/src/services/seed.service.js`):

```
Email:    demo@siteforge.app
Password: demo1234
```

The login page shows copy buttons and a **“Use Demo Account”** button that fills the form. The demo user owns a published demo site (“Nova Creative Studio”) with seeded form submissions and 14 days of analytics events. The account has no admin powers — it is a regular `owner` of that single demo site. Never place real credentials in `config/demo.js`; it is public by design.

## Admin account & platform admin

On first boot the server also seeds a **platform admin** account (`server/src/services/seed.service.js`). Unlike the demo credentials, these are **not public** — override them via env before deploying and change the password:

| Env var | Default | Purpose |
| --- | --- | --- |
| `ADMIN_EMAIL` | `admin@siteforge.app` | Admin login email |
| `ADMIN_PASSWORD` | `admin1234` | **Change before deploying** |
| `ADMIN_NAME` | `SiteForge Admin` | Display name |

- Seeding is idempotent and self-healing: an existing account with `ADMIN_EMAIL` that is not yet an admin is promoted at boot.
- **There is still only one login** (`/login`) — admins authenticate through the same page and the same JWT; their account `role` unlocks the admin surface.
- Server-enforced: every `/api/admin` route runs `protect` + `requireAdmin` (`server/src/middleware/authorize.js`), returning `401` for anonymous and `403` for non-admin accounts. Client-side `AdminRoute` is only a redirect convenience, never the security boundary.

**Admin surface** (sidebar section visible only to admins):
- `/admin` — platform stats (users, sites, published, pages, media, submissions, views) + newest accounts / recently updated sites
- `/admin/users` — search & filter accounts, view owned-site counts, promote/demote (`PATCH /api/admin/users/:id/role`). Changing your own role is blocked server-side (`CANNOT_CHANGE_SELF`) and hidden in the UI.
- `/admin/websites` — every site with owner, page/view counts, status filter; **unpublish** any live site (`POST /api/admin/websites/:id/unpublish`) and **force-delete** any site with the same full cleanup as the owner path (`DELETE /api/admin/websites/:id`)

## Features

**Auth & roles**
- JWT register / login / me, bcrypt password hashing
- Account roles: `user` (default) and `admin` (platform administration, enforced by `requireAdmin`)
- Website roles: `owner` (full), `editor` (edit content/media/save, no delete/settings), `viewer` (view/preview only). All checks run server-side via `requireWebsiteRole`.
- Platform admin endpoints under `/api/admin` (stats, users, role changes, cross-account site management)

**Dashboard**
- My sites, recently edited, published vs draft filters, total pages, views (from analytics)
- Actions: create, edit, preview, publish/unpublish, duplicate, delete

**Creation & templates**
- Name + description + category (business, portfolio, restaurant, blog, agency, saas, personal, landing, ecommerce)
- Blank or from template. 5 seeded templates (Business, Portfolio, Restaurant, SaaS, Blog) stored as reusable page-JSON.

**Visual editor (core)**
- 3-panel: component library (left) / canvas (center) / properties + pages + theme + versions (right)
- 21 components: container, section, heading, text, image, button, link, divider, spacer, navbar, hero, card, featureGrid, testimonials, pricing, gallery, faq, contactForm, footer, video, socialLinks
- Real dnd-kit drag-and-drop: drag in, reorder, nest in section/container, visual drop indicator, duplicate / copy / paste / delete / keyboard (Ctrl+Z, Ctrl+Shift+Z, Ctrl+C/V/D, Del)
- Component tree (no hardcoded positions): `{ id, type, props, children }`
- Properties panel per type (typography, colors, spacing, background, images, buttons, layout)
- Viewports: Desktop 100% / Tablet 768 / Mobile 375
- Global theme (primary/secondary/background/text/accent, fonts, base size, container width, radius, button style) applied via CSS vars
- Page management: create/rename/duplicate/delete/reorder/set-home/slug
- Navigation builder (internal page / external / section anchor / email / phone)
- Media library (upload/list/search/delete/select; Cloudinary if configured else local `/uploads`)
- Autosave (1200 ms debounce, Saving…/Saved states), manual snapshots, version history (last 30, restore), undo/redo (50 steps)

**Publishing & public renderer**
- Validate → snapshot draft pages+theme+nav → `publishedSnapshot` + `PublishVersion` → `status=published`, `publishedAt`, public `/site/:slug` + `/site/:slug/:pageSlug`
- Public renderer uses the *same* `Renderer` as preview but with `mode="live"`, applies theme + SEO meta, tracks a view event. Draft edits never leak to public until re-publish.
- SEO per site + per page (title, description, keywords, OG image, favicon)
- Custom-domain-ready model: `slug`, `customDomain`, `domainVerified`, `publishedAt` (DNS automation out of scope for MVP)

**Forms & analytics**
- `contactForm` validates, `POST /api/forms/:websiteId/submit`, stored as `FormSubmission`, owner views/deletes in dashboard
- Analytics events (page view, referrer, device, browser, visitorId, country if available); summary API powers dashboard charts (today/week/month, popular pages) with Recharts

## Tech stack

Frontend (`client/`): React 18, Vite 5, React Router 6, Tailwind 3, Axios, React Hook Form + Zod, Zustand, dnd-kit, lucide-react, Recharts.

Backend (`server/`): Node 20, Express 4, Mongoose 8, JWT, bcryptjs, multer, Cloudinary (optional), Helmet, CORS, express-rate-limit, Morgan, Zod validation.

Infra: MongoDB 7, Docker + Compose (frontend/nginx + backend + mongo). Tests: Jest + Supertest + mongodb-memory-server.

## Architecture

```
Website builder/
  client/                  # Vite SPA
    src/
      components/          # Button, Card, Input, Modal, Toast, EmptyState...
      editor/              # Renderer, EditorCanvas, SortableItem, DndContext, EditorUtils, ComponentLibrary
      editor-components/   # Layout, Typography, Media, Interactive, Sections (21 types)
      panels/              # Left, Right, Pages, Theme, Versions
      pages/               # Landing, Login, Register, Dashboard, Websites, CreateWebsite,
                           # Templates, Editor, Preview, PublicSite, MediaLibrary,
                           # SiteSettings, Submissions, Team, Analytics, NotFound
      layouts/             # DashboardLayout, AuthLayout, EditorLayout
      hooks/               # useAuth, useDebounce, useAutosave, useWebsites
      store/               # authStore, websiteStore, editorStore (history/clipboard), uiStore
      services/            # api (axios+JWT) + auth/website/page/media/template/analytics/form/member/publish
      routes/ schemas/ utils/ assets/
  server/
    src/
      config/              # db, cloudinary
      models/              # User, Website, WebsiteMember, Page, PageVersion, Template,
                           # Media, FormSubmission, AnalyticsEvent, PublishVersion, Theme(in Website)
      middleware/          # auth (JWT), authorize (requireWebsiteRole), upload, validate, errorHandler
      validators/          # zod schemas
      services/            # version (throttle+cap), publish (snapshot), analytics (aggregations), storage
      controllers/ routes/ # auth, websites (+nested pages/members/publish), pages, versions,
                           # templates, media, forms, analytics, members
      utils/               # asyncHandler, ApiResponse/Error, slugify
      app.js server.js
    tests/                 # auth, website, page, publish (RBAC, version restore, forms)
  docker-compose.yml
```

**Key decisions**
- Single source of truth: page `content` JSON in Mongo; `Renderer` recursively maps `type → React component`. Canvas, Preview, PublicSite share it.
- Draft vs published split: `Page.content` (draft) + `Website.publishedSnapshot` (deep copy on publish). Public route only reads the snapshot.
- Autosave ≠ every keystroke: editor mutates Zustand instantly (undoable), `useAutosave` debounces 1.2 s then `PUT /websites/:id/pages/:pageId`.
- Versions throttled (min 5 min between auto-versions, max 30 kept) + explicit snapshots; undo/redo is separate in-memory history (50).
- RBAC: `Website.owner` always allowed; else lookup `WebsiteMember`. Frontend hides buttons, backend rejects with 403.
- Storage abstraction: if Cloudinary env present → cloud; else local disk `uploads/` served statically. Both store `{url, filename, mimeType, size}`.

## Page JSON architecture

```json
{
  "id": "root",
  "type": "page",
  "props": { "title": "Home" },
  "children": [
    { "id": "navbar-1", "type": "navbar", "props": { "brand": "Acme", "links": [{ "label": "Home", "href": "/" }] }, "children": [] },
    { "id": "hero-1", "type": "hero", "props": { "title": "Grow your business", "subtitle": "...", "ctaText": "Contact Us" }, "children": [] },
    { "id": "sec-1", "type": "section", "props": { "background": "#ffffff", "padding": "large" }, "children": [
      { "id": "h-1", "type": "heading", "props": { "text": "Build your future", "level": 1 }, "children": [] },
      { "id": "b-1", "type": "button", "props": { "text": "Get Started", "href": "#contact" }, "children": [] }
    ]}
  ]
}
```

`editor/Renderer.jsx → renderNode(node, {mode, theme, website, pages, navigate})` memoizes and recurses. Containers (`page/section/container/featureGrid/gallery`) render `children`. Leaf props are controlled by `panels/RightPanel.jsx`. `utils/componentDefaults.js → createNode(type)` supplies fresh ids + defaults so dnd always produces valid trees.

## Component renderer explanation

- `editor-components/*.jsx` implement all 21 types as pure functions of `(node.props, theme)`.
- Theme vars (`--sf-primary`, `--sf-bg`, ...) set by `ThemeProvider` from `website.theme`; components fall back to props then theme then defaults → changing theme repaints instantly.
- Modes: `edit` (click-to-select outlines), `preview`/`live` (clean, forms active, nav works).

## Installation

Requires Node 20+, MongoDB 7 (or Docker).

```powershell
# from this folder
npm run install:all

# backend env
Copy-Item server\.env.example server\.env
# edit MONGO_URI, JWT_SECRET

# frontend env (optional)
Copy-Item client\.env.example client\.env
```

## Environment variables

`server/.env`:
```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/siteforge
JWT_SECRET=<long-random>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAX_FILE_SIZE=5242880
UPLOAD_DIR=uploads

# Platform admin (seeded at boot; override + change password before deploying)
ADMIN_EMAIL=admin@siteforge.app
ADMIN_PASSWORD=change-me-before-deploying
ADMIN_NAME=SiteForge Admin
```

`client/.env`: `VITE_API_URL=http://localhost:5000` (dev uses Vite proxy `/api → :5000` so this is only for explicit uses).

## MongoDB setup

- Local: install MongoDB 7, `mongod`, keep default `MONGO_URI`.
- Atlas: set `MONGO_URI=mongodb+srv://...`.
- Memory (tests only): `mongodb-memory-server` auto-downloads; no setup needed.

## Cloudinary / S3 setup

- Leave Cloudinary vars empty → local disk (`server/uploads/`, served at `/uploads/*`). Fine for MVP/demo.
- To use Cloudinary: create cloud → set `CLOUDINARY_CLOUD_NAME/KEY/SECRET` → restart backend → uploads go to cloud and return secure URLs.
- S3-compatible: implement in `server/src/services/storage.service.js` (same interface: `uploadBuffer/save(file) → {url, publicId}`); model already stores generic URL.

## Running locally

```powershell
# terminal 1 — backend :5000 (seeds templates + demo account/demo site on first boot)
npm run dev:server

# terminal 2 — frontend :5173
npm run dev:client
```

Open http://localhost:5173 → log in with the demo account (button on the login page) or Register → Create Website → Edit → Publish → open `/site/<slug>`.

Health: `GET http://localhost:5000/healthz` and `GET http://localhost:5000/api/health`.

## Docker setup

```powershell
docker compose up --build
# frontend http://localhost:8080 (nginx SPA, /site/:slug works on refresh)
# backend  http://localhost:5000
# mongo    localhost:27017
```

Services: `frontend` (Vite build + nginx), `backend` (Node + uploads volume), `mongodb` (mongo:7 + healthcheck + volume). Env for compose is inlined in `docker-compose.yml` — override `JWT_SECRET` for real deploys.

## Publishing architecture

1. `POST /api/websites/:id/publish` (owner only) validates ≥1 page.
2. Loads all `Page` docs → deep-clones `{title, slug, path, content}` + `website.theme/navigation/seo`.
3. Writes `Website.publishedSnapshot + status=published + publishedAt` and appends `PublishVersion{versionNumber, pagesSnapshot}`.
4. Public `GET /api/websites/slug/:slug` returns the published snapshot only (drafts 404). `PublicSite.jsx` renders it and fires `POST /api/analytics/track`.

Unpublish: `POST /websites/:id/unpublish` flips to `draft` (snapshot retained for republish audit).

Custom domains: `Website{customDomain, domainVerified}` reserved; future: map `Host` header → website lookup + DNS CNAME verification worker.

## API overview

All JSON is `{success:true,data}` or `{success:false,message,errorCode}`.

- Auth: `POST /api/auth/register|login`, `GET /api/auth/me`, `PATCH /api/auth/me` (profile)
- Websites: `GET|POST /api/websites`, `GET|PUT|DELETE /api/websites/:id`, `POST /:id/duplicate|publish|unpublish`, `PUT /:id/theme|navigation|seo|settings`
- Public site: `GET /api/websites/slug/:slug` (published only, no auth) — powers `/site/:slug`
- Templates: `GET /api/templates`, `POST /api/websites/from-template/:templateId`
- Pages: `GET|POST /api/websites/:id/pages`, `POST /api/websites/:id/pages/reorder`, `GET|PUT|DELETE /api/websites/:id/pages/:pageId`, `POST /:pageId/duplicate|set-home`
- Versions: `GET /api/websites/:id/pages/:pageId/versions`, `POST .../versions/snapshot`, `POST .../versions/:versionNumber/restore`
- Media: `POST /api/media` (multipart), `GET /api/media?websiteId=`, `DELETE /api/media/:id?websiteId=`
- Forms: `POST /api/websites/:id/forms/submit` (public, alias `POST /api/forms/:websiteId/submit`), `GET /api/websites/:id/forms` (owner/editor), `DELETE /api/websites/:id/forms/:submissionId` (alias `DELETE /api/forms/:submissionId`, resolves the site from the submission)
- Analytics: `POST /api/analytics/track` (public), `GET /api/analytics/:websiteId/summary?from&to` (returns `views`, `uniqueVisitors`, `today`, `week`, `month`, `byPage`, `byDay`), `GET /api/analytics/:websiteId/by-page`
- Members: `GET|POST /api/websites/:id/members`, `PATCH|DELETE /api/websites/:id/members/:memberId` (aliases `PATCH|DELETE /api/members/:memberId` resolve the site from the member doc; roles are `editor`/`viewer` only)
- Admin (account role `admin` only — `401` anonymous, `403` otherwise): `GET /api/admin/stats`, `GET /api/admin/users?search&role&page&limit`, `PATCH /api/admin/users/:id/role` (`user|admin`; self-change → `400 CANNOT_CHANGE_SELF`), `GET /api/admin/websites?search&status&page&limit`, `POST /api/admin/websites/:id/unpublish`, `DELETE /api/admin/websites/:id` (full cleanup: pages, versions, members, submissions, analytics, publish versions, media)

## Testing

```powershell
npm run test:server
# or
npm --prefix server test
```

38 tests across 6 suites: register/login/me, website CRUD + duplicate + slug clash (409), editor-cannot-delete (403), page create/update, autosave version creation, version restore, publish snapshot isolation (public sees published only), form submit + owner list, the demo suite (demo login, public slug endpoint incl. draft-404, template v2 seeding, from-template, wrapped `{theme}` body with client keys, slug/SEO update, analytics windows), and the admin suite (admin seed + login with role, 401/403 gating, stats, users list + search, role promotion + self-change/invalid-role rejections, platform website list with owner populate + status filter, admin unpublish → public 404, admin force-delete with member cleanup). Uses in-memory Mongo so no local DB needed.

## Performance notes

- Route-level code splitting via `React.lazy` + `Suspense` (`routes/AppRoutes.jsx`) — the initial chunk is ~134 kB gzip-included; `charts` (recharts) and `dnd` (@dnd-kit) load only on pages that use them (`vite.config.js` `manualChunks`).
- Google Fonts (Space Grotesk / Inter / JetBrains Mono) load with `preconnect` + `display=swap` (`client/index.html`); system fallbacks before they arrive.
- Media uploads served by nginx directly from the backend `/uploads` route in Docker (`client/nginx.conf` proxies `/api` + `/uploads` to `backend:5000`); the Vite dev server proxies both as well.
- All animation is CSS-based (no animation library); `Reveal` uses one `IntersectionObserver` per instance and cleans up on unmount. `prefers-reduced-motion` disables transitions/animations globally.

## Deployment instructions

- Backend: any Node host (Render/Railway/Fly/EC2). Set env, `npm --prefix server install --omit=dev`, `node server/src/server.js`. Ensure `MONGO_URI` (Atlas) + `CLIENT_URL` (frontend origin) + persistent disk/S3 for uploads.
- Frontend: Vercel/Netlify/static: `npm --prefix client install && npm --prefix client run build`, serve `client/dist`. Set `VITE_API_URL` to backend origin if not same-origin; otherwise rely on proxy in dev and absolute API in prod (`services/api.js` uses `/api` — configure reverse proxy or set baseURL).
- Full-stack Docker: `docker compose up --build -d` on a VM; put a reverse proxy (Caddy/Traefik) in front for TLS + future custom-domain routing.

## Future improvements

- Real-time collab (Yjs / sockets + presence), comments
- More components (slider, tabs, mega-menu, blog CMS, ecommerce cart)
- Undo across pages, branching versions
- Cloudflare R2/S3 presigned uploads, image resize pipeline
- Custom domains with automatic TLS + `Host` resolution
- E2E tests (Playwright), visual regression, Lighthouse budgets
- Redis + BullMQ for analytics ingestion / publish jobs (interfaces already isolated in services)
