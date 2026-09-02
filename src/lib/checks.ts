/**
 * Small, auditable DSL for building benefit eligibility checks.
 *
 * A benefit's eligibility is a list of rules over the AssessmentContext.
 * Each rule returns "pass" | "fail" | "unknown". Hard rules are firm
 * requirements: a single hard fail means ineligible. Soft rules are positive
 * signals that raise confidence but never disqualify.
 *
 * Status logic (deterministic, no black box):
 *   - any hard rule fails                  -> ineligible
 *   - any hard rule unknown (none failed)  -> need-more-info
 *   - all hard rules pass                  -> eligible
 *
 * Confidence:
 *   - eligible + every rule resolved       -> definite
 *   - eligible + some soft unknown/fail    -> likely
 *   - need-more-info                        -> possible
 */

import type {
  AssessmentContext,
  CheckResult,
  ContextField,
  LocalizedString,
} from "@/types/benefit";

export type RuleState = "pass" | "fail" | "unknown";

export type Predicate = (ctx: AssessmentContext) => RuleState;

export interface Rule {
  /** Pure test over the context. */
  test: Predicate;
  /** Firm requirement? A hard fail disqualifies. Default true. */
  hard?: boolean;
  /** Shown when this rule passes ("why you qualify"). */
  passReason?: LocalizedString;
  /** Shown when a hard rule fails (why not eligible). */
  failReason?: LocalizedString;
  /** Context field the user still needs to answer, if unknown. */
  missingField?: ContextField;
}

export function atLeast(
  get: (ctx: AssessmentContext) => number | undefined,
  min: number,
): Predicate {
  return (ctx) => {
    const v = get(ctx);
    if (v === undefined || v === null || Number.isNaN(v)) return "unknown";
    return v >= min ? "pass" : "fail";
  };
}

export function atMost(
  get: (ctx: AssessmentContext) => number | undefined,
  max: number,
): Predicate {
  return (ctx) => {
    const v = get(ctx);
    if (v === undefined || v === null || Number.isNaN(v)) return "unknown";
    return v <= max ? "pass" : "fail";
  };
}

/**
 * Like `atMost`, but the ceiling is computed from the context.
 *
 * Many benefits scale their income cutoff with household or family size (the
 * Manitoba Child Benefit publishes a different cutoff for 1-3, 4, 5, and 6
 * children). A fixed ceiling forces one tier's number onto every applicant,
 * which silently over- or under-promises for everyone else.
 *
 * Returns "unknown" when either the value or the ceiling is unavailable, so a
 * missing answer asks a question rather than producing a wrong verdict.
 */
export function atMostOf(
  get: (ctx: AssessmentContext) => number | undefined,
  ceiling: (ctx: AssessmentContext) => number | undefined,
): Predicate {
  return (ctx) => {
    const v = get(ctx);
    const max = ceiling(ctx);
    if (v === undefined || v === null || Number.isNaN(v)) return "unknown";
    if (max === undefined || max === null || Number.isNaN(max)) return "unknown";
    return v <= max ? "pass" : "fail";
  };
}

export function inRange(
  get: (ctx: AssessmentContext) => number | undefined,
  min: number,
  max: number,
): Predicate {
  return (ctx) => {
    const v = get(ctx);
    if (v === undefined || v === null || Number.isNaN(v)) return "unknown";
    return v >= min && v <= max ? "pass" : "fail";
  };
}

export function isTrue(
  get: (ctx: AssessmentContext) => boolean | undefined,
): Predicate {
  return (ctx) => {
    const v = get(ctx);
    if (v === undefined || v === null) return "unknown";
    return v ? "pass" : "fail";
  };
}

export function isFalse(
  get: (ctx: AssessmentContext) => boolean | undefined,
): Predicate {
  return (ctx) => {
    const v = get(ctx);
    if (v === undefined || v === null) return "unknown";
    return v ? "fail" : "pass";
  };
}

export function oneOf<T extends string>(
  get: (ctx: AssessmentContext) => T | undefined,
  allowed: T[],
): Predicate {
  return (ctx) => {
    const v = get(ctx);
    if (v === undefined || v === null) return "unknown";
    return allowed.includes(v) ? "pass" : "fail";
  };
}

/** Compose a benefit's `check` from a list of rules. */
export function buildCheck(
  rules: Rule[],
): (ctx: AssessmentContext) => CheckResult {
  return (ctx: AssessmentContext): CheckResult => {
    const reasons: LocalizedString[] = [];
    const missing: string[] = [];
    let hardFailReason: LocalizedString | undefined;
    let hardFailed = false;
    let hardUnknown = false;
    let softIncomplete = false;

    for (const rule of rules) {
      const hard = rule.hard !== false;
      const state = rule.test(ctx);

      if (state === "fail") {
        if (hard) {
          hardFailed = true;
          if (!hardFailReason && rule.failReason)
            hardFailReason = rule.failReason;
        } else {
          softIncomplete = true;
        }
      } else if (state === "unknown") {
        if (rule.missingField) missing.push(rule.missingField);
        if (hard) hardUnknown = true;
        else softIncomplete = true;
      } else {
        if (rule.passReason) reasons.push(rule.passReason);
      }
    }

    if (hardFailed) {
      return {
        status: "ineligible",
        confidence: "definite",
        reasons: hardFailReason ? [hardFailReason] : [],
        missing: [],
      };
    }

    if (hardUnknown) {
      return {
        status: "need-more-info",
        confidence: "possible",
        reasons,
        missing: dedupe(missing),
      };
    }

    return {
      status: "eligible",
      confidence: softIncomplete ? "likely" : "definite",
      reasons,
      missing: dedupe(missing),
    };
  };
}

function dedupe(items: string[]): string[] {
  return Array.from(new Set(items));
}
