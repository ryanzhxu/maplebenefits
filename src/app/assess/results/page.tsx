"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useI18n } from "@/i18n/LocaleProvider";
import { SITE } from "@/config/site";
import { useAssessment } from "@/store/assessment";
import { ACTIVE_BENEFITS, getBenefit, getBenefits } from "@/data/benefits";
import { annualMidpoint, assessAll } from "@/lib/engine";
import { formatMoney } from "@/lib/format";
import { ResultCard } from "@/components/ResultCard";
import type { EvalResult } from "@/types/benefit";

export default function ResultsPage() {
  const { t, r, locale } = useI18n();
  const { context, completed } = useAssessment();
  const helping = context.helpingSomeoneElse === true;
  const helperBenefits = getBenefits([
    "ccc",
    "medical-expense",
    "eligible-dependant",
    "dtc",
  ]);

  const results = useMemo(() => assessAll(ACTIVE_BENEFITS, context), [context]);

  const eligible = results.filter((x) => x.status === "eligible");
  const possible = results.filter((x) => x.status === "possible");
  const moreInfo = results.filter((x) => x.status === "need-more-info");

  const totalLow = [...eligible, ...possible].reduce(
    (sum, x) => sum + annualMidpoint(x),
    0,
  );

  if (!completed && eligible.length === 0 && possible.length === 0 && moreInfo.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">{t("assess.title")}</h1>
        <p className="mt-3 text-muted">{t("assess.intro")}</p>
        <Link
          href="/assess"
          className="mt-6 inline-flex rounded-xl bg-brand px-6 py-3 font-semibold text-white"
        >
          {t("assess.startButton")} →
        </Link>
      </div>
    );
  }

  const nothing =
    eligible.length === 0 && possible.length === 0 && moreInfo.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Print-only header */}
      <div className="mb-4 hidden print:block">
        <div className="text-lg font-bold">
          {SITE.name} — {t("results.printIntro")} {SITE.name}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">
            {t("results.title")}
          </h1>
          <p className="mt-2 max-w-xl text-muted">{t("results.subtitle")}</p>
          {eligible.length + possible.length + moreInfo.length > 0 && (
            <p className="mt-1 text-sm font-medium text-brand">
              {eligible.length + possible.length + moreInfo.length}{" "}
              {t("browse.resultsCount")}
            </p>
          )}
        </div>
        <div className="no-print flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-soft"
          >
            🖨 {t("common.print")}
          </button>
          <Link
            href="/assess"
            className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-soft"
          >
            {t("results.retake")}
          </Link>
        </div>
      </div>

      {/* Combined value */}
      {totalLow > 0 && (
        <div className="mt-6 rounded-[var(--radius-card)] border border-eligible/30 bg-eligible-soft p-5">
          <div className="text-sm font-medium text-eligible">
            {t("results.estimatedTotal")}
          </div>
          <div className="mt-1 text-3xl font-bold text-eligible">
            ~{formatMoney(Math.round(totalLow), locale)}{" "}
            <span className="text-base font-medium">{t("results.perYear")}</span>
          </div>
        </div>
      )}

      {nothing && (
        <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface p-8 text-center">
          <h2 className="text-lg font-semibold text-ink">
            {t("results.noneTitle")}
          </h2>
          <p className="mt-2 text-muted">{t("results.noneBody")}</p>
          <Link
            href="/benefits"
            className="mt-4 inline-block font-medium text-brand"
          >
            {t("common.browseBenefits")} →
          </Link>
        </div>
      )}

      <Section title={t("results.likelyTitle")} results={eligible} />
      <Section title={t("results.possibleTitle")} results={possible} />
      <Section title={t("results.moreInfoTitle")} results={moreInfo} />

      {/* Flow 4: benefits the helper can claim */}
      {helping && (
        <section className="mt-10 rounded-[var(--radius-card)] border border-brand/20 bg-brand-soft p-5">
          <h2 className="text-lg font-bold text-brand">
            {t("results.helperTitle")}
          </h2>
          <p className="mt-1 text-sm text-ink">{t("results.helperBody")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {helperBenefits.map((b) => (
              <Link
                key={b.id}
                href={`/benefits/${b.id}`}
                className="rounded-full border border-brand/30 bg-surface px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand hover:text-white"
              >
                {r(b.name)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Disclaimer */}
      <p className="mt-10 rounded-lg border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
        {t("results.disclaimer")}
      </p>
    </div>
  );
}

function Section({ title, results }: { title: string; results: EvalResult[] }) {
  if (results.length === 0) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xl font-bold text-ink">{title}</h2>
      <div className="mt-4 space-y-4">
        {results.map((res) => {
          const benefit = getBenefit(res.benefitId);
          if (!benefit) return null;
          return <ResultCard key={res.benefitId} benefit={benefit} result={res} />;
        })}
      </div>
    </section>
  );
}
