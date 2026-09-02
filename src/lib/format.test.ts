import { describe, expect, it } from "vitest";
import { stripLevelPrefix } from "@/lib/format";
import { BENEFITS } from "@/data/benefits";
import { resolve } from "@/i18n/locale";
import type { Locale } from "@/types/benefit";

describe("stripLevelPrefix", () => {
  it("drops the province when the name leads with it", () => {
    expect(stripLevelPrefix("BC Bus Pass Program", "provincial-bc", "en")).toBe("Bus Pass Program");
    expect(stripLevelPrefix("Ontario Child Benefit", "provincial-on", "en")).toBe("Child Benefit");
    expect(stripLevelPrefix("Manitoba Pharmacare", "provincial-mb", "en")).toBe("Pharmacare");
    expect(stripLevelPrefix("Nova Scotia Child Benefit", "provincial-ns", "en")).toBe("Child Benefit");
  });

  it("prefers the longest matching prefix", () => {
    // "Newfoundland and Labrador" must win over "Newfoundland".
    expect(
      stripLevelPrefix("Newfoundland and Labrador Child Benefit", "provincial-nl", "en"),
    ).toBe("Child Benefit");
    expect(stripLevelPrefix("NL Seniors' Benefit", "provincial-nl", "en")).toBe("Seniors' Benefit");
  });

  it("keeps the name when what would remain is too short to mean anything", () => {
    // "Ontario Works" -> "Works" names nothing at all.
    expect(stripLevelPrefix("Ontario Works", "provincial-on", "en")).toBe("Ontario Works");
  });

  it("only strips a real prefix, never a province mentioned elsewhere", () => {
    // WorkBC contains "BC" but does not start with it.
    expect(
      stripLevelPrefix("WorkBC Assistive Technology Services", "provincial-bc", "en"),
    ).toBe("WorkBC Assistive Technology Services");
    // A province in parentheses is part of how the program distinguishes itself.
    expect(stripLevelPrefix("Rent Assist (Manitoba)", "provincial-mb", "en")).toBe(
      "Rent Assist (Manitoba)",
    );
    expect(
      stripLevelPrefix("55 PLUS (Manitoba Income Supplement)", "provincial-mb", "en"),
    ).toBe("55 PLUS (Manitoba Income Supplement)");
    expect(stripLevelPrefix("AccessAbility Supports (PEI)", "provincial-pe", "en")).toBe(
      "AccessAbility Supports (PEI)",
    );
  });

  it("leaves federal benefits alone", () => {
    expect(stripLevelPrefix("Canada Child Benefit", "federal", "en")).toBe("Canada Child Benefit");
  });

  it("strips the Chinese prefixes, which run together with no space", () => {
    expect(stripLevelPrefix("卑詩省巴士證計劃", "provincial-bc", "zh-Hant")).toBe("巴士證計劃");
    expect(stripLevelPrefix("不列颠哥伦比亚省巴士证计划", "provincial-bc", "zh-Hans")).toBe(
      "巴士证计划",
    );
    // Chinese carries more per character, so this one stays readable where the
    // English equivalent ("Works") would not.
    expect(stripLevelPrefix("安大略工作援助", "provincial-on", "zh-Hant")).toBe("工作援助");
  });
});

describe("stripLevelPrefix over the live registry", () => {
  const locales: Locale[] = ["en", "zh-Hant", "zh-Hans"];

  it("never produces an empty or single-character title", () => {
    for (const b of BENEFITS) {
      for (const locale of locales) {
        const shown = stripLevelPrefix(resolve(b.name, locale), b.level, locale);
        expect(shown.trim().length, `${b.id} (${locale})`).toBeGreaterThan(1);
      }
    }
  });

  it("never leaves the province still leading an English provincial name", () => {
    const provinceWords = [
      "British Columbia",
      "Ontario ",
      "Alberta ",
      "Manitoba ",
      "Saskatchewan ",
      "Nova Scotia ",
      "New Brunswick ",
      "Prince Edward Island",
      "Newfoundland ",
    ];
    // "Ontario Works" is the documented exception: stripping it leaves nothing
    // meaningful, so the province stays.
    const allowed = new Set(["ontario-works"]);

    for (const b of BENEFITS) {
      if (b.level === "federal" || allowed.has(b.id)) continue;
      const shown = stripLevelPrefix(resolve(b.name, "en"), b.level, "en");
      for (const word of provinceWords) {
        expect(shown.startsWith(word), `${b.id} still starts with "${word}"`).toBe(false);
      }
    }
  });
});
