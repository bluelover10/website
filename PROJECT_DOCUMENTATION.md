# SiteForge — Complete Project Documentation

> **SiteForge** is a visual no-code website builder (MERN stack) — a self-hosted, portfolio-quality MVP in the spirit of Wix / Webflow. Users create websites by dragging components onto a canvas, style them, manage pages/theme/media/SEO, and publish to a public URL — with teams (Owner / Editor / Viewer), version history, form submissions, analytics, and a platform admin surface.

---

## Table of Contents

1. [What is SiteForge?](#1-what-is-siteforge)
2. [Purpose & Use Cases](#2-purpose--use-cases)
3. [Tech Stack](#3-tech-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Project Folder Structure](#5-project-folder-structure)
6. [Data Models](#6-data-models)
7. [Roles & Permissions (Full Details)](#7-roles--permissions-full-details)
   - 7.1 [The Two Role Systems](#71-the-two-role-systems)
   - 7.2 [Account Roles (`user` / `admin`)](#72-account-roles-user--admin)
   - 7.3 [Website Roles (`owner` / `editor` / `viewer`)](#73-website-roles-owner--editor--viewer)
   - 7.4 [Full Permission Matrix (Every Endpoint)](#74-full-permission-matrix-every-endpoint)
   - 7.5 [How RBAC Works Internally (Backend)](#75-how-rbac-works-internally-backend)
   - 7.6 [How Roles Work in the Frontend](#76-how-roles-work-in-the-frontend)
   - 7.7 [How to Use Roles (User Guide)](#77-how-to-use-roles-user-guide)
   - 7.8 [RBAC Error Codes](#78-rbac-error-codes)
   - 7.9 [Protected vs Public Routes Summary](#79-protected-vs-public-routes-summary)
8. [Core Feature Details](#8-core-feature-details)
9. [The Page JSON Architecture](#9-the-page-json-architecture)
10. [Publishing Flow](#10-publishing-flow)
11. [Forms & Analytics](#11-forms--analytics)
12. [API Reference](#12-api-reference)
13. [How to Install & Run](#13-how-to-install--run)
14. [User Guide (Step-by-Step Workflow)](#14-user-guide-step-by-step-workflow)
15. [Admin Guide](#15-admin-guide)
16. [Environment Variables](#16-environment-variables)
17. [Testing](#17-testing)
18. [Deployment](#18-deployment)
19. [Security Notes & Known Limitations](#19-security-notes--known-limitations)
20. [Future Improvements](#20-future-improvements)

---

## 1. What is SiteForge?

SiteForge is a **full-stack web application** that lets anyone build and publish a website **without writing code**:

- Pick a template or start blank
- **Drag & drop** ~21 visual components onto a live canvas
- Edit styles, typography, colors, spacing through a properties panel
- Manage multiple pages, navigation, global theme, media, and SEO
- Publish with one click to a **public URL** (`/site/<slug>`)
- Collect contact-form submissions and view traffic analytics
- Collaborate via per-site roles (Owner / Editor / Viewer)
- Platform admins oversee all users and sites

It is a complete **MERN** application: React frontend + Express/MongoDB backend, containerized with Docker.

---

## 2. Purpose & Use Cases

**Purpose:** demonstrate (and serve as a base for) a production-shaped SaaS website builder: multi-tenant sites, visual editing, draft/published isolation, team permissions, public hosting of built sites, and platform administration.

**Typical use cases:**

| User type | What they do |
|---|---|
| Freelancer / agency | Build client landing pages, invite a client as `viewer` to preview, or an intern as `editor` |
| Small business | Build a restaurant/portfolio/SaaS site from a template, collect contact leads, watch analytics |
| Blog author | Publish content pages with SEO settings |
| Platform operator | Run the whole service: stats, user management, taking abusive sites offline |

---

## 3. Tech Stack

**Frontend — `client/`**
- React 18, Vite 5, React Router 6
- Tailwind CSS 3 (custom "forge" design system, dark mode)
- Zustand (state), Axios (HTTP), React Hook Form + Zod (forms)
- **dnd-kit** (drag-and-drop), **Recharts** (analytics charts), lucide-react (icons)

**Backend — `server/`**
- Node.js 20, Express 4, Mongoose 8 (MongoDB)
- JWT auth + bcryptjs password hashing
- Zod (request validation), Multer (uploads), Cloudinary SDK (optional CDN storage)
- Helmet, CORS, express-rate-limit, Morgan (logging)

**Infra**
- MongoDB 7, Docker Compose (`frontend` nginx + `backend` + `mongodb`)
- Tests: Jest + Supertest + mongodb-memory-server

---

## 4. Architecture Overview

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│  client/ (Vite SPA)     │  /api  │  server/ (Express API)       │
│  ─ Editor canvas        │──────▶ │  ─ JWT protect middleware    │
│  ─ Renderer (JSON→UI)   │ proxy  │  ─ requireWebsiteRole (RBAC) │
│  ─ Zustand stores       │        │  ─ Zod validators            │
│  ─ Public site viewer   │        │  ─ Controllers → Mongoose    │
└─────────────────────────┘        └──────────────┬───────────────┘
        nginx / vite dev proxy                    │
                                          ┌───────▼────────┐
                                          │  MongoDB 7     │
                                          │  (10 models)   │
                                          └────────────────┘
```

**The single most important idea:** every page is a **JSON tree** stored in MongoDB. One recursive `Renderer` component maps `type → React component` and is reused in **three places** — the editor canvas, the preview, and the published public site. One source of truth, zero rendering drift.

**Draft vs published split:** edits go to `Page.content` (draft). Publishing deep-copies all pages + theme + nav + SEO into `Website.publishedSnapshot`. The public URL serves **only the snapshot**, so editing a live site never leaks until re-publish.

---

## 5. Project Folder Structure

```
Website builder/
└── Web/
    ├── package.json                    # root scripts (install:all, dev:server, dev:client…)
    ├── docker-compose.yml              # mongodb + backend + frontend
    ├── README.md
    ├── OVERHAUL_REPORT.md
    └── PROJECT_DOCUMENTATION.md        ← this file
    ├── client/                         # Vite React SPA
    │   ├── vite.config.js              # port 5173, proxies /api + /uploads → :5000, manual chunks
    │   ├── nginx.conf                  # (Docker) proxies /api + /uploads → backend:5000
    │   └── src/
    │       ├── components/             # Button, Card, Input, Modal, Toast, EmptyState…
    │       ├── editor/                 # Renderer, EditorCanvas, DndContext, SortableItem,
    │       │                           #   ComponentLibrary, EditorUtils
    │       ├── editor-components/      # the 21 component types: Layout, Typography, Media,
    │       │                           #   Sections, Interactive
    │       ├── panels/                 # LeftPanel, RightPanel, PagesPanel, ThemePanel, VersionsPanel
    │       ├── pages/                  # Landing, Login, Register, Dashboard, Websites,
    │       │                           #   CreateWebsite, Templates, Editor, Preview, PublicSite,
    │       │                           #   MediaLibrary, SiteSettings, Submissions, Team,
    │       │                           #   Analytics, NotFound + pages/admin/*
    │       ├── layouts/                # AuthLayout, DashboardLayout, EditorLayout
    │       ├── hooks/                  # useAuth, useDebounce, useAutosave, useWebsites
    │       ├── store/                  # authStore, websiteStore, editorStore (history/clipboard), uiStore
    │       ├── services/               # api (axios + JWT) + auth/website/page/media/template/
    │       │                           #   analytics/form/member/publish/admin
    │       ├── routes/AppRoutes.jsx    # lazy routes + AdminRoute/ProtectedRoute guards
    │       ├── config/demo.js          # public demo credentials (by design)
    │       └── utils/ schemas/ assets/
    └── server/
        ├── Dockerfile
        └── src/
            ├── server.js               # entry: connect DB → seed → listen :5000
            ├── app.js                  # express app (helmet, cors, routes, error handler)
            ├── config/                 # db, cloudinary
            ├── models/                 # User, Website, WebsiteMember, Page, PageVersion,
            │                           #   PublishVersion, Template, Media, FormSubmission,
            │                           #   AnalyticsEvent
            ├── middleware/             # auth (JWT protect), authorize (RBAC), validate (zod),
            │                           #   upload (multer), errorHandler
            ├── validators/             # zod schemas per resource
            ├── controllers/            # auth, website, page, version, template, media,
            │                           #   form, analytics, member, admin
            ├── routes/                 # auth, websites (mounts pages/members/media/forms/
            │                           #   analytics), templates, admin
            ├── services/               # seed (demo+admin+templates), publish (snapshot),
            │                           #   version (throttle+cap), analytics (aggregations),
            │                           #   storage (cloudinary | local disk)
            └── utils/                  # ApiError, ApiResponse, asyncHandler, slugify
```

---

## 6. Data Models

| Model | Purpose | Key fields |
|---|---|---|
| **User** | Account | `name`, `email` (unique), `passwordHash` (bcrypt, `select:false`), `avatar`, `role: 'user' \| 'admin'` |
| **Website** | A site | `name`, `slug` (unique), `description`, `category`, `owner → User`, `status: 'draft' \| 'published'`, `theme` (Mixed: colors/fonts/radius/…), `navigation[]` (label, linkType page/url/anchor, pageId, openInNew), `seo` (title/description/keywords/ogImage/favicon), `customDomain`, `domainVerified`, `publishedAt`, `publishedSnapshot` (the frozen copy served publicly), `viewsCount` |
| **WebsiteMember** | Per-site collaboration | `websiteId → Website`, `userId → User` (unique together), `role: 'owner' \| 'editor' \| 'viewer'`, `invitedBy` |
| **Page** | A page draft | `websiteId`, `title`, `slug`, `path`, `isHome`, `content` (**the JSON component tree**), order |
| **PageVersion** | Version history | per page; auto-versions throttled (≥5 min apart, max 30 kept) + manual snapshots |
| **PublishVersion** | Publish audit log | `versionNumber`, `pagesSnapshot` appended on every publish |
| **Template** | Seeded starter sites | full page-JSON (Business, Portfolio, Restaurant, SaaS, Blog) |
| **Media** | Uploaded files | `url`, `filename`, `mimeType`, `size`, `publicId`, owner/website scope |
| **FormSubmission** | Contact-form leads | `websiteId`, `formId`, payload, timestamps |
| **AnalyticsEvent** | Traffic events | page view: referrer, device, browser, `visitorId`, country, path, timestamp |

---

## 7. Roles & Permissions (Full Details)

SiteForge has **two independent role systems**, both enforced on the backend. The frontend merely hides controls — **the server is the security boundary**.

### 7.1 The Two Role Systems

| | **Account Role** | **Website Role** |
|---|---|---|
| Stored on | `User.role` | `WebsiteMember.role` (per website) |
| Values | `user` (default), `admin` | `owner`, `editor`, `viewer` |
| Scope | The whole platform | One specific website |
| Enforced by | `requireAdmin` middleware | `requireWebsiteRole(['…'])` middleware |
| UI surface | `/admin` section (shield icon, admins only) | Editor/dashboard buttons per site |
| Hierarchy | flat (user < admin) | owner > editor > viewer |
| Independent? | Yes — an `admin` account is NOT automatically a member/owner of any site | Yes — website roles don't grant admin powers |

An account is **always** the `owner` of the websites it creates (`Website.owner`). Other accounts get a `WebsiteMember` document with `editor` or `viewer`.

### 7.2 Account Roles (`user` / `admin`)

**`user`** — the default for every registered account. Can: register/login, create websites, edit/publish/delete **their own** sites, be invited as a member to other people's sites, use `/api/auth/me`.

**`admin`** — platform operator. **Everything a `user` can do, plus** exclusive access to `/api/admin/*` and the `/admin` UI:

- `/admin` — platform stats (users, sites, published, pages, media, submissions, views) + newest accounts / recently updated sites
- `/admin/users` — search & filter accounts, see owned-site counts, **promote/demote** (`PATCH /api/admin/users/:id/role`)
  - Changing **your own** role is blocked server-side (`400 CANNOT_CHANGE_SELF`) so the platform can never lock out all admins
  - Invalid role values are rejected (`400`)
- `/admin/websites` — every site platform-wide with owner populated, search + status filter
  - **Unpublish any live site** (`POST /api/admin/websites/:id/unpublish`)
  - **Force-delete any site** (`DELETE /api/admin/websites/:id`) with the same full cleanup as the owner path (pages, versions, members, submissions, analytics events, publish versions, media)

Important behaviors:

- There is **only one login** (`/login`). Admins use the same page and the same JWT — their account `role` simply unlocks the admin surface.
- Admin **does not need membership** on a site to administer it (`requireAdmin` is independent of `requireWebsiteRole`).
- The seeded admin is created at boot from `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` env. Seeding is **idempotent and self-healing**: if an account with `ADMIN_EMAIL` already exists but isn't admin, it is promoted at boot. These credentials are **not public** — override them and change the password before any real deployment.
- Client-side `AdminRoute` (in `client/src/routes/AppRoutes.jsx`) is only a redirect convenience: non-admins are bounced to `/dashboard`. A non-admin could technically load the admin page component — every data call would still fail with `403 FORBIDDEN_ADMIN`, and the page renders an error/empty state. Real security lives in `requireAdmin`.

### 7.3 Website Roles (`owner` / `editor` / `viewer`)

Resolved per request by `requireWebsiteRole` (`server/src/middleware/authorize.js`). Semantics:

| Role | Meaning | Can do (summary) |
|---|---|---|
| **owner** | Creator of the site (or has `Website.owner`) | **Everything**: edit, delete the site, manage team members, publish, settings, media, forms, pages, versions |
| **editor** | Invited collaborator with write access | Edit **all content** (pages, theme, navigation, SEO, settings), upload/delete media, publish/unpublish, duplicate, view/restore versions, read form submissions and delete them, view analytics. **Cannot**: delete the website, invite/change/remove members |
| **viewer** | Invited read-only collaborator | **View only**: open the site in the editor (read), list/read pages and versions, view analytics, view media library. **Cannot**: change anything — every write returns `403 FORBIDDEN_ROLE` |

Key rules:

- **Owner is always allowed** — resolved directly from `Website.owner`, not from a member document.
- Non-owners must have a `WebsiteMember` document; no membership at all ⇒ `403 FORBIDDEN` even if the user is a platform `admin` (admin power applies only on `/api/admin/*`, not to normal per-site endpoints).
- The invite validator (`server/src/validators/member.validator.js`) restricts **invitable/updatable member roles to `editor` and `viewer` only** — you can never invite a second "owner"; ownership is only `Website.owner`.
- There is exactly one `owner` per site. Role changes among members can only move between editor ⇄ viewer.
- Deleting a website removes all its data (pages, versions, members, submissions, analytics, publish versions, media).

### 7.4 Full Permission Matrix (Every Endpoint)

Legend: 🌐 public (no auth) · 🔑 any logged-in user · 👁 owner+editor+viewer · ✏ owner+editor · 👑 owner only · 🛡 platform admin only

| Endpoint | Access | Notes |
|---|---|---|
| `POST /api/auth/register` | 🌐 | creates a `user` |
| `POST /api/auth/login` | 🌐 | returns JWT |
| `GET /api/auth/me` | 🔑 | |
| `PATCH /api/auth/me` | 🔑 | update own profile |
| `GET /healthz`, `GET /api/health` | 🌐 | health checks |
| `GET /api/templates` · `GET /api/templates/:id` | 🌐 | browse templates |
| `GET /api/websites/slug/:slug` (alias `/published/:slug`) | 🌐 | **published snapshot only**; drafts 404 — powers `/site/:slug` |
| `POST /api/websites/:websiteId/forms/submit` (alias `POST /api/forms/:websiteId/submit`) | 🌐 | public contact-form submission |
| `POST /api/analytics/track` | 🌐 | public page-view tracking |
| `POST /api/templates/:templateId/instantiate` | 🔑 | create own site from template |
| `GET /api/websites` | 🔑 | list **own** sites (+ membership visible) |
| `POST /api/websites` | 🔑 | create a site (you become owner) |
| `POST /api/websites/from-template/:templateId` | 🔑 | create from template |
| `GET /api/websites/:websiteId` | 👁 | view one site you have access to |
| `PUT /api/websites/:websiteId` | ✏ | rename/describe/site basics |
| `DELETE /api/websites/:websiteId` | 👑 | delete site + all child data |
| `POST /api/websites/:websiteId/duplicate` | ✏ | duplicate as new draft |
| `POST /api/websites/:websiteId/publish` | ✏ | validate ≥1 page → snapshot → publish |
| `POST /api/websites/:websiteId/unpublish` | ✏ | flip to draft (snapshot retained) |
| `PUT /api/websites/:websiteId/theme` | ✏ | global design tokens |
| `PUT /api/websites/:websiteId/navigation` | ✏ | nav menu items |
| `PUT /api/websites/:websiteId/seo` | ✏ | SEO/meta per site |
| `PUT /api/websites/:websiteId/settings` | ✏ | site settings |
| `GET /api/websites/:websiteId/pages` | 👁 | list pages |
| `GET /api/websites/:websiteId/pages/:pageId` | 👁 | read a page (draft) |
| `POST /api/websites/:websiteId/pages` | ✏ | create page |
| `PUT /api/websites/:websiteId/pages/:pageId` | ✏ | **autosave** (page content) |
| `DELETE /api/websites/:websiteId/pages/:pageId` | ✏ | delete page |
| `POST /api/websites/:websiteId/pages/reorder` | ✏ | `{ orderedIds }` |
| `POST …/pages/:pageId/duplicate` | ✏ | |
| `POST …/pages/:pageId/set-home` | ✏ | |
| `GET …/pages/:pageId/versions` | 👁 | version history list |
| `GET …/pages/:pageId/versions/:versionNumber` | 👁 | read one version |
| `POST …/pages/:pageId/versions/snapshot` | ✏ | manual snapshot |
| `POST …/pages/:pageId/versions/:versionNumber/restore` | ✏ | restore |
| `GET /api/websites/:websiteId/media` (alias `/api/media?websiteId=`) | 👁 | media library list |
| `POST /api/websites/:websiteId/media` (multipart `file`) | ✏ | upload (multer runs first so `websiteId` form field is parsed) |
| `DELETE /api/websites/:websiteId/media/:mediaId` | ✏ | delete media |
| `GET /api/websites/:websiteId/forms` (alias `/api/forms/:websiteId`) | ✏ | list submissions (owner/editor only — viewers cannot read leads) |
| `DELETE /api/websites/:websiteId/forms/:submissionId` (aliases resolve website from the submission doc) | ✏ | delete a submission |
| `GET /api/websites/:websiteId/analytics/summary` (aliases: nested + `/api/analytics/:websiteId/summary`) | 👁 | views, uniqueVisitors, today/week/month, byDay, byPage |
| `GET /api/websites/:websiteId/analytics/by-page` (aliases) | 👁 | per-page ranking |
| `GET /api/websites/:websiteId/members` (alias `/api/members/:memberId` resolution for nested ops) | 👁 | team list |
| `POST /api/websites/:websiteId/members/invite` | 👑 | invite `editor`/`viewer` only |
| `PATCH /api/websites/:websiteId/members/:memberId` | 👑 | change member role editor ⇄ viewer |
| `DELETE /api/websites/:websiteId/members/:memberId` | 👑 | remove member |
| `GET /api/admin/stats` | 🛡 | platform counts + recent users/sites |
| `GET /api/admin/users` (`?search&role&page&limit`) | 🛡 | paginated user list |
| `PATCH /api/admin/users/:id/role` | 🛡 | promote/demote (`user`⇄`admin`); self-change → `400 CANNOT_CHANGE_SELF` |
| `GET /api/admin/websites` (`?search&status&page&limit`) | 🛡 | all sites, owner populated |
| `POST /api/admin/websites/:id/unpublish` | 🛡 | take any live site offline |
| `DELETE /api/admin/websites/:id` | 🛡 | force-delete with full cleanup |

### 7.5 How RBAC Works Internally (Backend)

`server/src/middleware/authorize.js`:

```js
function requireWebsiteRole(allowedRoles = ['owner', 'editor', 'viewer']) { … }
function requireOwnerRole() { return requireWebsiteRole(['owner']); }
const requireAdmin = /* checks req.user.role === 'admin' */
```

**`requireWebsiteRole(allowedRoles)` step by step:**

1. If `req.user` is missing → `401 UNAUTHENTICATED` (i.e. `protect` must run first).
2. Finds the website id from `req.params.websiteId | req.params.id | req.body.websiteId | req.query.websiteId` — missing → `400 WEBSITE_ID_MISSING`.
3. Loads the `Website`; not found → `404 WEBSITE_NOT_FOUND`.
4. **Owner shortcut:** if `website.owner === req.user.id` → attach `req.membership = { role: 'owner', isOwner: true }` → next(). No member document needed.
5. Otherwise look up `WebsiteMember { websiteId, userId }`:
   - Not found → `403 FORBIDDEN` ("no access to this website").
   - Found but `membership.role` ∉ `allowedRoles` → `403 FORBIDDEN_ROLE` ("requires one of [...]").
6. Attaches `req.website` and `req.membership` for controllers, then `next()`.

**`requireAdmin`** (defense-in-depth beyond route mounting order): `401` if anonymous, `403 FORBIDDEN_ADMIN` if `req.user.role !== 'admin'`. It is deliberately independent of website membership.

**Route mounting pattern** — websites routes are nested:

```
/api/websites/:websiteId  → mounts  /pages  /members  /media  /forms  /analytics
```

Standalone aliases (e.g. `DELETE /api/forms/:submissionId`, `PATCH /api/members/:memberId`) first **resolve the owning website from the child document** (submission/member), then run the exact same role check — so aliases and nested routes share identical authorization.

### 7.6 How Roles Work in the Frontend

- `authStore` holds the JWT + the account (`role` included). `ProtectedRoute` requires being logged in; `AdminRoute` (in `routes/AppRoutes.jsx`) additionally requires `user.role === 'admin'`, otherwise redirects to `/dashboard`.
- `DashboardLayout` renders the admin sidebar section (shield icon) **only** when `role === 'admin'`.
- Editor/dashboard views read the current membership and **hide** buttons the role can't use (e.g. viewers see read-only panels; the member "owner" row is protected in Team; admins can't change their own role in the UI — the server blocks it anyway).
- Nothing user-facing trusts the frontend alone: even if someone bypasses the UI, the server rejects every unauthorized request. React also escapes rendered content (no `dangerouslySetInnerHTML`).

### 7.7 How to Use Roles (User Guide)

**As a site Owner — invite a collaborator:**

1. Open the site → **Team** page (`/websites/:id/team`).
2. Click **Invite member**, enter their email and choose role:
   - `editor` — can build and publish for you
   - `viewer` — can look but not touch
3. The person must already have an account (registered email). They see the site appear in their dashboard with their role badge.
4. Manage the team later from the same page: change editor ⇄ viewer, or remove the member. (Owner row is protected — you can't demote yourself.)

**As an Editor (invited):** log in, open the shared site from your dashboard, edit everything: drag components, autosave edits, upload media, publish/unpublish, respond to form submissions. You cannot delete the whole site or manage the team.

**As a Viewer (invited):** open the site to inspect and preview — all editing controls are hidden/disabled, and any write API call would return `403 FORBIDDEN_ROLE`.

**As a Platform Admin:** log in normally → a shield-icon admin section appears in the sidebar:
- `/admin` — platform stats at a glance
- `/admin/users` — search users, promote someone to `admin` or demote to `user` (you can't change your own role)
- `/admin/websites` — search/filter all sites by owner or status, **Unpublish** a live site, or **force-delete** it with full data cleanup

**Demo account:** `demo@siteforge.app` / `demo1234` (public by design, shown on the login page) — a regular `owner` of the seeded "Nova Creative Studio" demo site with sample submissions and 14 days of analytics. No admin powers.

### 7.8 RBAC Error Codes

| HTTP | `errorCode` | Meaning |
|---|---|---|
| 401 | `UNAUTHENTICATED` | No/invalid JWT |
| 403 | `FORBIDDEN` | Logged in, but no membership on this website |
| 403 | `FORBIDDEN_ROLE` | Membership exists, but role not in the endpoint's allowed list (e.g. viewer trying to edit) |
| 403 | `FORBIDDEN_ADMIN` | `/api/admin/*` hit by a non-admin account |
| 400 | `WEBSITE_ID_MISSING` | Website id not provided |
| 404 | `WEBSITE_NOT_FOUND` | Website id doesn't exist |
| 400 | `CANNOT_CHANGE_SELF` | Admin tried to change own account role |

All API responses are `{ success: true, data }` or `{ success: false, message, errorCode }`.

### 7.9 Protected vs Public Routes Summary

**Public (no token):** register, login, health, template browsing, published-site snapshot, form submit, analytics track.

**Token required:** everything else. **Role required:** all per-site endpoints (per matrix above). **Admin role required:** all of `/api/admin/*`.

The entire public surface is intentionally tiny — published site reads, lead capture, and view tracking are the only unauthenticated write/read channels.

---

## 8. Core Feature Details

**Auth** — JWT (7d default), bcrypt hashing, `GET/PATCH /api/auth/me` for profile.

**Dashboard** — my sites, recently edited, published vs draft filters, total pages, views (real analytics numbers), quick actions: create / edit / preview / publish-unpublish / duplicate / delete.

**Creation & templates** — name + description + category (business, portfolio, restaurant, blog, agency, saas, personal, landing, ecommerce). Blank or from 5 seeded templates stored as reusable page-JSON.

**Visual editor (the core)** — 3 panels:
- *Left:* searchable component library + layers tree
- *Center:* canvas — real dnd-kit drag-and-drop: drag in, reorder, **nest inside section/container**, visual drop indicator; per-item toolbar (duplicate / copy / paste / delete); keyboard: `Ctrl+Z`, `Ctrl+Shift+Z`, `Ctrl+C/V/D`, `Del`
- *Right:* per-type property editors (typography, colors, spacing, background, images, buttons, layout) + Pages, Theme, Versions tabs

**21 component types:** container, section, heading, text, image, button, link, divider, spacer, navbar, hero, card, featureGrid, testimonials, pricing, gallery, faq, contactForm, footer, video, socialLinks.

**Viewports:** Desktop 100% / Tablet 768 / Mobile 375.

**Global theme:** primary/secondary/background/text/accent colors, heading/body fonts, base size, container width, corner radius, button style — applied via CSS variables (`--sf-primary`, `--sf-bg`, …) so theme changes repaint instantly. Components fall back `props → theme → defaults`.

**Media library:** upload/list/search/delete/select. Cloudinary if env is configured, otherwise local disk `uploads/` served statically. Both store `{ url, filename, mimeType, size }`.

**Autosave & history:** editor mutates Zustand instantly (undoable), `useAutosave` debounces 1.2 s → `PUT …/pages/:pageId`; Saving…/Saved indicator. Undo/redo = 50-step in-memory history. Version history = last 30 server snapshots (auto ones ≥5 min apart) + manual snapshots + restore.

**Publishing:** see §10. **SEO:** per site and per page (title, description, keywords, OG image, favicon). Custom-domain fields (`customDomain`, `domainVerified`) are reserved in the model — DNS automation is out of scope for the MVP.

**Platform admin UI:** `/admin`, `/admin/users`, `/admin/websites` — server-enforced (see §7).

---

## 9. The Page JSON Architecture

Every page stores its content as a recursive tree:

```json
{
  "id": "root",
  "type": "page",
  "props": { "title": "Home" },
  "children": [
    { "id": "navbar-1", "type": "navbar",
      "props": { "brand": "Acme", "links": [{ "label": "Home", "href": "/" }] }, "children": [] },
    { "id": "hero-1", "type": "hero",
      "props": { "title": "Grow your business", "subtitle": "...", "ctaText": "Contact Us" }, "children": [] },
    { "id": "sec-1", "type": "section",
      "props": { "background": "#ffffff", "padding": "large" },
      "children": [
        { "id": "h-1", "type": "heading", "props": { "text": "Build your future", "level": 1 }, "children": [] },
        { "id": "b-1", "type": "button",  "props": { "text": "Get Started", "href": "#contact" }, "children": [] }
      ] }
  ]
}
```

- `client/src/editor/Renderer.jsx` → `renderNode(node, { mode, theme, website, pages, navigate })` memoizes and recurses; containers (`page/section/container/featureGrid/gallery`) render `children`.
- `client/src/editor-components/*` implement all types as pure functions of `(node.props, theme)`.
- `client/src/utils/componentDefaults.js → createNode(type)` supplies fresh ids + defaults, so drag-and-drop always produces valid trees.
- **Modes:** `edit` (click-to-select outlines), `preview`/`live` (clean render, working nav, active forms).

---

## 10. Publishing Flow

1. **Owner/Editor** clicks Publish → `POST /api/websites/:id/publish` (validates the site has ≥1 page).
2. Server loads all `Page` docs and deep-clones `{ title, slug, path, content }` + `website.theme / navigation / seo`.
3. Writes `Website.publishedSnapshot`, sets `status: 'published'`, `publishedAt`, and appends a `PublishVersion { versionNumber, pagesSnapshot }` (audit trail).
4. Public `GET /api/websites/slug/:slug` returns **only** the snapshot (draft → 404). `PublicSite.jsx` renders it with `mode="live"`, applies theme + SEO meta, and fires `POST /api/analytics/track`.
5. Further draft edits never leak to the public URL until the next publish.
6. **Unpublish** (`POST …/unpublish`) flips to `draft`; the snapshot is retained for republishing/audit.

---

## 11. Forms & Analytics

**Forms:** the `contactForm` component validates fields client-side, then posts publicly to `POST /api/websites/:websiteId/forms/submit` (with `formId: 'contact'`). Submissions are stored as `FormSubmission`; owners/editors view and delete them in the **Submissions** dashboard page.

**Analytics:** `POST /api/analytics/track` (public) records each page view: path, referrer, device, browser, `visitorId`, country (when available). `GET …/analytics/summary?from&to` returns `{ views, uniqueVisitors, today, week, month, byDay[{date,views}], byPage[{pagePath,views}] }` — rendered with Recharts as stat cards + line/bar charts + a popular-pages ranking.

---

## 12. API Reference

Conventions: base URL `http://localhost:5000`; JSON responses `{ success, data }` / `{ success:false, message, errorCode }`; auth via `Authorization: Bearer <jwt>`.

### Auth
- `POST /api/auth/register` — `{ name, email, password }` → user + JWT
- `POST /api/auth/login` — `{ email, password }` → JWT
- `GET /api/auth/me` · `PATCH /api/auth/me` — profile (token required)

### Websites (token; role per §7.4)
- `GET|POST /api/websites`
- `GET|PUT|DELETE /api/websites/:websiteId`
- `POST /api/websites/:websiteId/duplicate | publish | unpublish`
- `PUT /api/websites/:websiteId/theme | navigation | seo | settings`
- `GET /api/websites/slug/:slug` — public published snapshot (alias `/published/:slug`)

### Templates
- `GET /api/templates` · `GET /api/templates/:templateId` (public)
- `POST /api/websites/from-template/:templateId` (token) · `POST /api/templates/:templateId/instantiate` (token)

### Pages (nested)
- `GET|POST /api/websites/:websiteId/pages`
- `POST /api/websites/:websiteId/pages/reorder` — `{ orderedIds }`
- `GET|PUT|DELETE /api/websites/:websiteId/pages/:pageId`
- `POST …/:pageId/duplicate` · `POST …/:pageId/set-home`

### Versions
- `GET /api/websites/:websiteId/pages/:pageId/versions` · `GET …/versions/:versionNumber`
- `POST …/versions/snapshot` · `POST …/versions/:versionNumber/restore` — targets `versionNumber`

### Media
- `POST /api/media` (multipart, `file` field) · `GET /api/media?websiteId=` · `DELETE /api/media/:id?websiteId=`
- Nested equivalents under `/api/websites/:websiteId/media`

### Forms
- `POST /api/websites/:websiteId/forms/submit` — public (alias `POST /api/forms/:websiteId/submit`)
- `GET /api/websites/:websiteId/forms` (owner/editor) — alias `GET /api/forms/:websiteId`
- `DELETE /api/websites/:websiteId/forms/:submissionId` — alias `DELETE /api/forms/:submissionId`

### Analytics
- `POST /api/analytics/track` — public
- `GET /api/analytics/:websiteId/summary?from&to` · `GET /api/analytics/:websiteId/by-page` (owner/editor/viewer; nested aliases under `/api/websites/:websiteId/analytics/…`)

### Members
- `GET /api/websites/:websiteId/members` (👁) · `POST …/members/invite` (👑, role `editor|viewer`)
- `PATCH|DELETE /api/websites/:websiteId/members/:memberId` (👑) — aliases `PATCH|DELETE /api/members/:memberId` (website resolved from the member doc)

### Admin (account role `admin` — 401 anonymous / 403 otherwise)
- `GET /api/admin/stats`
- `GET /api/admin/users?search&role&page&limit` · `PATCH /api/admin/users/:id/role`
- `GET /api/admin/websites?search&status&page&limit`
- `POST /api/admin/websites/:id/unpublish` · `DELETE /api/admin/websites/:id`

---

## 13. How to Install & Run

Requires **Node 20+** and **MongoDB 7** (or Docker).

### A. Docker (everything included)

```powershell
cd Web
docker compose up --build
# frontend → http://localhost:8080   (nginx SPA; /site/:slug works on refresh)
# backend  → http://localhost:5000
# mongo    → localhost:27017
```

### B. Manual (dev)

```powershell
cd Web
npm run install:all                       # installs server/ + client/ deps

Copy-Item server\.env.example server\.env # then edit MONGO_URI + JWT_SECRET
Copy-Item client\.env.example client\.env # optional

# Terminal 1 — backend :5000 (seeds templates + demo/admin accounts on first boot)
npm run dev:server

# Terminal 2 — frontend :5173 (Vite proxies /api and /uploads → :5000)
npm run dev:client
```

Open **http://localhost:5173** → use the demo account (button on the login page) or Register.

Health checks: `GET http://localhost:5000/healthz` and `GET http://localhost:5000/api/health`.

**MongoDB options:** local install (`mongod`, default URI), Atlas (`mongodb+srv://…`), or tests-only in-memory (auto).

**Storage:** leave `CLOUDINARY_*` empty → local disk `server/uploads/` (served at `/uploads/*`). Set the three vars → uploads go to Cloudinary. S3: implement in `server/src/services/storage.service.js` (same interface).

---

## 14. User Guide (Step-by-Step Workflow)

1. **Log in** — demo account via the login page's "Use Demo Account", or Register.
2. **Dashboard → "New site"** — enter name/description/category; pick **Blank** or a **Template**.
3. **Editor opens** — drag components from the left panel onto the canvas; nest them in sections; style them from the right panel.
4. **Pages panel** — add/rename/duplicate/reorder pages; set the home page.
5. **Theme panel** — set brand colors/fonts/radius; preview live.
6. **Site settings** — navigation menu, SEO (title/description/OG image/favicon), slug.
7. **Media** — upload images in the Media Library and reuse them in components.
8. **Preview** — check desktop / tablet / mobile viewports.
9. **Publish** — site goes live at `http://localhost:5173/site/<slug>` (share this URL; drafts stay private).
10. **Monitor** — check **Analytics** for traffic and **Submissions** for contact-form leads.
11. **Iterate** — keep editing; re-publish whenever you want changes live. Use version history / undo-redo for safety. Invite teammates from **Team**.

---

## 15. Admin Guide

1. Log in with the seeded admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD` env — defaults `admin@siteforge.app` / `admin1234`; **change before deploying**).
2. A **shield-icon admin section** appears in the sidebar:
   - **/admin** — users, sites, published/drafts, pages, media, submissions, views + recent accounts/sites
   - **/admin/users** — search (`?search=`), filter by role, pagination; **Promote/Demote** with one click (self-change blocked, in UI and server)
   - **/admin/websites** — all sites with owner + counts; filter by status; **Unpublish** any live site; **force-delete** any site (full data cleanup, with confirmation dialog)
3. Remember: admin rights are platform-level only. To edit a specific site's content like a member, you'd still need normal membership — the admin surface is for moderation and oversight.

---

## 16. Environment Variables

`server/.env`:

```ini
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/siteforge
JWT_SECRET=<long-random>            # change before deploying
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=              # optional — empty = local uploads
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAX_FILE_SIZE=5242880               # 5 MB
UPLOAD_DIR=uploads

# Platform admin (seeded at boot; override BOTH before deploying)
ADMIN_EMAIL=admin@siteforge.app
ADMIN_PASSWORD=change-me-before-deploying
ADMIN_NAME=SiteForge Admin
```

`client/.env`: `VITE_API_URL=http://localhost:5000` (dev uses the Vite proxy `/api → :5000`; this is only for explicit uses).

`docker-compose.yml` inlines env for the three services (override `JWT_SECRET` and `ADMIN_PASSWORD` for real deploys).

---

## 17. Testing

```powershell
npm run test:server        # or: npm --prefix server test
```

**39 tests / 6 suites** (in-memory MongoDB — no local DB needed): register/login/me; website CRUD + duplicate + slug clash (409); **RBAC** (editor cannot delete → 403); page create/update; autosave version creation; version restore; publish snapshot isolation (public sees published only; drafts 404); form submit + owner list; demo suite (demo login, public slug endpoint, template seeding, from-template, wrapped `{theme}` bodies, slug/SEO update, analytics windows); admin suite (admin seed + login role, 401/403 gating, stats, users search, role promotion + self-change/invalid-role rejections, platform website list + filters, admin unpublish → public 404, force-delete with member cleanup).

Production build: `npm run build:client` — code-split (~134 kB initial + lazy `charts`/`dnd` chunks).

---

## 18. Deployment

- **Backend:** any Node host (Render/Railway/Fly/EC2). Set env; `npm --prefix server install --omit=dev`; `node server/src/server.js`. Use Atlas for `MONGO_URI`, set `CLIENT_URL`, mount persistent disk or S3 for uploads.
- **Frontend:** Vercel/Netlify/static — `npm --prefix client run build`, serve `client/dist`. Set `VITE_API_URL` to the backend origin if not same-origin (`services/api.js` uses `/api` — configure a reverse proxy or set the baseURL).
- **Full-stack Docker:** `docker compose up --build -d` on a VM; put Caddy/Traefik in front for TLS and future custom-domain routing (`Host` header → website lookup).
- **Before going live:** change `JWT_SECRET` + `ADMIN_PASSWORD`, enable rate limiting hardening, review upload MIME checks, switch media to cloud storage.

---

## 19. Security Notes & Known Limitations

**Solid:**
- bcrypt password hashes (`select:false`), JWT tokens
- Server-side RBAC on every route (`requireWebsiteRole`, `requireAdmin`) — frontend is convenience only
- Draft/published snapshot isolation; public surface limited to 4 endpoints
- React escapes all user content; no `dangerouslySetInnerHTML`
- Self-role-change blocked (`CANNOT_CHANGE_SELF`); one owner per site; members limited to editor/viewer
- Helmet, CORS, Morgan; request validation via Zod everywhere

**Known gaps / pre-deployment tasks (stated honestly in OVERHAUL_REPORT.md):**
- No browser/E2E or visual-regression tests (only build + 39 server tests were run)
- Placeholder `JWT_SECRET` in docker-compose — must be replaced
- Rate limiting exists as a dependency but auth/public endpoints need explicit brute-force protection review
- File-upload MIME restrictions should be re-checked server-side
- Docker images reviewed but not executed during the overhaul pass
- Google Fonts load from CDN (system-font fallback offline); recharts chunk is ~395 kB (lazy-loaded)

---

## 20. Future Improvements

- Real-time collaboration (Yjs / sockets + presence), comments
- More components (slider, tabs, mega-menu, blog CMS, ecommerce cart)
- Undo across pages, branching versions
- Cloudflare R2/S3 presigned uploads, image resize pipeline
- Custom domains with automatic TLS + `Host` resolution
- E2E tests (Playwright), visual regression, Lighthouse budgets
- Redis + BullMQ for analytics ingestion / publish jobs (service interfaces already isolated)

---

*Documentation generated from the codebase: routes, middleware, models, validators, and controllers in `server/src`, plus client structure in `client/src`. Permission matrix reflects the actual `requireWebsiteRole(allowedRoles)` arguments on every route file (`websites/pages/members/media/forms/analytics/admin.routes.js`).*
