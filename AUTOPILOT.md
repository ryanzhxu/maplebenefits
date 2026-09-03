# AUTOPILOT.md — autobuild descriptor for MapleBenefits

MapleBenefits is a free, non-commercial finder for Canadian government benefits.
Real people use it to decide whether to apply for money they may be owed, so a
wrong number is not a cosmetic bug.

## Goal

Finish anchoring every benefit's figures to the official page that states them,
so the freshness lane can re-verify them automatically; add broad, high-reach
provincial benefits that pass validation; and once the data is sound, refine the
app and its user experience. Never invent a figure.

## Value ranking (what "highest-value" means here)

1. **Fix a wrong eligibility rule or displayed figure**, evidenced by a verbatim
   quote from the benefit's own official source. Prefer the ones that wrongly
   tell someone they do NOT qualify — under-promising stops people applying, so
   it costs more than over-promising.
2. **Anchor an unanchored benefit**: add a `figures` block whose every entry
   quotes the page that states it, so `run.ts freshness` re-checks it each run.
   36 of 80 benefits still have no `figures` block.
3. **Re-point a benefit that cites a page stating no dollar amounts** at the page
   that actually states them. Those figures are unfalsifiable until you do.
4. **Add a broad provincial benefit** a typical household could qualify for,
   researched to a spec that passes `scripts/crawl/validate-spec.ts` clean.
   Narrow categorical programs are out of scope.
5. **Refine the app and user experience**: accessibility, clarity of results,
   mobile layout, empty and error states, page performance.
6. **Remove duplication or dead code** your own earlier passes created.

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
