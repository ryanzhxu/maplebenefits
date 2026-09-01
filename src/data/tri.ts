import type { LocalizedString } from "@/types/benefit";

/** Terse constructor for a trilingual string. */
export function tri(en: string, hant: string, hans: string): LocalizedString {
  return { en, "zh-Hant": hant, "zh-Hans": hans };
}
