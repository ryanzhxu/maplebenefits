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
  | "tax-credits";

export type BenefitLevel = "federal" | "provincial-bc";

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
