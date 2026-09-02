/**
 * Freshness lane: re-check every sourced figure against its official page.
 *
 * This is the deterministic half of the automation. It reads figures declared
 * in the registry, fetches each cited page once, and asks `verifyFigure` what
 * it sees. No model is involved, so on the common path there is nothing to
 * hallucinate — a value either still appears verbatim on the page or it does
 * not.
 */

import type { Benefit, Figure } from "../../src/types/benefit";
import { fetchOfficial, FetchError } from "./fetch";
import { verifyFigure, withinBand, type Verdict } from "./verify";
import { DEFAULT_BAND } from "./config";

export interface FigureCheck {
  benefitId: string;
  key: string;
  label: string;
  source: string;
  verdict: Verdict | { kind: "fetch-failed"; reason: string };
  /** Set only for a "changed" verdict: is the move small enough to auto-merge? */
  inBand?: boolean;
}

/** Every (benefit, figure) pair in the registry, flattened. */
export function allFigures(benefits: Benefit[]): { benefit: Benefit; key: string; figure: Figure }[] {
  return benefits.flatMap((benefit) =>
    Object.entries(benefit.figures ?? {}).map(([key, figure]) => ({ benefit, key, figure })),
  );
}

/**
 * Check every figure. Pages are fetched at most once each (the fetcher's disk
 * cache dedupes within a run and across re-runs inside its TTL), so a benefit
 * citing one page five times costs one request.
 */
export async function checkAllFigures(benefits: Benefit[]): Promise<FigureCheck[]> {
  const results: FigureCheck[] = [];
  const pages = new Map<string, string | { error: string }>();

  for (const { benefit, key, figure } of allFigures(benefits)) {
    const url = figure.current.source;

    if (!pages.has(url)) {
      try {
        pages.set(url, (await fetchOfficial(url)).html);
      } catch (err) {
        const reason =
          err instanceof FetchError ? `${err.reason}: ${err.message}` : String(err);
        pages.set(url, { error: reason });
      }
    }

    const page = pages.get(url)!;
    const base = { benefitId: benefit.id, key, label: figure.label, source: url };

    if (typeof page !== "string") {
      results.push({ ...base, verdict: { kind: "fetch-failed", reason: page.error } });
      continue;
    }

    const verdict = verifyFigure(figure, page);
    results.push({
      ...base,
      verdict,
      inBand:
        verdict.kind === "changed"
          ? withinBand(verdict.oldValue, verdict.newValue, figure.band ?? DEFAULT_BAND)
          : undefined,
    });
  }
  return results;
}

/** One-line summary per outcome, for logs and the milestone email. */
export function summarize(checks: FigureCheck[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const c of checks) counts[c.verdict.kind] = (counts[c.verdict.kind] ?? 0) + 1;
  return counts;
}
