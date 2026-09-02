/**
 * The unattended nightly run, invoked by launchd.
 *
 * What it does: re-verifies every sourced figure against its official page,
 * re-audits every benefit's numbers against the source it cites, writes the
 * reports, commits them, and pushes.
 *
 * What it deliberately does NOT do: touch anything under src/. The registry is
 * only ever changed by a reviewed commit or by the migration lane, which runs
 * separately. A nightly run that goes wrong can, at worst, commit a bad report.
 *
 * It notifies only when something actually changed since the last run, so a
 * quiet week produces no mail.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { BENEFITS, ACTIVE_BENEFITS } from "../../src/data/benefits";
import { checkAllFigures, summarize } from "./freshness";
import { auditBenefit, benefitSourceBlocks, type BenefitAudit } from "./audit";
import { notify, type Milestone } from "./notify";
import { DATA_DIR, LOG_DIR, MAX_BENEFITS_CHANGED_PER_RUN, REPO_ROOT } from "./config";

const git = (...args: string[]): string =>
  execFileSync("git", args, { cwd: REPO_ROOT, encoding: "utf-8" }).trim();

interface RunState {
  lastRunAt: string;
  /** benefitId -> count of figures its cited source does not state. */
  unconfirmed: Record<string, number>;
  figureSummary: Record<string, number>;
}

function readState(): RunState | undefined {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, "state.json"), "utf-8")) as RunState;
  } catch {
    return undefined;
  }
}

function writeState(s: RunState): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(path.join(DATA_DIR, "state.json"), `${JSON.stringify(s, null, 2)}\n`);
}

async function main(): Promise<void> {
  const startedAt = new Date().toISOString();
  fs.mkdirSync(LOG_DIR, { recursive: true });

  // Start from whatever is on main. A peer session may have pushed since the
  // last run, and rebasing first is cheaper than resolving a conflict later.
  try {
    git("pull", "--rebase", "origin", "main");
  } catch (err) {
    notify({
      kind: "failure",
      title: "nightly run could not rebase on main",
      body: `git pull --rebase failed, so no crawl ran.\n\n${String(err)}`,
    });
    process.exit(1);
  }

  // --- freshness: are the figures we anchored still on their pages? ---
  const checks = await checkAllFigures(BENEFITS);
  const figureSummary = summarize(checks);
  const needsAttention = checks.filter(
    (c) => c.verdict.kind !== "unchanged" && !(c.verdict.kind === "changed" && c.inBand),
  );

  // --- audit: does each benefit's cited source state the numbers it shows? ---
  const blocks = benefitSourceBlocks();
  const audits: BenefitAudit[] = [];
  for (const b of ACTIVE_BENEFITS) {
    const source = blocks.get(b.id);
    if (source) audits.push(await auditBenefit(b, source));
  }

  fs.writeFileSync(path.join(DATA_DIR, "audit.json"), `${JSON.stringify(audits, null, 2)}\n`);
  fs.writeFileSync(
    path.join(LOG_DIR, `freshness-${startedAt.slice(0, 10)}.json`),
    `${JSON.stringify(checks, null, 2)}\n`,
  );

  // --- decide whether this is worth waking Ryan for ---
  const previous = readState();
  const unconfirmed = Object.fromEntries(
    audits.filter((a) => a.unconfirmed > 0).map((a) => [a.benefitId, a.unconfirmed]),
  );

  const newlyUnconfirmed = Object.keys(unconfirmed).filter(
    (id) => (previous?.unconfirmed[id] ?? 0) !== unconfirmed[id],
  );
  const changedFigures = checks.filter((c) => c.verdict.kind === "changed");

  const milestones: Milestone[] = [];

  if (changedFigures.length > MAX_BENEFITS_CHANGED_PER_RUN) {
    // More movement than a normal indexation cycle produces. Something is off
    // with the crawler or with a source site; do not treat it as routine.
    milestones.push({
      kind: "quarantine",
      title: `${changedFigures.length} figures moved in one run -- blast radius exceeded`,
      body:
        `The nightly crawl saw ${changedFigures.length} figures change, above the ` +
        `limit of ${MAX_BENEFITS_CHANGED_PER_RUN}. Nothing was applied.\n\n` +
        changedFigures
          .slice(0, 20)
          .map((c) =>
            c.verdict.kind === "changed"
              ? `  ${c.benefitId}.${c.key}: ${c.verdict.oldValue} -> ${c.verdict.newValue}`
              : "",
          )
          .join("\n"),
    });
  } else if (needsAttention.length > 0) {
    milestones.push({
      kind: "quarantine",
      title: `${needsAttention.length} figure(s) need a decision`,
      body: needsAttention
        .map((c) => `  ${c.benefitId}.${c.key} (${c.verdict.kind}) ${c.source}`)
        .join("\n"),
    });
  }

  if (newlyUnconfirmed.length > 0) {
    milestones.push({
      kind: "progress",
      title: `${newlyUnconfirmed.length} benefit(s) changed provenance status`,
      body:
        `Figures these benefits show are not stated on the source they cite:\n\n` +
        newlyUnconfirmed.map((id) => `  ${id}: ${unconfirmed[id]} unconfirmed`).join("\n") +
        `\n\nFull report: data/crawl/audit.json`,
    });
  }

  writeState({ lastRunAt: startedAt, unconfirmed, figureSummary });

  // --- commit the reports (never src/) ---
  git("add", "data/crawl/audit.json", "data/crawl/state.json", "data/crawl/logs");
  const staged = git("diff", "--cached", "--name-only");
  if (staged) {
    git(
      "commit",
      "-m",
      `chore(crawl): nightly report ${startedAt.slice(0, 10)}\n\n` +
        `figures: ${JSON.stringify(figureSummary)}\n` +
        `benefits with unconfirmed numbers: ${Object.keys(unconfirmed).length}/${audits.length}\n\n` +
        `Reports only; src/ untouched.\n\n` +
        `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`,
    );
    try {
      git("push", "origin", "main");
    } catch (err) {
      // launchd may not have the SSH agent this key needs. A report that is
      // committed but unpushed is a nuisance, not a failure -- the next run
      // pushes it. Do not lose the crawl results over it.
      milestones.push({
        kind: "failure",
        title: "nightly report committed but could not push",
        body: `The crawl ran and committed its report, but the push failed:\n\n${String(err).slice(0, 800)}`,
      });
    }
  }

  for (const m of milestones) {
    const via = notify(m);
    console.log(`notified (${via.via}): ${m.title}`);
  }
  console.log(
    `nightly complete. figures=${JSON.stringify(figureSummary)} ` +
      `unconfirmed_benefits=${Object.keys(unconfirmed).length}/${audits.length} ` +
      `milestones=${milestones.length}`,
  );
}

main().catch((err) => {
  notify({
    kind: "failure",
    title: "nightly crawl run failed",
    body: String(err instanceof Error ? err.stack : err).slice(0, 3000),
  });
  console.error(err);
  process.exit(1);
});
