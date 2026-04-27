# SECURITY.md

Pre-launch security review for `ms-mule-income-tracker`. Captures the threat
model, the chosen mitigations, and the step-by-step actions to ship before the
app is opened to public users.

## Architecture in one paragraph

Anonymous, single-user, browser-local SPA (state lives in `localStorage` —
no accounts, no backend DB). One Cloudflare Worker endpoint
(`worker/src/worker.ts`) at `GET /api/character/:name?worldId=…` proxies to
Nexon's no-auth ranking API and caches success responses for 6h, 404s for 1h.
The SPA is served from a self-hosted VPS (Docker → Caddy → nginx) and `/api/*`
is reverse-proxied through nginx to `*.workers.dev`. Avatar URLs from Nexon are
rendered directly into `<img src>` (`src/components/CharacterAvatar.tsx:77`).

## Threat model

Four concerns, in priority order:

1. **(a) Cost / quota burn.** An attacker iterates random `name` values to
   defeat the 6h cache, forcing 1:1 Worker→Nexon fanout. Outcomes: Cloudflare
   Workers free-tier blown, Nexon rate-limits or bans the Worker IP/account
   and the lookup feature dies for every legit user. Likeliest to materialize.
2. **(c) Abuse-as-proxy.** The Worker becomes a free, anonymous Nexon-ranking
   API for someone else's bot. Same root cause as (a); fixing (a) substantially
   addresses this.
3. **(d) ToS / reputation.** Unattended scraping with a generic
   `User-Agent` is exactly the traffic shape Nexon would block first.
4. **(b) Service availability.** If (a) is contained, the Worker stays healthy.

One mitigation stack — rate limit + origin gate + input validation +
self-identification — collapses (a), (b), (c) together. (d) is one extra
header.

## Pre-flight: the false alarm

A recon pass flagged `.sandcastle/.env` as containing live OAuth tokens checked
into the repo. **Verified false positive.** The file exists locally but is
gitignored via `.sandcastle/.gitignore` and has never been committed. No
action required.

---

## Decisions

### 1. Rate limit at Caddy on the VPS

**Concern.** The Worker has no rate limit. A simple `curl` loop with random
names defeats the cache and triggers unlimited Nexon round-trips.

**Decision.** Cap `/api/*` at **30 requests/minute/IP** at Caddy, return 429.

**Why this layer.** Traffic flows browser → Caddy → nginx → workers.dev. The
_real client IP_ is the connection IP only at Caddy. Rate-limiting at
Cloudflare's WAF on `workers.dev` would lump every legitimate user into one
bucket (your VPS's outbound IP) while giving direct attackers their own
bucket — exactly backwards. Rate-limiting at Caddy avoids any header-forwarding
gymnastics, and rejected requests never leave your VPS, so they don't burn
Worker requests either.

**Why 30/min.** Far above what a legit user does (<5/min in practice), far
below what an attacker needs to do real damage. Tunable later from telemetry.

### 2. Lock the Worker behind a shared-secret header

**Concern.** Even with Caddy rate-limiting, the Worker is publicly callable at
`https://ms-mule-income-tracker-worker.mules-henesys.workers.dev/api/...`.
Attackers bypass the VPS entirely and the rate limit doesn't apply.

**Decision.** nginx attaches `X-Proxy-Auth: <secret>` to every proxied call;
the Worker rejects requests without the matching secret with **404** (not
401 — 404 reveals less about whether the route exists).

**Why shared secret over alternatives.**

- Origin/Referer header check is forgeable with `curl -H` and only blocks
  lazy-browser-driven abuse.
- Cloudflare Access / mTLS is a paid SKU and overkill for one internal hop.
- IP allowlisting re-couples the Worker to your VPS's outbound IP.

A shared secret is ~15 lines total, recoverable in seconds (`wrangler secret
put` + redeploy nginx), and makes the Worker effectively private without
paying for Access.

**Repo-is-public tripwire.** The secret value must come from an env var
injected at build/run time — never committed to `nginx.conf`.

### 3. Validate `name` input, cache the 400

**Concern.** No length cap or charset check on `name`. Random Unicode
guarantees a cache miss every time → Nexon call. Long names produce log
noise and unbounded upstream payloads. Repeat invalid names re-run the
Worker on every hit instead of being served from cache.

**Decision.**

- Regex `/^[A-Za-z0-9]{2,13}$/` (matches MapleStory NA name rules). Reject
  with `400 invalid-name` before any cache or Nexon call.
- Return the 400 with `cache-control: public, max-age=3600` and `cache.put`
  it, so repeat junk from the same attacker becomes a CF cache hit.

**Why not broader Unicode.** Worlds in scope are NA/EU only per
`worker/src/worldIdMap.ts`. Relax later if scope expands.

**What this isn't.** Charset validation does not meaningfully shrink the
attacker's search space (62¹³ ≈ 2 quadrillion names is plenty to defeat the
cache). The real defense against unique-name flooding is the Caddy rate
limit. Input validation is the cheap belt-and-suspenders that short-circuits
malformed requests before Nexon and prevents log/cache poisoning.

