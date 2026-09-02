# Crawl automation — operating guide

Unattended job that keeps MapleBenefits' figures honest and finds benefits the
app does not yet cover. Design and decisions:
`docs/superpowers/specs/2026-09-01-benefit-crawl-automation-design.md`.

## What runs, and when

A launchd agent (`com.maplebenefits.crawl`) runs `scripts/crawl/nightly.sh`
every 6 hours. Each run:

1. rebases on `origin/main`
2. **freshness lane** — re-checks every sourced figure against its official page
3. **audit lane** — checks every benefit's numbers against the source it cites
4. writes reports, commits them, pushes
5. notifies only if something changed since the last run

It never writes to `src/`. The worst a bad run can do is commit a bad report.

```bash
bash scripts/crawl/install-launchd.sh                    # install / reinstall
launchctl bootout gui/$(id -u)/com.maplebenefits.crawl   # stop it
tail -f data/crawl/logs/launchd.out.log                  # watch a run
```

## Running a lane by hand

```bash
npx tsx scripts/crawl/run.ts freshness          # verify sourced figures
npx tsx scripts/crawl/run.ts audit --limit 10   # audit the first 10 benefits
npx tsx scripts/crawl/probe.ts <url> "phrase"   # what does the crawler see?
```

`probe` is the debugging tool. When a figure reports `quote-lost`, run it
against the page to find out whether the wording changed, the page moved, or
extraction dropped the text.

## Figures with receipts

A benefit declares each amount once, with the page it came from and the
verbatim sentence stating it:

```ts
const MCB = figures({
  perChild: {
    current: {
      value: 420,
      from: "2026-09-01",
      source: "https://www.gov.mb.ca/fs/eia/mcb.html",
      quote: "up to $420 tax free each year for every child",
    },
    history: [],
    verifiedAt: "2026-09-01",
    format: "currency",
    label: "Maximum per child per year",
  },
});
```

Rules and copy then read it — `val(MCB.perChild)` in a check,
`fmt(MCB.perChild)` inside a `tri()` string — so one number never appears in
six places and cannot drift between languages.

**History is appended, never overwritten.** It is the audit trail for changes
that merge without review, and the multi-year parameter table a tax filer
would need later.

## How a figure is re-verified

`verifyFigure` looks for the stored sentence on the live page, widening
through three tiers:

| Tier | Matches on | Survives |
|---|---|---|
| `exact` | the whole stored sentence | nothing but the number moving |
| `narrowed` | 45 characters either side | wording drift further away |
| `leading` | the phrase before the number | wording drift after it |

Outcomes: `unchanged`, `changed` (with the exact new value), `ambiguous` (the
pattern matched two different numbers), `quote-lost` (the sentence is gone).
It never guesses — the last two escalate.

## The gates

Auto-merge means these replace human review:

- **Provenance or reject** — a value must appear verbatim in its own quote.
  Enforced by `quoteSupports` in `npm test`, so a fabricated figure fails the
  suite regardless of what produced it.
- **Domain allowlist** — `OFFICIAL_DOMAINS` in `src/lib/figures.ts`. Federal,
  provincial, and the crown agencies that actually publish programs.
- **Sanity band** — a figure moving more than 25% (or its own `band`)
  quarantines instead of merging.
- **Blast radius** — at most 8 benefits changed per run.
- **Test wall** — `npm test` and `npm run build`.

`npm run lint` has two pre-existing errors (`Header.tsx`,
`LocaleProvider.tsx`) unrelated to this work, so the gate lints **changed
files**, not the whole repo.

## Notifications

`gh issue create` on the repo, which GitHub emails to the owner. There is no
mail transport on this machine and headless `claude -p` has no Gmail tool, so
this is the credential-free route. Every milestone is also written to
`data/crawl/logs/milestones/` before delivery is attempted, so none is lost.

To get real email instead, add a Gmail app password and an SMTP step; the
notifier is a single function (`scripts/crawl/notify.ts`).

## Reading a drift candidate

The audit reports, for each figure its source does not state, the closest
currency amount the page does state. **This is a lead, not a value to apply.**
Three failure modes seen in practice:

- **Shared pages.** One CRA page documents every program in a province, so the
  Newfoundland child benefit was paired with the *seniors* benefit's $1,882 and
  the *disability* benefit's $29,402. Always check the sentence.
- **Adjacent-but-different figures.** BC's $1,045 was paired with the "$1,000
  of assessed value" reduction rate. The real finding — that the $200
  northern-rural supplement was eliminated — came from reading the sentence,
  not from the number.
- **Non-amounts.** Before drift was anchored to `$`, benefit amounts matched
  toll-free numbers and "Date modified" years.

Drift earns its keep by directing attention. Confirm every value against its
sentence before changing anything.

## Recurring bug shape: one tier applied to everyone

Found three times in one night, all now fixed — Manitoba (family size),
Alberta Seniors (single vs couple), GIS (four thresholds by household
situation). A program publishes a different threshold per household type and
the app hard-codes one of them.

Over-promising wastes an application. **Under-promising is worse**: it tells
someone they do not qualify, and they never apply. Alberta's couple threshold
is $53,800 against the $33,410 the app was using for everyone.

Use `atMostOf` from `src/lib/checks.ts` — a ceiling computed from context —
rather than picking one tier.

## Status (2026-09-02)

- 21 of 73 benefits fully confirmed by their own sources
- 36 sourced figures across 13 benefits, all verifying live
- 0 broken official links (7 fixed)
- 52 benefits still carry at least one figure their source does not state

## Scope

In: federal, the nine covered provinces, and the three territories. A program
qualifies if a government runs it, it has direct dollar value to a household,
an individual can claim it, and it has a public eligibility page.

Out: Quebec (needs a French locale, deprioritized), municipal programs, and
any program that would need a new intake question — those are skipped and
logged rather than shrinking the assessment's usefulness for everyone.
