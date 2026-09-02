/**
 * Crawl automation entry point.
 *
 *   npx tsx scripts/crawl/run.ts freshness [--dry-run]
 *
 * Reports what each sourced figure looks like against its live official page.
 * `--dry-run` never writes; it is the safe way to see what a run would do.
 */

import { ACTIVE_BENEFITS, BENEFITS } from "../../src/data/benefits";
import { checkAllFigures, summarize, type FigureCheck } from "./freshness";

function line(c: FigureCheck): string {
  const id = `${c.benefitId}.${c.key}`;
  switch (c.verdict.kind) {
    case "unchanged":
      return `  ok        ${id}`;
    case "changed":
      return `  ${c.inBand ? "CHANGED  " : "QUARANTINE"} ${id}  ${c.verdict.oldValue} -> ${c.verdict.newValue}  (${c.verdict.strength}${c.inBand ? "" : ", outside band"})`;
    case "ambiguous":
      return `  AMBIGUOUS ${id}  candidates: ${c.verdict.candidates.join(", ")}`;
    case "quote-lost":
      return `  LOST      ${id}  page no longer states it: ${c.source}`;
    case "fetch-failed":
      return `  FETCHFAIL ${id}  ${c.verdict.reason}`;
  }
}

async function main(): Promise<void> {
  const lane = process.argv[2] ?? "freshness";
  if (lane !== "freshness") {
    console.error(`unknown lane: ${lane} (only "freshness" is implemented)`);
    process.exit(2);
  }

  const withFigures = BENEFITS.filter((b) => b.figures && Object.keys(b.figures).length > 0);
  console.log(
    `freshness lane: ${withFigures.length} of ${ACTIVE_BENEFITS.length} active benefits carry sourced figures`,
  );

  const checks = await checkAllFigures(BENEFITS);
  for (const c of checks) console.log(line(c));
  console.log("summary:", JSON.stringify(summarize(checks)));

  const needsAttention = checks.filter(
    (c) => c.verdict.kind !== "unchanged" && !(c.verdict.kind === "changed" && c.inBand),
  );
  console.log(`${needsAttention.length} figure(s) need attention.`);
}

main().catch((err) => {
  console.error("run failed:", err instanceof Error ? err.stack : err);
  process.exit(1);
});
