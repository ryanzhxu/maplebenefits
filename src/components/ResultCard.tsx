"use client";

import Link from "next/link";
import { useState } from "react";
import type { Benefit, EvalResult } from "@/types/benefit";
import { useI18n } from "@/i18n/LocaleProvider";
import { getBenefits } from "@/data/benefits";
import { formatEstimate } from "@/lib/format";
import { StatusBadge, ConfidenceBadge, LevelBadge } from "@/components/Badges";
import { INTAKE } from "@/data/intake";

export function ResultCard({
  benefit,
  result,
  defaultOpen = false,
}: {
  benefit: Benefit;
  result: EvalResult;
  defaultOpen?: boolean;
}) {
  const { t, r, locale } = useI18n();
  const [open, setOpen] = useState(defaultOpen);
  const prereqs = getBenefits(benefit.prerequisites ?? []);

  return (
    <div className="print-block rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <LevelBadge level={benefit.level} />
            <ConfidenceBadge confidence={result.confidence} />
          </div>
          <h3 className="text-lg font-semibold text-ink">{r(benefit.name)}</h3>
        </div>
        <StatusBadge status={result.status} />
      </div>

      {result.estimate && (
        <div className="mt-3 text-lg font-semibold text-eligible">
          {formatEstimate(result.estimate, locale)}
        </div>
      )}

      {/* Reasons */}
      {result.reasons.length > 0 && (
        <div className="mt-3">
          <div className="text-sm font-medium text-muted">
            {t("results.whyQualify")}
          </div>
          <ul className="mt-1.5 space-y-1">
            {result.reasons.map((reason, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <span aria-hidden className="text-eligible">
                  ✓
                </span>
                {r(reason)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Missing info */}
      {result.missing && result.missing.length > 0 && (
        <div className="mt-3">
          <ul className="space-y-1">
            {result.missing.map((field) => {
              const q = INTAKE.find((x) => x.field === field);
              if (!q) return null;
              return (
                <li key={field} className="flex items-start gap-2 text-sm text-muted">
                  <span aria-hidden>?</span>
                  {r(q.question)}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {prereqs.length > 0 && (
        <div className="mt-3 rounded-lg border border-brand/20 bg-brand-soft px-3 py-2 text-sm text-brand">
          {t("results.applyFirst")}:{" "}
          {prereqs.map((p, i) => (
            <span key={p.id}>
              {i > 0 && ", "}
              <Link href={`/benefits/${p.id}`} className="font-semibold underline">
                {r(p.name)}
              </Link>
            </span>
          ))}
        </div>
      )}

      {/* Steps toggle */}
      {benefit.applicationSteps.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="text-sm font-medium text-brand"
          >
            {t("common.howToApply")} {open ? "▲" : "▼"}
          </button>
          {open && (
            <ol className="mt-3 space-y-3 border-l-2 border-line pl-4">
              {benefit.applicationSteps.map((step) => (
                <li key={step.order}>
                  <div className="text-sm font-semibold text-ink">
                    {step.order}. {r(step.title)}
                  </div>
                  <p className="mt-0.5 text-sm leading-relaxed text-muted">
                    {r(step.description)}
                  </p>
                  {step.actionUrl && (
                    <a
                      href={step.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-sm font-medium text-brand underline"
                    >
                      {t("common.applyNow")} ↗
                    </a>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Link href={`/benefits/${benefit.id}`} className="font-medium text-brand">
          {t("common.learnMore")} →
        </Link>
        <a
          href={benefit.officialInfoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-muted underline"
        >
          {t("common.officialSource")} ↗
        </a>
      </div>
    </div>
  );
}
