import type { Locale, LocalizedString } from "@/types/benefit";

export type { Locale };

export const LOCALES: Locale[] = ["en", "zh-Hant", "zh-Hans"];

export const DEFAULT_LOCALE: Locale = "en";

/** Native label for each locale, shown in the language picker. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  "zh-Hant": "繁體中文",
  "zh-Hans": "简体中文",
};

/** Short code shown in the compact switcher. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  "zh-Hant": "繁",
  "zh-Hans": "简",
};

/** BCP-47 lang attribute for <html>. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  en: "en-CA",
  "zh-Hant": "zh-Hant",
  "zh-Hans": "zh-Hans",
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
