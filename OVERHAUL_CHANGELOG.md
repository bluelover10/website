 # SiteForge — Overhaul Changelog (Nov 2026)

Full quality, security, UX and performance pass over the entire project: server, client, all user roles (owner / editor / viewer / platform admin / public visitors), all breakpoints (mobile 375 / tablet 768 / laptop 1280+).

Baseline → result: **39/39 server tests pass**, client production build passes.

---

## 1. Server security (all endpoints)

**Critical fixes**
- **JWT secret validation at boot** — the server refuses to start in production without a ≥32-char secret (or with a known placeholder); in dev it generates an ephemeral secret with a loud warning. Placeholder `change-me-to-a-long-random-string` can no longer silently ship.
- **Cross-tenant version leak** — `GET /api/versions` with a missing `pageId` produced an *empty Mongo filter* matching every page's versions. `pageId` is now mandatory and pages are verified to belong to the website.
- **Upload content verification** — declared MIME type is client-controlled; files are now magic-byte sniffed (jpg/png/gif/webp), the extension is derived from the verified type (never the original filename), and the temp file is deleted on any failed role check or content check. 5 MB limit enforced by multer with proper 413 mapping.
- **NoSQL injection hardening** — query-object stripping middleware (`?search[$ne]=x`), escaped `$regex` searches (ReDoS / operator injection), `formId` restricted to a safe token shape.
- **`publishedContent` write path removed** from the page update API — publish snapshots are publish-flow-managed only (draft/published isolation).

**High**
- Rate limiters: auth 25/15min (successes excluded) · public form submit 30/15min · analytics track 300/15min · global API 500/15min · health exempt · all skipped under `NODE_ENV=test`.
- Login timing equalization: bcrypt compare against a dummy hash when the email doesn't exist (anti account-enumeration). bcrypt rounds 12 on register.
- Production-safe errors: generic 500 messages, no stack/raw-value echoes; Multer errors mapped to 4xx.
- Password policy min 8 chars; `avatar` validator no longer accepts arbitrary strings via a defeated `.url().or()`.
- Analytics `track` payload clamped field-by-field (no more verbatim `req.body` writes); form submissions no longer hand spoofable IP/user-agent back to the submitter.
- Template reseeding scoped to seeded rows (`isSeeded: true`) — user-created public templates survive reseed. Seeded admin refuses known placeholder passwords in production.
- `TRUST_PROXY` env-gated (was unconditionally trusting `X-Forwarded-For`).

**Performance & data integrity**
- `compression` (gzip) enabled; Morgan `combined` in prod.
- Model indexes: `Website.updatedAt` (dashboard sort), `User.createdAt` (admin list), `AnalyticsEvent(type, createdAt)` (platform stats).
- Media files cleaned up on website deletion (local disk + Cloudinary) and on failed DB writes.
- `publishedSnapshot` stripped from `getWebsite` responses (large internal blob).

**Deploy config** — `docker-compose.yml`: Mongo bound to 127.0.0.1, `TRUST_PROXY=1`, CORS origins, placeholder warnings. See **DEPLOYMENT.md** for the full production checklist.

## 2. Editor data-loss & correctness (owner/editor)

- **Autosave race eliminated** — module-scoped serialized save chain; edits made during an in-flight PUT are no longer marked "saved" and dropped; 4s retry after failures; deduped error toasts; `flushAutosave` live export for imperative callers.
- **Publish flushes first** — Publish now awaits the autosave flush so the published snapshot contains the latest edits; Back/Preview flush too; `beforeunload` guard when dirty.
- **Undo/redo correctness** — per-keystroke history coalescing (700ms window; typing 50 chars ≈ 1-3 entries instead of 50); clone-on-set everywhere; `resetHistoryCoalesce` at every branching action; single deep-clone pass per `updateNode` (2× clone + history per keystroke removed).
- **Page switching fetches fresh content** (was rendering stale list-cached content); deleting the active page selects the first remaining page; reorder rolls back to server truth on failure.
- **Version restore divergence fixed** — unsaved edits are flushed before the pre-restore snapshot; after restore the page detail is re-fetched so canvas === server; stale-canvas warning if the refetch fails.
- Undo/Redo buttons disable with history state; viewport choice persists across sessions.

## 3. Editor UX & mobile (owner/editor)

