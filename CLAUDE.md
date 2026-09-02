# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

MapleBenefits is a free, private, non-commercial web app that helps people in
Canada find government benefits they may qualify for, estimate the value, and
learn how to apply. It is a fully static site (no server runtime) deployed to
Cloudflare Pages.

## Commands

```bash
npm install
npm run dev        # next dev — http://localhost:3000
npm run build      # static export to ./out (output: "export")
npm start          # serve a production build
npm run lint       # eslint (flat config, eslint.config.mjs)
npm test           # vitest run — all *.test.ts

npx vitest run src/lib/checks.test.ts        # one test file
npx vitest run -t "gateway"                  # tests matching a name
npx vitest                                   # watch mode
```

Deploy (static): `npm run build` then
`npx wrangler pages deploy out --project-name=maplebenefits --branch=main`.

## Static-export constraints

`next.config.ts` sets `output: "export"`, `trailingSlash: true`,
`images.unoptimized`. There is no server at runtime. Do not add API routes,
Route Handlers, Server Actions, middleware, or `next/image` optimization. Every
dynamic route must be statically generatable — `/benefits/[id]` supplies
`generateStaticParams` over the benefit registry.

## Architecture

The core is a **pure, auditable eligibility engine**. Each benefit is a
function `check(context) -> { status, confidence, reasons, missing }`. No black
boxes — every result lists the reasons behind it.

Data flow: master intake question -> `AssessmentContext` -> each benefit's
`check` -> `EvalResult` (with amount estimate) -> sorted dashboard.

Key modules:
- `src/types/benefit.ts` — all domain types (`Benefit`, `AssessmentContext`,
  `CheckResult`, `AmountEstimate`, `LocalizedString`, category/level enums).
- `src/lib/checks.ts` — small rule DSL. Rules are **hard** (firm requirement)
  or **soft** (positive signal). Predicates return `pass | fail | unknown`.
  Status logic: any hard fail -> `ineligible`; any hard unknown (none failed)
  -> `need-more-info`; all hard pass -> `eligible`.
- `src/lib/engine.ts` — `evaluate` (runs a check, attaches
  `estimateAmount`), `assessAll` (runs every benefit and sorts: status group,
  then **gateway** benefits that others list as `prerequisites` float up, then
  higher annualized midpoint value), `actionableResults` (drops ineligible).
- `src/data/intake.ts` — the single shared master intake, one question per
  context field, with skip-logic. The full assessment asks every relevant
  question once; a single-benefit check asks only that benefit's
  `contextFields`.
- `src/data/benefits/*.ts` — benefit definitions grouped by region
  (federal-*, bc-*, ontario, alberta, manitoba, saskatchewan, nova-scotia,
  new-brunswick, pei, newfoundland). `index.ts` is the registry: it
  concatenates them into `BENEFITS`, exposes `ACTIVE_BENEFITS` (non
  `discontinued`), and `getBenefit`/`getBenefits` by id. 75 benefits today.
- `src/data/deep-content.ts` — richer per-benefit prose, keyed by benefit id,
  rendered as collapsible sections on the benefit page.
- `src/store/assessment.ts` — Zustand store persisted to **sessionStorage
  only** (key `mb.assessment`). Answers never leave the browser and clear when
  the tab session ends. This privacy property is a core product promise.
- `src/app/` — App Router pages: `/`, `/benefits`, `/benefits/[id]`,
  `/assess`, `/assess/results`, `/about`, plus `sitemap.ts`, `robots.ts`,
  `opengraph-image.tsx`.
- `src/config/site.ts` — app name, tagline, `benefitCount`. Rename the app by
  changing `SITE_NAME` here or setting `NEXT_PUBLIC_SITE_NAME` at build time;
  no component hard-codes the name.

## Internationalization

Every user-facing string is a `LocalizedString` (`string` or
`{ en, "zh-Hant"?, "zh-Hans"? }`). Build one with `tri(en, hant, hans)` from
`src/data/tri.ts`. `resolve()` in `src/i18n/locale.ts` renders it for the
active locale and **falls back to English** when a translation is missing (it
never throws). Locales: `en`, `zh-Hant`, `zh-Hans`. `LocaleProvider` +
`dictionaries.ts` cover UI chrome; benefit data carries its own translations.

## Conventions

- Path alias `@/*` -> `./src/*` (tsconfig + vitest). TypeScript is strict.
- Adding a benefit: add it to the right region file, then register the array in
  `src/data/benefits/index.ts` (import + spread). Declare its `contextFields`,
  an optional `estimateAmount`, and any `prerequisites`. Add deep content in
  `deep-content.ts`. Keep `SITE.benefitCount` in sync.
- Data accuracy: figures are verified against official federal / provincial
  sources — see `docs/research-notes.md`. Each benefit carries `lastUpdated`;
  pages warn when data is older than 6 months. Discontinued programs (Canada
  Carbon Rebate, BC Climate Action Tax Credit) are shown as "Ended", not as
  something to apply for. Set `discontinued` rather than deleting them.
- Tests live beside code as `*.test.ts` (node environment). The engine, the
  check DSL, and per-region scenario tests (`src/data/benefits.test.ts`) are
  the safety net — run them after any change to rules, estimates, or data.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
