import { describe, expect, it } from "vitest";
import type { Benefit } from "@/types/benefit";
import { dropKnown, extractCandidates, topAmountOn } from "../../scripts/crawl/discover";

const benefit = (name: string, shortName: string, url: string): Benefit =>
  ({ name, shortName, officialInfoUrl: url, applicationSteps: [] }) as unknown as Benefit;

const registry = [
  benefit("Ontario Trillium Benefit", "Trillium", "https://www.ontario.ca/page/ontario-trillium-benefit"),
  benefit("Ontario Disability Support Program", "ODSP", "https://www.ontario.ca/page/odsp"),
];

const candidate = (label: string, url: string) =>
  ({ level: "provincial-on" as const, label, url });

describe("dropKnown", () => {
  it("drops a benefit the registry already has, by name", () => {
    const kept = dropKnown([candidate("Ontario Trillium Benefit", "https://x.ca/a")], registry);
    expect(kept).toEqual([]);
  });

  it("drops a decorated version of a known name", () => {
    // Index pages write "ODSP : Ontario Disability Support Program".
    const kept = dropKnown(
      [candidate("ODSP : Ontario Disability Support Program", "https://x.ca/b")],
      registry,
    );
    expect(kept).toEqual([]);
  });

  it("KEEPS a different program that merely shares a word with a short name", () => {
    // The regression that hid eight real Ontario programs: the registry's
    // shortName "Trillium" swallowed the separate Trillium Drug Program.
    const kept = dropKnown([candidate("Trillium Drug Program", "https://x.ca/c")], registry);
    expect(kept.map((c) => c.label)).toEqual(["Trillium Drug Program"]);
  });

  it("drops anything already reachable at a known URL", () => {
    const kept = dropKnown(
      [candidate("Some Other Label", "https://www.ontario.ca/page/odsp")],
      registry,
    );
    expect(kept).toEqual([]);
  });
});

describe("extractCandidates", () => {
  it("skips navigation chrome and keeps real program links", () => {
    const html = `
      <a href="/page/business-and-economy">Business and economy</a>
      <a href="/page/low-income-workers-tax-credit">Low-Income Workers Tax Credit</a>
      <a href="/page/x">Learn</a>`;
    const got = extractCandidates(html, "provincial-on", "https://www.ontario.ca");
    expect(got.map((c) => c.label)).toEqual(["Low-Income Workers Tax Credit"]);
  });
});

describe("topAmountOn", () => {
  it("takes the largest plausible amount", () => {
    expect(topAmountOn("up to $1,200 a year, or $75 a month")).toBe(1200);
  });

  it("prefers a stated maximum over a larger income threshold", () => {
    // The real failure: Ontario's Low-Income Workers Tax Credit scored $82,500
    // (its income ceiling) instead of the credit's own value.
    const page = "You can receive up to $875. You do not qualify if your income is over $82,500.";
    expect(topAmountOn(page)).toBe(875);
  });

  it("falls back to the largest amount when nothing is phrased as a maximum", () => {
    expect(topAmountOn("The credit is $500 for singles and $900 for families.")).toBe(900);
  });

  it("ignores implausible figures", () => {
    expect(topAmountOn("a $2,400,000 program budget and $500 per person")).toBe(500);
  });

  it("returns undefined when the page states no amount", () => {
    expect(topAmountOn("Apply online for this program.")).toBeUndefined();
  });
});