### 4. Security headers on the SPA (CSP + companions)

**Concern.** `nginx.conf` sets zero security headers. `<img>`, `<script>`,
and `<iframe>` boundaries are wide open. A compromised Nexon CDN could be
used to render attacker-chosen URLs into `<img>` (low XSS risk, real
tracking-pixel / referrer-leak risk).

**Decision.** Add the following to `nginx.conf` (per-app, version-controlled):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://msavatar1.nexon.net https://nxfs.nexon.com;
  connect-src 'self';
  font-src 'self' data:;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  object-src 'none';

Strict-Transport-Security: max-age=63072000; includeSubDomains
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

**Why these choices.**

- `script-src 'self'` (no `'unsafe-inline'`) — Vite bundles everything; no
  inline scripts. Most important rule.
- `style-src 'self' 'unsafe-inline'` — React's `style={{}}` props compile to
  `style=""` attributes, which CSP counts as inline. Unavoidable for this
  stack without a nonce setup.
- `img-src` is the browser-enforced avatar allowlist — defense in depth
  against an upstream Nexon compromise.
- `connect-src 'self'` — all `fetch` is same-origin via the nginx proxy.
- `frame-ancestors 'none'` replaces `X-Frame-Options: DENY`.

**Why nginx, not Caddy.** Headers are app-specific (the Nexon hosts in
`img-src` are unique to this app), so they belong in app config, not the
host-level Caddyfile. Travels with the app if you ever migrate off Caddy.

**Pre-launch verification.** Build, serve, click through every screen with
DevTools open. Any `Refused to load …` console errors mean a CSP rule needs
adjustment.

### 5. Identify yourself to Nexon

**Concern.** `worker/src/nexonAdapter.ts:85` calls `fetch(url)` with no
custom headers. Your traffic is indistinguishable from any other scraper.
Nexon's ops team has no contact channel and you'd be collateral in any
anti-bot crackdown.

**Decision.** Set a self-identifying `User-Agent` on the outbound call:

```
User-Agent: ms-mule-income-tracker/1.0 (+https://github.com/hsukidev/ms-mule-income-tracker)
```

**Why repo URL, not email.** The repo is already public; GitHub issues are
a public, non-PII, low-spam contact channel. Email gets harvested.

**What this won't do.** Won't prevent a blanket Nexon ban on no-auth
scraping — but it makes you a recognizable, contactable integration if they
ever want to reach out instead of just blocking.

### 6. Telemetry — know if any of this is working

**Concern.** Without observability, every defense above is write-only. The
two questions you actually have at launch are "is the free tier melting?"
and "is the lookup feature broken?"

**Decision.** Logs + Cloudflare usage alert.

