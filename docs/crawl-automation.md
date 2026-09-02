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

## Scope

In: federal, the nine covered provinces, and the three territories. A program
qualifies if a government runs it, it has direct dollar value to a household,
an individual can claim it, and it has a public eligibility page.

Out: Quebec (needs a French locale, deprioritized), municipal programs, and
any program that would need a new intake question — those are skipped and
logged rather than shrinking the assessment's usefulness for everyone.
