"use client";

import Link from "next/link";
import { SITE } from "@/config/site";
import { useI18n } from "@/i18n/LocaleProvider";
import { BENEFITS, CATEGORIES } from "@/data/benefits";
import type { BenefitCategory } from "@/types/benefit";

const CATEGORY_ICON: Record<BenefitCategory, string> = {
  disability: "♿",
  seniors: "👵",
  family: "👪",
  housing: "🏠",
  health: "🩺",
  "income-support": "💵",
  "tax-credits": "🧾",
  education: "🎓",
};

export default function HomePage() {
  const { t, r } = useI18n();

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-soft to-bg">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm font-medium text-muted">
              {r(SITE.region)} · {SITE.benefitCount} {t("home.statBenefits")}
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight text-ink sm:text-5xl">
              {r(SITE.tagline)}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              {r(SITE.description)}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/assess"
                className="inline-flex items-center justify-center rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark"
              >
                {t("home.heroCtaPrimary")} →
              </Link>
              <Link
                href="/benefits"
                className="inline-flex items-center justify-center rounded-xl border border-line bg-surface px-6 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-neutral-soft"
              >
                {t("home.heroCtaSecondary")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight text-ink">
          {t("home.howItWorks")}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", title: t("home.step1Title"), body: t("home.step1Body") },
            { n: "2", title: t("home.step2Title"), body: t("home.step2Body") },
            { n: "3", title: t("home.step3Title"), body: t("home.step3Body") },
          ].map((s) => (
            <div
              key={s.n}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-6"
            >
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand text-white font-semibold">
                {s.n}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            {t("home.trustTitle")}
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              t("home.trustPrivacy"),
              t("home.trustSources"),
              t("home.trustFree"),
            ].map((line, i) => (
              <div
                key={i}
                className="rounded-xl border border-line bg-bg p-5 text-sm leading-relaxed text-ink"
              >
                {line}
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted">{t("home.disclaimerShort")}</p>
        </div>
      </section>

      {/* Featured categories preview */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            {t("browse.title")}
          </h2>
          <Link href="/benefits" className="text-sm font-medium text-brand">
            {t("common.browseBenefits")} →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((c) => {
            const count = BENEFITS.filter((b) => b.category === c).length;
            return (
              <Link
                key={c}
                href={`/benefits?category=${c}`}
                className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4 transition-shadow hover:shadow-md"
              >
                <span aria-hidden className="text-2xl">
                  {CATEGORY_ICON[c]}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold text-ink">
                    {t(`categories.${c}`)}
                  </span>
                  <span className="text-sm text-muted">
                    {count} {t("browse.resultsCount")}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
