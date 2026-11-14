# SiteForge — Deployment Guide & Production Checklist

Everything you need to take SiteForge from dev machine to a real deployment.

---

## 1. What you need

| Component | Requirement |
|---|---|
| Node.js | 20+ (backend build/runtime) |
| MongoDB | 7 (Atlas, self-hosted, or the bundled compose service) |
| Reverse proxy | nginx / Caddy / Traefik (TLS + routing) for production |
| Docker (optional) | For the bundled `docker compose` stack |

---

## 2. Deploy options

### Option A — Full stack via Docker (VM)

```powershell
# 1. Set real secrets FIRST (see checklist below)
#    edit docker-compose.yml environment block (JWT_SECRET / ADMIN_PASSWORD)
docker compose up --build -d
# frontend :8080 (nginx proxies /api + /uploads → backend:5000)
# backend  :5000   mongo: 127.0.0.1:27017 (localhost-bound)
```

Put a reverse proxy (Caddy/Traefik/nginx) in front of port 8080 for TLS.

### Option B — Split deploy (typical SaaS setup)

**Backend** (Render/Railway/Fly/EC2):
```bash
npm --prefix server install --omit=dev
node server/src/server.js
```
Env: `MONGO_URI` (Atlas), `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL` (frontend origin), `NODE_ENV=production`, `TRUST_PROXY=1` (if behind the platform's proxy), persistent disk or Cloudinary for uploads.

**Frontend** (Vercel/Netlify/static):
```bash
npm --prefix client install
npm --prefix client run build   # → client/dist
```
Serve `client/dist` with SPA fallback (all paths → index.html) and proxy `/api` + `/uploads` to the backend, or set the backend origin.

### Option C — MongoDB choices
- **Local dev:** install Mongo 7, `mongod`, default `MONGO_URI=mongodb://127.0.0.1:27017/siteforge`.
- **Atlas:** `MONGO_URI=mongodb+srv://<user>:<pass>@cluster/...`
- **Tests:** in-memory (automatic, nothing to install).

### Media storage
- Cloudinary env empty → local disk `server/uploads/` (needs a persistent volume in Docker; ephemeral on PaaS).
- Set `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` → uploads go to Cloudinary (recommended for PaaS).
- S3/R2: implement in `server/src/services/storage.service.js` (interface: `storeFile(file) → {url, publicId, provider}`, `removeStoredFile(doc)`).

---

## 3. Pre-deployment checklist (MANDATORY)

### Secrets
- [ ] **`JWT_SECRET`** — long random value (48+ hex chars). Generate:
  `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
  The server **refuses to boot in production** without a ≥32-char secret or with a known placeholder.
- [ ] **`ADMIN_PASSWORD`** — strong value; known placeholders (`admin1234`, `change-me-before-deploying`, `password`, `123456`, `admin`) are rejected in production boots.
- [ ] **`ADMIN_EMAIL`** — do NOT set it to an address a third party controls; whichever account holds that email is promoted to platform admin at boot.
- [ ] Change/remove the demo account for real deployments: delete the user `demo@siteforge.app` after first boot (its credentials are public by design).

### Network
- [ ] HTTPS via reverse proxy (Helmet sets the other security headers; TLS is the proxy's job).
- [ ] `TRUST_PROXY=1` **only** if the API sits behind exactly one trusted proxy (nginx in compose sets this). Otherwise rate-limit/IP logging can be spoofed via `X-Forwarded-For`.
- [ ] CORS `CLIENT_URL` — exact frontend origin(s), comma-separated. No wildcards with credentials.
- [ ] Do not expose MongoDB publicly (compose binds it to 127.0.0.1; add auth for multi-host setups).
- [ ] If you publish the backend port directly (compose does for dev), remember `TRUST_PROXY=1` makes client-supplied `X-Forwarded-For` trusted — acceptable locally, behind a real proxy, but not with a directly-exposed API on a public host.

### Data safety
- [ ] MongoDB backups (Atlas auto-backup or `mongodump` cron).
- [ ] Uploads volume backed up if using local storage.
- [ ] `npm --prefix server test` passes (39 tests, in-memory Mongo, no DB needed).

### Ops
- [ ] `GET /healthz` and `GET /api/health` wired to the load balancer/uptime monitor (exempt from rate limiting).
- [ ] Logs: Morgan `combined` in production; container stdout → log drain.
- [ ] Set `NODE_ENV=production` (enables: secure error messages, boot guards, gzip already on).

---

## 4. Security posture (what's built in)

| Layer | Implementation |
|---|---|
| Passwords | bcrypt (12 rounds register / 10 seeds), min 8 chars, timing-equalized login |
| Sessions | JWT (default 7d) via `Authorization: Bearer`; role resolved live from DB on every request |
| Rate limits | auth 25/15min (successes excluded) · form submit 30/15min · track 300/15min · global API 500/15min · health exempt (all skipped under test env) |
| Uploads | extension allowlist (jpg/png/gif/webp), extension derived from declared mime, **magic-byte content verification**, 5 MB cap, files unlinked on any authz/validation failure |
| Injection | query-object stripping middleware, escaped `$regex` searches, zod validation on every write, explicit field copies (no mass assignment) |
| Tenancy | `requireWebsiteRole` on every site-scoped route; version aliases require `pageId` + website ownership check; public surface limited to 4 endpoints |
| Headers | Helmet (+CORP cross-origin for uploads) |
| Errors | Generic 500 messages in production; no stack/value echoes |

Residual risks (documented, out of MVP scope): no password reset/account lockout; JWTs can't be revoked before expiry; no brute-force lockout beyond rate limiting; no virus scanning of uploads; MongoDB auth not enforced in the bundled compose (dev convenience).

---

## 5. Post-deploy verification

```powershell
# 1. Health
curl https://api.example.com/healthz

# 2. Register an admin-adjacent sanity account, create a site, publish, open /site/<slug>
# 3. Login as admin → /admin → stats load
# 4. Upload an image (jpg) → appears in /uploads and the media library
# 5. Try uploading a .html renamed to .png → must be rejected (INVALID_FILE_CONTENT)
# 6. Hammer /api/auth/login with a wrong password 30× → 429 RATE_LIMITED
# 7. Verify gzip: response headers include Content-Encoding: gzip on JSON APIs
```

---

## 6. Updating

- Migrations: none (Mongoose auto-applies schema defaults on next write; new indexes build on boot).
- Template reseeds are scoped to seeded rows (`isSeeded: true`) — user-created public templates survive version bumps.
- Seed failures **crash production boots** by design (fail fast) and only warn in dev.
