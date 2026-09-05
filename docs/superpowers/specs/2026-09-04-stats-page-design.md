# /stats analytics page — design

Date: 2026-09-04

## Goal

A single, password-gated `/stats` page showing: daily + all-time traffic,
visitor geography, questionnaire completion rate, and the most-viewed
benefit pages. Modeled on a much larger version already built for
`~/Developer/quirky` (Cloudflare Pages Function + KV counter), trimmed down.

## Constraint: privacy promise

The homepage (`src/i18n/dictionaries.ts`, `home.trustPrivacy`) states in all
three locales: "Your answers never leave your browser. No account, no
tracking." Decision (confirmed with the product owner): this copy stays
as-is. The tracking added here records **no PII, no per-visitor identifier,
and no assessment answer content** — only anonymous aggregate counts
(a pageview path, and a one-time completion signal). That is judged
consistent with the promise as intended (no tracking of *who you are* or
*what you answered*).

## Events

Exactly two, no client-side ID of any kind (not even an anonymous one):

- `pageview { path }` — fired once per route, from a client component
  (`src/components/Analytics.tsx`) watching `usePathname()`, mounted once in
  `src/app/layout.tsx`.
- `assess_completed {}` — fired once, alongside the existing
  `setCompleted(true)` call in `src/app/assess/page.tsx`.

Both are sent via `navigator.sendBeacon` (fetch-with-keepalive fallback) to
a Cloudflare Pages Function at `/track`. "Most-viewed benefit" and
"questionnaire completion rate" are both derived from the same `pageview`
stream server-side — no extra event types:

- a path matching `/benefits/<id>/` increments a per-benefit counter
- a path matching `/assess/` increments an "assess started" counter,
  compared against the `assess_completed` counter for a completion %

## Storage

One Cloudflare KV namespace, two key shapes (same pattern as quirky):

- `agg:all` — running totals: `{ visits, geo: {...}, benefits: {...}, assessStarted, assessCompleted }`
- `agg:d:<YYYY-MM-DD>` — same shape, scoped to one day, ~120-day TTL, used
  for "today" numbers

Geography is Cloudflare's own edge geo (`request.cf.country` /
`request.cf.region`) — the request IP itself is never read or stored.
Distinct geo keys are capped (as in quirky) to bound blob growth.

## Components

- `functions/lib/aggregate.js` — pure, framework-free functions: parse a
  path into a benefit id or "assess" marker, merge an event into a day/all
  blob, compute completion %. Unit-tested with vitest, no KV/Workers runtime
  needed to test it.
- `functions/track.js` — Cloudflare Pages Function, `onRequestPost`. Reads
  the two KV blobs, calls into `aggregate.js`, writes them back. Best-effort:
  wrapped in try/catch, never throws, degrades to a no-op if `STATS` KV
  binding is absent.
- `functions/stats.js` — Cloudflare Pages Function, `onRequestGet`. Gated by
  `?key=` matching `env.STATS_KEY` (404 otherwise). Reads `agg:all` and
  today's `agg:d:<date>`, server-renders a plain HTML page (no client JS,
  no build step): all-time + today visits, geo breakdown, assess funnel
  (started/completed/%), top 10 benefits by views.
- `src/lib/analytics.ts` — tiny client beacon helper (`track(event, data)`).
- `src/components/Analytics.tsx` — mounts once in `layout.tsx`, fires
  `pageview` on path change.
- One-line addition in `src/app/assess/page.tsx` firing `assess_completed`.

Explicitly out of scope (cut from quirky's version for simplicity): daily
history chart, auto-refresh, referrer/channel breakdown, Mixpanel/Loki
fan-out, per-visitor identifiers.

## Open risk, to resolve during implementation

Quirky's `functions/` directory sits at its repo root and deploys via
`wrangler pages deploy .`. This repo deploys `out/` (the Next static
export), not the repo root, via
`npx wrangler pages deploy out --project-name=maplebenefits --branch=main`.
Need to confirm whether Cloudflare Pages Functions require `functions/` to
live inside the deployed directory (`out/functions/`, populated by a
post-build copy step) or whether wrangler supports an external functions
path — verify against Cloudflare's docs before wiring the deploy step.

## Testing

- Vitest unit tests for `functions/lib/aggregate.js` (pure logic): path
  parsing, blob merging, completion-rate math.
- Manual verification after deploy: `curl` the `/track` endpoint and confirm
  KV counters increment; load `/stats?key=...` and confirm rendering; load
  `/stats` without the key and confirm 404.
