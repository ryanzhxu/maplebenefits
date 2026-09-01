"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/i18n/LocaleProvider";
import { BENEFITS, CATEGORIES, LEVELS } from "@/data/benefits";
import { resolve } from "@/i18n/locale";
import { BenefitCard } from "@/components/BenefitCard";
import type { BenefitCategory, BenefitLevel } from "@/types/benefit";

export default function BrowsePage() {
  const { t, r, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<BenefitCategory | "all">("all");
  const [level, setLevel] = useState<BenefitLevel | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BENEFITS.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if (level !== "all" && b.level !== level) return false;
      if (!q) return true;
      const haystack = [
        resolve(b.name, locale),
        resolve(b.name, "en"),
        b.shortName,
        resolve(b.description, locale),
        ...b.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, category, level, locale]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">
        {t("browse.title")}
      </h1>
      <p className="mt-2 text-muted">{t("browse.subtitle")}</p>

      {/* Search */}
      <div className="mt-6">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("browse.searchPlaceholder")}
          aria-label={t("browse.searchPlaceholder")}
          className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-base text-ink placeholder:text-muted"
        />
      </div>

      {/* Filters */}
      <div className="mt-4 space-y-3">
        <Filter
          label={t("browse.filterCategory")}
          value={category}
          onChange={(v) => setCategory(v as BenefitCategory | "all")}
          options={[
            { value: "all", label: t("common.all") },
            ...CATEGORIES.map((c) => ({
              value: c,
              label: t(`categories.${c}`),
            })),
          ]}
        />
        <Filter
          label={t("browse.filterLevel")}
          value={level}
          onChange={(v) => setLevel(v as BenefitLevel | "all")}
          options={[
            { value: "all", label: t("common.all") },
            ...LEVELS.map((l) => ({ value: l, label: t(`levels.${l}`) })),
          ]}
        />
      </div>

      <p className="mt-6 text-sm text-muted">
        {filtered.length} {t("browse.resultsCount")}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-8 rounded-xl border border-line bg-surface p-8 text-center text-muted">
          {t("browse.noResults")}
        </p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((b) => (
            <BenefitCard key={b.id} benefit={b} />
          ))}
        </div>
      )}
    </div>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-muted">{label}:</span>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            aria-pressed={active}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "border-brand bg-brand text-white"
                : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
