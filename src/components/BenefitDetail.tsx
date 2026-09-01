"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/LocaleProvider";
import { getBenefit, getBenefits } from "@/data/benefits";
import { DEEP } from "@/data/deep-content";
import {
  CategoryBadge,
  FreshnessNote,
  LevelBadge,
  StaleWarning,
} from "@/components/Badges";

export function BenefitDetail({ id }: { id: string }) {
  const { t, r } = useI18n();
  const benefit = getBenefit(id);
  if (!benefit) return null;

  const prereqs = getBenefits(benefit.prerequisites ?? []);
  const related = getBenefits(benefit.relatedBenefits).filter(
    (b) => !b.discontinued,
  );
  const deep = DEEP[benefit.id];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/benefits" className="text-sm font-medium text-brand">
        ← {t("nav.browse")}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <LevelBadge level={benefit.level} />
        <CategoryBadge category={benefit.category} />
        {benefit.discontinued && (
          <span className="rounded-md bg-neutral-soft px-2 py-0.5 text-xs font-semibold text-neutral">
            {r({ en: "Ended", "zh-Hant": "已結束", "zh-Hans": "已结束" })}
          </span>
        )}
      </div>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink">
        {r(benefit.name)}
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        {r(benefit.description)}
      </p>

      <div className="mt-5 rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <div className="text-sm font-medium text-muted">
          {t("common.estimatedValue")}
        </div>
        <div className="mt-1 text-xl font-semibold text-eligible">
          {r(benefit.estimatedValue)}
        </div>
      </div>

      {benefit.discontinued ? (
        <div className="mt-5 rounded-lg border border-neutral/30 bg-neutral-soft px-4 py-3 text-sm text-ink">
          {r(benefit.discontinuedNote)}
        </div>
      ) : (
        <div className="mt-5">
          <StaleWarning lastUpdated={benefit.lastUpdated} />
          <Link
            href={`/assess?focus=${benefit.id}`}
            className="mt-3 inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-brand-dark"
          >
            {t("common.checkIfIQualify")} →
          </Link>
        </div>
      )}

      {prereqs.length > 0 && (
        <div className="mt-6 rounded-lg border border-brand/20 bg-brand-soft px-4 py-3 text-sm text-brand">
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

      {/* Who qualifies (deep detail) */}
      {deep?.eligibilityDetails && deep.eligibilityDetails.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink">
            {t("common.whoQualifies")}
          </h2>
          <ul className="mt-3 space-y-2">
            {deep.eligibilityDetails.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-eligible">
                  ✓
                </span>
                <span className="leading-relaxed">{r(d)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Application steps */}
      {benefit.applicationSteps.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-bold text-ink">{t("common.howToApply")}</h2>
          <ol className="mt-4 space-y-4">
            {benefit.applicationSteps.map((step) => (
              <li
                key={step.order}
                className="rounded-[var(--radius-card)] border border-line bg-surface p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
                    {step.order}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink">{r(step.title)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted">
                      {r(step.description)}
                    </p>
                    {step.estimatedTime && (
                      <p className="mt-2 text-xs font-medium text-muted">
                        ⏱ {r(step.estimatedTime)}
                      </p>
                    )}
                    {step.tips && step.tips.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {step.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-eligible">
                            💡 {r(tip)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {step.actionUrl && (
                      <a
                        href={step.actionUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-block text-sm font-medium text-brand underline"
                      >
                        {t("common.applyNow")} ↗
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Documents */}
      {benefit.requiredDocuments.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">
            {t("common.requiredDocuments")}
          </h2>
          <ul className="mt-3 space-y-2">
            {benefit.requiredDocuments.map((doc, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <span aria-hidden className="text-brand">
                  ▸
                </span>
                {r(doc)}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Facts */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {benefit.processingTime && (
          <Fact label={t("common.processingTime")} value={r(benefit.processingTime)} />
        )}
        {benefit.paymentFrequency && (
          <Fact
            label={t("common.paymentFrequency")}
            value={r(benefit.paymentFrequency)}
          />
        )}
      </section>

      {/* Good to know */}
      {deep?.goodToKnow && deep.goodToKnow.length > 0 && (
        <section className="mt-8 rounded-[var(--radius-card)] border border-line bg-brand-soft/50 p-5">
          <h2 className="text-xl font-bold text-ink">
            {t("common.goodToKnow")}
          </h2>
          <ul className="mt-3 space-y-2">
            {deep.goodToKnow.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink">
                <span aria-hidden className="mt-0.5 text-brand">
                  💡
                </span>
                <span className="leading-relaxed">{r(d)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQs */}
      {deep?.faqs && deep.faqs.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">
            {t("common.commonQuestions")}
          </h2>
          <div className="mt-3 space-y-3">
            {deep.faqs.map((f, i) => (
              <details
                key={i}
                className="rounded-xl border border-line bg-surface p-4"
              >
                <summary className="cursor-pointer font-medium text-ink">
                  {r(f.q)}
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {r(f.a)}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">
            {t("common.relatedBenefits")}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((b) => (
              <Link
                key={b.id}
                href={`/benefits/${b.id}`}
                className="rounded-full border border-line bg-surface px-3 py-1.5 text-sm font-medium text-ink hover:border-brand hover:text-brand"
              >
                {r(b.name)}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Official source */}
      <section className="mt-10 border-t border-line pt-6">
        <a
          href={benefit.officialInfoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-brand underline"
        >
          {t("common.officialSource")} ↗
        </a>
        <div className="mt-2">
          <FreshnessNote lastUpdated={benefit.lastUpdated} />
        </div>
      </section>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs font-medium text-muted">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">{value}</div>
    </div>
  );
}
