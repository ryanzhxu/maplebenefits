/**
 * Core domain types for MapleBenefits.
 *
 * All user-facing text uses `LocalizedString` so the app can be shown in
 * English, Traditional Chinese, and Simplified Chinese. Any missing
 * translation falls back to English (see `resolve` in src/i18n/locale.ts).
 *
 * Eligibility model: each benefit is a PURE function `check(context)` that
 * returns a structured, auditable result. There is one shared master intake
 * (src/data/intake.ts) with one question per context field. The full
 * assessment answers every relevant intake question once and runs every
 * benefit's `check`. A single-benefit check asks only the fields that benefit
 * declares in `contextFields`. No black boxes — every result lists its reasons.
 */

export type Locale = "en" | "zh-Hant" | "zh-Hans";

/** A string that may carry translations. Plain strings are treated as English. */
export type LocalizedString =
  | string
  | {
      en: string;
      "zh-Hant"?: string;
      "zh-Hans"?: string;
    };

export type BenefitCategory =
  | "disability"
  | "seniors"
  | "family"
  | "housing"
  | "health"
  | "income-support"
  | "tax-credits"
  | "education";

export type BenefitLevel =
  | "federal"
  | "provincial-bc"
  | "provincial-on"
  | "provincial-ab"
  | "provincial-mb"
  | "provincial-sk"
  | "provincial-ns"
  | "provincial-nb"
  | "provincial-pe"
  | "provincial-nl";

export type InputType =
  | "yes-no"
  | "number"
  | "select"
  | "multi-select"
  | "date"
  | "text";

export interface RuleOption {
  value: string;
  label: LocalizedString;
}

/** Confidence attached to an engine result. */
export type Confidence = "definite" | "likely" | "possible";

export type EligibilityStatus =
  | "eligible"
  | "possible"
  | "ineligible"
  | "need-more-info";

export interface AmountEstimate {
  low: number;
  high: number;
  period: "year" | "month" | "one-time";
  note?: LocalizedString;
}

/** Structured, auditable result of a benefit's eligibility check. */
export interface CheckResult {
  status: EligibilityStatus;
  confidence: Confidence;
  /** Why this result — plain-language, shown to the user. */
  reasons: LocalizedString[];
  /** Context fields still unknown that would firm up the result. */
  missing?: string[];
}

/** Keys of AssessmentContext a benefit depends on (drives single-benefit flow). */
export type ContextField = keyof AssessmentContext & string;

export interface ApplicationStep {
  order: number;
  title: LocalizedString;
  description: LocalizedString;
  actionUrl?: string;
  tips?: LocalizedString[];
  estimatedTime?: LocalizedString;
}

/* -------------------------------------------------------------------------
 * Sourced figures ("figures with receipts")
 *
 * A dollar amount or threshold must be written ONCE per benefit, together with
 * the official page it came from and the verbatim sentence that states it. The
 * rule in `check()` and every piece of copy (including both Chinese
 * translations) then reads the figure instead of restating the literal.
 *
 * This exists so the crawl automation can update a figure by patching ONE
 * field. Before this, a single number lived in 4-6 places and a partial update
 * would have shipped different amounts in different languages.
 *
 * `quote` is the receipt: the crawler refuses to change a value it cannot find
 * verbatim on the official page. That removes recall from the loop.
 *
 * History is APPENDED, never overwritten -- it is the audit trail for changes
 * that merge without human review, and it is the multi-year parameter table a
 * future tax filer would need.
 * ---------------------------------------------------------------------- */

/** How a figure is rendered inside user-facing copy. */
export type FigureFormat =
  | "currency"        // 25864   -> "$25,864"
  | "currency-cents"  // 1673.24 -> "$1,673.24"
  | "percent"         // 5       -> "5%"
  | "number";         // 420     -> "420"
// Deliberately language-neutral: these four render identically in en, zh-Hant,
// and zh-Hans (existing copy already writes "$25,864" in all three). Units that
// need a word ("hours", "months") are supplied by the surrounding copy in its
// own language, never by the formatter.

/** One observed value of a figure, with the evidence it came from. */
export interface FigureObservation {
  value: number;
  /** ISO date this value took effect, or was first observed if unstated. */
  from: string;
  /** ISO date this value stopped applying. Absent on the current value. */
  to?: string;
  /** Official page stating this value. Must be on the crawler allowlist. */
  source: string;
  /** Verbatim sentence from `source` containing the value. The receipt. */
  quote: string;
}

/** A single sourced figure: its current value plus every value it has held. */
export interface Figure {
  current: FigureObservation;
  /** Superseded values, oldest first. Appended to, never overwritten. */
  history: FigureObservation[];
  /** ISO date the crawler last confirmed `current` against its source. */
  verifiedAt: string;
  format: FigureFormat;
  /** Short human label, used in audit logs and milestone emails. */
  label: string;
  /**
   * Largest fractional change that may merge without review. A move beyond
   * this quarantines instead of merging. Default 0.25 (25%).
   */
  band?: number;
}

