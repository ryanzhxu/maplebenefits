import type { Locale, LocalizedString } from "@/types/benefit";

export type { Locale };

export const LOCALES: Locale[] = ["en", "zh-Hant", "zh-Hans", "fr", "pa"];

/**
 * Locales offered in the language switcher. French and Punjabi have the
 * formatting/resolution infrastructure in place but only one benefit's
 * content is translated so far, so they stay hidden from the UI until
 * translation coverage is broad enough to not fall back to English on
 * nearly every page.
 */
export const SWITCHER_LOCALES: Locale[] = ["en", "zh-Hant", "zh-Hans"];

export const DEFAULT_LOCALE: Locale = "en";

/** Native label for each locale, shown in the language picker. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-Hant": "繁體中文",
  "zh-Hans": "简体中文",
  fr: "Français",
  pa: "ਪੰਜਾਬੀ",
};

/** Short code shown in the compact switcher. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  "zh-Hant": "繁",
  "zh-Hans": "简",
  fr: "FR",
  pa: "ਪੰ",
};

/** BCP-47 lang attribute for <html>. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en-CA",
  "zh-Hant": "zh-Hant",
  "zh-Hans": "zh-Hans",
  fr: "fr-CA",
  pa: "pa",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as string[]).includes(value);
}

/**
 * Resolve a LocalizedString to a plain string for the given locale.
 * Falls back to English when a translation is missing. Never throws.
 */
export function resolve(
  value: LocalizedString | undefined,
  locale: Locale,
): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return value[locale] ?? value.en ?? "";
}
