import { describe, expect, it } from "vitest";
import type { Benefit, Figure } from "@/types/benefit";
import {
  fmt,
  isOfficialUrl,
  numberPattern,
  quoteSupports,
  val,
  validateFigures,
} from "@/lib/figures";
import { BENEFITS } from "@/data/benefits";

const fig = (over: Partial<Figure> = {}): Figure => ({
  current: {
    value: 25864,
    from: "2025-07-01",
    source: "https://www.gov.mb.ca/fs/eia/mcb.html",
    quote: "net family income of less than $25,864",
  },
  history: [],
  verifiedAt: "2026-09-01",
  format: "currency",
  label: "Income cutoff",
  ...over,
});

const asBenefit = (figures: Record<string, Figure>): Benefit =>
  ({ id: "test-benefit", figures }) as unknown as Benefit;

describe("fmt", () => {
  it("renders the four language-neutral formats", () => {
    expect(fmt(fig())).toBe("$25,864");
    expect(fmt(fig({ current: { ...fig().current, value: 1673.24 }, format: "currency-cents" })))
      .toBe("$1,673.24");
    expect(fmt(fig({ current: { ...fig().current, value: 5 }, format: "percent" }))).toBe("5%");
    expect(fmt(fig({ current: { ...fig().current, value: 420 }, format: "number" }))).toBe("420");
  });

  it("rounds currency but keeps cents when asked", () => {
    const cents = { ...fig().current, value: 1673.24 };
    expect(fmt(fig({ current: cents, format: "currency" }))).toBe("$1,673");
    expect(fmt(fig({ current: cents, format: "currency-cents" }))).toBe("$1,673.24");
  });
});

describe("val", () => {
  it("reads the current value", () => {
    expect(val(fig())).toBe(25864);
  });
});

describe("quoteSupports — the provenance invariant", () => {
  it("accepts a quote containing the value with digit grouping", () => {
    expect(quoteSupports(fig())).toBe(true);
  });

  it("accepts a quote containing the value without digit grouping", () => {
    expect(
      quoteSupports(fig({ current: { ...fig().current, quote: "less than $25864 net" } })),
    ).toBe(true);
  });

  it("rejects a quote that does not contain the value", () => {
    expect(
      quoteSupports(fig({ current: { ...fig().current, quote: "less than $27,100 net" } })),
    ).toBe(false);
  });

  it("rejects a value that is only a substring of a longer number", () => {
    // 5 must not be considered supported by "45,521".
    const f = fig({
      current: { ...fig().current, value: 5, quote: "phase-out from $45,521 of income" },
      format: "percent",
    });
    expect(quoteSupports(f)).toBe(false);
  });

  it("matches a decimal value exactly", () => {
    const f = fig({
      current: { ...fig().current, value: 1673.24, quote: "maximum of $1,673.24 per month" },
      format: "currency-cents",
    });
    expect(quoteSupports(f)).toBe(true);
  });

  it("validates history entries too, not just the current value", () => {
    const f = fig({
      history: [
        {
          value: 24111,
          from: "2024-07-01",
          to: "2025-06-30",
          source: "https://www.gov.mb.ca/fs/eia/mcb.html",
          quote: "net family income of less than $99,999", // wrong receipt
        },
      ],
    });
    expect(quoteSupports(f)).toBe(false);
  });
});

describe("isOfficialUrl", () => {
  it("accepts federal, provincial, and agency domains over https", () => {
    for (const url of [
      "https://www.canada.ca/en/services/benefits.html",
      "https://www2.gov.bc.ca/gov/content/housing",
      "https://www.bchousing.org/housing-assistance/rental-assistance",
      "https://www.gov.mb.ca/fs/eia/mcb.html",
      "https://yukon.ca/en/some-program",
    ]) {
      expect(isOfficialUrl(url), url).toBe(true);
    }
  });

  it("rejects aggregators, lookalikes, and plain http", () => {
    for (const url of [
      "https://www.moneysense.ca/benefits",
      "https://canada.ca.evil.com/benefits",
      "http://www.canada.ca/en/services/benefits.html",
      "not-a-url",
    ]) {
      expect(isOfficialUrl(url), url).toBe(false);
    }
  });
});

describe("validateFigures", () => {
  it("passes a sound figure", () => {
    expect(validateFigures(asBenefit({ cutoff: fig() }))).toEqual([]);
  });

  it("flags an unofficial source", () => {
    const f = fig({ current: { ...fig().current, source: "https://example.com/x" } });
    expect(validateFigures(asBenefit({ cutoff: f }))[0].problem).toMatch(/not an official/);
  });

  it("flags a current observation that carries an end date", () => {
    const f = fig({ current: { ...fig().current, to: "2026-01-01" } });
    expect(validateFigures(asBenefit({ cutoff: f }))[0].problem).toMatch(/must not have an end date/);
  });

  it("accepts a value announced before it takes effect", () => {
    // BC published its January 2027 grant amounts during 2026. Recording the
    // real effective date is what makes history a usable tax-year table.
    const f = fig({
      current: { ...fig().current, from: "2027-01-01" },
      verifiedAt: "2026-09-02",
    });
    expect(validateFigures(asBenefit({ cutoff: f }))).toEqual([]);
  });

  it("flags a verifiedAt in the future", () => {
    const f = fig({ verifiedAt: "2099-01-01" });
    expect(validateFigures(asBenefit({ cutoff: f }))[0].problem).toMatch(/in the future/);
  });

  it("flags history that overlaps the current value", () => {
    const f = fig({
      history: [
        {
          value: 24111,
          from: "2024-07-01",
          to: "2025-12-31", // current starts 2025-07-01
          source: "https://www.gov.mb.ca/fs/eia/mcb.html",
          quote: "less than $24,111",
        },
      ],
    });
    expect(validateFigures(asBenefit({ cutoff: f })).map((p) => p.problem)).toContain(
      "history entry ending 2025-12-31 overlaps the current value",
    );
  });

  it("flags an out-of-range band", () => {
    expect(validateFigures(asBenefit({ cutoff: fig({ band: 2 }) }))[0].problem).toMatch(/band/);
  });
});

describe("the live registry", () => {
  it("has sound figures on every benefit", () => {
    const problems = BENEFITS.flatMap(validateFigures);
    expect(problems).toEqual([]);
  });
});

describe("numberPattern — how a value is matched on a page", () => {
  const matches = (value: number, text: string) =>
    new RegExp(numberPattern(value)).test(text.replace(/(?<=\d),(?=\d)/g, ""));

  it("matches a decimal written with extra trailing zeros", () => {
    // Pages write $1,741.20; the stored value is 1741.2. Every CPP, OAS and
    // GIS amount carries cents, so this is the common case.
    expect(matches(1741.2, "Maximum CPP disability amount (2026): $1,741.20/month")).toBe(true);
  });

  it("matches an integer written with .00", () => {
    expect(matches(420, "up to $420.00 per child")).toBe(true);
  });

  it("does not match a different amount sharing a prefix", () => {
    expect(matches(420, "up to $420.50 per child")).toBe(false);
    expect(matches(420, "up to $4205 per child")).toBe(false);
  });

  it("does not match inside a longer number", () => {
    expect(matches(5, "phase-out from $45,521")).toBe(false);
  });
});
