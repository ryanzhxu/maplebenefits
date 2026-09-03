# AUTOPILOT.md — autobuild descriptor for MapleBenefits

MapleBenefits is a free, non-commercial finder for Canadian government benefits.
Real people use it to decide whether to apply for money they may be owed, so a
wrong number is not a cosmetic bug.

## Goal

50 of 80 active benefits are now anchored (sourced `figures`, re-verified live
each run). From here: keep closing that gap, but weight EQUALLY toward
re-verifying benefits already marked anchored or "clean" against a fresh fetch
(a source page can change after the fact) and toward user-experience
refinement — accessibility, mobile layout, result clarity, empty/error states,
performance. Never invent a figure.

## Value ranking (what "highest-value" means here)

1. **Fix a wrong eligibility rule or displayed figure**, evidenced by a verbatim
   quote from the benefit's own official source. Prefer the ones that wrongly
   tell someone they do NOT qualify — under-promising stops people applying, so
   it costs more than over-promising.
2. **Re-verify a previously anchored benefit against a fresh fetch of its own
   cited source.** `npx tsx scripts/crawl/run.ts freshness` reports drift
   automatically — do not re-derive this by hand, run it and act on what it
   finds. A figure that was right when anchored can go stale like any other.
3. **Anchor an unanchored benefit**: add a `figures` block whose every entry
   quotes the page that states it. Run
   `npx tsx scripts/crawl/run.ts audit` first to see which unanchored benefits
   have the most user-facing figures at stake.
4. **Re-point a benefit that cites a page stating no dollar amounts** at the page
   that actually states them. Those figures are unfalsifiable until you do.
5. **Improve the user experience**: accessibility (labels, contrast, focus
   order, keyboard nav), mobile layout, clarity of eligibility results, empty
   and error states, page performance. Verify visually — run the dev server and
   look, don't just read the JSX.
6. **Add a broad provincial benefit** a typical household could qualify for,
   researched to a spec that passes `scripts/crawl/validate-spec.ts` clean.
   Narrow categorical programs are out of scope.
7. **Remove duplication or dead code** your own earlier passes created.

## Protected paths — NEVER modify

- `.github/workflows/**` — CI wiring; another session edits this
- `src/lib/figures.ts` — the provenance core. `quoteSupports` and the domain
  allowlist are what make every figure trustworthy; weakening them silently
  removes the gate.
- `scripts/crawl/validate-spec.ts` — the validator that checks researched specs
- `data/crawl/**` — the crawl automation's own reports, cache and ledger
- `docs/superpowers/specs/**` — the design record
- `AUTOPILOT.md`, `.autobuild/**` — this loop's own configuration and ledger

## Constraints

- **Never write a dollar figure you cannot quote.** Every number shown to a user
  must appear verbatim on an official page you fetched in this pass. Check with
  `npx tsx scripts/crawl/probe.ts <url> "phrase"`. If you cannot quote it, do not
  write it — say so in PROGRESS.md and pick something else.
- **Official sources only.** Fetch through `scripts/crawl/fetch.ts`, which
  enforces the domain allowlist and robots.txt. Never paste a figure from memory
  or from a blog, aggregator or news article.
- **Distinguish an income threshold from a benefit amount.** Confusing them is
  the most common error in this codebase.
- **Watch for tiered thresholds.** A program that publishes a different limit per
  household type, with the app hard-coding one tier, has been found eight times.
  Use `atMostOf` from `src/lib/checks.ts` rather than picking a tier.
- **Never weaken, skip or delete a test to make a pass go green.** If behaviour
  legitimately changed, update the expectation and say why in one line.
- **Add no runtime dependency.** The app has zero external runtime dependencies
  and makes no third-party request. That is a product promise, not an accident.
- **Adding a benefit** means: register it in its region array, add it to
  `src/data/benefits/index.ts` if the array is new, and update
  `SITE.benefitCount` — a test enforces the count.
- **Skip anything needing a new intake question.** The assessment is shown to
  every user; a new question makes the product worse for everyone. Note it and
  move on.
- **Do not change the app name or brand.**
- One logical change per pass. Keep the diff small and reviewable.
- `npm run lint` has two PRE-EXISTING errors in `src/components/Header.tsx` and
  `src/i18n/LocaleProvider.tsx`. Leave them unless fixing them IS the pass.

## Machine config (read by autobuild.sh — keep exact key = value format)

```autobuild
verify = npm test && npx tsc --noEmit && npm run build
gate = direct
notify = gh issue create --title "{title}" --body "{body}"
branch_prefix = autobuild
email_to = ryan.xu282@gmail.com
email_cmd =
```

<!--
verify  Deliberately NOT `npm run lint` — the repo has two pre-existing lint
        errors unrelated to this work, so a repo-wide lint gate would reject
        every pass. Tests, typecheck and a real static build are the gate.

gate    direct. `.github/workflows/ci.yml` runs tests + build on push to main
        and deploys to Cloudflare ONLY if that passes, so a broken build cannot
        reach the live site. PR mode is wrong here: this repo runs no separate
        PR-only checks.

email_cmd is EMPTY on purpose. This Mac has no MTA, no msmtp, and no
RESEND_API_KEY, and headless `claude -p` has no Gmail tool. Milestones therefore
arrive as GitHub issues via `notify`, which GitHub emails to the repo owner.
To get real email, set RESEND_API_KEY and paste the Resend one-liner from the
skill template into email_cmd.
-->