- **Editor works on mobile now** — below `lg` the left rail and right inspector became overlay drawers (44px FABs, backdrop, Escape to close); previously the canvas was squeezed to ~87px and block properties were unreachable <1024px.
- Touch drag: `TouchSensor` (180ms hold / 8px tolerance) so page scrolling isn't hijacked; drag handle always rendered + focusable with `touch-none`.
- Palette drops resolve the nearest valid container (no more invisible children inside leaf nodes); removed lying flat-list transform strategy.
- Keyboard: typing guard moved before the mod+z branches — native text undo works in property inputs; Ctrl+C/V/D and Delete respect text fields.
- Floating toolbar/drag handle no longer clipped by the canvas card; visible when selected.
- Header responsive at 375px: truncated title, icon-only Preview/Publish labels, viewport pills always visible, compact save-status dot on mobile.

## 4. Public visitor experience (published sites)

- **Navbar hamburger menu on mobile** (was: no navigation at all <768px) with backdrop + close-on-select.
- **Internal links navigate client-side** — `?page=slug` full-page-reload links (Navbar/Hero/Footer/buttons) now resolve against the site's pages and use router navigation; external URLs get `target=_blank rel=noopener`; anchors don't scroll-jump in edit mode.
- **Dark-theme correctness** — hardcoded white cards / slate text replaced with `color-mix` theme-aware values across Cards, FeatureGrid, Testimonials, Pricing, FAQ, ContactForm, Section, Divider (dark-themed sites no longer render white boxes).
- **Mobile grids collapse** — `minmax(max(220px, calc(100%/N)), 1fr)` for FeatureGrid/Gallery instead of ~100px phone cards.
- Image/Video: aspect-ratio wrappers (CLS), lazy+async loading, per-image error fallback tiles, empty-video placeholder (also removed the rickroll default), lazy iframes.
- Contact form: aria-labels, `role=alert`/`role=status`, status resets when typing resumes, submit blocked in edit mode.
- FAQ: proper accordion ARIA (`aria-expanded`/`aria-controls`/`role=region`).
- SEO: `og:image` + `twitter:card` when configured; favicon/title restored when navigating back into the app; analytics double-tracking guarded under StrictMode.

## 5. Dashboard & shared UI (all user types)

- **401 handling fixed** — api layer dispatches `siteforge:unauthorized`, authStore logs out, ProtectedRoute redirects (was: stuck "logged in" with every request failing).
- Friendly timeout/network error messages in the shared api layer.
- **Error + retry states** on Dashboard, Websites, Templates, Submissions, Team, MediaLibrary, SiteSettings, AdminUsers, AdminWebsites (previously swallowed fetch errors rendered false "empty" screens).
- **Destructive actions confirm** — Submissions delete, Team remove, Media delete (promise-based `askConfirm`, overlap-safe), busy states.
- Dashboard site cards expose the hidden feature routes (Submissions / Analytics / Team / Settings icon links).
- MediaLibrary: upload progress %, client-side 5MB guard, sequential multi-file uploads, 120s upload timeout (was 15s), 40px touch targets.
- Submissions: readable field chips instead of raw JSON, mobile card layout below `md`.
- Modal: viewport-height scroll + safe-area + focus restore; Toasts: `role=region`/`status`/`alert` + safe-area; ThemeProvider restores document CSS vars on unmount (site brand color no longer pollutes the whole app); ConfirmDialog busy state.
- RightPanel: usable JSON editors (draft-local `JsonField`, inline "Invalid JSON" errors instead of snap-back), valid label nesting, contrast fix.
- ThemePanel: debounced (500ms) serialized theme saves with error toasts (was a PATCH per keystroke); DM Sans + Poppins actually loaded in index.html.
- DashboardLayout: narrow store selectors (no whole-store subscriptions), mobile drawer focus trap + focus restore + `inert` content.
- Charts (Analytics + Dashboard): dark-mode tooltips.
- AdminUsers: role-select revert-on-cancel, normalized self-id comparison, error state.
- Routes: layout-preserving Suspense (layout stays mounted while lazy pages load); 4 dead files removed (`useDebounce`, `useWebsites`, `useAuth`, `PageTransition`).
- Register navigates with `replace:true`; slug utility falls back for non-Latin input and never re-exposes trailing dashes.

## 6. Verification

- `npm run test:server` → **39/39 pass** (in-memory Mongo).
- `npm run build:client` → pass; lazy chunks per page, vendor/charts split intact.
