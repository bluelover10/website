# SiteForge Overhaul — Final Report

Scope: full bug-fix pass, UI/UX redesign of every page with a unique design system, animations & micro-interactions, responsiveness + accessibility, performance optimization, security review, and a public demo login.
Baseline commit: `8ca0499 "Baseline before overhaul"` — all work below is in the commit that follows.

---

## 1. Bugs fixed (root causes, not workarounds)

### Server
- **Theme model rejected client payloads** — `Website.theme` is now a flexible `Schema.Types.Mixed` and the zod validator accepts the client theme keys (`baseSize`, `radius`, `buttonStyle`, …); update bodies wrapped as `{ theme: {...} }` pass through a `z.preprocess` shim (a plain union silently stripped them before).
- **Endpoint contract mismatches** fixed in forms / media / members / website controllers (aliases resolve the website from the submission or member document; roles restricted to `editor`/`viewer`).

### Client — API contracts
- **page.service**: version endpoints need the *nested* form `/websites/:websiteId/pages/:pageId/versions`; reorder sends `{ orderedIds }`; restore targets `versionNumber`, not a version id.
- **websiteStore**: `unwrapSite` applied everywhere (single-site endpoints return `data:{ website }`) — this fixed navigating to `/websites/undefined/edit`.
- **member/form/analytics/media/auth services** aligned to the real routes (e.g. `listByWebsite`, `removeSubmission(websiteId, id)`, summary shape).
- **PublicSite**: removed dead fallback fetches to non-existent routes (`/api/publish/:slug`, `/api/websites/published/:slug`, `/api/sites/:slug`); uses only `GET /api/websites/slug/:slug` (drafts 404 — covered by tests).

### Client — runtime bugs
- **Renderer**: a `type:'page'` root was not rendered; now normalized to `'root'`.
- **Sections**: missing `Share2` import crashed rendering.
- **Dashboard**: wrong stat keys (`pagesCount` → server returns `pageCount`, plus `viewsCount`); the "chart" plotted `Math.random()` — fabricated numbers replaced with real per-site views + a proper empty state.
- **CreateWebsite**: slug auto-generation clobbered manual slug edits — now respects a `slugTouched` ref.
- **Analytics**: remapped to the actual summary shape (`today/week/month/views`, `byDay[{date,views}]`, `byPage[{pagePath,views}]`); charts fixed accordingly (category Y-axis on `pagePath`).
- **ContactForm**: submissions were sent without `formId` — now sends `formId: 'contact'` so they appear in the inbox.
- **Team**: role select offered `admin` (invalid server-side) — editor/viewer only, owner protected.
- **MediaLibrary / Submissions**: delete/list calls missing `websiteId` scoping.
- **PagesPanel**: `window.alert`/`confirm` replaced with toasts + promise-based `askConfirm`.
- **uiStore**: `askConfirm` now returns a `Promise<boolean>` (module-level resolver); `ConfirmDialog` resolves on action; legacy `onConfirm` callbacks still supported. `Modal.onClose` must be wrapped (`() => closeConfirm(false)`).
- **Modal**: focus trap, ESC to close, body scroll lock.
- **Nested `<Link><Button/></Link>`** (invalid HTML, broken nesting): `Button.jsx` now exports `buttonClasses()` + `ButtonLink`; converted in Landing, NotFound, EditorLayout.
- **Dead code removed**: `panels/TopBar.jsx` (never imported, duplicate of EditorLayout) and `websiteService.listVersions/restoreVersion` (no route, no callers).

## 2. Demo login (public by design)

- Credentials mirror `server/src/services/seed.service.js`:
  - **Email:** `demo@siteforge.app` · **Password:** `demo1234` · "Demo User"
- Stored in a dedicated config file `client/src/config/demo.js`; rendered **only on the Login page** via `components/DemoAccessPanel.jsx` (copy buttons with clipboard fallback + a "Use Demo Account" button that fills the form).
- The demo user is a regular owner of the seeded, published "Nova Creative Studio" (with form submissions and 14 days of analytics) — **no admin powers**.
- No other credentials are exposed anywhere in the client.

## 3. Pages redesigned ("forge" design system)

Design system: primary **forge violet #5b4fd6** + amber accent, Space Grotesk (display) / Inter (body) / JetBrains Mono, warm-ink neutrals, `cubic-bezier(0.22,1,0.36,1)` easing, layered shadows, glass surfaces, dark mode via `.dark`, grid canvases, gradient heroes. All animation is CSS-only; reveals use one `IntersectionObserver` per component and everything respects `prefers-reduced-motion`.

