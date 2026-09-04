import { afterEach, describe, expect, it } from "vitest";
import { formatDate, formatEstimate, formatMoney, stripLevelPrefix } from "@/lib/format";
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

describe("formatMoney for fr and pa", () => {
  it("uses a real Intl locale tag, not the zh-Hant-HK fallback", () => {
    expect(formatMoney(1234, "fr")).toMatch(/1[\s ]234/);
    expect(formatMoney(1234, "pa")).toContain("1,234");
  });
});

describe("formatDate for fr", () => {
  it("renders French month names", () => {
    expect(formatDate("2026-09-03", "fr")).toContain("septembre");
  });
});

describe("formatEstimate for fr and pa", () => {
  it("renders the period and up-to labels in each language", () => {
    expect(formatEstimate({ low: 100, high: 100, period: "year" }, "fr")).toContain("/année");
    expect(formatEstimate({ low: 0, high: 100, period: "year" }, "fr")).toContain("jusqu'à");
    expect(formatEstimate({ low: 100, high: 100, period: "year" }, "pa")).toContain("/ਸਾਲ");
    expect(formatEstimate({ low: 0, high: 100, period: "year" }, "pa")).toContain("ਵੱਧ ਤੋਂ ਵੱਧ");
  });
});

describe("stripLevelPrefix for a locale with no prefix data yet", () => {
  it("returns the name unchanged for fr and pa (documented safe no-op)", () => {
    expect(stripLevelPrefix("Ontario Child Benefit", "provincial-on", "fr")).toBe(
      "Ontario Child Benefit",
    );
    expect(stripLevelPrefix("Ontario Child Benefit", "provincial-on", "pa")).toBe(
      "Ontario Child Benefit",
    );
  });
});

describe("formatDate is timezone-independent", () => {
  // The static export renders this on a UTC build machine; every browser in
  // Canada is west of UTC. Without an explicit timeZone, the same ISO date
  // renders as a different calendar day server vs. client, which React
  // reports as a hydration mismatch (error #418) on every benefit page.
  const originalTZ = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTZ;
  });

  it("renders the same calendar date regardless of the runtime's local timezone", () => {
    process.env.TZ = "America/Vancouver"; // UTC-7/-8, west of UTC (all of Canada)
    expect(formatDate("2026-09-01", "en")).toBe("September 1, 2026");

    process.env.TZ = "Pacific/Kiritimati"; // UTC+14, east of UTC
    expect(formatDate("2026-09-01", "en")).toBe("September 1, 2026");

    process.env.TZ = "UTC";
    expect(formatDate("2026-09-01", "en")).toBe("September 1, 2026");
  });
});
