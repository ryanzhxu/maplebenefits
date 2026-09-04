import type { Locale, LocalizedString } from "@/types/benefit";

/** Terse constructor for a trilingual string. */
export function tri(en: string, hant: string, hans: string): LocalizedString {
  return { en, "zh-Hant": hant, "zh-Hans": hans };
}

/** Constructor for content needing more than three languages. */
export function L(
  strings: { en: string } & Partial<Record<Locale, string>>,
): LocalizedString {
  return strings;
}
