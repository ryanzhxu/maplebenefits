# MapleBenefits 🍁

A free, private, non-commercial web app that helps people in Canada discover
government benefits they may be eligible for, estimate the value, and learn how
to apply. Covers **federal + British Columbia** benefits (29 in total).

Live: https://maplebenefits.pages.dev

> General guidance only — not legal, financial, or tax advice. Not affiliated
> with any government. Every benefit links to its official source.

## What it does

- **Find what you qualify for** — a guided questionnaire (asked once), then a
  results dashboard of every benefit you may qualify for, sorted by estimated
  dollar value, with plain-language reasons and step-by-step how-to-apply
  instructions. A printable action plan is included.
- **Browse** — search and filter all 29 benefits by category and level.
- **Check a single benefit** — a focused eligibility check on any benefit page.
- **Multiple languages** — English, Traditional Chinese, and Simplified
  Chinese throughout, with a language switcher. French and Punjabi are
  rolling out benefit by benefit (the Canada Child Benefit is translated so
  far); other content and the app's own interface fall back to English
  until translated.
- **Private by design** — no sign-up, no cookies, no tracking of answers. All
  assessment data stays in the browser session.

## Rename the app

The name lives in one place: `src/config/site.ts` (or set
`NEXT_PUBLIC_SITE_NAME` at build time). No component hard-codes it.

## Tech

- Next.js 16 (App Router), TypeScript strict, Tailwind CSS v4, React 19
- Zustand for assessment state (persisted to `sessionStorage` only)
- Static export (`output: "export"`), deployed to Cloudflare Pages
- Vitest for the rule engine and scenario tests

## Architecture

```
src/config/site.ts          App name, tagline, links (rename here)
src/types/benefit.ts        Domain types (Benefit, CheckResult, AssessmentContext…)
src/i18n/                    Locale resolver, dictionaries (en / zh-Hant / zh-Hans), provider
src/lib/checks.ts           Small DSL for building eligibility checks
src/lib/engine.ts           Pure rule engine: evaluate / assessAll
src/lib/estimate helpers    Amount estimators (in each benefit file)
src/data/intake.ts          Shared master intake questionnaire
src/data/benefits/*.ts      29 benefits, grouped by category; index.ts is the registry
src/components/              Header, Footer, cards, badges, question input, results
src/app/                     Pages: / , /benefits , /benefits/[id] , /assess , /assess/results , /about
docs/research-notes.md       Verified 2025-26 figures + official source URLs
docs/superpowers/specs/      Design spec
```

### Eligibility model

Each benefit is a **pure function** `check(context) -> { status, confidence,
reasons, missing }`. There is one shared master intake (one question per context
field). The full assessment answers every relevant question once and runs every
benefit's `check`. A single-benefit check asks only the fields that benefit
declares in `contextFields`. Every result lists its reasons — no black boxes.

## Develop

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # vitest
npm run build      # static export to ./out
```

## Deploy (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy out --project-name=maplebenefits --branch=main
```

## Data accuracy

All figures were verified against official Government of Canada and Government
of British Columbia sources on 2026-09-01 (see `docs/research-notes.md`). Each
benefit carries a `lastUpdated` date; pages show a warning if data is older than
6 months. The Canada Carbon Rebate and BC Climate Action Tax Credit ended in
April 2025 and are shown as "Ended" rather than as something to apply for.
