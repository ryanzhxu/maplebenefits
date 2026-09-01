/**
 * The rule engine. Pure, deterministic, side-effect free.
 *
 * `evaluate` runs one benefit's check against the context and attaches an
 * amount estimate. `assessAll` runs every benefit and returns them ordered
 * for the results dashboard: eligible first, then possible/need-more-info,
 * then ineligible; within a group, higher estimated value first.
 */

import type {
  AssessmentContext,
  Benefit,
  EligibilityStatus,
  EvalResult,
} from "@/types/benefit";

export function evaluate(
  benefit: Benefit,
  ctx: AssessmentContext,
): EvalResult {
  const result = benefit.check(ctx);
  const estimate = benefit.estimateAmount
    ? benefit.estimateAmount(ctx)
    : undefined;
  return { benefitId: benefit.id, ...result, estimate };
}

const STATUS_ORDER: Record<EligibilityStatus, number> = {
  eligible: 0,
  possible: 1,
  "need-more-info": 2,
  ineligible: 3,
};

/** Annualized midpoint value of an estimate, for sorting. 0 if none. */
export function annualMidpoint(result: EvalResult): number {
  const e = result.estimate;
  if (!e) return 0;
  const mid = (e.low + e.high) / 2;
  if (e.period === "month") return mid * 12;
  return mid; // year or one-time treated as-is for ranking
}

export function assessAll(
  benefits: Benefit[],
  ctx: AssessmentContext,
): EvalResult[] {
  const results = benefits.map((b) => evaluate(b, ctx));

  // A benefit is a "gateway" if another benefit in this set lists it as a
  // prerequisite. Gateways should be acted on first, so they float to the top
  // of their status group (e.g. apply for DTC before CDB / RDSP).
  const gateways = new Set<string>();
  for (const b of benefits) {
    for (const pre of b.prerequisites ?? []) gateways.add(pre);
  }

  return results.sort((a, b) => {
    const s = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (s !== 0) return s;
    const g = Number(gateways.has(b.benefitId)) - Number(gateways.has(a.benefitId));
    if (g !== 0) return g;
    return annualMidpoint(b) - annualMidpoint(a);
  });
}

/** Results a user would want to act on: eligible + possible + need-more-info. */
export function actionableResults(results: EvalResult[]): EvalResult[] {
  return results.filter((r) => r.status !== "ineligible");
}