- **Foundation**: `tailwind.config.js` (palette, fonts, keyframes, `ease-swift`, shadows) + `index.css` (tokens, dark tokens, `sf-input/sf-card/sf-canvas*`, `text-gradient`, `glass`, reveal system, reduced-motion kill switch).
- **Shared components**: Button (+`buttonClasses`/`ButtonLink`, spinner), Modal (focus trap), Toast/Toaster (`role=status`), Badge, Skeleton set, EmptyState, Card family, Input/Textarea/Select (labels, `aria-invalid`, error styling), Reveal, PageTransition, PageSpinner, ConfirmDialog.
- **Auth**: AuthLayout (gradient brand panel, ambient blobs, staggered highlights), Login (DemoAccessPanel, inline errors), Register.
- **DashboardLayout**: animated icon-rail sidebar, separate mobile drawer (backdrop, ESC, scroll lock, closes on nav), sticky glass header, dark toggle, gradient "New site" CTA.
- **Dashboard**: stat cards with gradient icon tiles, real-traffic area chart, quick actions, recent-site cards with hover actions.
- **Websites**: gradient tile headers (deterministic per-site tint), search + status filter, publish-now action.
- **CreateWebsite**: segmented Blank/Template mode control, radio-style template picker with check animation.
- **Templates**: category-tinted cards, hover lift, zooming thumbnails.
- **MediaLibrary**: hover-zoom tiles, upload button with spinner state, select/delete affordances.
- **SiteSettings**: section cards (General/SEO/Theme/Navigation), color swatch picker, danger zone.
- **Submissions**: table with badges, fade-in rows, delete.
- **Team**: gradient initial avatars, role badges, owner-protected row.
- **Analytics**: full rewrite — window stat cards, brand-styled line/bar charts, popular-pages ranking.
- **NotFound**: gradient 404 hero, gradient text, sr-only heading.
- **Landing**: glass sticky nav, hero with gradient + browser mock, 6-feature grid, 3-step how-it-works, CTA band, footer.
- **Editor**: EditorLayout (glass header, viewport pills, undo/redo, live save-status dot, gradient Publish), Editor tab rail, canvas with grid + brand drop-ring, SortableItem hover handle + floating toolbar, LeftPanel (search, palette cards, layers tree), RightPanel (restyled inputs, color/number pickers), ThemePanel (brand defaults, live preview, saved tick), PagesPanel, VersionsPanel.
- **PublicSite**: loading/404/error states restyled; **Preview**: glass chrome + grid canvas.

## 4. Performance

- Route-level code splitting: `React.lazy` for 16 pages + `Suspense`/PageSpinner; layouts stay eager.
- `manualChunks`: `vendor` (react/react-dom/router), `charts` (recharts), `dnd` (@dnd-kit) in `vite.config.js`.
- Fonts: Google Fonts with `preconnect` + `display=swap` in `index.html`; SVG favicon + `theme-color`.
- nginx (`client/nginx.conf`) proxies `/api` + `/uploads` → `backend:5000` (the Docker frontend previously could not reach the API at all) and sets immutable asset caching; the Vite dev server now proxies `/uploads` too.

**Measured (`npm run build:client`)**: previously a single **1,010 kB** JS bundle → now:
- initial `index` chunk **134.43 kB (44.44 kB gzip)** + `vendor` 164.59 kB (53.70 gzip), both loaded eagerly
- `charts` 394.75 kB (107.35 gzip) and `dnd` 50.11 kB (16.59 gzip) load only where used
- ~30 page/component chunks, CSS 58 kB (10 kB gzip)

## 5. Security review

- **Auth**: JWT with bcrypt hashing; server-side RBAC via `requireWebsiteRole` (`owner` > `editor` > `viewer`; editor cannot delete or change settings — verified by a 403 test).
- **Public surface** limited to: register/login, `GET /api/websites/slug/:slug` (published only), `POST /api/analytics/track`, `POST /api/websites/:id/forms/submit`. Everything else requires a token + role check.
- **Demo account** is the only intentional public credential; it holds no admin powers and its values live in `config/demo.js` + seed service. No real secrets are committed — `JWT_SECRET` in docker-compose is an explicitly-labeled placeholder.
- Client-side route guards are convenience only; all authorization is enforced server-side. React escapes rendered user content (no `dangerouslySetInnerHTML` introduced).

Residual risks (not addressed, out of scope): no rate limiting/brute-force protection on auth or public endpoints; placeholder `JWT_SECRET` must be replaced before any real deployment; file upload MIME restrictions should be re-checked server-side before production use.

## 6. Testing & verification (what was actually run)

| Check | Result |
| --- | --- |
| `npm run test:server` (jest, in-memory Mongo) | **29/29 pass** across 5 suites (~12 s) — auth, website CRUD + duplicate + 409 slug clash, RBAC 403, pages, autosave versions, restore, publish snapshot isolation, forms, demo suite (demo login, public slug + draft-404, template seeding, from-template, wrapped `{theme}` body, slug/SEO update, analytics windows) |
| `npm run build:client` (vite production build) | **Passes** — chunk split as reported in §4 |

**Not verified** (stated honestly): no automated browser/E2E tests exist in the project, so visual rendering and interactions were not exercised in a running browser; Docker images/compose were not built or run, so the nginx proxy path is reviewed-but-not-executed; dev servers were not started during this pass.

## 7. Remaining issues / limits

- No browser/E2E or visual-regression coverage (only build + server tests were available and run).
- The `charts` vendor chunk is ~395 kB minified (recharts); it is lazy-loaded but heavy if analytics is opened often.
- Google Fonts load from a CDN — offline, the UI falls back to system fonts.
- Recharts SVG charts inherit limited dark-mode styling; acceptable, flagged for polish.
- Rate limiting and production hardening (secret rotation, upload scanning) remain pre-deployment tasks.