- Caddy access log persisted to a Docker volume (so container restarts
  don't lose history).
- Cloudflare Workers usage alert via the dashboard at ~50% of free tier
  (50k req/day) — emails you when crossed.
- Structured `console.log` lines at the three Worker rejection branches:
  `invalid-name`, `proxy-auth-fail`, `upstream-failed`. JSON-formatted so
  they're greppable. **Truncate `name` to 20 chars in logs** — full
  attacker-controlled names risk log injection / disk fill.

**Why not Sentry / Analytics Engine yet.** Add when traffic justifies a
dashboard. At launch, weekly log review is enough.

**Operational runbook — practice once before launch.** Rotating the worker
secret should be a 60-second operation:

1. `openssl rand -hex 32` — new secret
2. `wrangler secret put PROXY_SECRET` — paste new value
3. Update VPS env var, `docker compose up -d` — nginx restarts with new value

---

## Action checklist

Order matters: items earlier on the list don't depend on later ones, but
later items reference earlier ones (e.g. the Worker logging in #6 covers the
secret rejection branch added in #2).

### 1. Caddy rate limit

- [ ] Install the `caddyserver/caddy-ratelimit` plugin in your Caddy build
      (or switch to a Caddy image that includes it).
- [ ] Add a rate-limit block to the Caddyfile for the `/api/*` path:
      `30r/m` per `{remote_host}`, action: respond with `429`.
- [ ] `caddy reload` and verify with `for i in {1..50}; do curl -s -o
  /dev/null -w "%{http_code}\n" https://your-host/api/character/test?worldId=…; done`
      — the last requests in the burst should return 429.

### 2. Worker shared-secret gate

- [ ] Generate a secret: `openssl rand -hex 32`.
- [ ] `cd worker && wrangler secret put PROXY_SECRET` — paste the value.
- [ ] In `worker/src/worker.ts`, add at the top of `handleLookup` (before the
      route match at line 64):
      `ts
  if (request.headers.get('x-proxy-auth') !== env.PROXY_SECRET) {
    return jsonResponse(404, { error: 'not-found', message: 'route not found' });
  }
  `
      Update the `fetch` handler signature to receive `env`:
      `fetch(request: Request, env: { PROXY_SECRET: string }): Promise<Response>`
      and pass `env` to `handleLookup`. Add `PROXY_SECRET` to a new
      `Env` interface; pass it through `HandlerDeps` so tests can inject.
- [ ] In `nginx.conf`, inside `location /api/`:
      `proxy_set_header X-Proxy-Auth $proxy_secret;`
      and read `$proxy_secret` from an env var via the nginx `envsubst`
      template pattern at container start. **Do not commit the value.**
- [ ] In your Docker / compose config, plumb `PROXY_SECRET` from a
      `.env` file (gitignored) or GitHub Actions secret into the nginx
      container.
- [ ] Verify: `curl https://*.workers.dev/api/character/foo?worldId=…`
      should return `404` (no header), while traffic through your domain
      should still work.

### 3. Input validation + cached 400

- [ ] In `worker/src/worker.ts`, after `decodeURIComponent` at line 68:
      ``ts
  if (!/^[A-Za-z0-9]{2,13}$/.test(name)) {
    const res = jsonResponse(
      400,
      { error: 'invalid-name', message: 'name must be 2–13 alphanumeric chars' },
      { 'cache-control': `public, max-age=3600` },
    );
    if (cache) await cache.put(request, res.clone());
    return res;
  }
  ``
- [ ] Note: this lives _after_ the cache lookup, so repeat junk from the
      same URL gets served from cache without re-running validation.
      (Move it before `cache.match` only if you want validation to run on
      every cache hit — not necessary.)
- [ ] Add a unit test in `worker/src/worker.test.ts` covering: rejects
      invalid charset, rejects too-short, rejects too-long, accepts valid.

### 4. Security headers in nginx

- [ ] In `nginx.conf` `server { … }` block (outside any `location`), add:
      `     add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://msavatar1.nexon.net https://nxfs.nexon.com; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" always;
  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()" always;
  `
- [ ] Build, run locally, click through every screen with DevTools Console
      open. Resolve any `Refused to load …` violations by either fixing the
      offending code or relaxing the specific directive.
- [ ] Verify in prod with `curl -I https://your-host/` — all headers should
      appear in the response.

### 5. User-Agent on Nexon calls

- [ ] In `worker/src/nexonAdapter.ts:85`, replace `await fetch(url)` with:
      `ts
  response = await fetch(url, {
    headers: {
      'user-agent': 'ms-mule-income-tracker/1.0 (+https://github.com/hsukidev/ms-mule-income-tracker)',
    },
  });
  `
- [ ] Update or add an adapter test that asserts the `user-agent` header
      is sent.

### 6. Telemetry

- [ ] Confirm Caddy access logs are written to a mounted volume in
      `docker-compose.yml`, not just stdout. Logs should survive a
      container restart.
- [ ] In the Cloudflare dashboard, set a Workers usage alert at 50% of
      the free tier (50,000 requests/day). Emails go to your account email.
- [ ] In `worker/src/worker.ts`, add structured logs at the three rejection
      branches:
      `ts
  // After proxy-auth check
  console.log(JSON.stringify({ event: 'proxy-auth-fail' }));
  // After invalid-name check
  console.log(JSON.stringify({ event: 'invalid-name', name: name.slice(0, 20) }));
  // In the catch block at line 126
  console.log(JSON.stringify({ event: 'upstream-failed', status: err instanceof UpstreamError ? err.status : undefined }));
  `
- [ ] Practice the secret-rotation runbook once on staging:
      `openssl rand -hex 32` → `wrangler secret put PROXY_SECRET` →
      update VPS env var → `docker compose up -d` → verify lookup still
      works end-to-end.

---

## Out of scope for this review

Deferred deliberately — flagged for a future pass:

- **Worker-level token bucket** (Durable Object / KV-based) keyed on
  cache misses only. Add if Caddy's coarse 30/min/IP proves insufficient
  in telemetry.
- **`localStorage` schema validation on read**. Migration logic in
  `src/persistence/muleMigrate.ts` handles known shapes; no hard runtime
  validation against arbitrary devtools-pasted JSON. Low risk for a
  single-user local-first app.
- **Outbound `characterImgURL` host allowlist in the Worker.** CSP
  `img-src` covers the same ground at the boundary you control.
- **`dangerouslySetInnerHTML` in `src/components/ui/chart.tsx:87`.**
  Reviewed: emits app-controlled CSS variables only, no user input
  reaches it.
- **`npm audit` / dependency hygiene cadence.** Worth a recurring
  weekly review; not gating launch.
- **Sentry / proper APM.** Add when a real user reports an unreproducible
  bug.
