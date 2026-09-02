"use client";

import Link from "next/link";
import type { Benefit } from "@/types/benefit";
import { useI18n } from "@/i18n/LocaleProvider";
import { CategoryBadge, LevelBadge } from "./Badges";
import { stripLevelPrefix } from "@/lib/format";

export function BenefitCard({ benefit }: { benefit: Benefit }) {
  const { t, r, locale } = useI18n();
  return (
    <Link
      href={`/benefits/${benefit.id}`}
      className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 transition-shadow hover:shadow-md focus-visible:shadow-md"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <LevelBadge level={benefit.level} />
        <CategoryBadge category={benefit.category} />
        {benefit.discontinued && (
          <span className="rounded-md bg-neutral-soft px-2 py-0.5 text-xs font-semibold text-neutral">
            {r({ en: "Ended", "zh-Hant": "已結束", "zh-Hans": "已结束" })}
          </span>
        )}
      </div>
      <h3 className="text-lg font-semibold text-ink group-hover:text-brand">
        {stripLevelPrefix(r(benefit.name), benefit.level, locale)}
      </h3>
      <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted">
        {r(benefit.description)}
      </p>
      <div className="mt-auto pt-4">
        <div className="text-sm font-medium text-eligible">
          {r(benefit.estimatedValue)}
        </div>
        <span className="mt-2 inline-block text-sm font-medium text-brand">
          {t("common.learnMore")} →
        </span>
      </div>
    </Link>
  );
}
