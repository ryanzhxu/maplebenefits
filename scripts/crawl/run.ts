/**
 * Crawl automation entry point.
 *
 *   npx tsx scripts/crawl/run.ts freshness           re-verify sourced figures
 *   npx tsx scripts/crawl/run.ts audit [--limit N]   check every benefit's
 *                                                    numbers against its own
 *                                                    cited source
 *
 * Both lanes are read-only. Neither writes to src/, so a run can never damage
 * the registry -- they produce reports, and the reports drive the work.
 */

import fs from "node:fs";
import path from "node:path";
import { ACTIVE_BENEFITS, BENEFITS } from "../../src/data/benefits";
import { checkAllFigures, summarize, type FigureCheck } from "./freshness";
import { auditBenefit, benefitSourceBlocks, type BenefitAudit } from "./audit";
import { sweep, type Candidate } from "./discover";
import type { BenefitLevel } from "../../src/types/benefit";
import { DATA_DIR } from "./config";

function figureLine(c: FigureCheck): string {
  const id = `${c.benefitId}.${c.key}`;
  switch (c.verdict.kind) {
    case "unchanged":
      return `  ok         ${id}`;
    case "changed":
      return `  ${c.inBand ? "CHANGED   " : "QUARANTINE"} ${id}  ${c.verdict.oldValue} -> ${c.verdict.newValue}  (${c.verdict.strength})`;
    case "ambiguous":
      return `  AMBIGUOUS  ${id}  candidates: ${c.verdict.candidates.join(", ")}`;
    case "quote-lost":
      return `  LOST       ${id}  ${c.source}`;
    case "fetch-failed":
      return `  FETCHFAIL  ${id}  ${c.verdict.reason}`;
  }
}

async function freshnessLane(): Promise<void> {
  const withFigures = BENEFITS.filter((b) => Object.keys(b.figures ?? {}).length > 0);
  console.log(
    `freshness: ${withFigures.length}/${ACTIVE_BENEFITS.length} active benefits carry sourced figures`,
  );
  const checks = await checkAllFigures(BENEFITS);
  for (const c of checks) console.log(figureLine(c));
  console.log("summary:", JSON.stringify(summarize(checks)));
}

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (hit) return hit.split("=")[1];
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}

async function auditLane(): Promise<void> {
  const limit = Number(arg("limit") ?? ACTIVE_BENEFITS.length);
  const blocks = benefitSourceBlocks();
  const targets = ACTIVE_BENEFITS.slice(0, limit);

  console.log(`audit: checking ${targets.length} benefits against their cited sources`);
  const reports: BenefitAudit[] = [];

  for (const [i, b] of targets.entries()) {
    const source = blocks.get(b.id);
    if (!source) {
      console.log(`  SKIP       ${b.id}  (source block not found)`);
      continue;
    }
    const report = await auditBenefit(b, source);
    reports.push(report);

    const bad = report.figures.filter((f) => !f.found).map((f) => f.value);
    const flag = report.fetchErrors.length ? "FETCHFAIL " : bad.length ? "UNCONFIRMED" : "ok        ";
    console.log(
      `  [${String(i + 1).padStart(3)}/${targets.length}] ${flag} ${b.id}  ` +
        `${report.confirmed} confirmed, ${report.unconfirmed} not` +
        (bad.length ? `: ${bad.slice(0, 8).join(", ")}` : "") +
        (report.fetchErrors.length ? `  [${report.fetchErrors.join("; ")}]` : ""),
    );
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = path.join(DATA_DIR, "audit.json");
  fs.writeFileSync(out, `${JSON.stringify(reports, null, 2)}\n`);

  const clean = reports.filter((r) => r.unconfirmed === 0 && !r.fetchErrors.length);
  const dirty = reports.filter((r) => r.unconfirmed > 0);
  console.log(
    `\naudit complete: ${clean.length} fully confirmed, ${dirty.length} with unconfirmed figures, ` +
      `${reports.filter((r) => r.fetchErrors.length).length} with fetch problems`,
  );
  console.log(`report: ${out}`);
}

async function discoverLane(): Promise<void> {
  const level = (arg("level") ?? "provincial-on") as BenefitLevel;
  console.log(`discovery: sweeping official program indexes for ${level}`);

  const candidates = await sweep(level, ACTIVE_BENEFITS);
  const ranked = candidates.filter((c) => !c.rejected);
  const dropped = candidates.filter((c) => c.rejected);

  console.log(`\nRANKED (${ranked.length}) — reach = population(M) x top amount on page`);
  for (const c of ranked) {
    console.log(
      `  ${String(c.reachScore).padStart(9)}  $${String(c.topAmount).padEnd(8)} ${c.label.slice(0, 52)}`,
    );
  }
  console.log(`\nDROPPED (${dropped.length})`);
  const byReason: Record<string, number> = {};
  for (const c of dropped) byReason[c.rejected!] = (byReason[c.rejected!] ?? 0) + 1;
  for (const [reason, n] of Object.entries(byReason)) console.log(`  ${n} — ${reason}`);

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const out = path.join(DATA_DIR, "queue.json");
  const existing: Record<string, Candidate[]> = fs.existsSync(out)
    ? JSON.parse(fs.readFileSync(out, "utf-8"))
    : {};
  existing[level] = candidates;
  fs.writeFileSync(out, `${JSON.stringify(existing, null, 2)}\n`);
  console.log(`\nqueue: ${out}`);
}

async function main(): Promise<void> {
  const lane = process.argv[2] ?? "freshness";
  if (lane === "freshness") return freshnessLane();
  if (lane === "audit") return auditLane();
  if (lane === "discover") return discoverLane();
  console.error(`unknown lane: ${lane} (expected "freshness", "audit" or "discover")`);
  process.exit(2);
}

main().catch((err) => {
  console.error("run failed:", err instanceof Error ? err.stack : err);
  process.exit(1);
});
