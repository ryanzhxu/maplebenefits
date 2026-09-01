"use client";

import { useI18n } from "@/i18n/LocaleProvider";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT } from "@/i18n/locale";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className="inline-flex items-center rounded-full border border-line bg-surface p-0.5"
      role="group"
      aria-label={t("common.language")}
    >
      {LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={active}
            title={LOCALE_LABELS[l]}
            className={`min-h-[34px] px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
              active
                ? "bg-brand text-white"
                : "text-muted hover:text-ink"
            }`}
          >
            {LOCALE_SHORT[l]}
          </button>
        );
      })}
    </div>
  );
}
