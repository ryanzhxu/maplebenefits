"use client";

import type {
  BenefitCategory,
  BenefitLevel,
  Confidence,
  EligibilityStatus,
} from "@/types/benefit";
import { useI18n } from "@/i18n/LocaleProvider";
import { formatDate, isStale } from "@/lib/format";

const STATUS_STYLE: Record<EligibilityStatus, string> = {
  eligible: "bg-eligible-soft text-eligible",
  possible: "bg-possible-soft text-possible",
  "need-more-info": "bg-brand-soft text-brand",
  ineligible: "bg-neutral-soft text-neutral",
};

const STATUS_ICON: Record<EligibilityStatus, string> = {
  eligible: "✓",
  possible: "≈",
  "need-more-info": "?",
  ineligible: "–",
};

export function StatusBadge({ status }: { status: EligibilityStatus }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[status]}`}
    >
      <span aria-hidden>{STATUS_ICON[status]}</span>
      {t(`status.${status}`)}
    </span>
  );
}

export function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const { t } = useI18n();
  return (
    <span className="text-xs font-medium text-muted">
      {t(`confidence.${confidence}`)}
    </span>
  );
}

export function LevelBadge({ level }: { level: BenefitLevel }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center rounded-md border border-line bg-surface px-2 py-0.5 text-xs font-medium text-muted">
      {t(`levels.${level}`)}
    </span>
  );
}

export function CategoryBadge({ category }: { category: BenefitCategory }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center rounded-md bg-neutral-soft px-2 py-0.5 text-xs font-medium text-ink">
      {t(`categories.${category}`)}
    </span>
  );
}

export function FreshnessNote({ lastUpdated }: { lastUpdated: string }) {
  const { t, locale } = useI18n();
  return (
    <span className="text-xs text-muted">
      {t("common.lastVerified")}: {formatDate(lastUpdated, locale)}
      {isStale(lastUpdated) ? " ⚠" : ""}
    </span>
  );
}

export function StaleWarning({ lastUpdated }: { lastUpdated: string }) {
  const { t } = useI18n();
  if (!isStale(lastUpdated)) return null;
  return (
    <div className="rounded-lg border border-possible/30 bg-possible-soft px-3 py-2 text-sm text-possible">
      {t("freshness.warning")}
    </div>
  );
}
