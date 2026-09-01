# MapleBenefits — Design Spec

**Date:** 2026-09-01
**Status:** Approved (autonomous build until 19:00 local)

## Vision

A free, non-commercial web app that helps Canadian residents discover
government benefits they may be eligible for, estimate the value, and learn
exactly how to apply. Goal: maximize the number of Canadians who try the tool
and act on it. Not for commercialization.

Core experience: a deterministic, rule-based eligibility engine with structured
UI. No chatbot, no AI calls, no backend, no database, no auth. All logic runs
client-side.

## Name

Working name **MapleBenefits**. The name is centralized so a rename is a
one-line change:
- `src/config/site.ts` exports `SITE` (name, tagline, urls, description).
- Optional `NEXT_PUBLIC_SITE_NAME` env var overrides the name at build time.
- No component hard-codes the app name.

## Tech Stack

- Next.js 14+ App Router, TypeScript strict.
- Tailwind CSS.
- Zustand for assessment state (persisted to `sessionStorage` only).
- Data as typed TS files. No DB.
- Static export (`output: 'export'`). Deploy to **Cloudflare Pages**.
- Vitest for unit tests (rule engine + amount estimators).

## Architecture

```
src/config/site.ts        Site name, tagline, links. Rename here.
src/types/benefit.ts      Benefit, EligibilityRule, ApplicationStep, AssessmentContext, EvalResult
src/data/benefits/*.ts    29 benefit files, one per benefit
src/data/benefits/index.ts  Registry: all benefits, lookups, categories
src/lib/engine.ts         Pure rule engine: evaluate(benefit, ctx) -> EvalResult
src/lib/estimate.ts       Amount estimators (income-tested benefits)
src/lib/format.ts         Money/date formatting helpers
src/lib/i18n.ts           String table (English now, French-ready)
src/store/assessment.ts   Zustand store for AssessmentContext
src/components/           Stepper, QuestionCard, BenefitCard, ResultCard, Disclaimer, ...
app/                      / , /benefits , /benefits/[id] , /assess , /assess/results , /about
```

### Units and responsibilities

1. **Data layer** — 29 typed `Benefit` objects. Pure data. Each carries an
   official `officialInfoUrl`, optional `applicationUrl`, and `lastUpdated`.
   Accuracy research lands here. No invented figures: unconfirmed numbers are
   shown as ranges or replaced by a link-out.
2. **Rule engine** (`engine.ts`) — pure functions, no side effects.
   `evaluate(benefit, ctx)` walks `eligibilityCriteria`, honoring `skipIf`, and
   returns `{ status, confidence, reasons[], missing[], estimatedAmount? }`.
   Status: `eligible | possible | ineligible | need-more-info`. Fully unit
   tested. Auditable — every result exposes human-readable reasons.
3. **Amount estimators** (`estimate.ts`) — pure functions for income-tested
   benefits (CCB, GST/CGEB, GIS, CWB, Carbon Rebate, BC Family Benefit).
   Return a dollar estimate or a range. Unit tested against published examples.
4. **Assessment flow** (`/assess`) — shared `AssessmentContext` collected once
   via a stepper with skip-logic, progress indicator, mobile-first. Persists to
   sessionStorage only.
5. **Results dashboard** (`/assess/results`) — matched benefits sorted by
   estimated value, dependency chains ("Get DTC first — it unlocks CDB, RDSP,
   PWD"), expandable why-you-qualify + application steps. Printable action plan.
6. **Browse/detail** (`/benefits`, `/benefits/[id]`) — category + level filters,
   search, detail pages with "Check if I qualify" single-benefit flow.

### Data model

Per the prompt: `Benefit`, `EligibilityRule`, `ApplicationStep`,
`AssessmentContext`. Engine output type `EvalResult`. `evaluate` on each rule is
a pure function `(answer, ctx) => "eligible" | "ineligible" | "continue" | "maybe"`.

### Benefit dependencies

Each benefit may declare `prerequisites: string[]` (benefit IDs). Results page
renders the dependency chain and orders the action plan so gateway benefits
(DTC) come first.

## Benefits scope (all 29)

Federal: DTC, CDB, CCB (+Child Disability Benefit), CCC, CGEB (GST/HST credit),
CDCP, CPP-D, CPP retirement, OAS, GIS, EI (regular + sickness), CWB, RDSP,
Medical Expense Tax Credit, Eligible Dependant Amount, Canada Carbon Rebate.

BC: PWD, BC Income Assistance, Fair PharmaCare, MSP Supplementary Benefits,
SAFER, BC Housing Registry, RAP, BC Seniors Supplement, BC Bus Pass, BC
Homeowner Grant, WorkBC Assistive Technology, BC Family Benefit, BC Climate
Action Tax Credit (verify current status).

## Non-negotiables

- No signup, no cookies, no analytics of answers. All state in-browser.
- Persistent disclaimer: general guidance only, not legal/financial/tax advice.
- Every benefit links to its official government source and shows "Last
  verified: <date>". Warning banner if `lastUpdated` older than 6 months.
- WCAG 2.1 AA: keyboard navigable, screen-reader friendly, mobile-first.
- Plain, encouraging Canadian English. Acronyms explained on first use.
- Strings externalized so French can be added later.

## Growth loop (participation)

- Flagship full assessment is the primary CTA.
- Printable / shareable action plan is the artifact people forward to family,
  friends, and clients.
- "Helping someone" mode reframes questions and also surfaces benefits the
  helper can claim (DTC transfer, CCC, Medical Expense Credit).

## Testing

- Unit tests for the engine (skip-logic, status transitions, reasons).
- Unit tests for amount estimators against published example figures.
- A few flow-level tests for the assessment reducer.
- `next build` (static export) must pass before each deploy.

## Deploy

Static export -> Cloudflare Pages via Wrangler. Email the live URL to the user
on every deploy.

## Order of work

1. Scaffold + types + config + engine + tests.
2. Enter all 29 benefits (breadth-first) with researched, sourced figures.
3. Browse + detail pages. First deploy.
4. Flagship assessment + results + print. Redeploy.
5. Landing + about, accessibility/mobile/SEO pass. Redeploy.
6. Final test, build, deploy, email URL.
