import { describe, expect, it } from "vitest";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT, LOCALE_HTML_LANG } from "@/i18n/locale";

describe("locale metadata", () => {
  it("includes French and Punjabi in the switchable locale list", () => {
    expect(LOCALES).toContain("fr");
    expect(LOCALES).toContain("pa");
  });

  it("has a label, short code, and html-lang tag for every locale", () => {
    for (const locale of LOCALES) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
      expect(LOCALE_SHORT[locale]).toBeTruthy();
      expect(LOCALE_HTML_LANG[locale]).toBeTruthy();
    }
  });

  it("labels French and Punjabi correctly", () => {
    expect(LOCALE_LABELS.fr).toBe("Français");
    expect(LOCALE_SHORT.fr).toBe("FR");
    expect(LOCALE_HTML_LANG.fr).toBe("fr-CA");
    expect(LOCALE_LABELS.pa).toBe("ਪੰਜਾਬੀ");
    expect(LOCALE_SHORT.pa).toBe("ਪੰ");
    expect(LOCALE_HTML_LANG.pa).toBe("pa");
  });
});
