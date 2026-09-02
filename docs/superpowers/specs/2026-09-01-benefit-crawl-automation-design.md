# Benefit Crawl Automation — Design

Status: approved 2026-09-01. Owner session: `canadian-benefits-e9`.

## Problem

MapleBenefits carries 75 benefits whose dollar figures were verified by hand on
2026-09-01. Two things degrade from here:

1. **Drift.** Every figure goes stale on a schedule we do not control (CCB
   indexes in July, OAS quarterly, provincial thresholds at budget time). A
   stale figure shows a wrong amount to a real person on a live public site.
2. **Gaps.** Federal + 9 provinces is not full coverage, and the long tail of
   provincial and territorial programs is unexplored.

Drift is the liability. Gaps are the opportunity. This design handles both.

## Shape

Two independent lanes over one shared foundation.

- **Freshness lane** (tight cadence, blocking): re-verify every anchored figure
  against its official source. Mostly deterministic — no model in the common
  case.
- **Discovery lane** (slow cadence, background): find programs not yet in the
  registry, score them by reach, work down a ranked queue.

Both run locally on Ryan's Mac under `launchd`, commit to `main`, and push.
The existing `.github/workflows/deploy.yml` then deploys to Cloudflare Pages.
No new CI. The deploy path is unchanged.

## Decision: full auto-merge

Ryan's call, 2026-09-01: everything merges without review. Email on milestones
only.

The human gate is therefore **replaced by a mechanical one, not deleted**. A
change reaches `main` only if all of these hold:

| Gate | Rule |
|---|---|
| Provenance | The new value is quotable verbatim from a snapshot fetched this run and committed with the change. A value the model "knows" but cannot quote is rejected. |
| Domain allowlist | Official federal / provincial / territorial domains only. No aggregators, news, or blogs. |
| Sanity bounds | A figure that moves beyond its band, changes order of magnitude, or flips sign quarantines and emails. It does not merge. |
| Test wall | `npm test`, `tsc --noEmit`, `npm run lint`, and a real `npm run build` all pass. |
| Blast radius | At most N benefits changed per run. One bad run cannot rewrite the registry. |
| Revert | Each run is one commit with a machine-readable trailer. Undo is one `git revert`. |

**Residual risk, accepted and stated:** a value correctly quoted from the wrong
page passes every gate. Mitigation is after-the-fact auditability — snapshot and
quote live in the repo, and the diff goes in the milestone email.

## Foundation: figures with receipts

Today one number is written 4-6 times. In `manitoba-child-benefit`, `25864`
appears in the `atMost` rule and in the English, Traditional Chinese, and
Simplified Chinese fail-reason strings. A robot that updates three of four
sites ships a site that quotes different numbers in different languages, with
nobody watching.

So each benefit declares its figures once, with provenance, and the rule and all
copy read from that declaration:

```ts
const MCB = figures({
  incomeCutoff: {
    current: { value: 25864, from: "2025-07-01",
               source: "https://www.gov.mb.ca/fs/eia/mcb.html",
               quote: "net family income of less than $25,864" },
    history: [],
  },
});
```

The crawler's job per figure becomes mechanical:

- quote present, value unchanged -> bump `verifiedAt`
- quote present, value moved -> patch one field, everything downstream follows
- quote absent -> page restructured; do not merge, escalate

**Never overwrite.** A changed figure appends the old one to `history` with its
date range. This is required for the auto-merge audit trail, and it is also the
exact parameter table a future tax filer needs (see Non-goals).

All 75 benefits migrate up front, before the loop runs. Lazy migration would
leave most of the registry in the risky mode for months — which is the mode
being auto-merged.

## Scope

A program qualifies only if all four hold:

1. run by a federal, provincial, or territorial government (municipal excluded)
2. direct dollar value to a person or household — cash, tax credit, subsidy, fee
   waiver, or covered service
3. an individual can claim it (not grants to businesses or organizations)
4. has a public eligibility page on an official domain

Rejections are logged with a reason so the queue stays auditable.

**Ranked, not capped.** Candidates are scored by reach (roughly, eligible
population x annual value). The loop works down the ranking. No target count is
set now; the stopping decision is made later from observed marginal value.

Measured unit cost, from this repo: 89 lines of benefit data + 20 of deep
content + 5 of test = ~116 lines per benefit, about half of it trilingual copy.
Roughly 5 minutes and ~60k tokens per benefit unattended.

## Non-goals

- **Quebec.** Deliberately out of scope. Doing it right needs a French locale,
  which Ryan deprioritized. Not queued.
- **New intake questions.** When a program cannot be represented by the existing
  ~25 `AssessmentContext` fields, it is skipped and logged. Ryan's call
  2026-09-01: ignore these for now. The automation does not extend the intake.
- **Municipal programs.** Excluded by the inclusion bar.
- **Tax filing.** No tax-year-aware `check()`, no T1 line mapping, no tax
  engine. The design only stops discarding the multi-year figure history a tax
  filer would later need. Ryan flagged this as a possible future direction, not
  current work.

## Incidental fixes folded into the foundation

- `SITE.benefitCount` becomes derived from `ACTIVE_BENEFITS.length`. Hand-syncing
  it guarantees merge conflicts between the two lanes and drifts on its own.
- `BenefitLevel` gains `provincial-yt`, `provincial-nt`, `provincial-nu` so the
  discovery lane is not blocked on a type change. (No `provincial-qc` — see
  Non-goals.)
- 26 of 75 benefits have no `deep-content.ts` entry. Logged as existing backlog,
  not fixed by this work.

## Multi-session safety

Ryan runs parallel sessions against shared trees, and has been bitten twice by
peers clobbering uncommitted files. Rules for this work:

- `git add` explicit paths. Never `-A`.
- Rebase before every push.
- Claim lanes with peers via `SendMessage` before touching shared files.
- Never edit a shared wiring file while a peer has it dirty.

## Notification

Milestone email to ryan.xu282@gmail.com. Concise. Sent on: first successful
unattended run, migration complete, a quarantined figure, a run of N+ new
benefits, and any gate failure that stops the loop.