/** The sourced figures a benefit depends on, keyed by a stable local name. */
export type FigureSet = Record<string, Figure>;

export interface Benefit {
  id: string;
  name: LocalizedString;
  shortName: string;
  category: BenefitCategory;
  level: BenefitLevel;
  description: LocalizedString;
  estimatedValue: LocalizedString;
  /** Pure eligibility check. Single source of truth. No side effects. */
  check: (context: AssessmentContext) => CheckResult;
  /** Shared-context fields this benefit depends on (for the single-benefit flow). */
  contextFields: ContextField[];
  /** Optional pure amount estimator from context. */
  estimateAmount?: (context: AssessmentContext) => AmountEstimate | undefined;
  applicationSteps: ApplicationStep[];
  requiredDocuments: LocalizedString[];
  applicationUrl?: string;
  officialInfoUrl: string;
  processingTime?: LocalizedString;
  paymentFrequency?: LocalizedString;
  tags: string[];
  relatedBenefits: string[];
  /** Benefit IDs that must be obtained first (gateways, e.g. DTC). */
  prerequisites?: string[];
  /**
   * Sourced dollar amounts and thresholds this benefit uses. Declared once
   * here and referenced by `check`, the copy, and the deep content, so the
   * crawler can update a value in one place. See `src/lib/figures.ts`.
   */
  figures?: FigureSet;
  /** ISO date this benefit's figures were last verified against the source. */
  lastUpdated: string;
  /** True if the program has ended. Shown as "Ended"; never returns eligible. */
  discontinued?: boolean;
  /** Note shown for a discontinued program. */
  discontinuedNote?: LocalizedString;
}

/** Shared answers across all benefit assessments — asked once, reused. */
export interface AssessmentContext {
  helpingSomeoneElse?: boolean;
  age?: number;
  residency?:
    | "citizen"
    | "pr"
    | "refugee"
    | "work-permit"
    | "student"
    | "other";
  province?: string; // "BC" for MVP
  yearsInCanada?: number;
  yearsInProvince?: number;
  maritalStatus?:
    | "single"
    | "married"
    | "common-law"
    | "separated"
    | "divorced"
    | "widowed";
  hasChildren?: boolean;
  numberOfChildren?: number;
  childrenUnder6?: number;
  youngestChildAge?: number;
  employmentStatus?:
    | "employed"
    | "self-employed"
    | "unemployed"
    | "retired"
    | "unable-to-work";
  annualIncome?: number; // individual, before tax
  familyIncome?: number; // household, before tax
  hasDisability?: boolean;
  hasSevereDisability?: boolean; // markedly restricted, DTC-level
  hasDTC?: boolean;
  isHomeowner?: boolean;
  monthlyRent?: number;
  hasPrivateDentalInsurance?: boolean;
  receivesProvincialAssistance?: boolean;
  hasRecentCppContributions?: boolean;
  hasRecentEiHours?: boolean;
  filedTaxes?: boolean;
  /** You or a family member is in, or about to start, post-secondary study. */
  postSecondaryStudent?: boolean;
  [key: string]: unknown;
}

/** Optional richer detail shown on a benefit page (augmentation layer). */
export interface DeepContent {
  /** Detailed, plain-language eligibility criteria (bullet list). */
  eligibilityDetails?: LocalizedString[];
  /** Practical tips, nuances, retroactivity, common mistakes. */
  goodToKnow?: LocalizedString[];
  /** Common questions and answers. */
  faqs?: { q: LocalizedString; a: LocalizedString }[];
}

/** A single question in the shared master intake. */
export interface IntakeQuestion {
  /** Context field this question fills. */
  field: ContextField;
  question: LocalizedString;
  /** Alternate phrasing when helping someone else. */
  questionHelping?: LocalizedString;
  helpText?: LocalizedString;
  inputType: InputType;
  options?: RuleOption[];
  /** Which section/group this belongs to (for grouping/progress). */
  group: LocalizedString;
  /** Skip this question if the context makes it irrelevant. */
  skipIf?: (ctx: AssessmentContext) => boolean;
  /** Optional min/max for number inputs. */
  min?: number;
  max?: number;
  /** Placeholder / unit hint for number inputs. */
  unit?: LocalizedString;
  /** If false, the user may proceed without answering. Default true. */
  required?: boolean;
}

/** Output of the rule engine for one benefit (check result + metadata). */
export interface EvalResult extends CheckResult {
  benefitId: string;
  estimate?: AmountEstimate;
}
